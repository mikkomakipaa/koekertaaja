# Aikahaaste (Time Challenge) - Simplified Architecture

## Architecture Decision: Third Difficulty Option (Not Separate Mode)

### ✅ Chosen Approach: Integrated Third Option

Aikahaaste is implemented as a **third difficulty option** alongside Helppo and Normaali, NOT as a separate game mode.

**Why This Is Better:**
1. **Simpler**: Reuses ALL existing quiz infrastructure
2. **Familiar**: Users already understand "choose difficulty" pattern
3. **Less Code**: ~60% less new code compared to separate mode
4. **Consistent**: Same URL structure, same components, same flow
5. **Maintainable**: One quiz page handles all variants

### Visual Structure

```
Main Play Page (/play)
├── Question Set Card: "Englanti 7. luokka - Kappale 3"
│   ├── [Helppo] ────────────> /play/ABC123
│   ├── [Normaali] ──────────> /play/XYZ789
│   └── [Aikahaaste] ────────> /play/ABC123?difficulty=aikahaaste
│
└── (Same quiz page, different rendering mode)
```

### URL Structure

| Difficulty | URL | Questions Used |
|------------|-----|----------------|
| Helppo | `/play/ABC123` | Helppo set (easier questions) |
| Normaali | `/play/XYZ789` | Normaali set (harder questions) |
| **Aikahaaste** | `/play/XYZ789?difficulty=aikahaaste` | **Random 10 from Normaali questions only** |

### Key Differences from Original Design

| Aspect | Original Design (Aikahaaste) | New Design (Aikahaaste) |
|--------|---------------------------|-------------------------|
| **Mode Type** | Separate mode with own pages | Third difficulty option |
| **Routes** | `/play/speed-quiz` → `/play/speed-quiz/[code]` | `/play/[code]?difficulty=aikahaaste` |
| **Selection Page** | New dedicated selection page | No new page - buttons on existing cards |
| **Components** | New SpeedQuizGame component | Reuse existing QuizPlay page |
| **Question Selection** | Random 10 from selected set | Random 10 from Normaali difficulty only |
| **Code Complexity** | ~500 LOC new code | ~150 LOC new code (70% reduction) |

## Component Reuse Strategy

### Components That Are REUSED (No Changes)

1. **QuestionRenderer** - Renders all question types (multiple choice, fill blank, etc.)
2. **ProgressBar** - Shows question X/10
3. **ResultsScreen** - Shows final score and breakdown
   - Only modification: Add optional `skippedQuestions` prop
4. **QuizPlay page** (`/play/[code]/page.tsx`)
   - Detects `?difficulty=aikahaaste` parameter
   - Conditionally shows timer
   - Adds auto-skip logic

### Components That Are NEW (Minimal)

1. **SpeedQuizTimer** - Progress bar at top (only visible in Aikahaaste mode)
2. **SpeedQuizIntro** - Countdown screen (3-2-1-Aloita!)
3. **useSpeedQuizTimer** - Timer hook with color states

### What Changes in Existing Components

**`/play/page.tsx` (Question Set Cards):**
```diff
+ Add third button: "Aikahaaste"
+ Check if total questions >= 10 before showing
+ Link to: /play/[code]?difficulty=aikahaaste
```

**`/play/[code]/page.tsx` (Quiz Play Page):**
```diff
+ const isAikahaaste = searchParams.get('difficulty') === 'aikahaaste';

+ if (isAikahaaste) {
+   // Show intro countdown
+   // Show timer at top
+   // Use random 10 questions
+   // Auto-skip on timeout
+ }
```

**`ResultsScreen.tsx`:**
```diff
+ interface ResultsScreenProps {
+   skippedQuestions?: string[]; // Optional - only for Aikahaaste
+ }

+ if (skippedQuestions && skippedQuestions.length > 0) {
+   // Show skipped count
+   // Show question list with expand/collapse
+   // Show correct answers for skipped
+ }
```

## Question Selection Logic

### Regular Quiz (Helppo/Normaali)
- Uses stratified sampling by topic
- Pulls from single difficulty level
- Exam length: 5-20 questions (user configured)

### Aikahaaste
- Uses **Normaali difficulty questions only**
- Randomly selects exactly 10 questions (Fisher-Yates shuffle)
- Fixed length: Always 10 questions
- Same difficulty level, different question selection

**Example:**
```
Question Set Group: "Englanti 7. luokka - Kappale 3"
├── Helppo: 40 questions → Not used for Aikahaaste
├── Normaali: 50 questions → Aikahaaste picks random 10 from these
└── Aikahaaste button links to: /play/[normaali-code]?difficulty=aikahaaste
```

## Data Flow

### 1. User Clicks "Aikahaaste" Button
```typescript
// On /play page
<Link href={`/play/${firstQuizSetCode}?difficulty=aikahaaste`}>
  <Button>
    <Lightning /> Aikahaaste
  </Button>
</Link>
```

### 2. Play Page Detects Mode
```typescript
// In /play/[code]/page.tsx
const searchParams = useSearchParams();
const isAikahaaste = searchParams.get('difficulty') === 'aikahaaste';

if (isAikahaaste) {
  // Initialize timer state
  const { timeRemaining, colorState, start, stop, reset } = useSpeedQuizTimer(10, handleTimeout);

  // Show intro countdown first
  if (showIntro) {
    return <SpeedQuizIntro onStart={() => { setShowIntro(false); start(); }} />;
  }
}
```

### 3. Questions Are Selected
```typescript
// Question set is already fetched (Normaali difficulty)
const questions = questionSet.questions; // Already fetched

// For Aikahaaste: Pick random 10 from this (Normaali) set
const selectedQuestions = isAikahaaste
  ? selectRandomQuestions(questions, 10)
  : stratifiedSampling(questions, examLength); // Regular mode
```

### 4. Timer Runs During Quiz
```tsx
{isAikahaaste && (
  <SpeedQuizTimer
    timeRemaining={timeRemaining}
    timeLimit={10}
    colorState={colorState}
  />
)}
```

### 5. Auto-Skip on Timeout
```typescript
const handleTimeout = () => {
  if (!isAikahaaste) return;

  // Mark as skipped
  setSkippedQuestions(prev => [...prev, currentQuestion.id]);

  // Move to next question
  if (hasMoreQuestions) {
    nextQuestion();
    reset();
    start();
  } else {
    endGame();
  }
};
```

### 6. Results Show Skipped Questions
```tsx
<ResultsScreen
  {...regularProps}
  skippedQuestions={isAikahaaste ? skippedQuestions : undefined}
/>
```

## File Structure

### New Files (Minimal)
```
src/
├── hooks/
│   └── useSpeedQuizTimer.ts          # Timer hook (NEW)
├── lib/
│   └── utils/
│       └── speedQuiz.ts              # Random selection utils (NEW)
└── components/
    └── speedQuiz/
        ├── SpeedQuizTimer.tsx        # Timer bar (NEW)
        └── SpeedQuizIntro.tsx        # Countdown (NEW)
```

### Modified Files
```
src/
├── app/
│   └── play/
│       ├── page.tsx                  # Add Aikahaaste button (MODIFIED)
│       └── [code]/
│           └── page.tsx              # Add timer logic (MODIFIED)
├── components/
│   └── play/
│       └── ResultsScreen.tsx         # Add skipped questions (MODIFIED)
└── types/
    └── index.ts                      # Add types (MODIFIED)
```

### Deleted Files (from original design)
```
❌ src/app/play/speed-quiz/page.tsx              # Not needed
❌ src/app/play/speed-quiz/[code]/page.tsx       # Not needed
❌ src/components/speedQuiz/SpeedQuizGame.tsx    # Not needed (reuse existing)
❌ src/components/speedQuiz/SpeedQuizResults.tsx # Not needed (reuse existing)
```

**Total LOC Reduction: ~400 lines of code eliminated**

## Implementation Phases

### Phase 1: Core Infrastructure (Tasks 158-160)
- [x] Type definitions
- [x] Utility functions (random selection)
- [x] Timer hook

### Phase 2: UI Components (Tasks 161-163)
- [x] Timer component
- [x] Intro component
- ~~[ ] Results component~~ (DELETED - reusing existing)

### Phase 3: Integration (Tasks 164-166)
- [x] Add button to play cards
- [x] Integrate timer into play page
- [x] Update ResultsScreen

### Phase 4: Polish & Testing (Tasks 167-168)
- [x] Styling and animations
- [x] Comprehensive testing

## Validation Checklist

### ✅ User's Requirements Met

- [x] **Renamed to Aikahaaste** (not Aikahaaste)
- [x] **Third option under question set** (not separate mode)
- [x] **Uses only that set's questions** (random 10 from the group)
- [x] **Reuses existing quiz design and components** (minimal modifications)
- [x] **Only adds: colors, texts, time bar** (as requested)

### ✅ Technical Validation

- [x] Single source of truth: `/play/[code]` handles all modes
- [x] URL parameter differentiates: `?difficulty=aikahaaste`
- [x] No code duplication (reuses QuestionRenderer, ResultsScreen, etc.)
- [x] Timer is isolated component (doesn't pollute existing code)
- [x] Backwards compatible (regular quiz unaffected)

### ✅ Simplicity Validation

- [x] No new routes needed
- [x] No new selection page
- [x] ~70% less code than original design
- [x] Easier to maintain (one quiz page, not two)
- [x] Familiar UX pattern (choose difficulty)

## Benefits of Simplified Architecture

1. **Faster Implementation**: 3-4 days instead of 10 days
2. **Less Maintenance**: One quiz page to maintain, not two
3. **Fewer Bugs**: Less code = fewer places for bugs
4. **Better UX**: Familiar pattern (users understand difficulty selection)
5. **More Flexible**: Easy to add more difficulty options later
6. **Consistent**: Same look and feel across all quiz modes

## Future Enhancements (v2)

Since architecture is now simpler, these become easier to add:

1. **Configurable Time**: Allow 5s, 10s, 15s per question
2. **Configurable Count**: Allow 5, 10, 15 questions
3. **Per-Difficulty Aikahaaste**: Aikahaaste mode for Helppo only or Normaali only
4. **Leaderboards**: Weekly best times per question set
5. **Power-ups**: Freeze time, skip question (gamification)

All can be added via URL parameters without changing architecture!

## Summary

**Aikahaaste = Existing Quiz + Timer**

That's it. Simple, elegant, maintainable.
