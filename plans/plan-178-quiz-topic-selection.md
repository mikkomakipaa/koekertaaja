# Plan 178 — Quiz Topic Selection

**Date:** 2026-04-08
**Status:** Proposed

---

## Summary

Add topic selection to quiz play so a learner can start either:

- a normal balanced quiz across all topics, or
- a quiz session scoped to one selected topic

In the quiz browse UI, `Valitse aihe` becomes the visible secondary quiz action. `Aikahaaste` remains available, but it moves out of the main card-face layout into a lower-prominence menu or in-flow option.

The implementation should reuse the existing topic metadata already stored on questions and the existing `topic` URL query pattern already used by flashcard review links. This keeps the feature incremental, avoids schema changes, and preserves current flashcard/topic mastery behavior.

---

## User Benefit

This supports a strong learner need already reflected in the personas and journeys: practice a specific weak area without leaving the quiz flow. Right now topic targeting exists for flashcards and weak-topic review links, but not for normal quiz sessions. That creates a gap:

- flashcards are good for memorization and recall
- quizzes are better when the student wants to actively test just one topic

For Emma, this reduces overwhelm and gives a clearer "I want to practice exactly this next" path.

---

## Current Implementation Context

### What already exists

- Questions already carry `topic` metadata and quiz sessions already use topic-balanced sampling across the whole set.
- Flashcard sessions already support topic filtering on [`src/app/play/[code]/page.tsx`](/Users/mikko.makipaa/koekertaaja/src/app/play/[code]/page.tsx).
- The app already uses `?topic=` in URLs for direct weak-topic review links from [`src/lib/play/results-screen.ts`](/Users/mikko.makipaa/koekertaaja/src/lib/play/results-screen.ts).
- Topic normalization and dedupe already exist in [`src/lib/topics/normalization.ts`](/Users/mikko.makipaa/koekertaaja/src/lib/topics/normalization.ts) and read paths.

### Why reuse matters

- No DB migration is needed.
- No new API route is needed.
- Topic-targeted entry can stay linkable and sharable.
- Existing topic mastery links remain conceptually consistent.

---

## Recommended Implementation Method

### 1. Reuse `topic` as the canonical session filter

Use `?topic=<canonical-topic>` for quiz sessions the same way the app already uses it for flashcard review.

Examples:

- Full quiz session: `/play/ABC123?mode=pelaa&difficulty=helppo`
- Topic-targeted quiz: `/play/ABC123?mode=pelaa&difficulty=helppo&topic=Fotosynteesi`

This keeps routing simple and enables direct links from future mastery/review surfaces.

### 2. Apply topic filtering before quiz sampling

Current quiz flow:

1. load all quiz-safe questions
2. optionally use review-mode subset
3. optionally use Aikahaaste subset
4. sample session questions

Proposed flow:

1. load all quiz-safe questions
2. optionally use review-mode subset
3. if `topic` is present and valid, filter question pool to that topic
4. optionally use Aikahaaste subset only from the filtered pool
5. run existing session sampling on that scoped pool

Important detail: once a topic is selected, do not run cross-topic balancing logic against the full set. The session should behave as "single-topic quiz mode", not "balanced whole-set mode with topic preference."

### 3. Keep flashcard and quiz selection shells visually aligned, but not identical

Reuse the current flashcard topic-selection card pattern as the base:

- header via `PlaySessionHeader`
- top "Kaikki aiheet" card
- one card per topic with question count
- mobile-first single-column list

But quiz mode needs quiz-specific copy and metadata:

- use question count, not card count
- keep difficulty context visible
- clarify that "Kaikki aiheet" stays balanced, while a selected topic focuses only on that topic

### 4. Preserve current no-selection behavior

Do not force topic selection for all quiz sessions.

Default quiz behavior should remain:

- user can start immediately from browse card CTA
- topic selection is an optional second step, not a new mandatory gate

Recommended entry model:

- primary CTA still starts the normal quiz immediately
- add a secondary, lighter "Valitse aihe" action inside the quiz play shell or browse card details

This avoids adding friction to the most common path.

### 5. Support direct topic links from mastery surfaces later

The results layer already builds topic-specific flashcard links. After this feature, topic mastery should be able to route to either:

- `Kertaa korteilla` for memorization
- `Pelaa aiheesta` for active testing

That follow-up should be a separate task, not part of the first implementation.

---

## UI Plan

### Recommended entry point

Keep the current play browse card structure and add a secondary topic action only for quiz sets with more than one available topic.

Recommended card behavior on `/play`:

- Primary CTA: `Pelaa nyt` or existing difficulty CTA behavior
- Secondary text action or compact button: `Valitse aihe`
- `Aikahaaste`: not shown as a card-face peer action; move behind a lightweight menu, overflow, or in-session "more ways to play" surface

This secondary action should navigate to the same play route with a lightweight selector state rather than creating a new standalone page.

### Topic selector screen

Inside [`src/app/play/[code]/page.tsx`](/Users/mikko.makipaa/koekertaaja/src/app/play/[code]/page.tsx), add a quiz-topic-selection state that mirrors the flashcard selector:

- Header title: stripped question set name
- Subtitle: `Valitse kaikki aiheet tai harjoittele yhtä aihetta`
- First card:
  - Title: `Kaikki aiheet`
  - Supporting text: `Tasapainoinen harjoitus kaikista aiheista`
- Topic cards:
  - Title: topic name
  - Supporting text: `N kysymystä`
  - Optional small badge for weakest topics in later iteration, not v1

### Selection behavior

- Choosing `Kaikki aiheet` clears the topic filter and starts the normal quiz
- Choosing a topic updates the route with `topic=...` and starts a topic-scoped session
- Add a lightweight back action to return to browse

### Copy guidance

Use Finnish copy aligned to the existing shell:

- section prompt: `Mitä haluat harjoitella?`
- all-topics support: `Saat tehtäviä tasaisesti eri aiheista`
- one-topic support: `Harjoittele vain tämän aiheen tehtäviä`

### When not to show selector

Skip topic selection UI entirely when:

- there are fewer than 2 distinct topics
- all valid questions collapse into one topic after normalization
- the chosen mode is review mode with only one topic present

In those cases the app should start the session normally.

---

## Open Questions — Validated

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Should quiz topic selection replace the default "play now" flow? | No. Keep normal quiz start as the default path. | The user journey emphasizes low-friction start. Making topic choice mandatory would slow the common case. |
| 2 | Should the selector live on `/play` or inside `/play/[code]`? | Inside `/play/[code]`. | Topic availability is set-specific and already resolved there. This avoids duplicating per-set topic lookups in browse cards. |
| 3 | Should topic selection use a new route? | No new route. Use the existing play route plus `topic` query state. | Existing flashcard and mastery patterns already use `topic` in the query string. |
| 4 | Should "Kaikki aiheet" remain topic-balanced? | Yes. | This preserves current quiz quality and fairness when no topic is selected. |
| 5 | Should a selected topic still run stratified cross-topic sampling? | No. Filter first, then sample only inside that topic. | The user intent is focused practice, not balanced whole-set coverage. |
| 6 | Should Aikahaaste support topic filtering? | Not in v1. | It adds edge-case complexity around pool size and pacing. Keep Aikahaaste whole-set only for now. |
| 7 | Should review mode support topic filtering? | Not in v1. | Review mode is already a narrowed remediation path. Combining mistake-bank and topic filters is likely too sparse. |
| 8 | What happens if the topic URL param is invalid? | Fall back to normal all-topic session. | Silent resilience is better than an error state for a stale or mistyped link. |
| 9 | Should the topic selector appear when only one topic exists? | No. | A selector with one meaningful choice adds useless friction. |
| 10 | Should browse cards show per-topic counts? | No for v1. | That would require extra query work on browse and adds visual density. Keep the detailed selection in the play route. |
| 11 | If there is room for only one visible secondary quiz action, should it be `Valitse aihe` or `Aikahaaste`? | `Valitse aihe`. | Topic selection has stronger everyday learning value and creates a cleaner bridge from mastery data to action. `Aikahaaste` is still useful, but it is a secondary challenge mode rather than the core study aid. |
| 12 | Should `Aikahaaste` be removed from the product? | No. Demote it from browse-card prominence. | The mode still adds engagement variety; it just should not compete with the more pedagogically useful topic-choice action. |

---

## Architecture Changes

### Files to extend

| File | Change type | Notes |
|------|------------|-------|
| `src/app/play/[code]/page.tsx` | Extend | Add quiz-topic selection state, query parsing, and filtered quiz pool behavior |
| `src/lib/play/flashcard-topic-lookup.ts` | Extend or extract shared helper | Generalize topic lookup/counting helpers so quiz and flashcard selection can share them |
| `src/lib/supabase/queries.ts` | Reuse | Existing topic read path already supports normalized topic options |
| `src/components/play/PlayBrowsePageClient.tsx` | Extend | Make `Valitse aihe` the visible secondary quiz action and move `Aikahaaste` into a lower-prominence access point |
| `src/lib/play/results-screen.ts` | Later follow-up | Optional future direct quiz-topic links from mastery summaries |

---

## Risks and Mitigations

### Risk: Topic-targeted sessions are too short

Some sets may have very few questions in one topic.

Mitigation:

- enforce a minimum pool threshold before showing topic action, or
- allow short sessions but show actual count honestly in the selector

Recommended v1 approach: show the selector as long as a topic has at least 3 questions; otherwise hide that topic from the list.

### Risk: Mixed-mode complexity in one page grows

`src/app/play/[code]/page.tsx` already carries quiz, flashcard, review, and speed-quiz logic.

Mitigation:

- extract shared topic-selection helpers
- isolate the selector rendering into a dedicated component if the diff becomes noisy

### Risk: Topic names drift across old data

Mitigation:

- rely on existing normalization/dedupe on read
- compare using normalized canonical topic labels only

---

## Testing Scope

Per [`DWF/TESTING_STRATEGY.md`](/Users/mikko.makipaa/koekertaaja/DWF/TESTING_STRATEGY.md), prioritize pure helper coverage and critical-path interaction behavior:

- unit tests for topic filtering helpers
- unit tests for invalid/missing topic param fallback
- component or interaction coverage for selector rendering conditions
- regression coverage to confirm default all-topic quiz flow does not change

Do not rely only on manual verification because the key behavior lives in conditional pool construction.

---

## Recommended Task Breakdown

1. Add quiz topic-selection session foundation and shared helper extraction.
2. Add selector UI and optional browse entry affordance.
3. Add tests and DWF/doc alignment.

---

## Recommendation

Implement this as an incremental extension of the current play route, not as a new mode or route family.

On the browse card, use `Valitse aihe` as the one visible secondary quiz action. Keep `Aikahaaste`, but demote it into a menu or deeper in-flow option so the card layout stays cleaner and the strongest learning-oriented action remains prominent.

That gives you:

- low implementation risk
- consistent topic-link semantics
- minimal product friction
- a clean base for future "Pelaa aiheesta" links from mastery results
