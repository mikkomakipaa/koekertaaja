# Aikahaaste (Speed Quiz) Feature Design

## Overview
A timed quiz mode that randomly selects 10 questions from a set with a 10-second time limit per question. Provides a fast-paced, challenging alternative to standard quiz mode.

## User Experience

### Mode Discovery
- **Location**: Third mode card on `/play` page, alongside "Tietovisat" and "Kortit"
- **Visual**: Lightning bolt icon (⚡), distinct color accent (e.g., amber/orange)
- **Label**: "Aikahaaste" with subtitle "10 kysymystä • 10 sekuntia / kysymys"

### User Flow
1. User navigates to `/play` page
2. Clicks "Aikahaaste" card
3. Sees list of available question sets (same as regular quiz)
4. Selects a question set (must have ≥10 questions)
5. Brief intro screen: "Valmistaudu! 10 kysymystä, 10 sekuntia per kysymys"
6. Countdown: 3... 2... 1... Aloita!
7. Quiz starts with timer running
8. Each question auto-skips when timer expires
9. End screen shows results (correct/skipped/wrong)

### Timer UI Design

#### Progress Bar (Top of Screen)
```
┌─────────────────────────────────────────────────┐
│ ████████████░░░░░░░░░░░░░░  8s                  │  ← Depleting bar + seconds
└─────────────────────────────────────────────────┘
```

**Specifications:**
- **Position**: Fixed at top of viewport, above question card
- **Height**: 8px (slim, unobtrusive)
- **Colors**:
  - Default: `bg-emerald-500` (10-4s remaining)
  - Warning: `bg-amber-500` (3-2s remaining)
  - Critical: `bg-red-500` (1-0s remaining)
- **Animation**: Smooth CSS transition (linear timing)
- **Number display**: Small text (12px) right-aligned showing "Xs"

#### Visual States
- **10-4 seconds**: Green bar, calm
- **3-2 seconds**: Amber bar, subtle pulse animation
- **1-0 seconds**: Red bar, faster pulse
- **Expired**: Bar disappears, question fades out (200ms)

### Question Transition
When timer expires:
1. Timer bar disappears
2. Question card fades out (200ms)
3. Next question fades in (200ms)
4. New timer starts immediately
5. No pause, no confirmation, fully automatic

### End Screen
Shows summary:
- Total time: ~100 seconds
- Correct answers: X/10
- Skipped questions: Y
- Score: XXXX points
- Streak: Best streak achieved

**Detailed breakdown:**
- List of all 10 questions with status (✓ Correct / ✗ Wrong / ⏭ Skipped)
- For skipped questions: Show correct answer
- For wrong questions: Show selected vs correct answer
- Click to expand full question details

Action buttons:
- "Yritä uudelleen" (same set)
- "Valitse toinen sarja"
- "Palaa etusivulle"

## Technical Architecture

### Data Model Changes

#### 1. Question Set Metadata
No changes needed - any quiz set can be used for Aikahaaste.

#### 2. New Quiz Session Type
```typescript
type QuizMode = 'quiz' | 'flashcard' | 'speed-quiz';

interface SpeedQuizSession {
  mode: 'speed-quiz';
  questionSetCode: string;
  selectedQuestions: string[]; // IDs of 10 randomly selected questions
  currentQuestionIndex: number;
  timePerQuestion: 10; // seconds (fixed for now)
  totalQuestions: 10; // fixed for now
  startTime: number; // timestamp
  questionStartTime: number; // timestamp when current question started
  skippedQuestions: string[]; // IDs of skipped questions
}
```

#### 3. Stats Tracking
Add new fields to user stats (optional, future enhancement):
```typescript
interface UserStats {
  speedQuizAttempts: number;
  speedQuizBestScore: number;
  averageResponseTime: number; // in milliseconds
  fastestStreak: number;
}
```

### Component Architecture

#### New Components

1. **`SpeedQuizModePage.tsx`** (`/play/speed-quiz`)
   - Lists available question sets (≥10 questions)
   - Shows lightning bolt icon, "Aikahaaste" branding
   - Filters sets by minimum question count

2. **`SpeedQuizIntro.tsx`**
   - Brief instruction screen
   - "3, 2, 1" countdown animation
   - Starts quiz on completion

3. **`SpeedQuizTimer.tsx`**
   - Fixed position progress bar at top
   - Displays remaining seconds
   - Color transitions (green → amber → red)
   - Auto-triggers skip on expiration

4. **`SpeedQuizPlay.tsx`** (`/play/speed-quiz/[code]`)
   - Main quiz interface
   - Integrates timer
   - Handles auto-skip logic
   - Disables pause functionality

5. **`SpeedQuizResults.tsx`**
   - End screen with stats
   - Highlights skipped questions
   - Shows total time taken

#### Modified Components

1. **`/play/page.tsx`**
   - Add third mode card for "Aikahaaste"
   - Lightning bolt icon
   - Amber/orange accent color

2. **Existing question components**
   - Reuse `MultipleChoiceQuestion`, `FillInBlankQuestion`, etc.
   - No modifications needed

### State Management

#### Timer Logic
```typescript
const useSpeedQuizTimer = (
  timeLimit: number,
  onExpire: () => void
) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const startTime = Date.now();
    const intervalId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, timeLimit - elapsed);

      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(intervalId);
        onExpire();
      }
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(intervalId);
  }, [isRunning, timeLimit, onExpire]);

  return { timeRemaining, isRunning, setIsRunning };
};
```

#### Question Selection Algorithm
```typescript
const selectRandomQuestions = (
  questions: Question[],
  count: number = 10
): Question[] => {
  if (questions.length < count) {
    throw new Error(`Not enough questions. Need ${count}, have ${questions.length}`);
  }

  // Fisher-Yates shuffle
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
};
```

### API Changes

#### No new endpoints needed
- Use existing `/api/question-sets/[code]` to fetch questions
- Use existing score submission endpoints
- Question selection happens client-side

### Mobile Considerations

1. **Screen Wake Lock** (optional enhancement)
   ```typescript
   // Keep screen awake during speed quiz
   navigator.wakeLock?.request('screen');
   ```

2. **Tab Visibility**
   - If user switches tabs, timer continues running
   - No pause, no penalty beyond time lost
   - Use `document.visibilityState` to detect (but don't pause)

3. **Touch Optimization**
   - Large touch targets for answer buttons
   - Prevent accidental taps during transitions

## UI/UX Details

### Color Palette
- **Primary**: Amber/Orange for speed theme (`amber-500`)
- **Timer states**:
  - Safe: `emerald-500`
  - Warning: `amber-500`
  - Critical: `red-500`

### Animations
- **Timer bar**: Linear depletion (CSS `transition: width 0.1s linear`)
- **Pulse (warning)**: Subtle scale animation
  ```css
  @keyframes pulse-warning {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  ```
- **Question transition**: Fade out/in (200ms each)

### Accessibility
- **Keyboard navigation**: Disabled during timed quiz (too slow)
- **Screen readers**: Announce time remaining every 5 seconds
- **Color blindness**: Timer bar has both color AND number indicator
- **Motion sensitivity**: Respect `prefers-reduced-motion` (disable pulse)

## Scoring System

### Same as Regular Quiz
- Correct answer: +100 points
- Streak bonus: +50 points per streak level
- Skipped question: 0 points (breaks streak)
- Wrong answer: 0 points (breaks streak)

### No Speed Bonus (for now)
Keep it simple. Speed is the challenge itself, not an additional scoring factor.

## Future Enhancements (v2)

1. **Configurable settings**
   - Question count: 5, 10, 15
   - Time limit: 5s, 10s, 15s
   - Save user preferences

2. **Leaderboards**
   - Weekly speed quiz champions
   - Best time per question set

3. **Power-ups** (gamification)
   - "Freeze time" (pause for 5s, once per quiz)
   - "Skip question" (advance without penalty, once per quiz)

4. **Adaptive timing**
   - Easy questions: 7 seconds
   - Medium questions: 10 seconds
   - Hard questions: 15 seconds

5. **Multiplayer mode**
   - Head-to-head speed quiz battles
   - Real-time scoring comparison

6. **Sound effects** (optional)
   - Tick-tock sound when <3 seconds
   - "Whoosh" sound on auto-skip
   - Success chime on correct answer

## Open Questions & Decisions

### Resolved ✅
- [x] Separate mode vs optional setting → **Separate mode**
- [x] Scoring system → **Same as regular quiz**
- [x] Configurable settings → **Fixed (10q, 10s) for now**
- [x] Timer UI → **Progress bar at top**
- [x] Timeout action → **Auto-skip immediately**
- [x] Pause feature → **No pause allowed**
- [x] Mode discovery → **Third card on /play page**

### Remaining 🤔
- [x] Should we show correct answers after quiz ends for skipped questions? → **Yes, show on results screen**
- [x] Should Aikahaaste have sound effects? → **No sounds for v1**
- [ ] Should Aikahaaste have its own separate stats page? → **Future enhancement**
- [ ] What happens if question set has exactly 10 questions? → **Use all, no randomization needed**
- [ ] Should we prevent users from starting Aikahaaste on very small sets (<10 questions)? → **Show message, prevent start**

## Implementation Plan

See `docs/todos/AIKAHAASTE-TODOS.md` for detailed task breakdown.

## Success Metrics

After launch, track:
1. Aikahaaste mode adoption rate (% of users who try it)
2. Completion rate (% who finish all 10 questions)
3. Average score in Aikahaaste vs regular quiz
4. User feedback (qualitative)
5. Repeat usage (% who play Aikahaaste multiple times)

Target:
- 30%+ of active users try Aikahaaste within first month
- 60%+ completion rate (finish all 10 questions)
- Users play Aikahaaste at least 2x per week on average
