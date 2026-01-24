# ADR-001: Core Architecture Decisions

**Status**: Accepted
**Date**: 2025-11-27 (initial), updated 2026-01-18
**Decision Makers**: Development team
**Stakeholders**: Students, teachers, parents

---

## Context

Koekertaaja is an AI-powered exam preparation application for Finnish primary school students (ages 10-12, grades 4-6). It needs to:

- Generate topic-balanced, grade-appropriate question sets from uploaded materials (PDFs, images, text)
- Provide both quiz mode (2 difficulty levels) and flashcard mode (memorization-focused)
- Deliver engaging gamification (points, streaks, badges) without social comparison
- Work seamlessly on mobile devices (iPad/iPhone primary)
- Keep AI costs under control while maintaining quality
- Require no authentication (public access via shareable codes)

---

## Decision 1: Anthropic Claude AI for Question Generation

### Status: Accepted

### Context

Need AI to generate high-quality, curriculum-aligned questions from user-uploaded materials.

### Options Considered

1. **Anthropic Claude Sonnet 4** (claude-sonnet-4-20250514)
   - Pros: Excellent multimodal support (PDFs, images), strong Finnish language, predictable quality
   - Cons: Higher cost per token than GPT-3.5

2. **OpenAI GPT-4o**
   - Pros: Fast, good quality, vision support
   - Cons: Weaker Finnish support, less predictable output structure

3. **Open-source models** (Llama 3, Mixtral)
   - Pros: Lower/no API costs
   - Cons: Requires infrastructure, weaker Finnish, no multimodal, lower quality

### Decision

**Choose Anthropic Claude Sonnet 4** for question generation.

### Rationale

- **Multimodal excellence**: Best-in-class PDF and image understanding
- **Finnish language**: Strong Finnish grammar and vocabulary generation
- **Structured output**: Reliable JSON formatting with Zod validation
- **Quality**: Generates age-appropriate, curriculum-aligned questions
- **Cost control**: Acceptable costs with 70%+ validation acceptance rate

### Consequences

**Positive**:
- High-quality questions with minimal post-processing
- Reliable multimodal support (PDF chapters, textbook photos)
- Strong Finnish language generation
- Predictable API costs (~$0.50-1.00 per question set)

**Negative**:
- Higher per-token cost than OpenAI
- Vendor lock-in to Anthropic
- Requires internet connection for generation

**Mitigation**:
- Cache generated questions in Supabase to minimize re-generation
- Implement configurable pool size (40-400) to control costs
- Accept 70%+ valid questions to avoid expensive re-generation
- Monitor API costs via logging

---

## Decision 2: Dual-Mode Generation (Quiz + Flashcards)

### Status: Accepted

### Context

Students need different study modes for different learning goals.

### Options Considered

1. **Single quiz mode only**
   - Pros: Simpler to build, lower AI costs
   - Cons: Doesn't support memorization-focused learning

2. **Dual-mode: Quiz (assessment) + Flashcards (memorization)**
   - Pros: Supports different learning styles, better pedagogical outcomes
   - Cons: More complex prompts, higher AI costs

3. **Adaptive mode** (auto-selects question types based on material)
   - Pros: Intelligent adaptation
   - Cons: Too complex, unpredictable results

### Decision

**Implement dual-mode generation**: Quiz mode (2 difficulty levels) + optional Flashcard mode.

### Rationale

- **Pedagogical value**: Quiz tests understanding, flashcards support memorization
- **User request**: Teachers wanted both assessment and study tools
- **Question type optimization**:
  - Quiz: Balanced mix (multiple_choice, fill_blank, short_answer, true_false, matching)
  - Flashcards: Active recall only (fill_blank, short_answer, matching) - no passive types
- **Optional flashcards**: Only generated if user requests (cost control)

### Consequences

**Positive**:
- Better learning outcomes (varied practice modes)
- Teacher satisfaction (one upload, multiple tools)
- Student engagement (choose mode based on needs)

**Negative**:
- More complex prompt engineering (separate prompts per mode)
- Higher AI costs if flashcards requested
- More database storage (3 sets vs 2)

**Mitigation**:
- Flashcards are optional (checkbox in UI)
- Separate prompt files for maintainability (`quiz/*.ts`, `flashcard/*.ts`)
- Single AI call generates all modes (cost-efficient)

---

## Decision 3: Topic-Balanced Question Generation & Selection

### Status: Accepted (added 2025-11-30)

### Context

Random question selection resulted in unbalanced coverage (e.g., 12 grammar + 3 vocabulary in 15-question session).

### Options Considered

1. **Random sampling** (original)
   - Pros: Simple, fast
   - Cons: Unbalanced topic coverage, unfair assessment

2. **Manual topic tagging** (human-curated)
   - Pros: Accurate topic labels
   - Cons: Labor-intensive, not scalable

3. **AI-identified topics + stratified sampling**
   - Pros: Automatic, balanced coverage, fair assessment
   - Cons: Requires topic identification in prompts, slight complexity

### Decision

**AI identifies 3-5 high-level topics during generation, stratified sampling ensures balanced selection**.

### Rationale

- **Fair assessment**: Equal coverage across all topics (e.g., 5 grammar + 5 vocabulary + 5 pronunciation)
- **Better learning**: Students practice all areas, not just random subset
- **Automatic**: No manual tagging needed
- **High-level topics**: "Grammar" vs "Grammar - Past Tense" (easier for AI, good enough for balance)

### Implementation

```typescript
// 1. AI prompt includes topic identification
"Identify 3-5 high-level topics from the material and tag each question with its primary topic."

// 2. Database stores topic, subtopic, and skill per question
ALTER TABLE questions ADD COLUMN topic TEXT;
ALTER TABLE questions ADD COLUMN subtopic TEXT;
ALTER TABLE questions ADD COLUMN skill TEXT;

// 3. Database stores subject_type per question set for prompt/skill context
ALTER TABLE question_sets ADD COLUMN subject_type TEXT;

// 4. Stratified sampling in useGameSession
const grouped = groupBy(questions, 'topic');
const sampled = sampleEvenly(grouped, sessionLength);
// Result: 15 questions = 5 per topic (if 3 topics)
```

### Consequences

**Positive**:
- Fair, balanced assessment
- Better learning outcomes
- Foundation for future topic-specific practice modes
- Works for both quiz and flashcard modes

**Negative**:
- Requires AI to identify topics (adds tokens)
- Migration needed for existing question sets
- Graceful fallback required if <70% tagged

**Mitigation**:
- Simple topic taxonomy (3-5 high-level topics max)
- Fallback to random sampling if <70% questions have topics
- Store topics in nullable column (backwards compatible)

---

## Decision 4: Grade-Based Lenient Answer Matching

### Status: Accepted (added 2025-12-14)

### Context

Grade 4 students struggled with exact-match requirements for fill-blank/short-answer questions (spelling, spacing, punctuation).

### Options Considered

1. **Exact match only**
   - Pros: Strict correctness
   - Cons: Frustrates young learners, discourages attempts

2. **AI-powered answer checking**
   - Pros: Intelligent evaluation
   - Cons: High costs, slow, unpredictable

3. **Grade-based similarity thresholds** (Levenshtein distance)
   - Pros: Age-appropriate, fast, predictable
   - Cons: May accept slightly incorrect answers

### Decision

**Implement grade-based lenient answer matching with three strategies**: exact (normalized) → contains → fuzzy (Levenshtein distance).

### Rationale

- **Age-appropriate**: Younger students (Grade 4) need more leniency
- **Encourages attempts**: Students less afraid of spelling mistakes
- **Fast**: Client-side calculation, no API calls
- **Predictable**: Clear thresholds, testable

### Implementation

```typescript
// Thresholds by grade
Grade 4: 75% similarity (~3 mistakes in 12-char word)
Grade 5: 80% similarity (~2 mistakes in 12-char word)
Grade 6: 85% similarity (~2 mistakes in 12-char word)

// Three-strategy matching
1. Exact (normalized): lowercase, trim, remove punctuation
2. Contains: correct answer substring in user answer
3. Fuzzy: Levenshtein distance similarity >= threshold
```

### Examples

```
Grade 4: "fotosynteesi" accepted for "fotosynteesin" (92% similar ✓)
Grade 6: "fotosynteesi" accepted for "fotosynteesin" (92% > 85% ✓)
All grades: "ves" rejected for "vesi" (75% similar, too short ✗)
```

### Consequences

**Positive**:
- Reduced frustration for young learners
- Encourages practice without fear
- Focus on understanding vs spelling

**Negative**:
- May accept slightly incorrect answers
- Requires careful threshold tuning

**Mitigation**:
- Conservative thresholds (75-85% range)
- User testing with real students
- Show correct spelling in explanation even if accepted
- Document in `docs/LENIENT_ANSWER_MATCHING.md`

---

## Decision 5: No Authentication, Public Read Access via Shareable Codes

### Status: Accepted

### Context

Need to balance ease of use with minimal security requirements (no PII stored).

### Options Considered

1. **Full authentication** (email/password)
   - Pros: User accounts, question set ownership, analytics
   - Cons: Friction for students, GDPR compliance, more complexity

2. **Teacher-only auth, student public access**
   - Pros: Teachers manage sets, students no friction
   - Cons: Partial auth complexity

3. **No auth, public read via shareable codes**
   - Pros: Zero friction, no GDPR concerns, simple architecture
   - Cons: No ownership tracking, potential abuse

### Decision

**No authentication system, public read access via 6-character shareable codes**.

### Rationale

- **Zero friction**: Students enter code, start practicing immediately
- **No PII**: No student accounts, no personal data stored
- **Simple architecture**: No auth system, no session management
- **Shareable**: Teachers post codes in Google Classroom, parents share via email
- **Acceptable trade-off**: Question sets are public anyway (educational content)

### Consequences

**Positive**:
- Instant access for students
- No GDPR compliance burden
- Simple codebase
- Easy sharing (codes in emails, classroom posts)

**Negative**:
- No question set ownership tracking
- Cannot implement "My Question Sets" without auth
- Cannot track individual student progress
- Potential code guessing (mitigated by 6-char randomness)

**Mitigation**:
- Crypto-secure 6-character codes (36^6 = 2 billion combinations)
- RLS policies: Public read, server-side writes only
- Future: Add optional auth for teachers ("My Question Sets" dashboard)

---

## Decision 6: Client-Side Game State (No Progress Persistence)

### Status: Accepted

### Context

Should we persist student practice session progress in the database?

### Options Considered

1. **Persistent game state** (database)
   - Pros: Resume sessions, track history, analytics
   - Cons: Requires auth, storage costs, privacy concerns

2. **Client-side game state** (React state + localStorage for badges)
   - Pros: Fast, simple, privacy-friendly
   - Cons: Lost on browser clear, no cross-device sync

### Decision

**Client-side game state** using React hooks + localStorage for badges/personal bests only.

### Rationale

- **Privacy**: No tracking of student answers
- **Simplicity**: No database writes during practice
- **Performance**: Instant response, no API latency
- **Acceptable trade-off**: 10-15 minute sessions don't need resume capability

### Implementation

```typescript
// useGameSession hook manages state
const [currentIndex, setCurrentIndex] = useState(0);
const [answers, setAnswers] = useState<Record<number, Answer>>({});
const [points, setPoints] = useState(0);
const [streak, setStreak] = useState(0);

// localStorage for persistence (badges, personal bests)
localStorage.setItem('badges', JSON.stringify(badgeState));
localStorage.setItem('personalBests', JSON.stringify(bests));
```

### Consequences

**Positive**:
- Fast, responsive UX
- No privacy concerns
- Simple implementation

**Negative**:
- Can't resume sessions
- No cross-device sync
- Lost on browser clear

**Mitigation**:
- Short sessions (10-15 min) don't need resume
- LocalStorage for important data (badges, personal bests)
- Future: Optional server sync with auth

---

## Decision 7: Supabase for Database (No ORM)

### Status: Accepted

### Context

Need database for question storage with public read access.

### Options Considered

1. **Supabase (PostgreSQL + RLS)**
   - Pros: Built-in RLS, realtime (future), simple client SDK
   - Cons: Vendor lock-in

2. **Firebase Firestore**
   - Pros: Realtime, simple rules
   - Cons: NoSQL limitations, expensive reads

3. **Self-hosted PostgreSQL + Prisma ORM**
   - Pros: Full control, type-safe queries
   - Cons: Infrastructure overhead, no managed RLS

### Decision

**Supabase with direct client queries (no ORM)**.

### Rationale

- **RLS built-in**: Public read policies, server-side writes
- **Simple queries**: Direct SQL via Supabase client
- **Real-time ready**: Can add subscriptions later
- **Managed**: No infrastructure management

### Consequences

**Positive**:
- Simple RLS setup
- Fast development
- Managed infrastructure

**Negative**:
- Vendor lock-in
- Manual query writing
- No type-safe query builder

**Mitigation**:
- Generate TypeScript types from Supabase schema
- Use helper functions in `lib/supabase/queries.ts`
- Document schema in `DWF/technical/DATA_MODEL.md`

---

## Decision 8: Vercel Deployment with CSP Headers

### Status**: Accepted

### Context

Need production hosting with security headers.

### Options Considered

1. **Vercel** (recommended for Next.js)
2. **Netlify**
3. **Self-hosted**

### Decision

**Deploy to Vercel with Content Security Policy (CSP) headers**.

### Rationale

- **Next.js optimized**: Zero-config deployment
- **CSP support**: Configured in `next.config.js`
- **Edge functions**: For future enhancements
- **Free tier**: Sufficient for MVP

### Consequences

**Positive**:
- Fast global CDN
- Automatic HTTPS
- Easy deployments

**Negative**:
- Vendor lock-in
- Cold start latency (serverless)

**Mitigation**:
- CSP headers configured: `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
- Monitor cold starts, optimize if needed

---

## Decision 9: Publishing Status Workflow for Question Sets

### Status: Accepted (added 2026-01-19)

### Context

Question sets need a simple publish gate to control visibility on Play pages. Creators should be able to review generated questions before making them publicly accessible.

### Options Considered

1. **No publishing workflow** (all sets immediately public)
   - Pros: Simple, no extra state
   - Cons: Can't review/test before sharing, accidental publishing

2. **Complex workflow** (draft → review → published → archived)
   - Pros: Full lifecycle management
   - Cons: Over-engineered for current use case, more UI complexity

3. **Simple two-state workflow** (created → published)
   - Pros: Minimal complexity, clear intention, easy to implement
   - Cons: Limited workflow options for future features

### Decision

**Implement simple two-state publishing workflow**: `created` (default, unpublished) → `published` (visible on Play pages).

### Rationale

- **Review before sharing**: Creators can review generated questions before students access them
- **Intentional publishing**: Clear distinction between testing and production sets
- **Simple implementation**: Single enum column with default value
- **RLS integration**: Publishing status naturally integrates with existing Row Level Security
- **Future-proof**: Can extend to more states later if needed (e.g., `archived`)

### Implementation

```sql
-- Enum type for status
CREATE TYPE question_set_status AS ENUM ('created', 'published');

-- Column with default 'created'
ALTER TABLE question_sets
ADD COLUMN status question_set_status DEFAULT 'created' NOT NULL;

-- RLS policy: only published sets publicly visible
CREATE POLICY "Enable read access for published question sets"
ON question_sets FOR SELECT
USING (status = 'published');
```

```typescript
// TypeScript types
export type QuestionSetStatus = 'created' | 'published';

export interface QuestionSet {
  // ... other fields
  status: QuestionSetStatus;  // 'created' (unpublished) or 'published'
}
```

### Consequences

**Positive**:
- Prevents accidental publishing of incomplete/test question sets
- Creator can test questions before sharing with students
- Clear separation between draft and production content
- Foundation for future admin/teacher dashboard
- Natural fit with RLS policies (only published sets public)

**Negative**:
- Requires publish action after generation (one extra step)
- Out of scope for MVP: role-based permissions for publishing
  (currently simple admin allowlist handles write access)

**Mitigation**:
- Default to `created` makes new sets unpublished by default
- Future: Add "Publish" button in creator UI
- Future: Admin dashboard to manage question set lifecycle
- Document status field in types and API schemas

---

## Decision 10: Map Question Integration Model (Inline Geography Quiz)

### Status: Accepted (added 2026-01-19)

### Context

Map questions should appear for geography content but have been inconsistently generated. We need a clear routing model to decide whether map questions are a dedicated profile or an inline rule within geography prompts.

### Options Considered

1. **Dedicated map profile/mode**
   - Pros: Explicit routing, easier to expand for non-geography use cases
   - Cons: New parameter surface, more prompt variants, more UI coupling

2. **Inline geography-only rules**
   - Pros: Minimal API changes, keeps map questions tied to geography context
   - Cons: Harder to reuse outside geography, relies on subject routing

### Decision

**Keep map questions inline** as a geography-only quiz rule in the prompt builder.

### Rationale

- **Simple routing**: No new profile/mode needed for a single subject constraint
- **Clear scope**: Map questions are only valid for geography at this stage
- **Less UI impact**: No extra UI knobs or server payload changes
- **Consistent prompts**: Geography prompts include map instructions and distribution

### Implementation

- `subjects/geography-map.txt` is included **only** when subject is geography and mode is quiz.
- `applyGeographyMapDistribution()` injects a 12% map allocation if missing.

### Consequences

**Positive**:
- Predictable map inclusion for geography quiz generation
- Reduced prompt/API complexity
- No changes needed in UI request payloads

**Negative**:
- Map questions cannot be triggered for non-geography subjects
- No explicit "map mode" for future experiments

**Mitigation**:
- If future use cases require broader map support, add a dedicated `promptProfile`
  parameter and promote map generation to its own profile.

---

## Cross-Cutting Decisions

### Performance Targets

- **Question generation**: <30 seconds (AI call + validation)
- **Question loading**: <2 seconds (database fetch)
- **Answer validation**: <100ms (client-side)
- **Page load**: <3 seconds (first contentful paint)

### Cost Targets

- **AI costs**: <$1.00 per question set (100-question pool)
- **Database**: Free tier (Supabase, <500MB, <2GB bandwidth/month)
- **Hosting**: Free tier (Vercel, <100GB bandwidth/month)

### Accessibility Standards

- **WCAG AAA**: 7:1 contrast for normal text
- **Touch targets**: 48px minimum
- **Keyboard navigation**: Full support
- **Screen readers**: ARIA labels, semantic HTML

---

## Future Architectural Considerations

### Planned (Not Yet Decided)

1. **Teacher authentication** for "My Question Sets" dashboard
2. **Spaced repetition algorithm** for flashcards
3. **Google Classroom integration** for code sharing
4. **Audio support** for pronunciation questions (English)
5. **Realtime multiplayer** practice mode
6. **Analytics dashboard** for teachers (requires auth)

### Technical Debt

1. **No E2E tests**: Add Playwright later
2. **No component tests**: Add Vitest tests later
3. **Manual prompt management**: Consider prompt versioning system
4. **No CI/CD**: Add GitHub Actions later

---

## References

- User Journeys: `DWF/product/USER_JOURNEYS.md`
- Personas: `DWF/product/PERSONAS.md`
- Design System: `DWF/design/DESIGN_SYSTEM.md`
- Testing Strategy: `DWF/technical/TESTING_STRATEGY.md`
- Lenient Answer Matching: `docs/LENIENT_ANSWER_MATCHING.md`
