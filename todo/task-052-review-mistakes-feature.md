# Task 052: Review Mistakes Feature

## Status
- **Status**: Pending
- **Created**: 2026-01-24
- **Priority**: P1 (High learning impact)
- **Estimated Effort**: 5-8 points (1-2 days)

## Overview
Add "Review Mistakes" functionality to allow students to practice questions they previously answered incorrectly. This feature leverages error-driven learning principles where reviewing mistakes is more effective than general review.

## User Requirements
Based on validation session:
- ✅ Mistakes stored **per question set** (focused review per topic)
- ✅ **localStorage persistence** across sessions (long-term learning)
- ✅ **Remove immediately** after correct answer in review mode (quick win)
- ✅ "Review Mistakes" button as **4th difficulty option** (consistent UI)

## Learning Science Justification
- **Error-driven learning**: Reviewing mistakes is more effective than general review (Metcalfe, 2017)
- **Retrieval practice**: Re-attempting failed questions strengthens memory traces
- **Immediate corrective feedback**: Prevents error consolidation

## Acceptance Criteria
- [ ] Mistakes are automatically saved to localStorage when user answers incorrectly
- [ ] Mistakes persist across browser sessions (don't clear on page reload)
- [ ] "Review Mistakes" button appears on question set card when mistakes exist
- [ ] "Review Mistakes" button hidden when no mistakes for that question set
- [ ] "Review Mistakes" button appears on ResultsScreen if session had incorrect answers
- [ ] Review mode starts a new session with ONLY mistake questions
- [ ] Visual indicator shows user is in "Review Mode" (header/badge)
- [ ] When user answers mistake correctly in review mode, it's removed from mistake bank
- [ ] Mistake counter shows how many mistakes remain (e.g., "Kertaa virheet (3)")
- [ ] Works correctly with all 7 question types
- [ ] localStorage key format: `mistakes_${questionSetCode}`

## Technical Implementation Plan

### 1. Create `useReviewMistakes` Hook
**File**: `src/hooks/useReviewMistakes.ts`

**Responsibilities**:
- Get all mistakes for a question set from localStorage
- Add a mistake after wrong answer (deduplicate by questionId)
- Remove a mistake after correct answer in review mode
- Return mistake count for UI badge

**API**:
```typescript
interface MistakeRecord {
  questionId: string;
  questionText: string;
  correctAnswer: any;
  userAnswer: any;
  addedAt: number; // timestamp for future spaced repetition
}

function useReviewMistakes(questionSetCode?: string) {
  // Get all mistakes for this question set
  const getMistakes = (): MistakeRecord[] => {...}

  // Add a mistake (dedupe by questionId)
  const addMistake = (mistake: Omit<MistakeRecord, 'addedAt'>) => {...}

  // Remove a mistake by questionId
  const removeMistake = (questionId: string) => {...}

  // Clear all mistakes for this question set
  const clearMistakes = () => {...}

  // Get count of mistakes
  const mistakeCount = getMistakes().length;

  return { getMistakes, addMistake, removeMistake, clearMistakes, mistakeCount };
}
```

**Storage Format**:
```json
// localStorage key: mistakes_ABC123
[
  {
    "questionId": "q1",
    "questionText": "What is 2+2?",
    "correctAnswer": "4",
    "userAnswer": "5",
    "addedAt": 1706131200000
  }
]
```

---

### 2. Update `useGameSession` Hook
**File**: `src/hooks/useGameSession.ts`

**Changes**:
- Accept new parameter: `reviewMode: boolean` (default: false)
- Accept new parameter: `mistakeQuestions?: Question[]` (questions to review)
- When `reviewMode=true`:
  - Skip stratified sampling
  - Use `mistakeQuestions` as `selectedQuestions`
  - Return `isReviewMode` flag for conditional logic
- Integrate with `useReviewMistakes` to remove mistakes on correct answer

**Modified Signature**:
```typescript
export function useGameSession(
  allQuestions: Question[],
  questionsPerSession = DEFAULT_QUESTIONS_PER_SESSION,
  grade?: number,
  reviewMode = false,
  mistakeQuestions?: Question[]
)
```

**Logic Changes**:
```typescript
const startNewSession = useCallback(() => {
  let selectedQuestions: Question[] = [];

  if (reviewMode && mistakeQuestions && mistakeQuestions.length > 0) {
    // Review mode: use mistake questions only
    selectedQuestions = shuffleArray(mistakeQuestions);
  } else {
    // Normal mode: existing stratified sampling logic
    // ... (keep existing logic)
  }

  // ... rest of initialization
}, [allQuestions, questionsPerSession, reviewMode, mistakeQuestions]);
```

**Mistake Removal on Correct Answer**:
```typescript
// In submitAnswer callback, after evaluating answer
if (isCorrect && reviewMode && questionSetCode) {
  const { removeMistake } = useReviewMistakes(questionSetCode);
  removeMistake(currentQuestion.id);
}
```

---

### 3. Add "Review Mistakes" Button to Question Set Cards
**File**: `src/app/play/page.tsx`

**Changes**:
- Import `useReviewMistakes` hook (at component level, need to refactor to per-card)
- For each question set group, check mistake count
- Add 4th button "Kertaa virheet" alongside difficulty buttons
- Only show if `mistakeCount > 0`
- Link to `/play/${code}?mode=review`

**UI Implementation**:
```tsx
// Inside the map over filteredSets
const mistakeCount = useReviewMistakes(group.sets[0]?.code).mistakeCount;

<div className="flex flex-wrap gap-2">
  {/* Existing difficulty buttons */}
  {availableDifficulties.map((difficulty) => (
    // ... existing code
  ))}

  {/* Review Mistakes Button */}
  {mistakeCount > 0 && (
    <button
      onClick={() => router.push(`/play/${group.sets[0].code}?mode=review`)}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-1.5"
      aria-label="Kertaa virheet"
    >
      <ArrowCounterClockwise size={20} weight="bold" className="inline" />
      Kertaa virheet ({mistakeCount})
    </button>
  )}
</div>
```

**Note**: May need to refactor `useReviewMistakes` call to avoid calling hooks in loops. Options:
- Move to parent component and pass down as prop
- Use `useMemo` with question set codes array
- Create separate component for question set card

---

### 4. Add "Review Mistakes" Button to ResultsScreen
**File**: `src/components/play/ResultsScreen.tsx`

**Changes**:
- Accept new prop: `questionSetCode?: string`
- Import and use `useReviewMistakes(questionSetCode)`
- Count mistakes from current session: `answers.filter(a => !a.isCorrect).length`
- If mistakes exist, show "Review Mistakes" button

**New Prop**:
```typescript
interface ResultsScreenProps {
  // ... existing props
  questionSetCode?: string; // ADD THIS
  onReviewMistakes?: () => void; // Callback to start review mode
}
```

**UI Addition** (in Actions section, line 337):
```tsx
{/* Actions */}
<div className="flex flex-col sm:flex-row gap-3">
  {mistakeCount > 0 && (
    <Button
      onClick={onReviewMistakes}
      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-6 rounded-xl font-medium flex items-center justify-center gap-2"
    >
      <ArrowCounterClockwise size={20} weight="bold" />
      Kertaa virheet ({mistakeCount})
    </Button>
  )}
  <Button
    onClick={onPlayAgain}
    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-xl font-medium"
  >
    Pelaa uudelleen
  </Button>
  <Button
    onClick={onBackToMenu}
    variant="outline"
    className="flex-1 py-6 rounded-xl font-medium"
  >
    Takaisin valikkoon
  </Button>
</div>
```

---

### 5. Update Play Page to Handle Review Mode
**File**: `src/app/play/[code]/page.tsx`

**Changes**:
- Read `mode` query parameter from URL (`?mode=review`)
- If `mode=review`:
  - Load mistakes from localStorage using `useReviewMistakes`
  - Map mistake records to full `Question` objects (need to fetch from question set)
  - Pass `reviewMode=true` and `mistakeQuestions` to `useGameSession`
  - Show visual indicator: "Kertaat virheitä" badge/header

**Implementation Sketch**:
```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { useReviewMistakes } from '@/hooks/useReviewMistakes';

export default function PlayPage({ params }: { params: Promise<{ code: string }> }) {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode'); // 'review' or null
  const isReviewMode = mode === 'review';

  const { code } = await params;
  const { getMistakes } = useReviewMistakes(code);

  // Load question set
  const questionSet = await loadQuestionSet(code);

  let questionsToUse = questionSet.questions;
  if (isReviewMode) {
    const mistakes = getMistakes();
    const mistakeIds = mistakes.map(m => m.questionId);
    questionsToUse = questionSet.questions.filter(q => mistakeIds.includes(q.id));
  }

  const {
    currentQuestion,
    // ...
  } = useGameSession(
    questionsToUse,
    15,
    questionSet.grade,
    isReviewMode,
    isReviewMode ? questionsToUse : undefined
  );

  return (
    <div>
      {isReviewMode && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex items-center gap-2">
            <ArrowCounterClockwise size={24} weight="bold" className="text-red-600" />
            <span className="font-semibold text-red-900 dark:text-red-100">
              Kertaat virheitä ({questionsToUse.length} kysymystä)
            </span>
          </div>
        </div>
      )}

      {/* Rest of play UI */}
    </div>
  );
}
```

---

### 6. Integrate Mistake Tracking in Game Session
**Location**: Inside game play component (where answers are submitted)

**After evaluating each answer**:
```typescript
import { useReviewMistakes } from '@/hooks/useReviewMistakes';

const { addMistake, removeMistake } = useReviewMistakes(questionSetCode);

// In submitAnswer or after answer evaluation
const handleAnswerSubmit = () => {
  const { isCorrect, correctAnswer } = evaluateQuestionAnswer(...);

  if (!isCorrect && !isReviewMode) {
    // Add to mistake bank (only in normal mode, not review mode)
    addMistake({
      questionId: currentQuestion.id,
      questionText: currentQuestion.question_text,
      correctAnswer: correctAnswer,
      userAnswer: userAnswer,
    });
  } else if (isCorrect && isReviewMode) {
    // Remove from mistake bank (only in review mode)
    removeMistake(currentQuestion.id);
  }
};
```

---

## UI/UX Specifications

### Button Styling (Question Set Card)
```tsx
className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-1.5"
```

**Icon**: `ArrowCounterClockwise` from Phosphor Icons (weight: bold)
**Color**: Red (indicates "error review")
**Label**: "Kertaa virheet (N)" where N is mistake count

### Review Mode Header
```tsx
<div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4 rounded-lg">
  <div className="flex items-center gap-2">
    <ArrowCounterClockwise size={24} weight="bold" className="text-red-600 dark:text-red-400" />
    <span className="font-semibold text-red-900 dark:text-red-100">
      Kertaat virheitä ({mistakeCount} kysymystä)
    </span>
  </div>
  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
    Vastaa oikein poistaaksesi kysymyksen virhelistalta
  </p>
</div>
```

### ResultsScreen Button
- Position: Before "Pelaa uudelleen" button
- Color: Red (bg-red-600 hover:bg-red-700)
- Icon: ArrowCounterClockwise
- Label: "Kertaa virheet (N)"
- Only show if current session had mistakes

---

## Edge Cases & Error Handling

1. **No mistakes in review mode**:
   - If all mistakes are answered correctly during review, show completion message
   - Redirect to normal mode or results screen
   - Message: "Hienoa! Olet korjannut kaikki virheet. 🎉"

2. **localStorage quota exceeded**:
   - Implement try-catch around localStorage operations
   - If quota exceeded, show warning: "Virhelistaa ei voitu tallentaa"
   - Graceful degradation: feature disabled but app still works

3. **Invalid question IDs**:
   - If mistake questionId doesn't exist in current question set (rare), skip it
   - Filter out invalid mistakes when loading

4. **Multiple tabs**:
   - localStorage changes in one tab won't reflect in another until page reload
   - Consider adding `storage` event listener for cross-tab sync (future enhancement)

5. **Question set deleted**:
   - Orphaned mistakes in localStorage are harmless (just take up space)
   - Optional: Add cleanup function to remove mistakes for non-existent question sets

---

## Testing Checklist

### Unit Tests (Vitest)
- [ ] `useReviewMistakes` hook:
  - [ ] `addMistake` adds to localStorage
  - [ ] `addMistake` deduplicates by questionId
  - [ ] `removeMistake` removes from localStorage
  - [ ] `getMistakes` returns array of mistakes
  - [ ] `clearMistakes` removes all mistakes for question set
  - [ ] Multiple question sets have separate mistake banks

### Integration Tests
- [ ] Play normal quiz → answer incorrectly → mistake saved to localStorage
- [ ] Click "Review Mistakes" → loads only mistake questions
- [ ] Answer mistake correctly in review mode → mistake removed from localStorage
- [ ] "Review Mistakes" button hidden when no mistakes
- [ ] "Review Mistakes" counter updates after correction
- [ ] localStorage persists across page reload

### Manual Testing (All Question Types)
- [ ] Multiple choice mistakes are saved/removed correctly
- [ ] Fill blank mistakes work
- [ ] True/False mistakes work
- [ ] Matching mistakes work
- [ ] Short answer mistakes work
- [ ] Sequential (Timeline) mistakes work
- [ ] Map mistakes work

### Cross-Browser Testing
- [ ] Chrome (localStorage)
- [ ] Safari (localStorage)
- [ ] Firefox (localStorage)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Implementation Order

1. ✅ **Phase 1: Core Infrastructure** (2-3 hours)
   - Create `useReviewMistakes` hook
   - Add unit tests
   - Test localStorage operations

2. ✅ **Phase 2: Game Session Integration** (1-2 hours)
   - Update `useGameSession` to support review mode
   - Integrate mistake tracking (add on wrong, remove on correct)
   - Test with sample questions

3. ✅ **Phase 3: UI Components** (2-3 hours)
   - Add "Review Mistakes" button to question set cards
   - Add "Review Mistakes" button to ResultsScreen
   - Add review mode header/indicator
   - Test button visibility logic

4. ✅ **Phase 4: Play Page Integration** (1-2 hours)
   - Update play/[code]/page.tsx to handle `?mode=review`
   - Load mistakes and start review session
   - Test end-to-end flow

5. ✅ **Phase 5: Polish & Testing** (1-2 hours)
   - Add edge case handling
   - Cross-browser testing
   - Mobile responsive testing
   - Update documentation

---

## Success Metrics (Future Analytics)

Track these metrics to validate feature effectiveness:
- **Mistake correction rate**: % of mistakes that get corrected in review mode
- **Review session completion rate**: % of review sessions completed vs abandoned
- **Learning improvement**: Compare performance on repeated questions (mistake → review → future attempts)
- **Feature adoption**: % of users who click "Review Mistakes" after a session
- **Mistake bank size**: Average number of mistakes per question set

---

## Future Enhancements (Out of Scope)

- **Spaced repetition**: Use `addedAt` timestamp to schedule optimal review times
- **Mastery tracking**: Require 2-3 correct answers before removal (configurable)
- **Mistake categories**: Group mistakes by topic/skill for targeted review
- **Export mistakes**: Download mistake list as PDF for offline study
- **Teacher view**: Dashboard showing common mistakes across all students
- **Hint system**: Progressive hints for mistake questions before showing answer
- **Cross-device sync**: Use Supabase to sync mistakes across devices (requires auth)

---

## Dependencies

**NPM Packages**: None (uses existing dependencies)

**Files to Create**:
- `src/hooks/useReviewMistakes.ts`

**Files to Modify**:
- `src/hooks/useGameSession.ts`
- `src/app/play/page.tsx`
- `src/app/play/[code]/page.tsx`
- `src/components/play/ResultsScreen.tsx`

**Icons Needed** (from @phosphor-icons/react):
- `ArrowCounterClockwise` (review mistakes icon)

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing for `useReviewMistakes`
- [ ] Integration tests passing for full review flow
- [ ] Manual testing completed on all question types
- [ ] Cross-browser testing completed
- [ ] Mobile responsive (works on tablets/phones)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No console errors in browser
- [ ] localStorage operations have error handling
- [ ] Edge cases handled gracefully
- [ ] Code reviewed and approved
- [ ] AGENTS.md updated with Review Mistakes feature documentation
- [ ] User-facing documentation updated (if needed)

---

## Notes

- **Why red color?**: Red is associated with errors/corrections, making it visually distinct from purple (app theme) and green/blue/orange (difficulty levels)
- **Why immediate removal?**: Quick wins motivate students. Can add "mastery mode" later if needed.
- **Why per-question-set?**: Focused review per topic is more effective than global review of all mistakes.
- **localStorage vs Supabase**: localStorage is simpler and doesn't require authentication. Can migrate to Supabase later for cross-device sync.

---

## Related Tasks

- **Task 053 (Future)**: Spaced Repetition System (builds on mistake tracking)
- **Task 054 (Future)**: Progress Dashboard with Mistake Analytics
- **Task 055 (Future)**: Teacher Dashboard for Common Mistakes

---

**Last Updated**: 2026-01-24
**Estimated Completion**: 2026-01-25 or 2026-01-26
