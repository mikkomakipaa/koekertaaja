# Plan 176 — Exam History Tab on Achievements Page

**Date:** 2026-03-05
**Status:** Approved for implementation

---

## Summary

Add a "Kokeet" (Exams) tab to the Achievements page. The tab displays all past exam sessions from localStorage in a scored list sorted by recency. No server calls — pure localStorage read. No new write paths needed.

---

## Problem

The Achievements page currently shows aggregate stats (total sessions, perfect scores) and topic-level mastery, but has no per-exam result history. Users cannot see what they have practiced, how they scored on each exam, or quickly navigate back to a specific exam. This information already exists in localStorage; it just isn't surfaced anywhere.

---

## Data Available in localStorage

All required data already exists. No new write paths or schema changes are needed.

| Source | Key pattern | Contains |
|--------|-------------|----------|
| `listPracticedSetDropdownItemsFromStorage()` | `topic_mastery_*` | code, name, subject, examDate, difficulty, grade, practicedAt |
| `readLastScoreFromStorage(code)` | `last_score_{code}` | score, total, percentage, timestamp, difficulty |

**Discovery mechanism:** `topic_mastery_*` key scanning via existing `listPracticedSetCodesFromStorage()`. Any session that recorded topic mastery (all sessions since late 2025) is included. Sets with no topic mastery data (very old or edge-case sessions) are not included; a `last_score_*` fallback scan is explicitly out of scope to keep complexity low.

---

## Open Questions — Validated

| # | Question | Decision |
|---|----------|----------|
| 1 | Should we add a `last_score_*` key scan as fallback for sets missing topic mastery data? | **No.** Adds complexity. Edge cases are sessions from before topic mastery was introduced. Acceptable data gap. |
| 2 | Should multiple difficulty variants of the same exam (same name, different codes) be grouped into one row? | **No, flat list.** Each code is a separate entry. Grouping requires fuzzy name-matching logic that is out of scope and adds brittleness. Separate entries show the actual granularity of what was practiced. |
| 3 | How to sort the list? | **Most recently practiced first.** Priority: `lastScore.timestamp` > `metadata.practicedAt` > sort to end. |
| 4 | Should difficulty suffixes (" - Helppo", " - Normaali", " - Kortit") be stripped from displayed names? | **Yes.** Apply the same strip logic already in `play/page.tsx`. Extract to a shared utility so both locations use the same function. |
| 5 | Tab label: "Kokeet", "Tulokset", or "Historia"? | **"Kokeet."** Matches the app's vocabulary (Koekertaaja = exam prepper). Short enough for a 3-column tab. |
| 6 | Should the tab label include a count, e.g. "Kokeet (5)"? | **No.** Adds visual noise for young users. The list itself shows the count implicitly. |
| 7 | Should each card have a "Pelaa uudelleen" / play-again link? | **Yes, small ghost link.** Route to `/play/{code}?mode=pelaa` for quiz difficulties, `/play/{code}?mode=opettele` for flashcard. Adds navigation value without visual weight. |
| 8 | Score color coding? | **Yes.** Green ≥ 80 %, amber 60–79 %, red < 60 %. Familiar from Finnish school grading culture. |
| 9 | Empty state when no exam data exists? | **Yes.** Show a message: "Pelaa yksi harjoituskierros, niin koetulokset ilmestyvät tänne." |
| 10 | Pagination or max-item cap? | **No pagination.** All entries scrollable. Most students will have < 20 entries. |
| 11 | Tab grid: current `grid-cols-2` → `grid-cols-3`. "Aiheiden hallinta" too long? | **Shorten to "Aiheet".** Matches the concept (topic coverage) and fits 3-column layout on mobile. |
| 12 | Subject icon: `subjectIconConfigs` currently lives in `play/page.tsx`. Reuse in exam history? | **Extract to shared utility** `src/lib/utils/subject-config.ts`. Both `play/page.tsx` and the new `ExamHistoryTab` import from there. This is the correct refactor regardless of this feature. |

---

## Architecture

### New files
| File | Purpose |
|------|---------|
| `src/hooks/useExamHistory.ts` | Hook: reads all practiced sets + last scores, returns sorted `ExamHistoryEntry[]` |
| `src/components/achievements/ExamHistoryTab.tsx` | Tab UI: sorted list of exam result cards |
| `src/lib/utils/subject-config.ts` | Shared subject icon + color config (extracted from play/page.tsx) |

### Modified files
| File | Change |
|------|--------|
| `src/app/play/page.tsx` | Import `getSubjectConfig` from shared utility (remove local definition) |
| `src/app/play/achievements/page.tsx` | Add "Kokeet" tab, update `grid-cols-2` → `grid-cols-3`, rename "Aiheiden hallinta" → "Aiheet" |

### Type additions
Add `ExamHistoryEntry` to `src/types/` (or inline in the hook if it stays local):

```typescript
interface ExamHistoryEntry {
  code: string;
  name: string | null;           // Difficulty suffix stripped
  subject: string | null;
  examDate: string | null;
  difficulty: string | null;
  grade: string | null;
  sortTimestamp: number;         // max(lastScore.timestamp, practicedAt, 0)
  lastScore: {
    score: number;
    total: number;
    percentage: number;
    timestamp: number;
    difficulty?: string;
  } | null;
}
```

---

## `useExamHistory` Hook Contract

```typescript
export function useExamHistory(): {
  entries: ExamHistoryEntry[];
  isEmpty: boolean;
}
```

- Reads on mount (client-only, SSR-safe guard)
- No reactivity needed (localStorage doesn't trigger re-renders; mount-read is sufficient)
- Returns entries sorted descending by `sortTimestamp`

---

## ExamHistoryTab UI Spec

**Card per entry:**
- Left: subject icon in a colored `h-9 w-9 rounded-md` container (from shared subject-config)
- Center column: `name` (semibold, `text-sm`), `examDate` (muted `text-xs` if present), difficulty + grade badges (`rounded-full text-xs`)
- Right: score pill — `{percentage}%` with color coding, sub-label `{score}/{total}`
- Bottom-right: small ghost "Pelaa →" link

**Score pill colors:**
- ≥ 80 %: `bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200`
- 60–79 %: `bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200`
- < 60 %: `bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200`
- No score: `bg-gray-100 text-gray-600` with em dash

**Card container:** `rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-shadow duration-150` (standard card rules)

---

## Implementation Order (task dependencies)

```
task-250  Extract shared subject-config utility
     ↓
task-251  Create useExamHistory hook
     ↓
task-252  Build ExamHistoryTab component
     ↓
task-253  Integrate tab into achievements page
```

---

## Design Constraints

- Follow `DWF/DESIGN_GUIDELINES.md` for all new surfaces
- Cards: `rounded-xl`, no permanent shadow, `hover:shadow-md`
- Typography: named scale classes only (`text-xs`, `text-sm`, `text-base`)
- Colors: semantic only (score = status color, subject = subject color)
- Tab labels: `text-sm` minimum, no truncation in 3-column layout
