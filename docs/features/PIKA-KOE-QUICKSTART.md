# Aikahaaste Quick Start Guide

## ✅ All Design Decisions Made

The Aikahaaste feature is fully designed and ready for implementation. All questions have been answered:

| Decision | Choice |
|----------|--------|
| **Mode Type** | Separate mode (third card on /play page) |
| **Scoring** | Same as regular quiz |
| **Configuration** | Fixed: 10 questions, 10 seconds each |
| **Timer UI** | Progress bar at top |
| **Timeout Action** | Auto-skip immediately |
| **Pause** | No pause allowed |
| **Discovery** | Third mode card on /play page |
| **Show Answers** | Yes, show correct answers for skipped questions on results |
| **Sound Effects** | No sounds for v1 |

## 🚀 Getting Started

### Step 1: Read the Design Doc
Start with `docs/features/AIKAHAASTE-DESIGN.md` to understand:
- User experience flow
- Technical architecture
- Component structure
- Data models

### Step 2: Follow the TODO Phases
Open `docs/todos/AIKAHAASTE-TODOS.md` and work through phases sequentially:

1. **Phase 1 (Days 1-2)**: Core infrastructure
   - Types, utilities, custom hooks
2. **Phase 2 (Days 3-4)**: UI components
   - Timer, intro, results
3. **Phase 3 (Days 5-6)**: Pages & routing
   - Mode selection, play page, game logic
4. **Phase 4 (Day 7)**: Styling & polish
5. **Phase 5 (Day 8)**: Testing & QA
6. **Phase 6 (Day 9)**: Analytics (optional)
7. **Phase 7 (Day 10)**: Documentation

### Step 3: Start with Core Utils
Begin implementation with:
```bash
# 1. Create type definitions
touch src/types/speedQuiz.ts

# 2. Create utility functions
touch src/lib/utils/speedQuiz.ts

# 3. Create custom hook
touch src/hooks/useSpeedQuizTimer.ts
```

## 📦 File Structure

New files to create:
```
src/
├── types/
│   └── speedQuiz.ts              # Type definitions
├── lib/
│   └── utils/
│       └── speedQuiz.ts          # Utility functions
├── hooks/
│   └── useSpeedQuizTimer.ts      # Timer hook
├── components/
│   └── speedQuiz/
│       ├── SpeedQuizTimer.tsx    # Progress bar timer
│       ├── SpeedQuizIntro.tsx    # Countdown screen
│       ├── SpeedQuizGame.tsx     # Main game logic
│       └── SpeedQuizResults.tsx  # End screen
└── app/
    └── play/
        └── speed-quiz/
            ├── page.tsx          # Mode selection
            └── [code]/
                └── page.tsx      # Play page
```

Files to modify:
```
src/
├── app/
│   └── play/
│       └── page.tsx              # Add third mode card
└── types/
    └── index.ts                  # Add 'speed-quiz' to QuizMode type
```

## 🎨 Design Tokens

Use these color tokens consistently:

```typescript
const speedQuizTheme = {
  // Primary brand color
  primary: 'amber-500',
  primaryHover: 'amber-600',

  // Timer states
  timerSafe: 'emerald-500',      // 10-4 seconds
  timerWarning: 'amber-500',      // 3-2 seconds
  timerCritical: 'red-500',       // 1-0 seconds

  // Status icons
  iconCorrect: 'emerald-600',
  iconWrong: 'red-600',
  iconSkipped: 'slate-400',
};
```

## 🧪 Testing Strategy

### Manual Testing Checklist
After each phase, test:
- ✅ Works in light mode
- ✅ Works in dark mode
- ✅ Responsive on mobile (320px)
- ✅ Responsive on tablet (768px)
- ✅ Responsive on desktop (1280px)
- ✅ No console errors
- ✅ TypeScript compiles without errors

### Key Test Scenarios
1. **Happy path**: Complete quiz with all correct answers
2. **All skipped**: Let all questions timeout
3. **Mixed**: Some correct, some wrong, some skipped
4. **Edge case**: Question set with exactly 10 questions
5. **Error case**: Question set with <10 questions

## ⚡ Quick Implementation Tips

### 1. Timer Hook Pattern
```typescript
// Use setInterval for smooth animation
const intervalId = setInterval(() => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const remaining = Math.max(0, timeLimit - elapsed);
  setTimeRemaining(remaining);

  if (remaining === 0) {
    clearInterval(intervalId);
    onExpire();
  }
}, 100); // Update every 100ms for smooth bar
```

### 2. Random Selection
```typescript
// Fisher-Yates shuffle algorithm
const shuffled = [...questions];
for (let i = shuffled.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
}
return shuffled.slice(0, 10);
```

### 3. Color State Logic
```typescript
const getTimerColorState = (seconds: number) => {
  if (seconds >= 4) return 'safe';    // green
  if (seconds >= 2) return 'warning'; // amber
  return 'critical';                   // red
};
```

### 4. Auto-Skip Handler
```typescript
const handleTimeout = useCallback(() => {
  // Mark current question as skipped
  setSkippedQuestions(prev => [...prev, currentQuestion.id]);

  // Move to next question or end quiz
  if (currentQuestionIndex < totalQuestions - 1) {
    setCurrentQuestionIndex(prev => prev + 1);
  } else {
    navigateToResults();
  }
}, [currentQuestion, currentQuestionIndex, totalQuestions]);
```

## 🚨 Common Pitfalls to Avoid

1. **Timer cleanup**: Always clear interval on unmount
2. **State updates during unmount**: Check if component is mounted
3. **Timer drift**: Use `Date.now()` for accuracy, not increments
4. **Rapid clicks**: Debounce answer submission
5. **Memory leaks**: Clean up all subscriptions/intervals
6. **Dark mode**: Test timer bar visibility in both themes
7. **Mobile performance**: Optimize timer rendering (use CSS transitions)

## 📊 Success Metrics

After MVP launch, track:
- Aikahaaste mode adoption rate (target: 30%+ of users try it)
- Completion rate (target: 60%+ finish all 10 questions)
- Average score vs regular quiz (expect lower scores)
- Repeat usage (target: 2x per week)

## 🎯 MVP Scope

**In scope for v1:**
- ✅ Fixed 10 questions, 10 seconds each
- ✅ Progress bar timer
- ✅ Auto-skip on timeout
- ✅ Show correct answers on results
- ✅ Works on mobile + desktop
- ✅ Dark mode support

**Out of scope (v2+):**
- ❌ Configurable time/question count
- ❌ Sound effects
- ❌ Leaderboards
- ❌ Multiplayer mode
- ❌ Power-ups
- ❌ Separate stats tracking

## 🤝 Need Help?

1. **Design questions**: Refer to `AIKAHAASTE-DESIGN.md`
2. **Task questions**: Check `AIKAHAASTE-TODOS.md`
3. **Technical questions**: Ask in project chat or create issue

## 🎉 Ready to Start!

You have everything you need:
- ✅ Complete design specification
- ✅ Detailed implementation plan
- ✅ Phase-by-phase breakdown
- ✅ All decisions made
- ✅ Testing strategy
- ✅ Success criteria

**Estimated timeline**: 10 days (4-6 hours/day)

Good luck! 🚀
