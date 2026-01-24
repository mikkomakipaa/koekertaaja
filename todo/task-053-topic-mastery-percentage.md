# Task 053: Topic Mastery % on Question Set Cards

## Status
- **Status**: Pending
- **Created**: 2026-01-24
- **Priority**: P1 (High engagement, zero cost)
- **Estimated Effort**: 3 points (2-4 hours)

## Overview
Display topic mastery percentages on question set cards using localStorage-tracked performance data. Shows students which topics they've mastered and which need more practice, helping them make informed decisions about what to study next.

## User Requirements
Based on validation session:
- ✅ **Question set cards only** (not on ResultsScreen)
- ✅ **Progress bars** visual design
- ✅ **localStorage persistence** (no profiles/authentication)
- ✅ **Per question set** tracking

## Learning Science Justification
- **Metacognition**: Self-monitoring improves learning outcomes by 30% (Dunlosky et al., 2013)
- **Mastery learning**: Students focus on weak areas, improving efficiency
- **Visible progress**: Motivates continued practice and builds confidence

## Acceptance Criteria
- [ ] Track correct/total answers per topic per question set in localStorage
- [ ] Update mastery data after each question is answered in game session
- [ ] Display topic mastery on question set cards (only if mastery data exists)
- [ ] Progress bars show percentage visually with color coding
- [ ] Color scheme: Green (≥80%), Yellow (50-79%), Red (<50%)
- [ ] Works across all 7 question types
- [ ] Mobile responsive (progress bars scale properly)
- [ ] localStorage key format: `topic_mastery_${questionSetCode}`
- [ ] Graceful handling when topic field is missing or undefined
- [ ] No mastery display if student hasn't played that question set yet

---

## Technical Implementation Plan

### 1. Create `useTopicMastery` Hook
**File**: `src/hooks/useTopicMastery.ts` (NEW)

**Responsibilities**:
- Get topic mastery stats for a question set from localStorage
- Update mastery stats after each answer
- Calculate mastery percentages per topic
- Return data in format ready for UI rendering

**API**:
```typescript
interface TopicMasteryRecord {
  [topic: string]: {
    correct: number;
    total: number;
    percentage: number; // calculated field
  };
}

function useTopicMastery(questionSetCode?: string) {
  /**
   * Get mastery stats for this question set
   * Returns: { "Matematiikka": { correct: 8, total: 10, percentage: 80 }, ... }
   */
  const getMasteryStats = (): TopicMasteryRecord => {
    if (!questionSetCode) return {};

    try {
      const key = `topic_mastery_${questionSetCode}`;
      const stored = localStorage.getItem(key);
      if (!stored) return {};

      const data = JSON.parse(stored);

      // Add calculated percentage field
      const withPercentages: TopicMasteryRecord = {};
      for (const [topic, stats] of Object.entries(data)) {
        withPercentages[topic] = {
          ...(stats as { correct: number; total: number }),
          percentage: Math.round(((stats.correct / stats.total) * 100))
        };
      }

      return withPercentages;
    } catch (error) {
      console.error('Error reading topic mastery:', error);
      return {};
    }
  };

  /**
   * Update mastery stats after answering a question
   * @param topic - Question topic
   * @param isCorrect - Whether answer was correct
   */
  const updateMastery = (topic: string | undefined, isCorrect: boolean) => {
    if (!questionSetCode || !topic || topic.trim() === '') return;

    try {
      const key = `topic_mastery_${questionSetCode}`;
      const current = getMasteryStats();

      // Initialize topic if doesn't exist
      if (!current[topic]) {
        current[topic] = { correct: 0, total: 0, percentage: 0 };
      }

      // Update counts
      current[topic].total += 1;
      if (isCorrect) {
        current[topic].correct += 1;
      }

      // Recalculate percentage
      current[topic].percentage = Math.round(
        (current[topic].correct / current[topic].total) * 100
      );

      // Save to localStorage (without percentage field)
      const toStore: Record<string, { correct: number; total: number }> = {};
      for (const [topicKey, stats] of Object.entries(current)) {
        toStore[topicKey] = {
          correct: stats.correct,
          total: stats.total
        };
      }

      localStorage.setItem(key, JSON.stringify(toStore));
    } catch (error) {
      console.error('Error updating topic mastery:', error);
      // Fail silently - don't break gameplay
    }
  };

  /**
   * Clear all mastery data for this question set
   */
  const clearMastery = () => {
    if (!questionSetCode) return;

    try {
      const key = `topic_mastery_${questionSetCode}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing topic mastery:', error);
    }
  };

  /**
   * Check if any mastery data exists
   */
  const hasMasteryData = (): boolean => {
    const stats = getMasteryStats();
    return Object.keys(stats).length > 0;
  };

  return {
    getMasteryStats,
    updateMastery,
    clearMastery,
    hasMasteryData,
  };
}

export { useTopicMastery };
export type { TopicMasteryRecord };
```

**localStorage Format**:
```json
// Key: topic_mastery_ABC123
{
  "Matematiikka": { "correct": 8, "total": 10 },
  "Biologia": { "correct": 3, "total": 8 },
  "Kemia": { "correct": 12, "total": 15 }
}
```

---

### 2. Integrate with `useGameSession` Hook
**File**: `src/hooks/useGameSession.ts` (MODIFY)

**Changes**:
- Accept new optional parameter: `questionSetCode?: string`
- Import and use `useTopicMastery` hook
- Update mastery after each answer in `submitAnswer`

**Modified Signature**:
```typescript
export function useGameSession(
  allQuestions: Question[],
  questionsPerSession = DEFAULT_QUESTIONS_PER_SESSION,
  grade?: number,
  reviewMode = false,
  mistakeQuestions?: Question[],
  questionSetCode?: string  // ADD THIS
)
```

**Integration in submitAnswer** (around line 122):
```typescript
import { useTopicMastery } from './useTopicMastery';

export function useGameSession(
  // ... params
  questionSetCode?: string
) {
  // ... existing state
  const { updateMastery } = useTopicMastery(questionSetCode);

  const submitAnswer = useCallback(() => {
    // ... existing answer evaluation logic

    const currentQuestion = selectedQuestions[currentQuestionIndex];
    const { isCorrect, correctAnswer } = evaluateQuestionAnswer(
      currentQuestion,
      userAnswer,
      grade
    );

    // ... existing points/streak logic

    // UPDATE TOPIC MASTERY (NEW)
    if (currentQuestion.topic) {
      updateMastery(currentQuestion.topic, isCorrect);
    }

    // ... rest of submitAnswer logic
  }, [userAnswer, selectedQuestions, currentQuestionIndex, /* ... */ updateMastery]);

  // ... rest of hook
}
```

---

### 3. Create TopicMasteryDisplay Component
**File**: `src/components/play/TopicMasteryDisplay.tsx` (NEW)

**Purpose**: Reusable component to display topic mastery with progress bars

**Props**:
```typescript
interface TopicMasteryDisplayProps {
  questionSetCode: string;
  className?: string;
}
```

**Implementation**:
```tsx
'use client';

import { useTopicMastery } from '@/hooks/useTopicMastery';
import { Brain } from '@phosphor-icons/react';

interface TopicMasteryDisplayProps {
  questionSetCode: string;
  className?: string;
}

export function TopicMasteryDisplay({
  questionSetCode,
  className = ''
}: TopicMasteryDisplayProps) {
  const { getMasteryStats, hasMasteryData } = useTopicMastery(questionSetCode);

  if (!hasMasteryData()) {
    return null; // Don't render if no data
  }

  const masteryStats = getMasteryStats();
  const topics = Object.entries(masteryStats).sort((a, b) =>
    b[1].percentage - a[1].percentage // Sort by mastery desc
  );

  // Color based on percentage
  const getColor = (percentage: number) => {
    if (percentage >= 80) return {
      bg: 'bg-green-500',
      text: 'text-green-700 dark:text-green-300',
      label: 'Hyvä hallinta'
    };
    if (percentage >= 50) return {
      bg: 'bg-yellow-500',
      text: 'text-yellow-700 dark:text-yellow-300',
      label: 'Kohtuullinen hallinta'
    };
    return {
      bg: 'bg-red-500',
      text: 'text-red-700 dark:text-red-300',
      label: 'Harjoittele lisää'
    };
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
        <Brain size={14} weight="duotone" />
        <span>Hallintasi</span>
      </div>

      {topics.map(([topic, stats]) => {
        const colors = getColor(stats.percentage);

        return (
          <div key={topic} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {topic}
              </span>
              <span className={`text-xs font-semibold ${colors.text}`}>
                {stats.percentage}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors.bg} transition-all duration-500 ease-out`}
                style={{ width: `${stats.percentage}%` }}
                role="progressbar"
                aria-valuenow={stats.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${topic}: ${stats.percentage}% hallinnassa`}
              />
            </div>

            {/* Stats below bar */}
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              {stats.correct}/{stats.total} oikein
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

### 4. Add TopicMasteryDisplay to Question Set Cards
**File**: `src/app/play/page.tsx` (MODIFY)

**Changes**:
- Import `TopicMasteryDisplay` component
- Add component inside each question set card
- Place it after difficulty buttons section

**Integration** (around line 389, after difficulty buttons):
```tsx
import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';

// Inside the map over filteredSets, after difficulty buttons div:

{/* Difficulty Buttons (existing code) */}
<div className="flex flex-wrap gap-2">
  {/* ... existing difficulty buttons ... */}
</div>

{/* Topic Mastery Display - NEW */}
<div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
  <TopicMasteryDisplay questionSetCode={group.sets[0].code} />
</div>
```

**Note**: Using `group.sets[0].code` assumes all sets in a group share mastery data. Since we track by question set code, each difficulty (Helppo/Normaali) will have separate mastery tracking. This is actually good - it shows mastery per difficulty level.

**Alternative**: If you want shared mastery across difficulties, we'd need to track by `cleanName` instead of `code`, but that adds complexity. Recommend separate tracking per difficulty.

---

### 5. Update Play Page to Pass questionSetCode
**File**: `src/app/play/[code]/page.tsx` (MODIFY)

**Changes**:
- Pass `questionSetCode` to `useGameSession` hook

**Around line where useGameSession is called**:
```typescript
const {
  currentQuestion,
  // ... other returns
} = useGameSession(
  questions,
  questionsPerSession,
  questionSet.grade,
  isReviewMode,
  isReviewMode ? mistakeQuestions : undefined,
  questionSet.code  // ADD THIS - pass question set code
);
```

---

## UI/UX Specifications

### Progress Bar Styling
```tsx
// Container
className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"

// Fill (green)
className="h-full bg-green-500 transition-all duration-500 ease-out"

// Fill (yellow)
className="h-full bg-yellow-500 transition-all duration-500 ease-out"

// Fill (red)
className="h-full bg-red-500 transition-all duration-500 ease-out"
```

### Color Thresholds
- **Green (≥80%)**: Good mastery - "Hyvä hallinta"
- **Yellow (50-79%)**: Moderate mastery - "Kohtuullinen hallinta"
- **Red (<50%)**: Needs practice - "Harjoittele lisää"

### Mobile Responsive
- Progress bars scale to full width of card
- Text sizes: 12px for topic names, 10px for stats
- Touch-friendly (no interaction needed, just display)

### Accessibility
- `role="progressbar"` on progress bar div
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` attributes
- `aria-label` describing topic and percentage
- Sufficient color contrast (WCAG AA compliant)

---

## Edge Cases & Error Handling

1. **Questions without topic field**:
   - Skip mastery tracking for those questions
   - Don't crash, just silently ignore

2. **localStorage quota exceeded**:
   - Wrap all localStorage operations in try-catch
   - Log error to console
   - Fail silently - don't break gameplay

3. **Empty topic strings**:
   - Filter out `topic === ''` or `topic.trim() === ''`
   - Don't create mastery entries for empty topics

4. **Multiple question sets in same group**:
   - Each difficulty (Helppo/Normaali) has separate code
   - Each tracks mastery independently
   - This is intentional - mastery at Helppo ≠ mastery at Normaali

5. **First-time play (no mastery data)**:
   - `hasMasteryData()` returns false
   - Component renders `null` (nothing displayed)
   - After first session, mastery appears

6. **Topic name changes**:
   - If topic names change in new question generation, old mastery data becomes orphaned
   - Not a problem - just shows old topics until localStorage cleared
   - Optional: Add "Clear Stats" button in future

7. **Cross-browser localStorage**:
   - Same pattern as badges - works in all modern browsers
   - Private/incognito mode may not persist (expected behavior)

---

## Testing Checklist

### Unit Tests (Vitest)
- [ ] `useTopicMastery` hook:
  - [ ] `getMasteryStats` returns empty object when no data
  - [ ] `updateMastery` creates new topic entry
  - [ ] `updateMastery` increments correct count when isCorrect=true
  - [ ] `updateMastery` increments total count always
  - [ ] `updateMastery` calculates percentage correctly
  - [ ] `hasMasteryData` returns false when no data
  - [ ] `hasMasteryData` returns true when data exists
  - [ ] `clearMastery` removes data from localStorage

### Integration Tests
- [ ] Play quiz → mastery updates after each answer
- [ ] Correct answer → correct count increments
- [ ] Wrong answer → total increments, correct stays same
- [ ] Navigate to browse page → mastery displayed on card
- [ ] Progress bar percentage matches calculated mastery
- [ ] Color changes based on percentage thresholds
- [ ] Multiple topics tracked separately

### Manual Testing (All Question Types)
- [ ] Multiple choice questions update mastery
- [ ] Fill blank questions update mastery
- [ ] True/false questions update mastery
- [ ] Matching questions update mastery
- [ ] Short answer questions update mastery
- [ ] Sequential questions update mastery
- [ ] Map questions update mastery

### Visual Testing
- [ ] Progress bars render correctly on mobile (320px width)
- [ ] Progress bars render correctly on tablet (768px width)
- [ ] Progress bars render correctly on desktop (1024px+ width)
- [ ] Dark mode colors look good
- [ ] Light mode colors look good
- [ ] Progress bar fills animate smoothly
- [ ] Text is readable at all sizes

### Cross-Browser Testing
- [ ] Chrome (localStorage)
- [ ] Safari (localStorage)
- [ ] Firefox (localStorage)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Implementation Order

1. ✅ **Phase 1: Hook Infrastructure** (30-45 min)
   - Create `useTopicMastery.ts` hook
   - Add unit tests
   - Test localStorage operations

2. ✅ **Phase 2: Game Session Integration** (15-30 min)
   - Update `useGameSession` to accept questionSetCode
   - Call `updateMastery` after each answer
   - Test with sample questions

3. ✅ **Phase 3: UI Component** (30-45 min)
   - Create `TopicMasteryDisplay` component
   - Implement progress bar styling
   - Test responsive design

4. ✅ **Phase 4: Browse Page Integration** (15-30 min)
   - Add component to question set cards
   - Test visibility logic (only show when data exists)

5. ✅ **Phase 5: Play Page Integration** (15 min)
   - Pass questionSetCode to useGameSession
   - End-to-end testing

6. ✅ **Phase 6: Polish & Testing** (30 min)
   - Cross-browser testing
   - Mobile responsive testing
   - Edge case handling
   - Accessibility audit

---

## Success Metrics (Future Analytics)

Track these metrics to validate feature effectiveness:
- **Mastery improvement rate**: How quickly students improve mastery % per topic
- **Topic coverage**: % of topics practiced vs. ignored
- **Retention**: Do students with higher mastery % retain knowledge longer?
- **Feature usage**: % of students who reference mastery before choosing difficulty
- **Motivation**: Do students practice more when they see progress?

---

## Future Enhancements (Out of Scope)

- **Mastery history graph**: Chart showing mastery % over time
- **Subtopic mastery**: Track subtopics separately (more granular)
- **Skill mastery**: Track by skill tags in addition to topics
- **Global mastery**: Show mastery across all question sets (not just per-set)
- **Mastery badges**: Unlock badges for 100% mastery on topics
- **Export mastery**: Download mastery report as PDF
- **Teacher dashboard**: Aggregate mastery stats across all students (requires auth)
- **Recommended practice**: AI suggests which topics to practice next
- **Mastery decay**: Reduce mastery % over time if not practiced (spaced repetition)

---

## Dependencies

**NPM Packages**: None (uses existing dependencies)

**Icons Needed** (from @phosphor-icons/react):
- `Brain` (mastery icon)

**Files to Create**:
- `src/hooks/useTopicMastery.ts`
- `src/components/play/TopicMasteryDisplay.tsx`

**Files to Modify**:
- `src/hooks/useGameSession.ts`
- `src/app/play/page.tsx`
- `src/app/play/[code]/page.tsx`

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing for `useTopicMastery`
- [ ] Integration tests passing for mastery tracking
- [ ] Visual tests completed on all screen sizes
- [ ] Cross-browser testing completed
- [ ] Mobile responsive (works on tablets/phones)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No console errors in browser
- [ ] localStorage operations have error handling
- [ ] Edge cases handled gracefully
- [ ] Progress bars animate smoothly
- [ ] Accessibility attributes present
- [ ] WCAG AA color contrast met
- [ ] Code reviewed and approved
- [ ] AGENTS.md updated with Topic Mastery feature documentation

---

## Cost Analysis

**Development Time**: 2-4 hours
**API Cost**: $0.00 (localStorage only, no AI)
**Ongoing Cost**: $0.00 (no server/database)
**Maintenance**: Low (stable feature, no external dependencies)

**ROI**:
- **High engagement**: Students see tangible progress
- **Better learning outcomes**: Focus on weak areas
- **Zero cost**: Pure client-side feature
- **Motivational**: Visual progress increases practice time

---

## Notes

- **Why progress bars?**: More visual than text, easier to scan at a glance
- **Why per-question-set?**: Each difficulty level has different question pools, so mastery should be tracked separately
- **Why localStorage?**: No authentication required, works offline, zero cost
- **Why not subtopics?**: Keep it simple for MVP. Can add subtopic mastery later if needed.
- **Why Brain icon?**: Represents knowledge/mastery, pairs well with existing icon system

---

## Related Tasks

- **Task 052**: Review Mistakes Feature (uses same localStorage pattern)
- **Task 054 (Future)**: Progress Dashboard (aggregates mastery across sets)
- **Task 055 (Future)**: Spaced Repetition (uses mastery data for scheduling)

---

**Last Updated**: 2026-01-24
**Estimated Completion**: 2026-01-24 (same day - quick win!)
