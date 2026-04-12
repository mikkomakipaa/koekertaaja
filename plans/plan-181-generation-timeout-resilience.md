# Plan 181 — Generation timeout resilience

## Problem

Vercel Hobby plan enforces a hard **60-second** serverless-function timeout.
The current quiz/flashcard generation routes set `maxDuration: 240` (4 min), which Hobby silently
ignores. As a result, any generation request that takes longer than 60 s is killed mid-flight with
no feedback to the user.

### Why it's bad today

| Step | Approximate wall-clock | Notes |
|---|---|---|
| `POST /api/identify-topics` | 5–15 s | Separate call, usually OK |
| `POST /api/generate-questions/quiz` | 40–120 s | Runs **both** difficulties sequentially in one handler |
| `POST /api/generate-questions/flashcard` | 20–60 s | Single call, borderline |
| `POST /api/extend-question-set` | 30–90 s | Single call, often times out |

The quiz route is the worst offender: it calls the LLM twice (once per difficulty level) in a
single server-side function, making the total handler time 80–240 s on a bad day.

---

## Goal

Every serverless function completes within **50 seconds** (10 s safety margin under the 60 s cap)
for a typical generation request (≤ 20 questions).

Larger requests (> 20 questions) succeed via chunked client-orchestration rather than failing
silently.

---

## Design principle: topic-based client-orchestrated steps

Generation is batched **per topic**, not per difficulty level. With 3–4 topics per set, this
produces 3–4 calls for quiz mode, each completing in < 20 s for a typical 3–5 question topic slice.

Difficulty moves from a set-level property to a **per-question metadata field** assigned by the
model. This eliminates the need to generate the same material twice and produces more natural
variation within a question set.

```
Current:
  client ──── POST /api/generate-questions/quiz ──► (topics + helppo + normaali, 80-240 s)

Proposed:
  client ──► POST /api/identify-topics          ←── EnhancedTopic[] (< 15 s)
  client ──► POST /api/generate-topic           ←── questions for topic 1 + per-question difficulty (< 20 s)
  client ──► POST /api/generate-topic           ←── questions for topic 2 (< 20 s)
  client ──► POST /api/generate-topic           ←── questions for topic 3 (< 20 s)
  [flashcard mode: same loop, type='flashcard']
```

Steps map directly to the existing `CreationProgressStepper` — each topic becomes a named step
("Geometria ✓", "Algebra ✓"). Intermediate results are held in client state and assembled once all
steps complete. Failed steps show a retry button; successful steps are not re-run.

---

## Proposed changes

### A. Per-question difficulty metadata

`difficulty` moves from `question_sets` (set-level) to individual `questions` rows.

```sql
ALTER TABLE questions ADD COLUMN difficulty TEXT
  CHECK (difficulty IN ('helppo', 'normaali', 'vaikea'));
```

The model is instructed to assign a difficulty per question in the generation prompt. Existing
rows are backfilled using the parent `question_set.difficulty` value. The `question_sets.difficulty`
column is kept for now for backwards compatibility but its role becomes display-only.

### B. New route: `POST /api/generate-topic`

Replaces the two existing generation routes. Handles one topic at a time:

```typescript
// Request body
{
  type: 'quiz' | 'flashcard';
  topic: EnhancedTopic;           // the topic to generate for
  allTopics: EnhancedTopic[];     // full context so model avoids overlap
  subject: string;
  grade: string;
  questionCount: number;          // questions for this topic slice (max 20, server-enforced)
  material?: string;
  // ... other existing params
}

// Response: questions array, each question includes a `difficulty` field
```

`maxDuration` set to 60 (matches Hobby cap, no override needed).

### C. Update client orchestration (`CreatePageClient.tsx`)

Replace existing difficulty-loop with a topic-loop:

```
for each topic in identifiedTopics:
  call POST /api/generate-topic { topic, allTopics, questionCount: perTopicCount }
  advance stepper step for that topic
```

Each stepper step is labelled with the topic name. Intermediate results held in client state,
assembled at the end before saving to DB.

### D. Retry per step

A failed topic step shows "Yritä uudelleen" and re-runs only that topic's call.
Completed topic steps are preserved.

### E. Keep `/api/identify-topics` unchanged

Already a separate < 15 s call. No changes needed.

### F. Extend-question-set route

Apply the same per-topic batching. The extend flow re-runs the topic loop for new topics or
top-up questions for existing topics. Cap at 20 questions per call server-side.

### G. Deprecate old routes

Once the client is switched, `/api/generate-questions/quiz` and `/api/generate-questions/flashcard`
return HTTP 410 Gone. Delete after 30 days.

---

## Sequence when creating a new question set

```
1. User submits form
2. Client calls POST /api/identify-topics
   → receives EnhancedTopic[] (e.g. ["Geometria", "Algebra", "Tilastot"])
   → stepper: "Aiheet tunnistettu ✓"

3. For each topic (quiz mode):
   Client calls POST /api/generate-topic { type:'quiz', topic, allTopics, ... }
   → receives questions[] each with per-question difficulty
   → stepper: "Geometria ✓" / "Algebra ✓" / "Tilastot ✓"

4. For each topic (flashcard mode):
   Client calls POST /api/generate-topic { type:'flashcard', topic, allTopics, ... }
   → stepper: "Geometria (muistikortit) ✓" / ...

5. Client merges all topic batches and calls POST /api/question-sets (existing)
   → question set saved with per-question difficulty on each row
```

---

## What stays the same

- All database writes happen at the end (step 5) — no partial DB state during generation
- Existing prompt logic, PromptBuilder, questionGenerator, providerRouter — unchanged
- UI/UX: stepper, progress indicators, topic distribution — unchanged
- API contract for the final `POST /api/question-sets` — unchanged

---

## Open questions to validate before implementation

| # | Question | Why it matters | Where to check |
|---|---|---|---|
| OQ1 | **What is the p90 latency of a single 15-question quiz generation call today?** | Determines whether a 50 s budget is achievable without reducing quality. Target: < 45 s p90. | Enable server timing logs; test with 10/15/20 question counts for both Anthropic and OpenAI |
| OQ2 | **Is `maxDuration: 240` actually hitting the 60 s Hobby cap in production, or are we on Pro?** | Changes urgency — if currently on Pro (300 s), the problem is future risk, not a current outage. | Check Vercel dashboard → project settings → plan tier |
| OQ3 | **Do topics need to be passed from step 2 to step 3, or can each step re-identify topics from the material?** | If topic re-identification is fast (< 10 s), steps can be fully independent; otherwise topics must be threaded through as a parameter. | Look at `identifyTopicsFromMaterial()` in `questionGeneration.ts` and its typical latency |
| OQ4 | **What question counts do real users actually request?** | If real usage is always ≤ 10 questions, the problem is academic; if 30+ is common, the chunking logic becomes critical. | PostHog events or Supabase query on question count distribution |
| OQ5 | **Does the existing `creationSteps` state machine handle a failed middle step + retry cleanly?** | If not, retry UX needs to be added before splitting the calls — otherwise a failed normaali step leaves the user with no way to complete the set. | Review `CreatePageClient.tsx` stepper error handling |
| OQ6 | **Can `/api/generate-single` be made stateless (no session/context between calls)?** | Stateless = trivially horizontally scalable and no sticky-session concerns on Vercel. | Confirm that question generation needs no server-side state between calls |
| OQ7 | **Are Vercel Edge Functions a viable path for the generation routes?** | Edge functions have no `maxDuration` constraint for streaming responses and run globally close to users. However they cannot use Node.js APIs and some npm packages may not be compatible. | Check if `@anthropic-ai/sdk` and `openai` npm packages support Edge runtime |

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Single 20-question call still exceeds 50 s on Anthropic Sonnet with long material | Medium | Add material truncation (already exists), auto-downgrade to faster model for large prompts |
| More client→server round trips increase perceived latency | Low | Steps are already shown sequentially in the stepper — perceived time is similar; first results appear faster |
| Merging questions from multiple calls introduces duplicates | Low | Server-side deduplication on question text hash before save |
| Old routes still called by any external integrations | Very low | No public API; `Authorization` header required |

---

## Implementation order

| Task | Description | Depends on |
|---|---|---|
| 320 | Add `duration_ms` to prompt metrics | — |
| 321 | Retry UI in stepper | — |
| 326 | `questions.difficulty` column + types + generator output | — |
| 327 | Backfill `difficulty` on existing question rows | 326 |
| 322 | New `POST /api/generate-topic` route | 326 |
| 323 | Client orchestration refactor (topic loop) | 321 + 322 |
| 324 | Extend route batch cap | — |
| 325 | Deprecate old generation routes (410 Gone) | 323 |
