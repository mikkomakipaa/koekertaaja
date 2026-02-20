# Aikahaaste Implementation TODOs

## Phase 1: Core Infrastructure (Days 1-2)

### Data Models & Types
- [ ] Create `SpeedQuizSession` type in `/types/index.ts`
  - Add `mode: 'speed-quiz'` to existing `QuizMode` type
  - Define session state structure
  - Add skipped questions tracking
  ```typescript
  interface SpeedQuizSession {
    mode: 'speed-quiz';
    questionSetCode: string;
    selectedQuestions: Question[];
    currentQuestionIndex: number;
    timePerQuestion: 10;
    totalQuestions: 10;
    startTime: number;
    questionStartTime: number;
    skippedQuestions: string[];
  }
  ```

### Utility Functions
- [ ] Create `/lib/utils/speedQuiz.ts`
  - [ ] Implement `selectRandomQuestions(questions: Question[], count: number): Question[]`
  - [ ] Implement `shuffleArray()` helper (Fisher-Yates)
  - [ ] Add validation: `canRunSpeedQuiz(questionSet: QuestionSet): boolean`
    - Check if set has ≥10 questions
    - Check if set is quiz type (not flashcard)
  - [ ] Add tests for random selection algorithm

### Custom Hooks
- [ ] Create `/hooks/useSpeedQuizTimer.ts`
  - [ ] Implement timer countdown logic
  - [ ] Add auto-expire callback
  - [ ] Add color state calculation (green/amber/red)
  - [ ] Handle cleanup on component unmount
  - [ ] Return: `{ timeRemaining, isRunning, start, stop, reset, colorState }`
  ```typescript
  const useSpeedQuizTimer = (timeLimit: number, onExpire: () => void) => {
    const [timeRemaining, setTimeRemaining] = useState(timeLimit);
    const [isRunning, setIsRunning] = useState(false);

    // Implementation...

    return { timeRemaining, isRunning, start, stop, reset, colorState };
  };
  ```

## Phase 2: UI Components (Days 3-4)

### Timer Component
- [ ] Create `/components/speedQuiz/SpeedQuizTimer.tsx`
  - [ ] Progress bar with depleting animation
  - [ ] Display seconds remaining
  - [ ] Color transitions (green → amber → red)
  - [ ] Pulse animation for warning/critical states
  - [ ] Respect `prefers-reduced-motion`
  - [ ] Add ARIA labels for accessibility
  - [ ] Test on mobile (check performance)

### Intro/Countdown Component
- [ ] Create `/components/speedQuiz/SpeedQuizIntro.tsx`
  - [ ] Show instructions: "10 kysymystä, 10 sekuntia per kysymys"
  - [ ] "Valmis?" button
  - [ ] Countdown animation: 3... 2... 1... Aloita!
  - [ ] Auto-start quiz after countdown
  - [ ] Add sound effects (optional, future)

### Results Component
- [ ] Create `/components/speedQuiz/SpeedQuizResults.tsx`
  - [ ] Display final score
  - [ ] Show correct/skipped/wrong breakdown
  - [ ] **List all 10 questions with status icons (✓ / ✗ / ⏭)**
  - [ ] **Show correct answers for skipped questions**
  - [ ] **Show selected vs correct for wrong answers**
  - [ ] Expandable question details (click to see full question)
  - [ ] Display total time taken
  - [ ] Show best streak achieved
  - [ ] "Yritä uudelleen" button
  - [ ] "Valitse toinen sarja" button
  - [ ] "Palaa etusivulle" button

### Mode Selection Card
- [ ] Update `/components/play/ModeCard.tsx` (or create new)
  - [ ] Add lightning bolt icon variant
  - [ ] Amber/orange accent color
  - [ ] Show "Aikahaaste" label
  - [ ] Subtitle: "10 kysymystä • 10 sek / kysymys"
  - [ ] Link to `/play/speed-quiz`

## Phase 3: Pages & Routing (Days 5-6)

### Speed Quiz Mode Selection Page
- [ ] Create `/app/play/speed-quiz/page.tsx`
  - [ ] Fetch all available question sets
  - [ ] Filter sets with ≥10 questions
  - [ ] Display as grid/list (similar to regular quiz page)
  - [ ] Show question count badge on each set
  - [ ] Add "Liian vähän kysymyksiä" message for small sets
  - [ ] Link to `/play/speed-quiz/[code]` on click

### Speed Quiz Play Page
- [ ] Create `/app/play/speed-quiz/[code]/page.tsx`
  - [ ] Fetch question set by code
  - [ ] Validate question count (≥10)
  - [ ] Show intro screen (SpeedQuizIntro)
  - [ ] Initialize session state
  - [ ] Render quiz with timer
  - [ ] Handle question transitions
  - [ ] Auto-skip on timer expiration
  - [ ] Navigate to results on completion

### Quiz Game Logic
- [ ] Create `/components/speedQuiz/SpeedQuizGame.tsx`
  - [ ] Manage quiz session state
  - [ ] Integrate timer hook
  - [ ] Render current question
  - [ ] Handle answer submission
  - [ ] Handle auto-skip (timer expires)
  - [ ] Track skipped questions
  - [ ] Calculate score (same as regular quiz)
  - [ ] No pause button
  - [ ] Disable keyboard shortcuts during timed mode

### Update Main Play Page
- [ ] Update `/app/play/page.tsx`
  - [ ] Add third mode card for "Aikahaaste"
  - [ ] Position alongside "Tietovisat" and "Kortit"
  - [ ] Use amber/orange accent color
  - [ ] Lightning bolt icon
  - [ ] Link to `/play/speed-quiz`

## Phase 4: Styling & Polish (Day 7)

### Design System Integration
- [ ] Add amber color variants to Tailwind config (if not present)
  ```javascript
  colors: {
    amber: {
      50: '#fffbeb',
      // ... full amber scale
    }
  }
  ```

- [ ] Create speed quiz color tokens
  ```typescript
  const speedQuizColors = {
    primary: 'amber-500',
    timerSafe: 'emerald-500',
    timerWarning: 'amber-500',
    timerCritical: 'red-500',
  };
  ```

### Animations
- [ ] Add pulse animation to `globals.css`
  ```css
  @keyframes pulse-warning {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.02); }
  }
  ```

- [ ] Add smooth fade transitions
  ```css
  .speed-quiz-transition {
    transition: opacity 200ms ease-in-out;
  }
  ```

### Dark Mode Support
- [ ] Test all components in dark mode
- [ ] Ensure timer bar is visible in both themes
- [ ] Adjust amber color values for dark mode readability
- [ ] Test color transitions (green → amber → red)

### Responsive Design
- [ ] Test on mobile (320px - 428px)
- [ ] Test on tablet (768px - 1024px)
- [ ] Test on desktop (1280px+)
- [ ] Ensure timer is visible at all breakpoints
- [ ] Adjust question card sizing for mobile
- [ ] Test touch interactions

## Phase 5: Testing & QA (Day 8)

### Unit Tests
- [ ] Test `selectRandomQuestions()` utility
  - Returns exactly N questions
  - Questions are random (no pattern)
  - Handles edge cases (<10 questions, exactly 10 questions)

- [ ] Test `useSpeedQuizTimer` hook
  - Counts down correctly
  - Calls onExpire at 0 seconds
  - Color state changes at correct thresholds
  - Cleans up interval on unmount

### Integration Tests
- [ ] Test complete speed quiz flow
  - Select mode → Choose set → Countdown → Play → Results
  - Verify auto-skip works
  - Verify scoring is correct
  - Verify skipped questions are tracked

### Manual Testing Checklist
- [ ] Start speed quiz from main page
- [ ] Complete full quiz with all correct answers
- [ ] Let all questions timeout (test auto-skip)
- [ ] Mix of answered and skipped questions
- [ ] Test on mobile device
- [ ] Test keyboard navigation (should be disabled)
- [ ] Test with screen reader
- [ ] Test in dark mode
- [ ] Test with slow network (loading states)
- [ ] Test with question set that has exactly 10 questions
- [ ] Verify no console errors

### Edge Cases
- [ ] Question set has <10 questions (show error)
- [ ] Question set has exactly 10 questions (use all)
- [ ] User refreshes page mid-quiz (data loss - acceptable)
- [ ] User navigates away (confirm modal? or allow)
- [ ] Timer expires during answer submission (skip answer)
- [ ] Network error during question fetch

## Phase 6: Analytics & Monitoring (Day 9)

### Event Tracking (if using analytics)
- [ ] Track "speed_quiz_started" event
  - Properties: question_set_code, question_count
- [ ] Track "speed_quiz_completed" event
  - Properties: score, correct_count, skipped_count, total_time
- [ ] Track "question_skipped" event
  - Properties: question_id, time_expired_at
- [ ] Track "speed_quiz_abandoned" event
  - Properties: questions_completed, time_elapsed

### Error Monitoring
- [ ] Add error boundaries around speed quiz components
- [ ] Log errors to monitoring service (Sentry/PostHog)
- [ ] Add fallback UI for component errors

## Phase 7: Documentation (Day 10)

### User-Facing
- [ ] Add help text on speed quiz selection page
- [ ] Add tooltip/info icon explaining the mode
- [ ] Update FAQ (if exists) with Aikahaaste info

### Developer Documentation
- [ ] Update AGENTS.md in `/app/play/` directory
  - Document speed quiz architecture
  - Explain timer implementation
  - Note auto-skip behavior
- [ ] Add JSDoc comments to all new functions/components
- [ ] Update README with new feature

### CLAUDE.md Updates
- [ ] Add Aikahaaste patterns to project guidelines
- [ ] Document timer hook usage
- [ ] Note performance considerations (timer interval)

## Future Enhancements (Post-MVP)

### V2 Features (Priority)
- [ ] Configurable time limits (5s, 10s, 15s)
- [ ] Configurable question counts (5, 10, 15)
- [ ] User preference storage (localStorage)
- [ ] Show correct answers for skipped questions at end

### V3 Features (Nice-to-have)
- [ ] Leaderboards (weekly/monthly)
- [ ] Sound effects (tick-tock, whoosh, success)
- [ ] Adaptive timing based on difficulty
- [ ] Power-ups (freeze time, skip question)
- [ ] Separate stats page for speed quiz
- [ ] Multiplayer mode (head-to-head)

### Performance Optimizations
- [ ] Wake lock API (keep screen on during quiz)
- [ ] Preload next question for instant transition
- [ ] Optimize timer rendering (RAF vs setInterval)
- [ ] Lazy load results page components

## Success Criteria

### MVP Ready When:
- [x] User can access speed quiz from main play page
- [x] User can select from available question sets (≥10 questions)
- [x] Quiz runs with 10 random questions, 10s each
- [x] Timer is visible and accurate
- [x] Questions auto-skip on timeout
- [x] Results page shows score and skipped questions
- [x] Works on mobile and desktop
- [x] No major bugs or errors
- [x] Dark mode supported
- [x] Passes basic accessibility checks

### Definition of Done (per task):
- [ ] Code written and tested
- [ ] TypeScript types are strict and correct
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] No console errors/warnings
- [ ] Meets accessibility standards (ARIA labels, keyboard nav)
- [ ] Code reviewed (if team)
- [ ] Merged to main branch

---

## Notes

- **Timeline**: 10 days (assuming 4-6 hours/day)
- **Complexity**: Medium (new mode but leverages existing quiz infrastructure)
- **Risk**: Timer accuracy on slow devices/browsers
- **Testing Priority**: Mobile devices, auto-skip behavior, scoring accuracy

## Decisions Made ✅

1. ✅ Show correct answers for skipped questions on results page
2. ✅ No sound effects for v1 (add in v2)
3. ✅ Scores saved same way as regular quiz (no separate storage)
4. ✅ No practice mode (keep it simple)
