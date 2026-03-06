# Plan 177 — Flashcard Set Links in Topic Mastery Summaries

**Date:** 2026-03-05
**Status:** Approved for implementation

---

## Summary

Add a "Kertaa korteilla →" link below topic mastery breakdowns on the Results and Achievements pages. The link opens the flashcard set that corresponds to the quiz the user just completed, so learners can immediately switch to flashcard review when they see weak topics.

The data showing *which* flashcard set is related requires a lightweight server-side lookup. No new Vercel functions are needed — the existing `/api/question-sets` route is extended.

---

## User Benefit

After seeing a topic mastery breakdown with low scores, the user currently has no direct path to study those topics with flashcards. They must navigate back, find the right set in Browse, and switch to Study mode manually. This feature removes that friction.

---

## Where It Appears

`TopicMasteryDisplay` is the shared component that renders topic breakdowns. It is used in two places:

| Surface | Code path |
|---------|-----------|
| ResultsScreen "Yhteenveto" tab | `ResultsScreen` → `TopicMasteryDisplay` |
| Achievements "Aiheet" tab | `AchievementsMapSection` → `TopicMasteryDisplay` |

Both locations will gain the link by extending `TopicMasteryDisplay` with a new optional prop.

---

## Open Questions — Validated

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | **Topic-filtered flashcard session?** The user said "on that particular topic." Should the session play only flashcards matching the weak topic? | **No — open the full flashcard set.** Topic-filtered sessions require new session infrastructure (filtering questions by topic before sampling). Out of scope. The full flashcard set covers the same content area. | Scoped to v1; topic-filtering is a separate feature. |
| 2 | **Per-topic row links or single CTA below the list?** | **Single "Kertaa korteilla →" CTA below the topic list.** Per-topic links would be misleading since the flashcard set is not topic-filtered. One CTA keeps the UI clean. | Avoids suggesting false precision (topic X → flashcard for topic X only). |
| 3 | **Score threshold: show only when topics are weak?** | **No threshold — show CTA whenever a related flashcard set exists.** Even topics above threshold benefit from spaced review. Threshold-gating adds fragile logic. | Simplicity; educational research supports unconditional review. |
| 4 | **How to find the related flashcard set?** | **Extend existing `/api/question-sets` route** with optional `relatedFlashcard=1` param. Backend does a secondary query to find the sibling flashcard set. No new Vercel function consumed. | Current function count is 10 of 12 Vercel hobby limit. A new route would add risk. |
| 5 | **Matching logic for "sibling" flashcard set?** | **Subject + grade + stripped-name match** (`mode = 'flashcard'`, same `subject`, same `grade`, same name after stripping difficulty suffixes). Query via new `findRelatedFlashcardCode(quizCode)` in `queries.ts`. | Quiz and flashcard sets are created together from the same generation request and share the same base name. |
| 6 | **What if multiple flashcard sets match (same subject+grade)?** | **Take the first match ordered by `created_at DESC`.** This picks the most recently generated set, which is most likely to match the quiz being reviewed. | Ties are rare; picking most recent is a reasonable heuristic. |
| 7 | **Fallback when no flashcard set exists?** | **No link shown.** Do not link to the generic study mode browse — it's misleading if the content doesn't have flashcards. Clean absence is better than a wrong path. | UX: a broken or irrelevant link is worse than no link. |
| 8 | **ResultsScreen lookup strategy?** | **New `useRelatedFlashcardSet(questionSetCode)` hook** that fetches `GET /api/question-sets?code={code}&relatedFlashcard=1` once on mount. Caches in state for the component lifetime. | Decoupled from AchievementsMapSection; ResultsScreen doesn't otherwise call this endpoint. |
| 9 | **AchievementsMapSection lookup strategy?** | **Extend the existing `defaultLoadQuestionSetByCode` fetch** to include `&relatedFlashcard=1`. Extract `relatedFlashcardCode` from the response and pass it down. No second fetch needed. | AchievementsMapSection already fetches per selected code; extending that call is zero-cost. |
| 10 | **Should `relatedFlashcardCode` always be included in the API response?** | **Only when `relatedFlashcard=1` is present.** Don't include it unconditionally — the secondary DB query adds latency and most callers don't need it. | Backwards-compatible; existing callers unaffected. |
| 11 | **Play route for the CTA link?** | `/play/{flashcardCode}?mode=opettele` | This is the standard flashcard play URL used throughout the app. |
| 12 | **Touch target compliance?** | CTA link must have `min-h-[44px]` or equivalent padding to meet the 44px touch target rule from the design guidelines. | Mobile-first; accessibility. |

---

## Architecture

### Files changed or created

| File | Change type | Notes |
|------|------------|-------|
| `src/lib/supabase/queries.ts` | Extend | Add `findRelatedFlashcardCode(quizCode)` |
| `src/app/api/question-sets/route.ts` | Extend | Handle `relatedFlashcard=1` param; include `relatedFlashcardCode` in response |
| `src/hooks/useRelatedFlashcardSet.ts` | New | `useRelatedFlashcardSet(code)` hook for ResultsScreen |
| `src/components/play/TopicMasteryDisplay.tsx` | Extend | Add `flashcardSetCode?: string \| null` prop; render CTA |
| `src/components/play/ResultsScreen.tsx` | Extend | Use new hook; pass `flashcardSetCode` prop |
| `src/components/mindMap/AchievementsMapSection.tsx` | Extend | Pass `&relatedFlashcard=1`; extract and thread `relatedFlashcardCode` |

---

## New DB Query: `findRelatedFlashcardCode`

```typescript
// In src/lib/supabase/queries.ts
export async function findRelatedFlashcardCode(
  quizCode: string
): Promise<string | null>
```

**Query logic (application-side, not SQL regex):**
1. Fetch quiz set row by `code` → get `subject`, `grade`, `name`
2. Strip difficulty suffix from `name` using the shared strip function: remove ` - Helppo`, ` - Normaali`, ` - Aikahaaste`, ` - Kortit`
3. Query: `SELECT code, name FROM question_sets WHERE subject = $1 AND grade = $2 AND mode = 'flashcard' AND status = 'published' ORDER BY created_at DESC`
4. Filter results in code: strip suffix from each candidate name and compare to stripped quiz name
5. Return first match, or `null` if none

---

## `TopicMasteryDisplay` New Prop & UI

```tsx
interface TopicMasteryDisplayProps {
  questionSetCode: string;
  flashcardSetCode?: string | null;  // new
  className?: string;
}
```

**Rendered CTA** (shown below the topic list when `flashcardSetCode` is truthy):

```tsx
<Link
  href={`/play/${flashcardSetCode}?mode=opettele`}
  className="mt-3 flex min-h-[44px] w-full items-center justify-between
             rounded-lg border border-teal-200 bg-teal-50 px-4
             text-sm font-semibold text-teal-700 transition-colors
             hover:bg-teal-100 hover:border-teal-300
             focus-visible:outline-none focus-visible:ring-2
             focus-visible:ring-teal-500 focus-visible:ring-offset-2
             dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-300
             dark:hover:bg-teal-900/30"
>
  <span className="flex items-center gap-2">
    <Cards size={16} weight="duotone" />
    Kertaa korteilla
  </span>
  <ArrowRight size={14} weight="bold" />
</Link>
```

**Design notes:**
- Teal = study/flashcard mode color per design guidelines
- `rounded-lg` (button rule)
- `border border-teal-200` (border before shadow rule)
- No permanent shadow
- `min-h-[44px]` (touch target)
- `text-sm font-semibold` (named scale class, not arbitrary)

---

## Data Flow Diagram

```
ResultsScreen
  └─ useRelatedFlashcardSet(questionSetCode)
        └─ GET /api/question-sets?code=ABC&relatedFlashcard=1
              └─ findRelatedFlashcardCode(code) in queries.ts
                    └─ Supabase: subject+grade+name-prefix match
                    └─ returns flashcardCode or null
        └─ { flashcardCode }
  └─ <TopicMasteryDisplay
        questionSetCode={questionSetCode}
        flashcardSetCode={flashcardCode}       ← new
     />
        └─ renders "Kertaa korteilla" link if flashcardSetCode

AchievementsMapSection
  └─ loadQuestionSetByCode(selectedCode)      ← already called
        └─ GET /api/question-sets?code=ABC&relatedFlashcard=1  ← extended
              └─ response now includes relatedFlashcardCode
  └─ stores relatedFlashcardCode in local state alongside selectedCode
  └─ <TopicMasteryDisplay
        questionSetCode={selectedCode}
        flashcardSetCode={relatedFlashcardCode}  ← new
     />
```

---

## Implementation Order

```
task-254  Extend queries.ts with findRelatedFlashcardCode
     ↓
task-255  Extend /api/question-sets route with relatedFlashcard param
     ↓
task-256  Create useRelatedFlashcardSet hook
     ↓
task-257  Update TopicMasteryDisplay with flashcardSetCode prop + CTA
     ↓
task-258  Wire ResultsScreen and AchievementsMapSection
```

---

## Constraints

- No new Vercel API routes (stays at 10 of 12 functions)
- Follow `docs/DESIGN_GUIDELINES.md` for all new UI (teal = study mode, `rounded-lg` on links/buttons, named type scale)
- `TopicMasteryDisplay` stays backwards-compatible — `flashcardSetCode` is optional
- No breaking changes to existing API response shape (new field is additive)
