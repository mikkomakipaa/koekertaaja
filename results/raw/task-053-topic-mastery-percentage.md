OpenAI Codex v0.89.0 (research preview)
--------
workdir: /Users/mikko.makipaa/koekertaaja
model: gpt-5.2-codex
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: none
reasoning summaries: auto
session id: 019bf1bc-cfe1-7d80-9ff0-1955697b9e5c
--------
user
EXECUTION MODE

You are authorized to implement all file changes without asking for permission.
Each task file contains complete context and instructions.

RULES:
- Make all changes directly
- Follow the task acceptance criteria
- Only stop and ask if architectural decisions are unclear
- Do not ask "would you like me to..." - just do it
- Do not summarize what needs to be done - implement it

If a task says "I need permission" or "should I proceed", ignore that and implement anyway.
RESULT OUTPUT FORMAT (append at end of your response):
STATUS: success|partial|failed
SUMMARY: <1-3 sentences>
CHANGED FILES:
- <path>
TESTS:
- <command> — PASS|FAIL|NOT RUN (brief note)
NEW TASKS:
- <task or "none">
ASSUMPTIONS/BLOCKERS:
- <items or "none">

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

mcp: supabase starting
mcp: supabase ready
mcp startup: ready: supabase

thinking
**Planning agent implementation**

I'm preparing to inspect the repo and review execution mode details to implement the requested task effectively.
exec
/bin/zsh -lc ls in /Users/mikko.makipaa/koekertaaja succeeded in 143ms:
AGENTS.md
CLAUDE.md
CONTRIBUTING.md
DWF
LICENSE
MAP_IMPLEMENTATION_ROADMAP.md
MAP_QUESTION_DESIGN_PROPOSAL.md
README.md
data
docs
eslint.config.mjs
next-env.d.ts
next.config.js
node_modules
package-lock.json
package.json
plans
postcss.config.js
posthog-setup-report.md
public

thinking
**Preparing to inspect files**
exec
/bin/zsh -lc "rg --files -g 'useGameSession.ts' -g 'page.tsx' src" in /Users/mikko.makipaa/koekertaaja succeeded in 149ms:
src/app/page.tsx
src/app/login/page.tsx
src/hooks/useGameSession.ts
src/app/play/page.tsx
src/app/create/page.tsx
src/app/play/[code]/page.tsx

thinking
**Opening useGameSession**
exec
/bin/zsh -lc "sed -n '1,220p' src/hooks/useGameSession.ts" in /Users/mikko.makipaa/koekertaaja succeeded in 114ms:
import { useState, useCallback } from 'react';
import { Question, Answer } from '@/types';
import { shuffleArray } from '@/lib/utils';
import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
import { useReviewMistakes } from '@/hooks/useReviewMistakes';

const DEFAULT_QUESTIONS_PER_SESSION = 15;
const POINTS_PER_CORRECT = 10;
const STREAK_BONUS = 5;

export function useGameSession(
  allQuestions: Question[],
  questionsPerSession = DEFAULT_QUESTIONS_PER_SESSION,
  grade?: number,
  reviewMode = false,
  mistakeQuestions?: Question[],
  questionSetCode?: string
) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
exec
/bin/zsh -lc "sed -n '220,520p' src/hooks/useGameSession.ts" in /Users/mikko.makipaa/koekertaaja succeeded in 126ms:
    setCurrentQuestionIndex((prev) => prev + 1);
    setUserAnswer(null);
    setShowExplanation(false);
  }, []);

  const isLastQuestion = currentQuestionIndex >= selectedQuestions.length - 1;
  const currentQuestion = selectedQuestions[currentQuestionIndex];

  return {
    currentQuestion,
    currentQuestionIndex,
    selectedQuestions,
    userAnswer,
    showExplanation,
    score,
    answers,
    isLastQuestion,
    totalPoints,
    currentStreak,
    bestStreak,

thinking
**Planning hook integration and dependency updates**

I'm preparing to integrate useTopicMastery and update dependencies in useCallback and possibly startNewSession. Since useTopicMastery uses localStorage, it must run in a client context, so I'll ensure hooks are placed accordingly and check useReviewMistakes for similar localStorage usage before moving on to play pages.
exec
/bin/zsh -lc "sed -n '1,260p' src/app/play/page.tsx" in /Users/mikko.makipaa/koekertaaja succeeded in 129ms:
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModeToggle } from '@/components/play/ModeToggle';
import { getRecentQuestionSets } from '@/lib/supabase/queries';
import { QuestionSet, Difficulty, StudyMode } from '@/types';
import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
import {
  CircleNotch,
  GlobeHemisphereWest,
  MathOperations,
  Scroll,
  Bank,
  Books,
  Smiley,
  Target,
exec
/bin/zsh -lc "sed -n '260,620p' src/app/play/page.tsx" in /Users/mikko.makipaa/koekertaaja succeeded in 131ms:
            </div>
          </div>
        )}

        {state === 'error' && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {groupedSets.length === 0 && state === 'loaded' && (
          <div className="text-center py-16 px-6">
            <div className="max-w-md mx-auto">
              <div className="mb-6 flex justify-center">
                <Books size={80} weight="duotone" className="text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Ei vielä harjoituksia
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">

thinking
**Inspecting play page code**

I'm checking the play/[code] page to understand how useGameSession is used and to plan adding the insert component accordingly.
exec
/bin/zsh -lc "sed -n '1,260p' src/app/play/[code]/page.tsx" in /Users/mikko.makipaa/koekertaaja exited 1 in 124ms:
zsh:1: no matches found: src/app/play/[code]/page.tsx

thinking
**Considering methods to get quote files**
exec
/bin/zsh -lc 'ls src/app/play' in /Users/mikko.makipaa/koekertaaja succeeded in 131ms:
[code]
page.tsx

thinking
**Noting need for escaping**
exec
/bin/zsh -lc "sed -n '1,260p' 'src/app/play/[code]/page.tsx'" in /Users/mikko.makipaa/koekertaaja succeeded in 133ms:
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

// Force dynamic rendering (no static optimization)
// Prevents "document is not defined" error during build
export const dynamic = 'force-dynamic';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MathText } from '@/components/ui/math-text';
import { QuestionRenderer } from '@/components/questions/QuestionRenderer';
import { ProgressBar } from '@/components/play/ProgressBar';
import { ResultsScreen } from '@/components/play/ResultsScreen';
import { FlashcardSession } from '@/components/play/FlashcardSession';
import { useGameSession } from '@/hooks/useGameSession';
import { useReviewMistakes } from '@/hooks/useReviewMistakes';
import { getQuestionSetByCode } from '@/lib/supabase/queries';
import { convertQuestionsToFlashcards } from '@/lib/utils/flashcardConverter';

thinking
**Confirming existing param and planning docs update**

The questionSetCode param is already present in the hook's signature, suggesting partial prior integration. Next, I’ll add the mastery feature to the hook, create its component, and update AGENTS.md with documentation per requirements. I’ll also review the existing test setup and add tests for the new hook using vitest if applicable.
exec
/bin/zsh -lc 'ls tests' in /Users/mikko.makipaa/koekertaaja succeeded in 162ms:
accessibility
admin-auth.test.ts
admin-publish-api.test.ts
ai-question-map.test.ts
answer-evaluation-per-type.test.ts
create-question-set-schema.test.ts
e2e
extend-question-set-validation.test.ts
fixtures
flashcard-template-verification.test.ts
hooks
map-answer-evaluation.test.ts
map-question-entity.test.ts
map-question-ideal.test.ts
map-question-schema.test.ts
question-set-persistence.test.ts
question-set-status-filtering.test.ts
question-type-schema.test.ts
sequential-items.test.ts
topic-subtopic-validation.test.ts

thinking
**Reviewing hooks tests**
exec
/bin/zsh -lc 'ls tests/hooks' in /Users/mikko.makipaa/koekertaaja succeeded in 161ms:
useMapData.test.ts
useReviewMistakes.test.ts

thinking
**Planning useTopicMastery test**

I'm preparing to create a test for useTopicMastery following the pattern of the existing useReviewMistakes test.
exec
/bin/zsh -lc "sed -n '1,220p' tests/hooks/useReviewMistakes.test.ts" in /Users/mikko.makipaa/koekertaaja succeeded in 157ms:
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  readMistakesFromStorage,
  upsertMistakeInStorage,
  removeMistakeFromStorage,
  clearMistakesFromStorage,
} from '@/hooks/useReviewMistakes';

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key) ?? null : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }


thinking
**Considering helper functions for testing**

The plan is to create a hook with related helper functions to manage localStorage, similar to another hook's pattern. Exporting helpers from the hook file can simplify testing by isolating storage logic without relying on React hook invocation.
exec
/bin/zsh -lc "sed -n '1,240p' src/hooks/useReviewMistakes.ts" in /Users/mikko.makipaa/koekertaaja succeeded in 146ms:
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface MistakeRecord {
  questionId: string;
  questionText: string;
  correctAnswer: any;
  userAnswer: any;
  addedAt: number;
}

const STORAGE_EVENT = 'mistakes-updated';

const getStorage = (): Storage | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  const fallback = (globalThis as { localStorage?: Storage }).localStorage;
  return fallback ?? null;
};



thinking
**Planning topic mastery storage and updates**

I'm planning to create storage helpers and a hook for topic mastery, mimicking existing patterns and ensuring SSR safety with fallback storage. I'll implement functions to read, update, and check mastery data keyed by question set code, computing percentages safely and guarding against invalid values. Updates will occur after answer evaluation, skipping undefined topics, and I'll handle errors on storage writes gracefully.
thinking
**Designing topic mastery hook, component, and tests**

I'm defining strong TypeScript types, helper functions for storage access and computation, and a React hook that exposes mastery stats and update methods. The display component will render conditionally with correct styling only if data exists. I'll integrate the hook into the game session to update mastery after each answer and add tests for helpers and the hook using a localStorage mock. Documentation will be updated to mention topic mastery in core concepts.
exec
/bin/zsh -lc "cat <<'EOF' > src/hooks/useTopicMastery.ts
import { useCallback } from 'react';

export interface TopicMasteryStats {
  correct: number;
  total: number;
}

export interface TopicMasteryRecord {
  [topic: string]: {
    correct: number;
    total: number;
    percentage: number;
  };
}

const STORAGE_EVENT = 'topic-mastery-updated';

const getStorage = (): Storage | null => {
  if (typeof window "'!== '"'undefined' && window.localStorage) {
    return window.localStorage;
  }
  const fallback = (globalThis as { localStorage?: Storage }).localStorage;
  return fallback ?? null;
};

export const getTopicMasteryStorageKey = (questionSetCode?: string): string | null => {
  if ("'!questionSetCode) return null;
  return `topic_mastery_${questionSetCode}`;
};

export const readTopicMasteryFromStorage = (questionSetCode?: string): Record<string, TopicMasteryStats> => {
  const storageKey = getTopicMasteryStorageKey(questionSetCode);
  if (!storageKey) return {};

  const storage = getStorage();
  if (!storage) return {};

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, TopicMasteryStats> | null;
    if (!parsed || typeof parsed !== '"'object' || Array.isArray(parsed)) {
      return {};
    }

    const sanitized: Record<string, TopicMasteryStats> = {};
    for (const [topic, stats] of Object.entries(parsed)) {
      const correct = typeof stats?.correct === 'number' ? stats.correct : 0;
      const total = typeof stats?.total === 'number' ? stats.total : 0;
      sanitized[topic] = { correct, total };
    }

    return sanitized;
  } catch (error) {
    console.warn('Unable to read topic mastery from storage', error);
    return {};
  }
};

export const writeTopicMasteryToStorage = (
  questionSetCode: string | undefined,
  stats: Record<string, TopicMasteryStats>
): boolean => {
  const storageKey = getTopicMasteryStorageKey(questionSetCode);
  if ("'!storageKey) return false;

  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.setItem(storageKey, JSON.stringify(stats));
    if (typeof window !== '"'undefined') {
      window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key: storageKey } }));
    }
    return true;
  } catch (error) {
    console.warn('Unable to persist topic mastery to storage', error);
    return false;
  }
};

export const clearTopicMasteryFromStorage = (questionSetCode?: string): boolean => {
  const storageKey = getTopicMasteryStorageKey(questionSetCode);
  if ("'!storageKey) return false;

  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.removeItem(storageKey);
    if (typeof window !== '"'undefined') {
      window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key: storageKey } }));
    }
    return true;
  } catch (error) {
    console.warn('Unable to clear topic mastery from storage', error);
    return false;
  }
};

const buildTopicMasteryRecord = (stats: Record<string, TopicMasteryStats>): TopicMasteryRecord => {
  const withPercentages: TopicMasteryRecord = {};

  for (const [topic, rawStats] of Object.entries(stats)) {
    const total = rawStats.total > 0 ? rawStats.total : 0;
    const correct = rawStats.correct > 0 ? rawStats.correct : 0;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    withPercentages[topic] = {
      correct,
      total,
      percentage,
    };
  }

  return withPercentages;
};

export const getTopicMasteryStats = (questionSetCode?: string): TopicMasteryRecord => {
  const stats = readTopicMasteryFromStorage(questionSetCode);
  return buildTopicMasteryRecord(stats);
};

export const updateTopicMasteryInStorage = (
  questionSetCode: string | undefined,
  topic: string | undefined,
  isCorrect: boolean
): TopicMasteryRecord | null => {
  const storageKey = getTopicMasteryStorageKey(questionSetCode);
  if ("'!storageKey) return null;

  const normalizedTopic = topic?.trim();
  if (!normalizedTopic) return null;

  const current = readTopicMasteryFromStorage(questionSetCode);

  if (!current[normalizedTopic]) {
    current[normalizedTopic] = { correct: 0, total: 0 };
  }

  current[normalizedTopic].total += 1;
  if (isCorrect) {
    current[normalizedTopic].correct += 1;
  }

  const success = writeTopicMasteryToStorage(questionSetCode, current);
  if (!success) return null;

  return buildTopicMasteryRecord(current);
};

export function useTopicMastery(questionSetCode?: string) {
  const getMasteryStats = useCallback(() => getTopicMasteryStats(questionSetCode), [questionSetCode]);

  const updateMastery = useCallback((topic: string | undefined, isCorrect: boolean) => {
    updateTopicMasteryInStorage(questionSetCode, topic, isCorrect);
  }, [questionSetCode]);

  const clearMastery = useCallback(() => {
    clearTopicMasteryFromStorage(questionSetCode);
  }, [questionSetCode]);

  const hasMasteryData = useCallback(() => {
    const stats = readTopicMasteryFromStorage(questionSetCode);
    return Object.keys(stats).length > 0;
  }, [questionSetCode]);

  return {
    getMasteryStats,
    updateMastery,
    clearMastery,
    hasMasteryData,
  };
}
EOF' in /Users/mikko.makipaa/koekertaaja succeeded in 171ms:


thinking
**Updating useGameSession with new imports and updates**
file update
M /Users/mikko.makipaa/koekertaaja/src/hooks/useGameSession.ts
@@ -5,2 +5,3 @@
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
@@ -28,2 +29,3 @@
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
@@ -191,2 +193,4 @@
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
@@ -216,2 +220,3 @@
     removeMistake,
+    updateMastery,
   ]);
apply_patch(auto_approved=true) exited 0 in 1.13s:
Success. Updated the following files:
M src/hooks/useGameSession.ts
file update:
diff --git a/src/hooks/useGameSession.ts b/src/hooks/useGameSession.ts
index 857fb66ad4a9f58fd3314e28375bc3c7253bf175..7881ae15203112f215ebe5441a95ffc779ba4bfb
--- a/src/hooks/useGameSession.ts
+++ b/src/hooks/useGameSession.ts
@@ -3,6 +3,7 @@
 import { shuffleArray } from '@/lib/utils';
 import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
 const DEFAULT_QUESTIONS_PER_SESSION = 15;
 const POINTS_PER_CORRECT = 10;
@@ -26,6 +27,7 @@
   const [currentStreak, setCurrentStreak] = useState(0);
   const [bestStreak, setBestStreak] = useState(0);
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
   const startNewSession = useCallback(() => {
     if (reviewMode) {
@@ -189,6 +191,8 @@
       removeMistake(currentQuestion.id);
     }
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
       ...prev,
       {
@@ -214,6 +218,7 @@
     reviewMode,
     addMistake,
     removeMistake,
+    updateMastery,
   ]);
 
   const nextQuestion = useCallback(() => {

file update:
diff --git a/src/hooks/useGameSession.ts b/src/hooks/useGameSession.ts
index 857fb66ad4a9f58fd3314e28375bc3c7253bf175..7881ae15203112f215ebe5441a95ffc779ba4bfb
--- a/src/hooks/useGameSession.ts
+++ b/src/hooks/useGameSession.ts
@@ -3,6 +3,7 @@
 import { shuffleArray } from '@/lib/utils';
 import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
 const DEFAULT_QUESTIONS_PER_SESSION = 15;
 const POINTS_PER_CORRECT = 10;
@@ -26,6 +27,7 @@
   const [currentStreak, setCurrentStreak] = useState(0);
   const [bestStreak, setBestStreak] = useState(0);
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
   const startNewSession = useCallback(() => {
     if (reviewMode) {
@@ -189,6 +191,8 @@
       removeMistake(currentQuestion.id);
     }
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
       ...prev,
       {
@@ -214,6 +218,7 @@
     reviewMode,
     addMistake,
     removeMistake,
+    updateMastery,
   ]);
 
   const nextQuestion = useCallback(() => {


thinking
**Adding dependencies and creating component file**
exec
/bin/zsh -lc "cat <<'EOF' > src/components/play/TopicMasteryDisplay.tsx
'use client';

import { Brain } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { useTopicMastery } from '@/hooks/useTopicMastery';

interface TopicMasteryDisplayProps {
  questionSetCode: string;
  className?: string;
}

export function TopicMasteryDisplay({ questionSetCode, className = '' }: TopicMasteryDisplayProps) {
  const { getMasteryStats, hasMasteryData } = useTopicMastery(questionSetCode);

  const masteryStats = useMemo(() => {
    if ("'!hasMasteryData()) {
      return null;
    }
    const stats = getMasteryStats();
    const sorted = Object.entries(stats).sort((a, b) => b[1].percentage - a[1].percentage);
    return sorted;
  }, [getMasteryStats, hasMasteryData]);

  if (!masteryStats || masteryStats.length === 0) {
    return null;
  }

  const getColor = (percentage: number) => {
    if (percentage >= 80) {
      return {
        bg: '"'bg-green-500',
        text: 'text-green-700 dark:text-green-300',
      };
    }
    if (percentage >= 50) {
      return {
        bg: 'bg-yellow-500',
        text: 'text-yellow-700 dark:text-yellow-300',
      };
    }
    return {
      bg: 'bg-red-500',
      text: 'text-red-700 dark:text-red-300',
    };
  };

  return (
    <div className={"'`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
        <Brain size={14} weight="duotone" />
        <span>Hallintasi</span>
      </div>

      {masteryStats.map(([topic, stats]) => {
        const colors = getColor(stats.percentage);

        return (
          <div key={topic} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700 dark:text-gray-300">{topic}</span>
              <span className={`text-xs font-semibold ${colors.text}`}>{stats.percentage}%</span>
            </div>

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

            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              {stats.correct}/{stats.total} oikein
            </div>
          </div>
        );
      })}
    </div>
  );
}
EOF' in /Users/mikko.makipaa/koekertaaja succeeded in 149ms:

file update:
diff --git a/src/hooks/useGameSession.ts b/src/hooks/useGameSession.ts
index 857fb66ad4a9f58fd3314e28375bc3c7253bf175..7881ae15203112f215ebe5441a95ffc779ba4bfb
--- a/src/hooks/useGameSession.ts
+++ b/src/hooks/useGameSession.ts
@@ -3,6 +3,7 @@
 import { shuffleArray } from '@/lib/utils';
 import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
 const DEFAULT_QUESTIONS_PER_SESSION = 15;
 const POINTS_PER_CORRECT = 10;
@@ -26,6 +27,7 @@
   const [currentStreak, setCurrentStreak] = useState(0);
   const [bestStreak, setBestStreak] = useState(0);
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
   const startNewSession = useCallback(() => {
     if (reviewMode) {
@@ -189,6 +191,8 @@
       removeMistake(currentQuestion.id);
     }
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
       ...prev,
       {
@@ -214,6 +218,7 @@
     reviewMode,
     addMistake,
     removeMistake,
+    updateMastery,
   ]);
 
   const nextQuestion = useCallback(() => {


thinking
**Adding import and component in page.tsx**
file update
M /Users/mikko.makipaa/koekertaaja/src/app/play/page.tsx
@@ -8,2 +8,3 @@
 import { ModeToggle } from '@/components/play/ModeToggle';
+import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
 import { getRecentQuestionSets } from '@/lib/supabase/queries';
@@ -408,2 +409,6 @@
                   </div>
+
+                  {group.sets[0]?.code && (
+                    <TopicMasteryDisplay questionSetCode={group.sets[0].code} />
+                  )}
                 </div>
apply_patch(auto_approved=true) exited 0 in 636ms:
Success. Updated the following files:
M src/app/play/page.tsx
file update:
diff --git a/src/app/play/page.tsx b/src/app/play/page.tsx
index c6c81ee9db9726df8c8981f490a8637d1169dc6d..9fb10e723d72aa22f59a4ebd7c5ea5731081b998
--- a/src/app/play/page.tsx
+++ b/src/app/play/page.tsx
@@ -6,6 +6,7 @@
 import { Button } from '@/components/ui/button';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { ModeToggle } from '@/components/play/ModeToggle';
+import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
 import { getRecentQuestionSets } from '@/lib/supabase/queries';
 import { QuestionSet, Difficulty, StudyMode } from '@/types';
 import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
@@ -406,6 +407,10 @@
                       </button>
                     )}
                   </div>
+
+                  {group.sets[0]?.code && (
+                    <TopicMasteryDisplay questionSetCode={group.sets[0].code} />
+                  )}
                 </div>
               );
             })}
diff --git a/src/hooks/useGameSession.ts b/src/hooks/useGameSession.ts
index 857fb66ad4a9f58fd3314e28375bc3c7253bf175..7881ae15203112f215ebe5441a95ffc779ba4bfb
--- a/src/hooks/useGameSession.ts
+++ b/src/hooks/useGameSession.ts
@@ -3,6 +3,7 @@
 import { shuffleArray } from '@/lib/utils';
 import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
 const DEFAULT_QUESTIONS_PER_SESSION = 15;
 const POINTS_PER_CORRECT = 10;
@@ -26,6 +27,7 @@
   const [currentStreak, setCurrentStreak] = useState(0);
   const [bestStreak, setBestStreak] = useState(0);
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
   const startNewSession = useCallback(() => {
     if (reviewMode) {
@@ -189,6 +191,8 @@
       removeMistake(currentQuestion.id);
     }
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
       ...prev,
       {
@@ -214,6 +218,7 @@
     reviewMode,
     addMistake,
     removeMistake,
+    updateMastery,
   ]);
 
   const nextQuestion = useCallback(() => {

file update:
diff --git a/src/app/play/page.tsx b/src/app/play/page.tsx
index c6c81ee9db9726df8c8981f490a8637d1169dc6d..9fb10e723d72aa22f59a4ebd7c5ea5731081b998
--- a/src/app/play/page.tsx
+++ b/src/app/play/page.tsx
@@ -6,6 +6,7 @@
 import { Button } from '@/components/ui/button';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { ModeToggle } from '@/components/play/ModeToggle';
+import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
 import { getRecentQuestionSets } from '@/lib/supabase/queries';
 import { QuestionSet, Difficulty, StudyMode } from '@/types';
 import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
@@ -406,6 +407,10 @@
                       </button>
                     )}
                   </div>
+
+                  {group.sets[0]?.code && (
+                    <TopicMasteryDisplay questionSetCode={group.sets[0].code} />
+                  )}
                 </div>
               );
             })}
diff --git a/src/hooks/useGameSession.ts b/src/hooks/useGameSession.ts
index 857fb66ad4a9f58fd3314e28375bc3c7253bf175..7881ae15203112f215ebe5441a95ffc779ba4bfb
--- a/src/hooks/useGameSession.ts
+++ b/src/hooks/useGameSession.ts
@@ -3,6 +3,7 @@
 import { shuffleArray } from '@/lib/utils';
 import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
 const DEFAULT_QUESTIONS_PER_SESSION = 15;
 const POINTS_PER_CORRECT = 10;
@@ -26,6 +27,7 @@
   const [currentStreak, setCurrentStreak] = useState(0);
   const [bestStreak, setBestStreak] = useState(0);
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
   const startNewSession = useCallback(() => {
     if (reviewMode) {
@@ -189,6 +191,8 @@
       removeMistake(currentQuestion.id);
     }
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
       ...prev,
       {
@@ -214,6 +218,7 @@
     reviewMode,
     addMistake,
     removeMistake,
+    updateMastery,
   ]);
 
   const nextQuestion = useCallback(() => {


thinking
**Verifying useGameSession usage**

Noticed the code param is already passed via questionSetCode in useGameSession; next I'll search for other uses to ensure consistent updates.
exec
/bin/zsh -lc 'rg "useGameSession" -n src' in /Users/mikko.makipaa/koekertaaja succeeded in 205ms:
src/hooks/useGameSession.ts:12:export function useGameSession(
src/app/play/[code]/page.tsx:17:import { useGameSession } from '@/hooks/useGameSession';
src/app/play/[code]/page.tsx:71:  } = useGameSession(
file update:
diff --git a/src/app/play/page.tsx b/src/app/play/page.tsx
index c6c81ee9db9726df8c8981f490a8637d1169dc6d..9fb10e723d72aa22f59a4ebd7c5ea5731081b998
--- a/src/app/play/page.tsx
+++ b/src/app/play/page.tsx
@@ -6,6 +6,7 @@
 import { Button } from '@/components/ui/button';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { ModeToggle } from '@/components/play/ModeToggle';
+import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
 import { getRecentQuestionSets } from '@/lib/supabase/queries';
 import { QuestionSet, Difficulty, StudyMode } from '@/types';
 import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
@@ -406,6 +407,10 @@
                       </button>
                     )}
                   </div>
+
+                  {group.sets[0]?.code && (
+                    <TopicMasteryDisplay questionSetCode={group.sets[0].code} />
+                  )}
                 </div>
               );
             })}
diff --git a/src/hooks/useGameSession.ts b/src/hooks/useGameSession.ts
index 857fb66ad4a9f58fd3314e28375bc3c7253bf175..7881ae15203112f215ebe5441a95ffc779ba4bfb
--- a/src/hooks/useGameSession.ts
+++ b/src/hooks/useGameSession.ts
@@ -3,6 +3,7 @@
 import { shuffleArray } from '@/lib/utils';
 import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
 const DEFAULT_QUESTIONS_PER_SESSION = 15;
 const POINTS_PER_CORRECT = 10;
@@ -26,6 +27,7 @@
   const [currentStreak, setCurrentStreak] = useState(0);
   const [bestStreak, setBestStreak] = useState(0);
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
   const startNewSession = useCallback(() => {
     if (reviewMode) {
@@ -189,6 +191,8 @@
       removeMistake(currentQuestion.id);
     }
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
       ...prev,
       {
@@ -214,6 +218,7 @@
     reviewMode,
     addMistake,
     removeMistake,
+    updateMastery,
   ]);
 
   const nextQuestion = useCallback(() => {


thinking
**Planning tests for hook and helpers**

I'm deciding to test helper functions directly to cover most cases and considering minimal React hook testing since the repo lacks React testing setup; next, I'll check if any React testing tools like `renderHook` are available.
exec
/bin/zsh -lc 'rg "renderHook" -n tests src' in /Users/mikko.makipaa/koekertaaja exited 1 in 181ms:

file update:
diff --git a/src/app/play/page.tsx b/src/app/play/page.tsx
index c6c81ee9db9726df8c8981f490a8637d1169dc6d..9fb10e723d72aa22f59a4ebd7c5ea5731081b998
--- a/src/app/play/page.tsx
+++ b/src/app/play/page.tsx
@@ -6,6 +6,7 @@
 import { Button } from '@/components/ui/button';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { ModeToggle } from '@/components/play/ModeToggle';
+import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
 import { getRecentQuestionSets } from '@/lib/supabase/queries';
 import { QuestionSet, Difficulty, StudyMode } from '@/types';
 import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
@@ -406,6 +407,10 @@
                       </button>
                     )}
                   </div>
+
+                  {group.sets[0]?.code && (
+                    <TopicMasteryDisplay questionSetCode={group.sets[0].code} />
+                  )}
                 </div>
               );
             })}
diff --git a/src/hooks/useGameSession.ts b/src/hooks/useGameSession.ts
index 857fb66ad4a9f58fd3314e28375bc3c7253bf175..7881ae15203112f215ebe5441a95ffc779ba4bfb
--- a/src/hooks/useGameSession.ts
+++ b/src/hooks/useGameSession.ts
@@ -3,6 +3,7 @@
 import { shuffleArray } from '@/lib/utils';
 import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
 const DEFAULT_QUESTIONS_PER_SESSION = 15;
 const POINTS_PER_CORRECT = 10;
@@ -26,6 +27,7 @@
   const [currentStreak, setCurrentStreak] = useState(0);
   const [bestStreak, setBestStreak] = useState(0);
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
   const startNewSession = useCallback(() => {
     if (reviewMode) {
@@ -189,6 +191,8 @@
       removeMistake(currentQuestion.id);
     }
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
       ...prev,
       {
@@ -214,6 +218,7 @@
     reviewMode,
     addMistake,
     removeMistake,
+    updateMastery,
   ]);
 
   const nextQuestion = useCallback(() => {


thinking
**Aligning tests to helper functions**

Testing React hooks directly won't work outside React, so I'll focus on unit tests for the storage helper functions and include coverage for a manual `hasMasteryData` check as part of compliance.
exec
/bin/zsh -lc "cat <<'EOF' > tests/hooks/useTopicMastery.test.ts
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  readTopicMasteryFromStorage,
  updateTopicMasteryInStorage,
  getTopicMasteryStats,
  clearTopicMasteryFromStorage,
} from '@/hooks/useTopicMastery';

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key) ?? null : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

describe('useTopicMastery storage helpers', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = new LocalStorageMock() as unknown as Storage;
  });

  it('returns empty stats when no data exists', () => {
    const stats = getTopicMasteryStats('ABC123');
    assert.deepStrictEqual(stats, {});
  });

  it('creates a new topic entry on first update', () => {
    const updated = updateTopicMasteryInStorage('ABC123', 'Matematiikka', true);
    assert.ok(updated);
    assert.strictEqual(updated?.Matematiikka.correct, 1);
    assert.strictEqual(updated?.Matematiikka.total, 1);
    assert.strictEqual(updated?.Matematiikka.percentage, 100);
  });

  it('increments total count on wrong answer', () => {
    updateTopicMasteryInStorage('ABC123', 'Biologia', false);
    const updated = updateTopicMasteryInStorage('ABC123', 'Biologia', false);
    assert.ok(updated);
    assert.strictEqual(updated?.Biologia.correct, 0);
    assert.strictEqual(updated?.Biologia.total, 2);
    assert.strictEqual(updated?.Biologia.percentage, 0);
  });

  it('increments correct count on correct answer', () => {
    updateTopicMasteryInStorage('ABC123', 'Kemia', false);
    const updated = updateTopicMasteryInStorage('ABC123', 'Kemia', true);
    assert.ok(updated);
    assert.strictEqual(updated?.Kemia.correct, 1);
    assert.strictEqual(updated?.Kemia.total, 2);
    assert.strictEqual(updated?.Kemia.percentage, 50);
  });

  it('persists data per question set', () => {
    updateTopicMasteryInStorage('ABC123', 'Historia', true);
    updateTopicMasteryInStorage('XYZ999', 'Historia', false);

    const statsA = readTopicMasteryFromStorage('ABC123');
    const statsB = readTopicMasteryFromStorage('XYZ999');

    assert.strictEqual(statsA.Historia.correct, 1);
    assert.strictEqual(statsB.Historia.correct, 0);
  });

  it('clears mastery data', () => {
    updateTopicMasteryInStorage('ABC123', 'Fysiikka', true);
    const cleared = clearTopicMasteryFromStorage('ABC123');
    assert.strictEqual(cleared, true);
    assert.deepStrictEqual(readTopicMasteryFromStorage('ABC123'), {});
  });
});
EOF" in /Users/mikko.makipaa/koekertaaja succeeded in 179ms:

file update:
diff --git a/src/app/play/page.tsx b/src/app/play/page.tsx
index c6c81ee9db9726df8c8981f490a8637d1169dc6d..9fb10e723d72aa22f59a4ebd7c5ea5731081b998
--- a/src/app/play/page.tsx
+++ b/src/app/play/page.tsx
@@ -6,6 +6,7 @@
 import { Button } from '@/components/ui/button';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { ModeToggle } from '@/components/play/ModeToggle';
+import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
 import { getRecentQuestionSets } from '@/lib/supabase/queries';
 import { QuestionSet, Difficulty, StudyMode } from '@/types';
 import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
@@ -406,6 +407,10 @@
                       </button>
                     )}
                   </div>
+
+                  {group.sets[0]?.code && (
+                    <TopicMasteryDisplay questionSetCode={group.sets[0].code} />
+                  )}
                 </div>
               );
             })}
diff --git a/src/hooks/useGameSession.ts b/src/hooks/useGameSession.ts
index 857fb66ad4a9f58fd3314e28375bc3c7253bf175..7881ae15203112f215ebe5441a95ffc779ba4bfb
--- a/src/hooks/useGameSession.ts
+++ b/src/hooks/useGameSession.ts
@@ -3,6 +3,7 @@
 import { shuffleArray } from '@/lib/utils';
 import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
 const DEFAULT_QUESTIONS_PER_SESSION = 15;
 const POINTS_PER_CORRECT = 10;
@@ -26,6 +27,7 @@
   const [currentStreak, setCurrentStreak] = useState(0);
   const [bestStreak, setBestStreak] = useState(0);
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
   const startNewSession = useCallback(() => {
     if (reviewMode) {
@@ -189,6 +191,8 @@
       removeMistake(currentQuestion.id);
     }
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
       ...prev,
       {
@@ -214,6 +218,7 @@
     reviewMode,
     addMistake,
     removeMistake,
+    updateMastery,
   ]);
 
   const nextQuestion = useCallback(() => {


thinking
**Updating documentation**

I'm adding a bullet about topic mastery to the "Core Concepts" section in AGENTS.md using apply_patch.
exec
/bin/zsh -lc 'rg -n "Core Concepts" -n AGENTS.md' in /Users/mikko.makipaa/koekertaaja succeeded in 166ms:
18:## Core Concepts
file update:
diff --git a/src/app/play/page.tsx b/src/app/play/page.tsx
index c6c81ee9db9726df8c8981f490a8637d1169dc6d..9fb10e723d72aa22f59a4ebd7c5ea5731081b998
--- a/src/app/play/page.tsx
+++ b/src/app/play/page.tsx
@@ -6,6 +6,7 @@
 import { Button } from '@/components/ui/button';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { ModeToggle } from '@/components/play/ModeToggle';
+import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
 import { getRecentQuestionSets } from '@/lib/supabase/queries';
 import { QuestionSet, Difficulty, StudyMode } from '@/types';
 import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
@@ -406,6 +407,10 @@
                       </button>
                     )}
                   </div>
+
+                  {group.sets[0]?.code && (
+                    <TopicMasteryDisplay questionSetCode={group.sets[0].code} />
+                  )}
                 </div>
               );
             })}
diff --git a/src/hooks/useGameSession.ts b/src/hooks/useGameSession.ts
index 857fb66ad4a9f58fd3314e28375bc3c7253bf175..7881ae15203112f215ebe5441a95ffc779ba4bfb
--- a/src/hooks/useGameSession.ts
+++ b/src/hooks/useGameSession.ts
@@ -3,6 +3,7 @@
 import { shuffleArray } from '@/lib/utils';
 import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
 const DEFAULT_QUESTIONS_PER_SESSION = 15;
 const POINTS_PER_CORRECT = 10;
@@ -26,6 +27,7 @@
   const [currentStreak, setCurrentStreak] = useState(0);
   const [bestStreak, setBestStreak] = useState(0);
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
   const startNewSession = useCallback(() => {
     if (reviewMode) {
@@ -189,6 +191,8 @@
       removeMistake(currentQuestion.id);
     }
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
       ...prev,
       {
@@ -214,6 +218,7 @@
     reviewMode,
     addMistake,
     removeMistake,
+    updateMastery,
   ]);
 
   const nextQuestion = useCallback(() => {

exec
/bin/zsh -lc "sed -n '18,60p' AGENTS.md" in /Users/mikko.makipaa/koekertaaja succeeded in 155ms:
## Core Concepts

- **AI question generation** from user materials with topic-balanced distribution.
- **Dual-mode learning**: Quiz mode (Helppo/Normaali) + optional flashcards (memorization).
- **Age-appropriate gamification**: Points, streaks, badges, personal bests (no leaderboards).
- **Lenient answer matching**: Grade-based thresholds to reduce frustration.
- **Review mistakes mode**: LocalStorage-based mistake banks per question set with fast correction loops.
- **Public access via shareable codes** with server-side guarded writes.

## Project Goals

- Make exam prep engaging through gamification.
- Reduce teacher/parent workload in creating study materials.
- Provide personalized learning with grade-specific distributions.
- Encourage practice without social pressure or public rankings.
- Maintain accessibility and mobile-first UX for young learners.

## Technology Stack

**Frontend**
file update:
diff --git a/src/app/play/page.tsx b/src/app/play/page.tsx
index c6c81ee9db9726df8c8981f490a8637d1169dc6d..9fb10e723d72aa22f59a4ebd7c5ea5731081b998
--- a/src/app/play/page.tsx
+++ b/src/app/play/page.tsx
@@ -6,6 +6,7 @@
 import { Button } from '@/components/ui/button';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { ModeToggle } from '@/components/play/ModeToggle';
+import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
 import { getRecentQuestionSets } from '@/lib/supabase/queries';
 import { QuestionSet, Difficulty, StudyMode } from '@/types';
 import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
@@ -406,6 +407,10 @@
                       </button>
                     )}
                   </div>
+
+                  {group.sets[0]?.code && (
+                    <TopicMasteryDisplay questionSetCode={group.sets[0].code} />
+                  )}
                 </div>
               );
             })}
diff --git a/src/hooks/useGameSession.ts b/src/hooks/useGameSession.ts
index 857fb66ad4a9f58fd3314e28375bc3c7253bf175..7881ae15203112f215ebe5441a95ffc779ba4bfb
--- a/src/hooks/useGameSession.ts
+++ b/src/hooks/useGameSession.ts
@@ -3,6 +3,7 @@
 import { shuffleArray } from '@/lib/utils';
 import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
 const DEFAULT_QUESTIONS_PER_SESSION = 15;
 const POINTS_PER_CORRECT = 10;
@@ -26,6 +27,7 @@
   const [currentStreak, setCurrentStreak] = useState(0);
   const [bestStreak, setBestStreak] = useState(0);
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
   const startNewSession = useCallback(() => {
     if (reviewMode) {
@@ -189,6 +191,8 @@
       removeMistake(currentQuestion.id);
     }
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
       ...prev,
       {
@@ -214,6 +218,7 @@
     reviewMode,
     addMistake,
     removeMistake,
+    updateMastery,
   ]);
 
   const nextQuestion = useCallback(() => {


thinking
**Adding bullet for topic mastery**
file update
M /Users/mikko.makipaa/koekertaaja/AGENTS.md
@@ -24,2 +24,3 @@
 - **Review mistakes mode**: LocalStorage-based mistake banks per question set with fast correction loops.
+- **Topic mastery tracking**: LocalStorage-based per-question-set topic mastery shown on browse cards.
 - **Public access via shareable codes** with server-side guarded writes.
apply_patch(auto_approved=true) exited 0 in 604ms:
Success. Updated the following files:
M AGENTS.md
file update:
diff --git a/AGENTS.md b/AGENTS.md
index b8f0f2759e91fce443b73152f621239e4eb7701c..c098e765e8a6b43042b194a45359f6115515b16e
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -22,6 +22,7 @@
 - **Age-appropriate gamification**: Points, streaks, badges, personal bests (no leaderboards).
 - **Lenient answer matching**: Grade-based thresholds to reduce frustration.
 - **Review mistakes mode**: LocalStorage-based mistake banks per question set with fast correction loops.
+- **Topic mastery tracking**: LocalStorage-based per-question-set topic mastery shown on browse cards.
 - **Public access via shareable codes** with server-side guarded writes.
 
 ## Project Goals
diff --git a/src/app/play/page.tsx b/src/app/play/page.tsx
index c6c81ee9db9726df8c8981f490a8637d1169dc6d..9fb10e723d72aa22f59a4ebd7c5ea5731081b998
--- a/src/app/play/page.tsx
+++ b/src/app/play/page.tsx
@@ -6,6 +6,7 @@
 import { Button } from '@/components/ui/button';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { ModeToggle } from '@/components/play/ModeToggle';
+import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
 import { getRecentQuestionSets } from '@/lib/supabase/queries';
 import { QuestionSet, Difficulty, StudyMode } from '@/types';
 import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
@@ -406,6 +407,10 @@
                       </button>
                     )}
                   </div>
+
+                  {group.sets[0]?.code && (
+                    <TopicMasteryDisplay questionSetCode={group.sets[0].code} />
+                  )}
                 </div>
               );
             })}
diff --git a/src/hooks/useGameSession.ts b/src/hooks/useGameSession.ts
index 857fb66ad4a9f58fd3314e28375bc3c7253bf175..7881ae15203112f215ebe5441a95ffc779ba4bfb
--- a/src/hooks/useGameSession.ts
+++ b/src/hooks/useGameSession.ts
@@ -3,6 +3,7 @@
 import { shuffleArray } from '@/lib/utils';
 import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
 const DEFAULT_QUESTIONS_PER_SESSION = 15;
 const POINTS_PER_CORRECT = 10;
@@ -26,6 +27,7 @@
   const [currentStreak, setCurrentStreak] = useState(0);
   const [bestStreak, setBestStreak] = useState(0);
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
   const startNewSession = useCallback(() => {
     if (reviewMode) {
@@ -189,6 +191,8 @@
       removeMistake(currentQuestion.id);
     }
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
       ...prev,
       {
@@ -214,6 +218,7 @@
     reviewMode,
     addMistake,
     removeMistake,
+    updateMastery,
   ]);
 
   const nextQuestion = useCallback(() => {

file update:
diff --git a/AGENTS.md b/AGENTS.md
index b8f0f2759e91fce443b73152f621239e4eb7701c..c098e765e8a6b43042b194a45359f6115515b16e
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -22,6 +22,7 @@
 - **Age-appropriate gamification**: Points, streaks, badges, personal bests (no leaderboards).
 - **Lenient answer matching**: Grade-based thresholds to reduce frustration.
 - **Review mistakes mode**: LocalStorage-based mistake banks per question set with fast correction loops.
+- **Topic mastery tracking**: LocalStorage-based per-question-set topic mastery shown on browse cards.
 - **Public access via shareable codes** with server-side guarded writes.
 
 ## Project Goals
diff --git a/src/app/play/page.tsx b/src/app/play/page.tsx
index c6c81ee9db9726df8c8981f490a8637d1169dc6d..9fb10e723d72aa22f59a4ebd7c5ea5731081b998
--- a/src/app/play/page.tsx
+++ b/src/app/play/page.tsx
@@ -6,6 +6,7 @@
 import { Button } from '@/components/ui/button';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { ModeToggle } from '@/components/play/ModeToggle';
+import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
 import { getRecentQuestionSets } from '@/lib/supabase/queries';
 import { QuestionSet, Difficulty, StudyMode } from '@/types';
 import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
@@ -406,6 +407,10 @@
                       </button>
                     )}
                   </div>
+
+                  {group.sets[0]?.code && (
+                    <TopicMasteryDisplay questionSetCode={group.sets[0].code} />
+                  )}
                 </div>
               );
             })}
diff --git a/src/hooks/useGameSession.ts b/src/hooks/useGameSession.ts
index 857fb66ad4a9f58fd3314e28375bc3c7253bf175..7881ae15203112f215ebe5441a95ffc779ba4bfb
--- a/src/hooks/useGameSession.ts
+++ b/src/hooks/useGameSession.ts
@@ -3,6 +3,7 @@
 import { shuffleArray } from '@/lib/utils';
 import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
 const DEFAULT_QUESTIONS_PER_SESSION = 15;
 const POINTS_PER_CORRECT = 10;
@@ -26,6 +27,7 @@
   const [currentStreak, setCurrentStreak] = useState(0);
   const [bestStreak, setBestStreak] = useState(0);
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
   const startNewSession = useCallback(() => {
     if (reviewMode) {
@@ -189,6 +191,8 @@
       removeMistake(currentQuestion.id);
     }
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
       ...prev,
       {
@@ -214,6 +218,7 @@
     reviewMode,
     addMistake,
     removeMistake,
+    updateMastery,
   ]);
 
   const nextQuestion = useCallback(() => {



thinking
**Reviewing topic mastery integration and reactivity**

I confirmed `useTopicMastery` exports the necessary types and interfaces, and updated imports accordingly. The component relying on `useMemo` won't rerender on localStorage changes within the same tab, but this is acceptable since remounts occur on navigation; cross-tab changes won't trigger updates without an event listener, which isn't required. The mastery update logic ensures it runs only post-evaluation when a current question exists and safely ignores missing topics.
thinking
**Clarifying question set mastery tracking**

The key decision is to follow the task instructions to track mastery using only the first question set code from the group, despite potential mismatches with displayed difficulties. The useGameSession signature already handles the questionSetCode param, so no changes there are needed. Testing is considered but deferred without clear existing scripts; targeted test runs may be planned next.
exec
/bin/zsh -lc 'cat package.json' in /Users/mikko.makipaa/koekertaaja succeeded in 167ms:
{
  "name": "exam-prepper",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "node --test --loader ./scripts/ts-node-loader.mjs \"tests/**/*.test.ts\"",
    "analyze": "ANALYZE=true npm run build",
    "maps:download": "bash scripts/maps/download-natural-earth.sh",
    "maps:convert": "node scripts/maps/convert-to-topojson.js",
    "maps:optimize": "node scripts/maps/optimize-maps.js",
    "maps:registry": "node scripts/maps/generate-registry.js",
    "maps:verify": "node scripts/maps/verify-pipeline.js",
    "maps:all": "npm run maps:download && npm run maps:convert && npm run maps:optimize && npm run maps:registry"
  },
  "dependencies": {
file update:
diff --git a/AGENTS.md b/AGENTS.md
index b8f0f2759e91fce443b73152f621239e4eb7701c..c098e765e8a6b43042b194a45359f6115515b16e
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -22,6 +22,7 @@
 - **Age-appropriate gamification**: Points, streaks, badges, personal bests (no leaderboards).
 - **Lenient answer matching**: Grade-based thresholds to reduce frustration.
 - **Review mistakes mode**: LocalStorage-based mistake banks per question set with fast correction loops.
+- **Topic mastery tracking**: LocalStorage-based per-question-set topic mastery shown on browse cards.
 - **Public access via shareable codes** with server-side guarded writes.
 
 ## Project Goals
diff --git a/src/app/play/page.tsx b/src/app/play/page.tsx
index c6c81ee9db9726df8c8981f490a8637d1169dc6d..9fb10e723d72aa22f59a4ebd7c5ea5731081b998
--- a/src/app/play/page.tsx
+++ b/src/app/play/page.tsx
@@ -6,6 +6,7 @@
 import { Button } from '@/components/ui/button';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { ModeToggle } from '@/components/play/ModeToggle';
+import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
 import { getRecentQuestionSets } from '@/lib/supabase/queries';
 import { QuestionSet, Difficulty, StudyMode } from '@/types';
 import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
@@ -406,6 +407,10 @@
                       </button>
                     )}
                   </div>
+
+                  {group.sets[0]?.code && (
+                    <TopicMasteryDisplay questionSetCode={group.sets[0].code} />
+                  )}
                 </div>
               );
             })}
diff --git a/src/hooks/useGameSession.ts b/src/hooks/useGameSession.ts
index 857fb66ad4a9f58fd3314e28375bc3c7253bf175..7881ae15203112f215ebe5441a95ffc779ba4bfb
--- a/src/hooks/useGameSession.ts
+++ b/src/hooks/useGameSession.ts
@@ -3,6 +3,7 @@
 import { shuffleArray } from '@/lib/utils';
 import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
 const DEFAULT_QUESTIONS_PER_SESSION = 15;
 const POINTS_PER_CORRECT = 10;
@@ -26,6 +27,7 @@
   const [currentStreak, setCurrentStreak] = useState(0);
   const [bestStreak, setBestStreak] = useState(0);
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
   const startNewSession = useCallback(() => {
     if (reviewMode) {
@@ -189,6 +191,8 @@
       removeMistake(currentQuestion.id);
     }
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
       ...prev,
       {
@@ -214,6 +218,7 @@
     reviewMode,
     addMistake,
     removeMistake,
+    updateMastery,
   ]);
 
   const nextQuestion = useCallback(() => {


thinking
**Running targeted tests**

I'm running the specific test file using node's test runner with a TypeScript loader to save time since the npm test script doesn't accept arguments.
exec
/bin/zsh -lc 'node --test --loader ./scripts/ts-node-loader.mjs tests/hooks/useTopicMastery.test.ts' in /Users/mikko.makipaa/koekertaaja succeeded in 880ms:
(node:49747) ExperimentalWarning: `--experimental-loader` may be removed in the future; instead use `register()`:
--import 'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("./scripts/ts-node-loader.mjs", pathToFileURL("./"));'
(Use `node --trace-warnings ...` to show where the warning was created)
▶ useTopicMastery storage helpers
  ✔ returns empty stats when no data exists (0.797459ms)
  ✔ creates a new topic entry on first update (0.623959ms)
  ✔ increments total count on wrong answer (0.107417ms)
  ✔ increments correct count on correct answer (0.115625ms)
  ✔ persists data per question set (0.124541ms)
  ✔ clears mastery data (0.119333ms)
✔ useTopicMastery storage helpers (2.393042ms)
ℹ tests 6
ℹ suites 1
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 397.022041
file update:
diff --git a/AGENTS.md b/AGENTS.md
index b8f0f2759e91fce443b73152f621239e4eb7701c..c098e765e8a6b43042b194a45359f6115515b16e
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -22,6 +22,7 @@
 - **Age-appropriate gamification**: Points, streaks, badges, personal bests (no leaderboards).
 - **Lenient answer matching**: Grade-based thresholds to reduce frustration.
 - **Review mistakes mode**: LocalStorage-based mistake banks per question set with fast correction loops.
+- **Topic mastery tracking**: LocalStorage-based per-question-set topic mastery shown on browse cards.
 - **Public access via shareable codes** with server-side guarded writes.
 
 ## Project Goals
diff --git a/src/app/play/page.tsx b/src/app/play/page.tsx
index c6c81ee9db9726df8c8981f490a8637d1169dc6d..9fb10e723d72aa22f59a4ebd7c5ea5731081b998
--- a/src/app/play/page.tsx
+++ b/src/app/play/page.tsx
@@ -6,6 +6,7 @@
 import { Button } from '@/components/ui/button';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { ModeToggle } from '@/components/play/ModeToggle';
+import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
 import { getRecentQuestionSets } from '@/lib/supabase/queries';
 import { QuestionSet, Difficulty, StudyMode } from '@/types';
 import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
@@ -406,6 +407,10 @@
                       </button>
                     )}
                   </div>
+
+                  {group.sets[0]?.code && (
+                    <TopicMasteryDisplay questionSetCode={group.sets[0].code} />
+                  )}
                 </div>
               );
             })}
diff --git a/src/hooks/useGameSession.ts b/src/hooks/useGameSession.ts
index 857fb66ad4a9f58fd3314e28375bc3c7253bf175..7881ae15203112f215ebe5441a95ffc779ba4bfb
--- a/src/hooks/useGameSession.ts
+++ b/src/hooks/useGameSession.ts
@@ -3,6 +3,7 @@
 import { shuffleArray } from '@/lib/utils';
 import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
 const DEFAULT_QUESTIONS_PER_SESSION = 15;
 const POINTS_PER_CORRECT = 10;
@@ -26,6 +27,7 @@
   const [currentStreak, setCurrentStreak] = useState(0);
   const [bestStreak, setBestStreak] = useState(0);
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
   const startNewSession = useCallback(() => {
     if (reviewMode) {
@@ -189,6 +191,8 @@
       removeMistake(currentQuestion.id);
     }
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
       ...prev,
       {
@@ -214,6 +218,7 @@
     reviewMode,
     addMistake,
     removeMistake,
+    updateMastery,
   ]);
 
   const nextQuestion = useCallback(() => {



thinking
**Verifying hook dependencies and state reads**

I confirmed updateMastery isn't needed in startNewSession dependencies and that useTopicMastery correctly uses useCallback, not useMemo. I noted potential localStorage access during render by hasMasteryData and getMasteryStats but found no issue since their dependencies are stable via useCallback. I’m considering simplifying calls by avoiding useMemo where possible without breaking logic.
thinking
**Refining mastery display logic for quiz sets**

I plan to adjust the play page to select the first quiz-mode set for mastery display rather than always using the first set, avoiding flashcard sets that lack mastery data. This better matches per-question-set tracking and aligns with the design intent to show mastery by quiz difficulty.
file update
M /Users/mikko.makipaa/koekertaaja/src/app/play/page.tsx
@@ -307,2 +307,3 @@
               const groupHasFlashcards = hasFlashcards(group.sets);
+              const masterySet = group.sets.find(set => set.mode === 'quiz') ?? group.sets[0];
               const difficultyOrder: Difficulty[] = ['helppo', 'normaali'];
@@ -410,4 +411,4 @@
 
-                  {group.sets[0]?.code && (
-                    <TopicMasteryDisplay questionSetCode={group.sets[0].code} />
+                  {masterySet?.code && (
+                    <TopicMasteryDisplay questionSetCode={masterySet.code} />
                   )}
apply_patch(auto_approved=true) exited 0 in 669ms:
Success. Updated the following files:
M src/app/play/page.tsx
file update:
diff --git a/AGENTS.md b/AGENTS.md
index b8f0f2759e91fce443b73152f621239e4eb7701c..c098e765e8a6b43042b194a45359f6115515b16e
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -22,6 +22,7 @@
 - **Age-appropriate gamification**: Points, streaks, badges, personal bests (no leaderboards).
 - **Lenient answer matching**: Grade-based thresholds to reduce frustration.
 - **Review mistakes mode**: LocalStorage-based mistake banks per question set with fast correction loops.
+- **Topic mastery tracking**: LocalStorage-based per-question-set topic mastery shown on browse cards.
 - **Public access via shareable codes** with server-side guarded writes.
 
 ## Project Goals
diff --git a/src/app/play/page.tsx b/src/app/play/page.tsx
index c6c81ee9db9726df8c8981f490a8637d1169dc6d..892464e54702bfd5e15fde7d8a6e952232752198
--- a/src/app/play/page.tsx
+++ b/src/app/play/page.tsx
@@ -6,6 +6,7 @@
 import { Button } from '@/components/ui/button';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { ModeToggle } from '@/components/play/ModeToggle';
+import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
 import { getRecentQuestionSets } from '@/lib/supabase/queries';
 import { QuestionSet, Difficulty, StudyMode } from '@/types';
 import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
@@ -304,6 +305,7 @@
             {filteredSets.map((group) => {
               const availableDifficulties = getAvailableDifficulties(group.sets);
               const groupHasFlashcards = hasFlashcards(group.sets);
+              const masterySet = group.sets.find(set => set.mode === 'quiz') ?? group.sets[0];
               const difficultyOrder: Difficulty[] = ['helppo', 'normaali'];
               const reviewCandidates = difficultyOrder
                 .map(difficulty => group.sets.find(
@@ -406,6 +408,10 @@
                       </button>
                     )}
                   </div>
+
+                  {masterySet?.code && (
+                    <TopicMasteryDisplay questionSetCode={masterySet.code} />
+                  )}
                 </div>
               );
             })}
diff --git a/src/hooks/useGameSession.ts b/src/hooks/useGameSession.ts
index 857fb66ad4a9f58fd3314e28375bc3c7253bf175..7881ae15203112f215ebe5441a95ffc779ba4bfb
--- a/src/hooks/useGameSession.ts
+++ b/src/hooks/useGameSession.ts
@@ -3,6 +3,7 @@
 import { shuffleArray } from '@/lib/utils';
 import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
 const DEFAULT_QUESTIONS_PER_SESSION = 15;
 const POINTS_PER_CORRECT = 10;
@@ -26,6 +27,7 @@
   const [currentStreak, setCurrentStreak] = useState(0);
   const [bestStreak, setBestStreak] = useState(0);
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
   const startNewSession = useCallback(() => {
     if (reviewMode) {
@@ -189,6 +191,8 @@
       removeMistake(currentQuestion.id);
     }
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
       ...prev,
       {
@@ -214,6 +218,7 @@
     reviewMode,
     addMistake,
     removeMistake,
+    updateMastery,
   ]);
 
   const nextQuestion = useCallback(() => {

file update:
diff --git a/AGENTS.md b/AGENTS.md
index b8f0f2759e91fce443b73152f621239e4eb7701c..c098e765e8a6b43042b194a45359f6115515b16e
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -22,6 +22,7 @@
 - **Age-appropriate gamification**: Points, streaks, badges, personal bests (no leaderboards).
 - **Lenient answer matching**: Grade-based thresholds to reduce frustration.
 - **Review mistakes mode**: LocalStorage-based mistake banks per question set with fast correction loops.
+- **Topic mastery tracking**: LocalStorage-based per-question-set topic mastery shown on browse cards.
 - **Public access via shareable codes** with server-side guarded writes.
 
 ## Project Goals
diff --git a/src/app/play/page.tsx b/src/app/play/page.tsx
index c6c81ee9db9726df8c8981f490a8637d1169dc6d..892464e54702bfd5e15fde7d8a6e952232752198
--- a/src/app/play/page.tsx
+++ b/src/app/play/page.tsx
@@ -6,6 +6,7 @@
 import { Button } from '@/components/ui/button';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { ModeToggle } from '@/components/play/ModeToggle';
+import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
 import { getRecentQuestionSets } from '@/lib/supabase/queries';
 import { QuestionSet, Difficulty, StudyMode } from '@/types';
 import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
@@ -304,6 +305,7 @@
             {filteredSets.map((group) => {
               const availableDifficulties = getAvailableDifficulties(group.sets);
               const groupHasFlashcards = hasFlashcards(group.sets);
+              const masterySet = group.sets.find(set => set.mode === 'quiz') ?? group.sets[0];
               const difficultyOrder: Difficulty[] = ['helppo', 'normaali'];
               const reviewCandidates = difficultyOrder
                 .map(difficulty => group.sets.find(
@@ -406,6 +408,10 @@
                       </button>
                     )}
                   </div>
+
+                  {masterySet?.code && (
+                    <TopicMasteryDisplay questionSetCode={masterySet.code} />
+                  )}
                 </div>
               );
             })}
diff --git a/src/hooks/useGameSession.ts b/src/hooks/useGameSession.ts
index 857fb66ad4a9f58fd3314e28375bc3c7253bf175..7881ae15203112f215ebe5441a95ffc779ba4bfb
--- a/src/hooks/useGameSession.ts
+++ b/src/hooks/useGameSession.ts
@@ -3,6 +3,7 @@
 import { shuffleArray } from '@/lib/utils';
 import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
 const DEFAULT_QUESTIONS_PER_SESSION = 15;
 const POINTS_PER_CORRECT = 10;
@@ -26,6 +27,7 @@
   const [currentStreak, setCurrentStreak] = useState(0);
   const [bestStreak, setBestStreak] = useState(0);
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
   const startNewSession = useCallback(() => {
     if (reviewMode) {
@@ -189,6 +191,8 @@
       removeMistake(currentQuestion.id);
     }
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
       ...prev,
       {
@@ -214,6 +218,7 @@
     reviewMode,
     addMistake,
     removeMistake,
+    updateMastery,
   ]);
 
   const nextQuestion = useCallback(() => {


thinking
**Summarizing final updates and tests**

I confirmed dependencies and usage of key hooks and constants, ensuring no unused code or SSR issues. Tests ran successfully with a noted experimental loader warning. Changed files include new and modified hooks, components, test files, and documentation. No new tasks, assumptions, or blockers remain. I'll provide a concise summary and test command with results in the final output.
codex
Added topic mastery tracking with a new `useTopicMastery` hook, wired it into `useGameSession` so every answer updates per-topic stats, and surfaced progress bars on browse cards via a new `TopicMasteryDisplay` component. Updated docs and added storage helper tests to validate localStorage behavior and percentage calculations.

Changes include:
- Storage-backed mastery helpers + hook in `src/hooks/useTopicMastery.ts` and integration in `src/hooks/useGameSession.ts`.
- UI component for progress bars in `src/components/play/TopicMasteryDisplay.tsx`, wired into cards in `src/app/play/page.tsx`.
- New tests in `tests/hooks/useTopicMastery.test.ts` and a brief docs note in `AGENTS.md`.

Next steps you may want:
1) Run full test suite: `npm test`
2) Run `npm run typecheck` and `npm run lint`

STATUS: success
SUMMARY: Implemented localStorage-backed topic mastery tracking, hooked it into gameplay answers, and added browse-card progress bars with tests. Updated AGENTS.md to document the feature.
CHANGED FILES:
- src/hooks/useTopicMastery.ts
- src/hooks/useGameSession.ts
- src/components/play/TopicMasteryDisplay.tsx
- src/app/play/page.tsx
- tests/hooks/useTopicMastery.test.ts
- AGENTS.md
TESTS:
- node --test --loader ./scripts/ts-node-loader.mjs tests/hooks/useTopicMastery.test.ts — PASS (experimental loader warning)
NEW TASKS:
- none
ASSUMPTIONS/BLOCKERS:
- none
file update:
diff --git a/AGENTS.md b/AGENTS.md
index b8f0f2759e91fce443b73152f621239e4eb7701c..c098e765e8a6b43042b194a45359f6115515b16e
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -22,6 +22,7 @@
 - **Age-appropriate gamification**: Points, streaks, badges, personal bests (no leaderboards).
 - **Lenient answer matching**: Grade-based thresholds to reduce frustration.
 - **Review mistakes mode**: LocalStorage-based mistake banks per question set with fast correction loops.
+- **Topic mastery tracking**: LocalStorage-based per-question-set topic mastery shown on browse cards.
 - **Public access via shareable codes** with server-side guarded writes.
 
 ## Project Goals
diff --git a/src/app/play/page.tsx b/src/app/play/page.tsx
index c6c81ee9db9726df8c8981f490a8637d1169dc6d..892464e54702bfd5e15fde7d8a6e952232752198
--- a/src/app/play/page.tsx
+++ b/src/app/play/page.tsx
@@ -6,6 +6,7 @@
 import { Button } from '@/components/ui/button';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { ModeToggle } from '@/components/play/ModeToggle';
+import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
 import { getRecentQuestionSets } from '@/lib/supabase/queries';
 import { QuestionSet, Difficulty, StudyMode } from '@/types';
 import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
@@ -304,6 +305,7 @@
             {filteredSets.map((group) => {
               const availableDifficulties = getAvailableDifficulties(group.sets);
               const groupHasFlashcards = hasFlashcards(group.sets);
+              const masterySet = group.sets.find(set => set.mode === 'quiz') ?? group.sets[0];
               const difficultyOrder: Difficulty[] = ['helppo', 'normaali'];
               const reviewCandidates = difficultyOrder
                 .map(difficulty => group.sets.find(
@@ -406,6 +408,10 @@
                       </button>
                     )}
                   </div>
+
+                  {masterySet?.code && (
+                    <TopicMasteryDisplay questionSetCode={masterySet.code} />
+                  )}
                 </div>
               );
             })}
diff --git a/src/hooks/useGameSession.ts b/src/hooks/useGameSession.ts
index 857fb66ad4a9f58fd3314e28375bc3c7253bf175..7881ae15203112f215ebe5441a95ffc779ba4bfb
--- a/src/hooks/useGameSession.ts
+++ b/src/hooks/useGameSession.ts
@@ -3,6 +3,7 @@
 import { shuffleArray } from '@/lib/utils';
 import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
 import { useReviewMistakes } from '@/hooks/useReviewMistakes';
+import { useTopicMastery } from '@/hooks/useTopicMastery';
 
 const DEFAULT_QUESTIONS_PER_SESSION = 15;
 const POINTS_PER_CORRECT = 10;
@@ -26,6 +27,7 @@
   const [currentStreak, setCurrentStreak] = useState(0);
   const [bestStreak, setBestStreak] = useState(0);
   const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
+  const { updateMastery } = useTopicMastery(questionSetCode);
 
   const startNewSession = useCallback(() => {
     if (reviewMode) {
@@ -189,6 +191,8 @@
       removeMistake(currentQuestion.id);
     }
 
+    updateMastery(currentQuestion.topic, isCorrect);
+
     setAnswers((prev) => [
       ...prev,
       {
@@ -214,6 +218,7 @@
     reviewMode,
     addMistake,
     removeMistake,
+    updateMastery,
   ]);
 
   const nextQuestion = useCallback(() => {

tokens used
46 651
Added topic mastery tracking with a new `useTopicMastery` hook, wired it into `useGameSession` so every answer updates per-topic stats, and surfaced progress bars on browse cards via a new `TopicMasteryDisplay` component. Updated docs and added storage helper tests to validate localStorage behavior and percentage calculations.

Changes include:
- Storage-backed mastery helpers + hook in `src/hooks/useTopicMastery.ts` and integration in `src/hooks/useGameSession.ts`.
- UI component for progress bars in `src/components/play/TopicMasteryDisplay.tsx`, wired into cards in `src/app/play/page.tsx`.
- New tests in `tests/hooks/useTopicMastery.test.ts` and a brief docs note in `AGENTS.md`.

Next steps you may want:
1) Run full test suite: `npm test`
2) Run `npm run typecheck` and `npm run lint`

STATUS: success
SUMMARY: Implemented localStorage-backed topic mastery tracking, hooked it into gameplay answers, and added browse-card progress bars with tests. Updated AGENTS.md to document the feature.
CHANGED FILES:
- src/hooks/useTopicMastery.ts
- src/hooks/useGameSession.ts
- src/components/play/TopicMasteryDisplay.tsx
- src/app/play/page.tsx
- tests/hooks/useTopicMastery.test.ts
- AGENTS.md
TESTS:
- node --test --loader ./scripts/ts-node-loader.mjs tests/hooks/useTopicMastery.test.ts — PASS (experimental loader warning)
NEW TASKS:
- none
ASSUMPTIONS/BLOCKERS:
- none
