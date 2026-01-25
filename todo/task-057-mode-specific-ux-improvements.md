# Task 057: Mode-Specific UX Improvements (Quiz + Flashcard)

## Status
- **Status**: Pending
- **Created**: 2026-01-24
- **Priority**: P1 (High user value)
- **Estimated Effort**: 8 points (1-1.5 days)

## Overview
Implement mode-specific UX improvements for both Quiz and Flashcard modes that enhance gameplay, reduce confusion, provide better context, and improve learning outcomes. These improvements focus on making each mode feel polished, professional, and optimized for its specific learning purpose.

## Design Philosophy
- **Mode-aware**: Each mode has unique UX needs
- **Reduce friction**: Remove redundancy, confusion
- **Enhance feedback**: Immediate, clear, motivating
- **User control**: Options without overwhelming

## User Requirements
Based on screenshot analysis and UX principles:
- ✅ Remove duplicate/redundant text
- ✅ Add missing context (question type, difficulty)
- ✅ Provide skip/confidence options
- ✅ Enhance feedback (streaks, encouragement)
- ✅ Keyboard shortcuts for power users
- ✅ Exit confirmations for incomplete sessions

## Acceptance Criteria

### Quiz Mode
- [ ] Duplicate "Kysymys X/Y" header removed
- [ ] Question type indicator visible
- [ ] Skip button available
- [ ] Streak indicator shows when streak ≥ 3
- [ ] Enhanced input placeholders with hints
- [ ] Keyboard shortcuts hint displayed
- [ ] Motivational messages after correct answers
- [ ] Progress percentage shown

### Flashcard Mode
- [ ] Duplicate "Napauta..." text removed
- [ ] Confidence rating buttons after flip
- [ ] Card review counter displayed
- [ ] Exit confirmation for incomplete sessions
- [ ] Keyboard navigation hints
- [ ] Shuffle toggle with indicator
- [ ] Card flip animation hint on first card

### Both Modes
- [ ] All features work on mobile and desktop
- [ ] Dark mode fully supported
- [ ] No breaking changes to existing functionality

---

## Technical Implementation Plan - Quiz Mode

### 1. Remove Duplicate Header (5 min)

#### 1.1 Clean Up Header Text
**File**: `src/app/play/[code]/page.tsx`

**Problem**: "Kysymys 1/15" appears in header AND below

**Solution**: Remove the duplicate below header

```tsx
{/* REMOVE THIS - It's redundant with header */}
{/* <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
  Kysymys {currentQuestionIndex + 1} / {selectedQuestions.length}
</h2> */}

{/* Keep only in header (already exists in screenshot) */}
```

---

### 2. Question Type Indicator (1 hour)

#### 2.1 Add Helper Function
**File**: `src/app/play/[code]/page.tsx`

```typescript
import {
  TextT,
  ListChecks,
  CheckCircle,
  Shuffle,
  ChatText,
  ListNumbers,
  MapPin,
  Article,
} from '@phosphor-icons/react';

const getQuestionTypeInfo = (type: QuestionType) => {
  const typeMap: Record<QuestionType, { label: string; icon: React.ReactNode }> = {
    fill_blank: {
      label: 'Täydennä lause',
      icon: <TextT size={14} weight="duotone" />,
    },
    multiple_choice: {
      label: 'Monivalinta',
      icon: <ListChecks size={14} weight="duotone" />,
    },
    true_false: {
      label: 'Totta vai tarua',
      icon: <CheckCircle size={14} weight="duotone" />,
    },
    matching: {
      label: 'Yhdistä parit',
      icon: <Shuffle size={14} weight="duotone" />,
    },
    short_answer: {
      label: 'Lyhyt vastaus',
      icon: <ChatText size={14} weight="duotone" />,
    },
    sequential: {
      label: 'Järjestä oikein',
      icon: <ListNumbers size={14} weight="duotone" />,
    },
    map: {
      label: 'Kartta',
      icon: <MapPin size={14} weight="duotone" />,
    },
  };

  return typeMap[type] || {
    label: 'Kysymys',
    icon: <Article size={14} weight="duotone" />,
  };
};
```

#### 2.2 Display Type Badge
**Location**: Above question text

```tsx
{/* Question Type & Difficulty Badges - NEW */}
<div className="flex items-center gap-2 mb-4">
  {/* Question Type */}
  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-xs font-medium text-indigo-700 dark:text-indigo-300">
    {getQuestionTypeInfo(currentQuestion.question_type).icon}
    {getQuestionTypeInfo(currentQuestion.question_type).label}
  </span>

  {/* Difficulty Badge (if available) */}
  {difficulty && (
    <span className={`
      inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
      ${difficulty === 'helppo'
        ? 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300'
        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
      }
    `}>
      {difficulty === 'helppo' ? (
        <>
          <Smiley size={14} weight="fill" />
          Helppo
        </>
      ) : (
        <>
          <Target size={14} weight="duotone" />
          Normaali
        </>
      )}
    </span>
  )}
</div>
```

---

### 3. Skip Button (30 min)

#### 3.1 Add Skip Handler
**File**: `src/app/play/[code]/page.tsx`

```typescript
const handleSkip = () => {
  // Treat skip as incorrect answer (no points)
  const currentQuestion = selectedQuestions[currentQuestionIndex];

  setAnswers((prev) => [
    ...prev,
    {
      questionId: currentQuestion.id,
      questionText: currentQuestion.question_text,
      userAnswer: null,
      correctAnswer: getCorrectAnswerDisplay(currentQuestion),
      isCorrect: false,
      explanation: currentQuestion.explanation,
      pointsEarned: 0,
      streakAtAnswer: 0,
    },
  ]);

  // Reset streak
  setCurrentStreak(0);

  // Show explanation immediately
  setShowExplanation(true);
};
```

#### 3.2 Add Skip Button UI
**Location**: Next to submit button

```tsx
{/* Submit & Skip Buttons */}
<div className="flex gap-3">
  {/* Primary: Submit answer */}
  <button
    onClick={submitAnswer}
    disabled={!userAnswer || userAnswer === ''}
    className="
      flex-1
      bg-indigo-600 hover:bg-indigo-700
      disabled:bg-gray-300 dark:disabled:bg-gray-700
      disabled:cursor-not-allowed
      text-white font-semibold
      px-6 py-4 rounded-xl
      transition-colors
      shadow-sm hover:shadow-md
    "
  >
    Tarkista vastaus
  </button>

  {/* Secondary: Skip */}
  <button
    onClick={handleSkip}
    className="
      px-6 py-4 rounded-xl
      bg-gray-200 dark:bg-gray-700
      hover:bg-gray-300 dark:hover:bg-gray-600
      text-gray-700 dark:text-gray-300
      font-medium
      transition-colors
      flex items-center gap-2
    "
    aria-label="Ohita kysymys"
  >
    <ArrowRight size={20} weight="bold" />
    <span className="hidden sm:inline">Ohita</span>
  </button>
</div>
```

---

### 4. Streak Indicator (1 hour)

#### 4.1 Add Streak Display
**Location**: Near points display (top-right area)

```tsx
{/* Streak Indicator - NEW (shows when streak >= 3) */}
{currentStreak >= 3 && (
  <div className="
    flex items-center gap-2
    px-4 py-2
    bg-orange-50 dark:bg-orange-900/20
    border-2 border-orange-500
    rounded-lg
    animate-bounce-subtle
  ">
    <Fire size={24} weight="fill" className="text-orange-500" />
    <div>
      <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
        Putki
      </div>
      <div className="text-xl font-bold text-orange-700 dark:text-orange-300">
        {currentStreak}
      </div>
    </div>
  </div>
)}
```

#### 4.2 Add Bounce Animation
**File**: `src/app/globals.css`

```css
@keyframes bounce-subtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.animate-bounce-subtle {
  animation: bounce-subtle 1s ease-in-out infinite;
}
```

---

### 5. Enhanced Input Placeholders (30 min)

#### 5.1 Context-Aware Placeholders
**File**: Component for each question type

**For Fill Blank questions**:
```tsx
const getPlaceholderHint = (questionText: string): string => {
  // Extract hint from question if possible
  // For "We pick ___ in summer" -> suggest "hedelmä, marja, vihanneksen nimi..."

  const commonHints: Record<string, string> = {
    'default': 'Kirjoita vastauksesi tähän...',
    'fill_blank': 'Esim: sana, termi tai lyhyt vastaus',
    'short_answer': 'Kirjoita vastaus omin sanoin (1-3 lausetta)',
  };

  // Smart hint extraction (basic example)
  if (questionText.toLowerCase().includes('summer')) {
    return 'Esim: hedelmä, kasvi, toiminta...';
  }

  return commonHints[currentQuestion.question_type] || commonHints.default;
};

// In input component:
<input
  type="text"
  value={userAnswer || ''}
  onChange={(e) => setUserAnswer(e.target.value)}
  placeholder={getPlaceholderHint(currentQuestion.question_text)}
  className="..."
/>
```

---

### 6. Keyboard Shortcuts Hint (30 min)

#### 6.1 Add Hint Below Input
**Location**: Below text input fields

```tsx
{/* Keyboard Shortcut Hint - NEW */}
{currentQuestion.question_type === 'fill_blank' && (
  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center flex items-center justify-center gap-4">
    <div className="flex items-center gap-1">
      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">
        Enter
      </kbd>
      <span>lähettää vastaus</span>
    </div>
    <div className="flex items-center gap-1">
      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">
        Esc
      </kbd>
      <span>tyhjennä</span>
    </div>
  </div>
)}
```

#### 6.2 Implement Keyboard Handlers
```tsx
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Enter to submit
    if (e.key === 'Enter' && userAnswer && !showExplanation) {
      submitAnswer();
    }

    // Escape to clear
    if (e.key === 'Escape') {
      setUserAnswer('');
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [userAnswer, showExplanation, submitAnswer]);
```

---

### 7. Motivational Messages (30 min)

#### 7.1 Add Encouragement Pool
**File**: `src/app/play/[code]/page.tsx`

```typescript
const getRandomEncouragement = (): string => {
  const encouragements = [
    'Hienoa! 🎉',
    'Oikein! Jatka samaan malliin! 💪',
    'Erinomaista! ⭐',
    'Olet tulessa! 🔥',
    'Täydellinen vastaus! ✨',
    'Loistava! 🌟',
    'Mahtavaa työtä! 👏',
    'Osaat tämän! 💯',
  ];

  return encouragements[Math.floor(Math.random() * encouragements.length)];
};
```

#### 7.2 Display After Correct Answer
**Location**: In explanation section

```tsx
{showExplanation && (
  <div className="mt-6 space-y-4">
    {/* Motivational Message (only if correct) - NEW */}
    {isCorrect && (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-4 rounded-lg">
        <p className="text-emerald-800 dark:text-emerald-200 font-medium">
          {getRandomEncouragement()}
        </p>
      </div>
    )}

    {/* Explanation (existing) */}
    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-lg">
      <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
        Selitys:
      </p>
      <p className="text-blue-800 dark:text-blue-200">
        {currentQuestion.explanation}
      </p>
    </div>
  </div>
)}
```

---

### 8. Progress Percentage (15 min)

#### 8.1 Add Percentage Label
**Location**: Above or next to progress bar

```tsx
{/* Progress Bar with Percentage - UPDATED */}
<div className="mb-4">
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
      Edistyminen
    </span>
    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
      {Math.round(((currentQuestionIndex + 1) / selectedQuestions.length) * 100)}% valmis
    </span>
  </div>
  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
    <div
      className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
      style={{ width: `${((currentQuestionIndex + 1) / selectedQuestions.length) * 100}%` }}
      role="progressbar"
      aria-valuenow={(currentQuestionIndex + 1) / selectedQuestions.length * 100}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  </div>
</div>
```

---

## Technical Implementation Plan - Flashcard Mode

### 9. Remove Duplicate "Napauta" Text (5 min)

#### 9.1 Clean Up Redundant Text
**File**: `src/components/play/FlashcardCard.tsx`

```tsx
{/* REMOVE THIS - Redundant with card text */}
{/* <div className="mt-6 text-center">
  <p className="text-gray-600 dark:text-gray-400 text-sm">
    Napauta korttia nähdäksesi vastauksen
  </p>
</div> */}

{/* Keep only the one ON the card itself */}
```

---

### 10. Confidence Rating Buttons (2 hours)

#### 10.1 Add Confidence State
**File**: `src/components/play/FlashcardCard.tsx`

```typescript
import { ThumbsDown, Minus, ThumbsUp } from '@phosphor-icons/react';

type Confidence = 'hard' | 'medium' | 'easy';

const [cardConfidence, setCardConfidence] = useState<Record<string, Confidence>>({});
```

#### 10.2 Add Confidence Handler
```typescript
const markConfidence = (confidence: Confidence) => {
  // Save confidence rating
  setCardConfidence(prev => ({
    ...prev,
    [flashcards[currentIndex].id]: confidence,
  }));

  // Store in localStorage for spaced repetition (future)
  try {
    const key = `flashcard_confidence_${flashcards[currentIndex].questionId}`;
    localStorage.setItem(key, JSON.stringify({
      confidence,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Error saving confidence:', error);
  }

  // Auto-advance to next card
  setTimeout(() => {
    handleNext();
  }, 300);
};
```

#### 10.3 Display Confidence Buttons
**Location**: After card is flipped

```tsx
{/* Confidence Rating Buttons - NEW (only after flip) */}
{isFlipped && (
  <div className="mt-6 space-y-3">
    <p className="text-center text-sm text-gray-600 dark:text-gray-400 font-medium">
      Kuinka hyvin osasit?
    </p>
    <div className="flex gap-3">
      <button
        onClick={() => markConfidence('hard')}
        className="
          flex-1
          bg-rose-500 hover:bg-rose-600
          text-white font-semibold
          py-3 px-4 rounded-lg
          transition-colors
          flex items-center justify-center gap-2
          shadow-sm hover:shadow-md
        "
      >
        <ThumbsDown size={20} weight="fill" />
        <span className="text-sm">En osannut</span>
      </button>
      <button
        onClick={() => markConfidence('medium')}
        className="
          flex-1
          bg-amber-500 hover:bg-amber-600
          text-white font-semibold
          py-3 px-4 rounded-lg
          transition-colors
          flex items-center justify-center gap-2
          shadow-sm hover:shadow-md
        "
      >
        <Minus size={20} weight="bold" />
        <span className="text-sm">Osittain</span>
      </button>
      <button
        onClick={() => markConfidence('easy')}
        className="
          flex-1
          bg-emerald-500 hover:bg-emerald-600
          text-white font-semibold
          py-3 px-4 rounded-lg
          transition-colors
          flex items-center justify-center gap-2
          shadow-sm hover:shadow-md
        "
      >
        <ThumbsUp size={20} weight="fill" />
        <span className="text-sm">Osasin!</span>
      </button>
    </div>
  </div>
)}
```

---

### 11. Card Review Counter (1 hour)

#### 11.1 Track Review Count
**File**: `src/components/play/FlashcardCard.tsx`

```typescript
import { ClockCounterClockwise } from '@phosphor-icons/react';

const getReviewCount = (cardId: string): number => {
  try {
    const key = `flashcard_reviews_${cardId}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
};

const incrementReviewCount = (cardId: string) => {
  try {
    const key = `flashcard_reviews_${cardId}`;
    const current = getReviewCount(cardId);
    localStorage.setItem(key, (current + 1).toString());
  } catch (error) {
    console.error('Error incrementing review count:', error);
  }
};

// Call when card is viewed/flipped
useEffect(() => {
  if (isFlipped) {
    incrementReviewCount(flashcards[currentIndex].id);
  }
}, [isFlipped, currentIndex]);
```

#### 11.2 Display Review Counter
**Location**: Top-right of flashcard

```tsx
{/* Card Review Counter - NEW */}
{(() => {
  const reviewCount = getReviewCount(flashcards[currentIndex].id);

  if (reviewCount === 0) return null;

  return (
    <div className="absolute top-4 right-4 bg-teal-100 dark:bg-teal-900/30 px-3 py-1.5 rounded-full z-10">
      <div className="flex items-center gap-1.5 text-xs">
        <ClockCounterClockwise size={14} weight="duotone" className="text-teal-600 dark:text-teal-400" />
        <span className="font-medium text-teal-700 dark:text-teal-300">
          {reviewCount}x katsottu
        </span>
      </div>
    </div>
  );
})()}
```

---

### 12. Exit Confirmation (30 min)

#### 12.1 Add Exit Handler with Confirmation
**File**: `src/components/play/FlashcardCard.tsx`

```typescript
import { useState } from 'react';

const [showExitConfirm, setShowExitConfirm] = useState(false);

const handleExit = () => {
  // If session incomplete, confirm
  if (currentIndex < flashcards.length - 1) {
    setShowExitConfirm(true);
  } else {
    // Session complete, safe to exit
    router.push('/play');
  }
};
```

#### 12.2 Exit Confirmation Modal
```tsx
{/* Exit Confirmation Modal - NEW */}
{showExitConfirm && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
        Haluatko varmasti lopettaa?
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Olet käynyt läpi {currentIndex + 1}/{flashcards.length} korttia.
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setShowExitConfirm(false)}
          className="
            bg-teal-600 hover:bg-teal-700
            text-white font-semibold
            py-3 px-6 rounded-lg
            transition-colors
          "
        >
          Jatka opiskelua
        </button>
        <button
          onClick={() => router.push('/play')}
          className="
            bg-gray-200 dark:bg-gray-700
            hover:bg-gray-300 dark:hover:bg-gray-600
            text-gray-700 dark:text-gray-300 font-medium
            py-3 px-6 rounded-lg
            transition-colors
          "
        >
          Lopeta
        </button>
      </div>
    </div>
  </div>
)}
```

---

### 13. Keyboard Navigation Hints (30 min)

#### 13.1 Add Hint at Bottom
**Location**: Below flashcard

```tsx
{/* Keyboard Shortcuts Hint - NEW */}
<div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
  <span className="inline-flex items-center gap-1">
    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono">
      Space
    </kbd>
    kääntää kortti
  </span>
  <span className="inline-flex items-center gap-1">
    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono">
      ←
    </kbd>
    edellinen
  </span>
  <span className="inline-flex items-center gap-1">
    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono">
      →
    </kbd>
    seuraava
  </span>
</div>
```

#### 13.2 Implement Keyboard Handlers
```tsx
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Space to flip
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      setIsFlipped(!isFlipped);
    }

    // Arrow left for previous
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      handlePrevious();
    }

    // Arrow right for next
    if (e.key === 'ArrowRight' && currentIndex < flashcards.length - 1) {
      handleNext();
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [isFlipped, currentIndex, flashcards.length]);
```

---

### 14. Shuffle Toggle (1 hour)

#### 14.1 Add Shuffle State
**File**: `src/components/play/FlashcardCard.tsx`

```typescript
import { Shuffle } from '@phosphor-icons/react';
import { shuffleArray } from '@/lib/utils';

const [isShuffled, setIsShuffled] = useState(false);
const [orderedFlashcards] = useState(flashcards); // Original order
const [currentFlashcards, setCurrentFlashcards] = useState(flashcards);

const toggleShuffle = () => {
  if (isShuffled) {
    // Return to original order
    setCurrentFlashcards(orderedFlashcards);
    setIsShuffled(false);
  } else {
    // Shuffle
    setCurrentFlashcards(shuffleArray([...flashcards]));
    setIsShuffled(true);
  }
  // Reset to first card
  setCurrentIndex(0);
  setIsFlipped(false);
};
```

#### 14.2 Shuffle Toggle Button
**Location**: Above flashcard progress

```tsx
{/* Shuffle Toggle - NEW */}
<div className="flex items-center justify-between mb-4">
  <button
    onClick={toggleShuffle}
    className={`
      flex items-center gap-2 px-3 py-2 rounded-lg
      font-medium text-sm
      transition-all
      ${isShuffled
        ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
      }
    `}
  >
    <Shuffle size={18} weight={isShuffled ? 'fill' : 'regular'} />
    <span>{isShuffled ? 'Sekoitettu' : 'Järjestyksessä'}</span>
  </button>

  {/* Existing progress indicator */}
  <span className="text-sm text-gray-600 dark:text-gray-400">
    Kortti {currentIndex + 1} / {flashcards.length}
  </span>
</div>
```

---

### 15. Card Flip Animation Hint (1 hour)

#### 15.1 Add First-Time Hint State
```typescript
const [hasFlippedOnce, setHasFlippedOnce] = useState(false);

useEffect(() => {
  // Check if user has seen flip hint before
  const hasSeenHint = localStorage.getItem('has_seen_flip_hint');
  setHasFlippedOnce(!!hasSeenHint);
}, []);

const handleFlip = () => {
  setIsFlipped(!isFlipped);

  if (!hasFlippedOnce) {
    setHasFlippedOnce(true);
    localStorage.setItem('has_seen_flip_hint', 'true');
  }
};
```

#### 15.2 Animated Flip Hint
**Location**: Overlay on first card (if not flipped yet)

```tsx
{/* Flip Hint Animation - NEW (only on first card, first time) */}
{currentIndex === 0 && !hasFlippedOnce && !isFlipped && (
  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
    <div className="animate-wiggle">
      <div className="w-16 h-16 bg-teal-500/20 dark:bg-teal-500/10 rounded-full flex items-center justify-center backdrop-blur-sm">
        <ArrowsClockwise size={32} weight="bold" className="text-teal-600 dark:text-teal-400" />
      </div>
    </div>
  </div>
)}
```

#### 15.3 Wiggle Animation
**File**: `src/app/globals.css`

```css
@keyframes wiggle {
  0%, 100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

.animate-wiggle {
  animation: wiggle 1s ease-in-out 3;
}
```

---

## UI/UX Specifications

### Quiz Mode Styling

**Question Type Badge**:
- Background: `indigo-100` (light), `indigo-900/30` (dark)
- Text: `indigo-700` (light), `indigo-300` (dark)
- Icon size: 14px
- Padding: `px-3 py-1.5`
- Border radius: `rounded-lg`

**Skip Button**:
- Mobile: Icon only
- Desktop: Icon + "Ohita" text
- Background: `gray-200` (light), `gray-700` (dark)
- Icon: `ArrowRight` 20px bold

**Streak Indicator**:
- Appears when streak ≥ 3
- Border: 2px solid orange-500
- Animation: subtle bounce (1s infinite)
- Icon: Fire 24px fill

### Flashcard Mode Styling

**Confidence Buttons**:
- Hard: `bg-rose-500` (red)
- Medium: `bg-amber-500` (orange)
- Easy: `bg-emerald-500` (green)
- All: hover shadow-md, 3-column grid
- Icon size: 20px fill/bold

**Review Counter Badge**:
- Position: Absolute top-4 right-4
- Background: `teal-100` (light), `teal-900/30` (dark)
- Padding: `px-3 py-1.5`
- Border radius: `rounded-full`

**Exit Confirmation Modal**:
- Backdrop: `bg-black/50`
- Card: `bg-white` (light), `bg-gray-800` (dark)
- Max width: `max-w-sm`
- Padding: `p-6`
- Border radius: `rounded-xl`

---

## Testing Checklist

### Quiz Mode Tests
- [ ] Duplicate header removed
- [ ] Question type badge displays correct icon/label
- [ ] Skip button treats as incorrect (no points, resets streak)
- [ ] Streak indicator appears at streak 3, 5, 10
- [ ] Streak indicator animates smoothly
- [ ] Enhanced placeholders show contextual hints
- [ ] Keyboard shortcuts work (Enter, Esc)
- [ ] Motivational messages show after correct answers
- [ ] Messages randomize (not same every time)
- [ ] Progress percentage accurate

### Flashcard Mode Tests
- [ ] Duplicate "Napauta..." text removed
- [ ] Confidence buttons appear after flip
- [ ] Confidence ratings save to localStorage
- [ ] Auto-advance after rating selection
- [ ] Review counter increments on flip
- [ ] Review counter displays correctly
- [ ] Exit confirmation shows if incomplete
- [ ] Exit confirmation doesn't show if complete
- [ ] Keyboard shortcuts work (Space, ←, →)
- [ ] Shuffle toggle changes card order
- [ ] Flip hint shows on first card
- [ ] Flip hint disappears after first flip

### Edge Cases
- [ ] localStorage quota exceeded handled
- [ ] Malformed localStorage data doesn't crash
- [ ] Keyboard shortcuts don't conflict with browser
- [ ] Confidence buttons work on touch devices
- [ ] Exit confirmation closes on backdrop click
- [ ] Shuffle maintains current card reference

### Visual/Responsive Tests
- [ ] Mobile (320px): All buttons accessible
- [ ] Tablet (768px): Layouts optimized
- [ ] Desktop (1024px+): Keyboard hints visible
- [ ] Dark mode: All colors look good
- [ ] Animations smooth (60fps)
- [ ] Touch targets ≥ 48px

### Accessibility Tests
- [ ] All buttons have aria-labels
- [ ] Keyboard navigation logical
- [ ] Focus states visible
- [ ] Screen reader announces mode changes
- [ ] Color not sole indicator (icons + text)

---

## Implementation Order

### Quiz Mode (4-5 hours)
1. ✅ Remove duplicate header (5min)
2. ✅ Question type indicator (1h)
3. ✅ Skip button (30min)
4. ✅ Streak indicator (1h)
5. ✅ Enhanced placeholders (30min)
6. ✅ Keyboard shortcuts (30min)
7. ✅ Motivational messages (30min)
8. ✅ Progress percentage (15min)

### Flashcard Mode (4-6 hours)
9. ✅ Remove duplicate text (5min)
10. ✅ Confidence rating buttons (2h)
11. ✅ Card review counter (1h)
12. ✅ Exit confirmation (30min)
13. ✅ Keyboard hints (30min)
14. ✅ Shuffle toggle (1h)
15. ✅ Flip animation hint (1h)

**Total**: 8-11 hours (1-1.5 days)

---

## Dependencies

**NPM Packages**: None (uses existing dependencies)

**Icons Needed** (from @phosphor-icons/react):
- Quiz: `TextT`, `ListChecks`, `CheckCircle`, `Shuffle`, `ChatText`, `ListNumbers`, `MapPin`, `ArrowRight`, `Fire`
- Flashcard: `ThumbsDown`, `Minus`, `ThumbsUp`, `ClockCounterClockwise`, `Shuffle`, `ArrowsClockwise`

**Files to Create**:
- None (all modifications to existing files)

**Files to Modify**:
- `src/app/play/[code]/page.tsx` (Quiz improvements)
- `src/components/play/FlashcardCard.tsx` (Flashcard improvements)
- `src/app/globals.css` (animations)

---

## Definition of Done

- [ ] All quiz mode improvements implemented
- [ ] All flashcard mode improvements implemented
- [ ] All acceptance criteria met
- [ ] Duplicate text removed from both modes
- [ ] Context indicators added (type, difficulty, confidence)
- [ ] User controls added (skip, shuffle, keyboard)
- [ ] Feedback enhanced (streak, encouragement, review count)
- [ ] Exit confirmations prevent accidental loss
- [ ] All features work on mobile and desktop
- [ ] Dark mode fully supported
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No console errors
- [ ] localStorage operations have error handling
- [ ] Accessibility tested (keyboard, screen reader)
- [ ] Visual regression testing completed
- [ ] Documentation updated

---

## Rollback Plan

All features are additive and non-breaking:

1. **Immediate rollback**: Revert modified files
2. **Partial rollback**: Features independent, can disable individually
3. **Data safety**: localStorage won't break existing functionality
4. **Graceful degradation**: All features fail silently if issues occur

---

## Success Metrics (Future Analytics)

- **Skip usage**: % of questions skipped
- **Confidence ratings**: Distribution of hard/medium/easy
- **Review effectiveness**: Do reviewed cards improve scores?
- **Keyboard shortcuts**: % of users who use them
- **Shuffle preference**: % of users who shuffle cards
- **Exit rate**: % of incomplete sessions

---

## Notes

- **Why remove duplicates?**: Reduces visual noise, cleaner UX
- **Why question type indicator?**: Sets expectations, reduces confusion
- **Why skip button?**: Reduces frustration, honest self-assessment
- **Why confidence ratings?**: Foundation for spaced repetition
- **Why keyboard shortcuts?**: Power users, faster workflow
- **Why exit confirmation?**: Prevents accidental data loss

---

## Related Tasks

- **Task 052**: Review Mistakes (uses confidence data)
- **Task 053**: Topic Mastery % (complements progress tracking)
- **Task 055**: Design Refresh (visual improvements)
- **Task 056**: Common UX Improvements (browse page enhancements)

---

**Last Updated**: 2026-01-24
**Estimated Completion**: 2026-01-26 (1-1.5 days)
**Priority**: High (polish core experience)
