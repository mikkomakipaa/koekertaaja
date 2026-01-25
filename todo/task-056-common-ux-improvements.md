# Task 056: Common UI/UX Improvements

## Status
- **Status**: Pending
- **Created**: 2026-01-24
- **Priority**: P1 (High user value)
- **Estimated Effort**: 8 points (1-1.5 days)

## Overview
Implement 8 high-impact UX improvements to the browse/play page that enhance discoverability, provide better context, and improve the overall user experience. These improvements focus on helping students find content, understand time commitments, track progress, and navigate the app more efficiently.

## Design Philosophy
- **User-centric**: Help students make informed decisions
- **Context-rich**: Show relevant information at a glance
- **Non-intrusive**: Add value without overwhelming
- **Mobile-first**: Works beautifully on tablets and phones

## User Requirements
Based on user feedback and UX analysis:
- ✅ Help students find content quickly (search, filters)
- ✅ Show time commitment upfront (question count, duration)
- ✅ Display performance context (last score, progress)
- ✅ Reduce confusion with empty states
- ✅ Professional loading experience (skeletons)

## Acceptance Criteria
- [ ] Empty states show helpful guidance and actions
- [ ] Question count and time estimate visible on all cards
- [ ] Last score displayed when available
- [ ] Search bar filters by name, subject, topic, subtopic
- [ ] "New" badges appear on recently created question sets (<7 days)
- [ ] Skeleton loading states during data fetch
- [ ] Completion progress indicator shows partial progress
- [ ] Last score displays with performance icon
- [ ] All features work on mobile (320px+) and desktop
- [ ] Dark mode fully supported
- [ ] No breaking changes to existing functionality

---

## Technical Implementation Plan

### 1. Empty States with Guidance (1 hour)

#### 1.1 No Question Sets Found
**File**: `src/app/play/page.tsx`

**Location**: Replace existing empty state (around line 272-301)

**Implementation**:
```tsx
{groupedSets.length === 0 && state === 'loaded' && (
  <div className="text-center py-16 px-6">
    <div className="max-w-md mx-auto">
      <div className="mb-6 flex justify-center">
        <Books size={80} weight="duotone" className="text-purple-500 dark:text-purple-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
        Ei vielä harjoituksia
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
        Luo ensimmäinen kysymyssarja aloittaaksesi harjoittelun
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={() => router.push('/create')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 rounded-xl text-lg font-semibold flex items-center gap-2 justify-center"
        >
          <Sparkle size={20} weight="fill" />
          Luo kysymyssarja
        </Button>
        <Button
          onClick={() => router.push('/')}
          variant="outline"
          className="px-8 py-6 rounded-xl text-lg font-semibold"
        >
          Takaisin valikkoon
        </Button>
      </div>
    </div>
  </div>
)}
```

#### 1.2 No Results from Search/Filter
**Add above the question sets grid**:

```tsx
{filteredSets.length === 0 && groupedSets.length > 0 && (
  <div className="text-center py-12 px-6">
    <div className="mb-6 flex justify-center">
      <MagnifyingGlass size={64} weight="duotone" className="text-gray-400 dark:text-gray-600" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
      Ei tuloksia
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-6">
      {searchQuery
        ? `Hakusanalla "${searchQuery}" ei löytynyt kysymyssarjoja`
        : selectedGrade
        ? `Luokalla ${selectedGrade} ei ole kysymyssarjoja`
        : 'Ei kysymyssarjoja valituilla suodattimilla'
      }
    </p>
    <div className="flex gap-3 justify-center">
      {searchQuery && (
        <Button onClick={() => setSearchQuery('')} variant="outline">
          Tyhjennä haku
        </Button>
      )}
      {selectedGrade && (
        <Button onClick={() => setSelectedGrade(null)} variant="outline">
          Näytä kaikki luokat
        </Button>
      )}
    </div>
  </div>
)}
```

---

### 2. Question Count & Time Estimate (1 hour)

#### 2.1 Add Helper Function
**File**: `src/app/play/page.tsx`

**Add near top of component**:
```typescript
// Calculate estimated duration based on question count
const estimateDuration = (questionCount: number): string => {
  // Average 42 seconds per question for ages 10-12
  const minutes = Math.ceil((questionCount * 0.7));

  if (minutes < 1) return '< 1 min';
  if (minutes === 1) return '1 min';
  if (minutes < 60) return `~${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0
    ? `~${hours}h ${remainingMins}min`
    : `~${hours}h`;
};
```

#### 2.2 Add to Question Set Cards
**Location**: Inside each question set card, after subject badge (around line 340)

```tsx
{/* Question Count & Time Estimate - NEW */}
<div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
  <span className="flex items-center gap-1">
    <ListNumbers size={14} weight="duotone" className="text-gray-400" />
    <span className="font-medium">
      {group.sets[0]?.question_count || 15} kysymystä
    </span>
  </span>
  <span className="flex items-center gap-1">
    <Clock size={14} weight="duotone" className="text-gray-400" />
    <span className="font-medium">
      {estimateDuration(group.sets[0]?.question_count || 15)}
    </span>
  </span>
</div>
```

**Import icons**:
```tsx
import { ListNumbers, Clock } from '@phosphor-icons/react';
```

---

### 3. Last Score Display (1-2 hours)

#### 3.1 Create localStorage Helper Hook
**File**: `src/hooks/useLastScore.ts` (NEW)

```typescript
import { useState, useEffect } from 'react';

interface LastScore {
  score: number;
  total: number;
  percentage: number;
  timestamp: number;
  difficulty?: string;
}

export function useLastScore(questionSetCode?: string) {
  const [lastScore, setLastScore] = useState<LastScore | null>(null);

  useEffect(() => {
    if (!questionSetCode) {
      setLastScore(null);
      return;
    }

    try {
      const key = `last_score_${questionSetCode}`;
      const stored = localStorage.getItem(key);

      if (stored) {
        const data = JSON.parse(stored) as LastScore;
        setLastScore(data);
      } else {
        setLastScore(null);
      }
    } catch (error) {
      console.error('Error reading last score:', error);
      setLastScore(null);
    }
  }, [questionSetCode]);

  const saveLastScore = (score: number, total: number, difficulty?: string) => {
    if (!questionSetCode) return;

    const percentage = Math.round((score / total) * 100);
    const data: LastScore = {
      score,
      total,
      percentage,
      timestamp: Date.now(),
      difficulty,
    };

    try {
      const key = `last_score_${questionSetCode}`;
      localStorage.setItem(key, JSON.stringify(data));
      setLastScore(data);
    } catch (error) {
      console.error('Error saving last score:', error);
    }
  };

  const clearLastScore = () => {
    if (!questionSetCode) return;

    try {
      const key = `last_score_${questionSetCode}`;
      localStorage.removeItem(key);
      setLastScore(null);
    } catch (error) {
      console.error('Error clearing last score:', error);
    }
  };

  return {
    lastScore,
    saveLastScore,
    clearLastScore,
  };
}
```

#### 3.2 Display Last Score on Cards
**File**: `src/app/play/page.tsx`

**Import hook**:
```tsx
import { useLastScore } from '@/hooks/useLastScore';
```

**Add to card component** (inside the map, after difficulty buttons):
```tsx
{/* Last Score Display - NEW */}
{(() => {
  const { lastScore } = useLastScore(group.sets[0]?.code);

  if (!lastScore) return null;

  const getScoreIcon = () => {
    if (lastScore.percentage >= 80) {
      return <Star size={16} weight="fill" className="text-yellow-500" />;
    }
    if (lastScore.percentage >= 60) {
      return <ThumbsUp size={16} weight="fill" className="text-blue-500" />;
    }
    return <Barbell size={16} weight="bold" className="text-orange-500" />;
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Viimeisin tulos:
        </span>
        <div className="flex items-center gap-1.5">
          {getScoreIcon()}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {lastScore.score}/{lastScore.total}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            ({lastScore.percentage}%)
          </span>
        </div>
      </div>
    </div>
  );
})()}
```

**Import icons**:
```tsx
import { Star, ThumbsUp, Barbell } from '@phosphor-icons/react';
```

#### 3.3 Save Score After Session
**File**: `src/components/play/ResultsScreen.tsx`

**Add to useEffect** (around line 66):
```tsx
import { useLastScore } from '@/hooks/useLastScore';

export function ResultsScreen({
  // ... existing props
  questionSetCode,
}: ResultsScreenProps) {
  const { saveLastScore } = useLastScore(questionSetCode);

  useEffect(() => {
    if (questionSetCode) {
      // ... existing code (badges, personal best)

      // Save last score - NEW
      saveLastScore(score, total, difficulty);
    }
  }, []);

  // ... rest of component
}
```

---

### 4. Search Bar (2 hours)

#### 4.1 Add Search State
**File**: `src/app/play/page.tsx`

**Add state** (around line 45):
```tsx
const [searchQuery, setSearchQuery] = useState('');
```

#### 4.2 Add Search Input UI
**Location**: Above grade filter chips (around line 232)

```tsx
{/* Search Bar - NEW */}
<div className="mb-6">
  <div className="relative">
    <MagnifyingGlass
      size={20}
      weight="duotone"
      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
    />
    <input
      type="text"
      placeholder="Etsi aihealuetta, ainetta tai aihetta..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="
        w-full pl-10 pr-10 py-3
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-lg
        text-base
        placeholder:text-gray-400 dark:placeholder:text-gray-500
        focus:ring-2 focus:ring-purple-500 focus:border-transparent
        dark:focus:ring-purple-400
        transition-shadow
      "
    />
    {searchQuery && (
      <button
        onClick={() => setSearchQuery('')}
        className="
          absolute right-3 top-1/2 -translate-y-1/2
          text-gray-400 hover:text-gray-600
          dark:text-gray-500 dark:hover:text-gray-300
          transition-colors
        "
        aria-label="Tyhjennä haku"
      >
        <X size={20} weight="bold" />
      </button>
    )}
  </div>
</div>
```

**Import icons**:
```tsx
import { MagnifyingGlass, X } from '@phosphor-icons/react';
```

#### 4.3 Add Search Filter Logic
**Update filteredSets** (around line 182):

```tsx
// BEFORE
const filteredSets = selectedGrade
  ? groupedSets.filter(g => g.grade === selectedGrade)
  : groupedSets;

// AFTER
const filteredSets = groupedSets
  .filter(g => {
    // Grade filter
    if (selectedGrade && g.grade !== selectedGrade) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        g.name,
        g.subject,
        g.topic || '',
        g.subtopic || '',
      ].join(' ').toLowerCase();

      if (!searchableText.includes(query)) return false;
    }

    return true;
  });
```

---

### 5. "New" Badges (1 hour)

#### 5.1 Add Helper Function
**File**: `src/app/play/page.tsx`

```typescript
// Check if question set is new (created within last 7 days)
const isNewQuestionSet = (createdAt: string): boolean => {
  const created = new Date(createdAt);
  const now = new Date();
  const daysDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff <= 7;
};
```

#### 5.2 Add Badge to Cards
**Location**: Top-right of card (around line 316, before title)

```tsx
<div
  key={group.key}
  className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-800 hover:shadow-md transition-all relative"
>
  {/* "New" Badge - NEW */}
  {isNewQuestionSet(group.sets[0]?.created_at) && (
    <div className="absolute top-4 right-4 z-10">
      <span className="
        inline-flex items-center gap-1
        px-3 py-1.5 rounded-full
        text-xs font-bold
        bg-gradient-to-r from-pink-500 to-rose-500
        text-white
        shadow-sm
        animate-pulse
      ">
        <Sparkle size={12} weight="fill" />
        Uusi!
      </span>
    </div>
  )}

  {/* Rest of card content */}
</div>
```

**Import icon**:
```tsx
import { Sparkle } from '@phosphor-icons/react';
```

---

### 6. Skeleton Loading States (1-2 hours)

#### 6.1 Create Skeleton Component
**File**: `src/components/ui/skeleton.tsx` (NEW)

```tsx
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      role="status"
      aria-label="Ladataan..."
    />
  );
}
```

#### 6.2 Replace Loading Spinner
**File**: `src/app/play/page.tsx`

**Replace existing loading UI** (around line 204-213):

```tsx
// BEFORE
if (state === 'loading') {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <CircleNotch weight="bold" className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-600" />
        <p className="text-lg text-gray-600">Ladataan aihealueita...</p>
      </div>
    </div>
  );
}

// AFTER
if (state === 'loading') {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Mode Toggle Skeleton */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            <Skeleton className="flex-1 h-12 rounded-lg" />
            <Skeleton className="flex-1 h-12 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 md:p-12">
        {/* Header Skeleton */}
        <div className="mb-10">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>

        {/* Search Bar Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        {/* Grade Filter Skeleton */}
        <div className="mb-6 flex gap-2">
          <Skeleton className="h-10 w-20 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>

        {/* Question Set Cards Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-800"
            >
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-12 w-28 rounded-lg" />
                <Skeleton className="h-12 w-28 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### 7. Completion Progress Indicator (2-3 hours)

#### 7.1 Create Progress Tracking Hook
**File**: `src/hooks/useSessionProgress.ts` (NEW)

```typescript
import { useState, useEffect } from 'react';

interface SessionProgress {
  answered: number;
  total: number;
  percentage: number;
}

export function useSessionProgress(questionSetCode?: string) {
  const [progress, setProgress] = useState<SessionProgress | null>(null);

  useEffect(() => {
    if (!questionSetCode) {
      setProgress(null);
      return;
    }

    try {
      const key = `session_progress_${questionSetCode}`;
      const stored = localStorage.getItem(key);

      if (stored) {
        const data = JSON.parse(stored);
        const percentage = Math.round((data.answered / data.total) * 100);
        setProgress({ ...data, percentage });
      } else {
        setProgress(null);
      }
    } catch (error) {
      console.error('Error reading session progress:', error);
      setProgress(null);
    }
  }, [questionSetCode]);

  const updateProgress = (answered: number, total: number) => {
    if (!questionSetCode) return;

    const percentage = Math.round((answered / total) * 100);
    const data: SessionProgress = { answered, total, percentage };

    try {
      const key = `session_progress_${questionSetCode}`;
      localStorage.setItem(key, JSON.stringify(data));
      setProgress(data);
    } catch (error) {
      console.error('Error updating session progress:', error);
    }
  };

  const clearProgress = () => {
    if (!questionSetCode) return;

    try {
      const key = `session_progress_${questionSetCode}`;
      localStorage.removeItem(key);
      setProgress(null);
    } catch (error) {
      console.error('Error clearing session progress:', error);
    }
  };

  return {
    progress,
    updateProgress,
    clearProgress,
  };
}
```

#### 7.2 Display Progress Ring on Cards
**File**: `src/app/play/page.tsx`

**Import hook**:
```tsx
import { useSessionProgress } from '@/hooks/useSessionProgress';
```

**Add progress ring** (top-right of card, alongside "New" badge):

```tsx
{(() => {
  const { progress } = useSessionProgress(group.sets[0]?.code);

  if (!progress || progress.percentage === 0 || progress.percentage === 100) {
    return null;
  }

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress.percentage / 100) * circumference;

  return (
    <div className="absolute top-4 right-4 z-10">
      <div className="relative w-12 h-12">
        <svg className="transform -rotate-90 w-12 h-12">
          {/* Background circle */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-indigo-500 dark:text-indigo-400 transition-all duration-500"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300">
          {progress.percentage}%
        </span>
      </div>
    </div>
  );
})()}
```

#### 7.3 Update Progress During Gameplay
**File**: `src/app/play/[code]/page.tsx`

**Import hook**:
```tsx
import { useSessionProgress } from '@/hooks/useSessionProgress';
```

**Update progress after each answer**:
```tsx
const { updateProgress, clearProgress } = useSessionProgress(questionSet.code);

// After submitAnswer or in useEffect when question changes
useEffect(() => {
  if (currentQuestionIndex >= 0 && selectedQuestions.length > 0) {
    updateProgress(currentQuestionIndex + 1, selectedQuestions.length);
  }
}, [currentQuestionIndex, selectedQuestions.length, updateProgress]);

// Clear progress when session completes
useEffect(() => {
  if (isLastQuestion && showExplanation) {
    // Session completed
    clearProgress();
  }
}, [isLastQuestion, showExplanation, clearProgress]);
```

---

### 8. Subject Icon Enhancement (1 hour)

**File**: `src/app/play/page.tsx`

**Update `getSubjectLabel` function** (around line 136):

```tsx
// BEFORE: Small icon inline with text
const getSubjectLabel = (subject: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    english: (
      <span className="flex items-center gap-1.5">
        <GlobeHemisphereWest size={18} weight="duotone" className="text-blue-500" />
        Englanti
      </span>
    ),
    // ... etc
  };
  return iconMap[subject] || <span>{subject}</span>;
};

// AFTER: Larger icon in colored box
const getSubjectWithIcon = (subject: string) => {
  const subjectConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    english: {
      icon: <GlobeHemisphereWest size={24} weight="duotone" />,
      label: 'Englanti',
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    },
    math: {
      icon: <MathOperations size={24} weight="duotone" />,
      label: 'Matematiikka',
      color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    },
    history: {
      icon: <Scroll size={24} weight="duotone" />,
      label: 'Historia',
      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    },
    society: {
      icon: <Bank size={24} weight="duotone" />,
      label: 'Yhteiskuntaoppi',
      color: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    },
    biology: {
      icon: <Leaf size={24} weight="duotone" />,
      label: 'Biologia',
      color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    },
    geography: {
      icon: <MapTrifold size={24} weight="duotone" />,
      label: 'Maantiede',
      color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
    },
    finnish: {
      icon: <BookOpenText size={24} weight="duotone" />,
      label: 'Äidinkieli',
      color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    },
  };

  const config = subjectConfig[subject] || {
    icon: <Book size={24} weight="duotone" />,
    label: subject,
    color: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  };

  return (
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2 rounded-lg ${config.color}`}>
        {config.icon}
      </div>
      <div>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {config.label}
        </span>
        {/* Topic can go here as subtitle if needed */}
      </div>
    </div>
  );
};
```

**Update card to use new function** (around line 327):

```tsx
{/* Subject - UPDATED */}
{getSubjectWithIcon(group.subject)}
```

**Import new icons**:
```tsx
import { Leaf, MapTrifold, BookOpenText } from '@phosphor-icons/react';
```

---

## UI/UX Specifications

### Empty State Styling
- Icon: 80px, duotone weight
- Heading: text-2xl, font-bold
- Body text: text-lg, gray-600
- Buttons: px-8 py-6 (large touch targets)
- Spacing: mb-8 between sections

### Search Bar Styling
- Height: 48px (py-3)
- Icon: 20px, left-aligned (pl-10)
- Clear button: right-aligned (pr-10)
- Focus: ring-2 ring-purple-500
- Placeholder: gray-400

### "New" Badge Animation
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
```

### Progress Ring SVG
- Radius: 20px
- Stroke width: 3px
- Background: gray-200 (light), gray-700 (dark)
- Progress: indigo-500 (light), indigo-400 (dark)
- Transition: 500ms for smooth animation

### Skeleton Animation
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

---

## Testing Checklist

### Functionality Tests
- [ ] Empty state shows when no question sets
- [ ] Empty state shows when search/filter has no results
- [ ] Search filters by name, subject, topic, subtopic
- [ ] Search is case-insensitive
- [ ] Clear button (X) clears search
- [ ] "New" badge appears on sets created <7 days ago
- [ ] "New" badge disappears after 7 days
- [ ] Question count displays correctly
- [ ] Time estimate is accurate (~0.7 min per question)
- [ ] Last score displays when available
- [ ] Last score icon matches performance (star/thumbs/barbell)
- [ ] Progress ring shows correct percentage
- [ ] Progress ring disappears at 0% and 100%
- [ ] Skeleton loading shows during data fetch
- [ ] Subject icons display correctly with colors

### Edge Cases
- [ ] Empty search query shows all results
- [ ] Search with special characters works
- [ ] Very long question set names don't break layout
- [ ] Missing subject icons fall back gracefully
- [ ] localStorage quota exceeded handled gracefully
- [ ] Malformed localStorage data doesn't crash app

### Visual/Responsive Tests
- [ ] Mobile (320px): All elements stack correctly
- [ ] Tablet (768px): Search bar full width
- [ ] Desktop (1024px+): Optimal spacing
- [ ] Dark mode: All colors look good
- [ ] Empty states centered and readable
- [ ] Icons sized appropriately
- [ ] Progress ring doesn't overlap "New" badge

### Accessibility Tests
- [ ] Search input has proper label/placeholder
- [ ] Clear button has aria-label
- [ ] Skeleton has role="status" and aria-label
- [ ] Progress ring has aria-valuenow
- [ ] All interactive elements keyboard accessible
- [ ] Focus states visible
- [ ] Color contrast WCAG AA compliant

---

## Implementation Order

### Phase 1: High-Impact Quick Wins (3-4 hours)
1. ✅ Empty states (1h)
2. ✅ Question count & time estimate (1h)
3. ✅ Search bar (2h)

### Phase 2: Progress & Context (3-4 hours)
4. ✅ Last score display (1-2h)
5. ✅ "New" badges (1h)
6. ✅ Skeleton loading (1-2h)

### Phase 3: Polish (2-3 hours)
7. ✅ Completion progress ring (2-3h)
8. ✅ Subject icon enhancement (1h)

**Total**: 8-11 hours (1-1.5 days)

---

## Dependencies

**NPM Packages**: None (uses existing dependencies)

**Icons Needed** (from @phosphor-icons/react):
- `ListNumbers`, `Clock` (question count/time)
- `MagnifyingGlass`, `X` (search)
- `Sparkle` (new badge)
- `Star`, `ThumbsUp`, `Barbell` (score icons)
- `Leaf`, `MapTrifold`, `BookOpenText` (subject icons)

**Files to Create**:
- `src/hooks/useLastScore.ts`
- `src/hooks/useSessionProgress.ts`
- `src/components/ui/skeleton.tsx`

**Files to Modify**:
- `src/app/play/page.tsx`
- `src/app/play/[code]/page.tsx`
- `src/components/play/ResultsScreen.tsx`

---

## Definition of Done

- [ ] All 8 improvements implemented
- [ ] All acceptance criteria met
- [ ] Empty states show helpful guidance
- [ ] Search filters work correctly
- [ ] Last scores save and display
- [ ] Progress tracking works across sessions
- [ ] "New" badges appear/disappear correctly
- [ ] Skeleton loading shows during fetch
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

All features use localStorage and are non-breaking:

1. **Immediate rollback**: Revert modified files
2. **Partial rollback**: Features are independent, can disable individually
3. **Data safety**: localStorage won't break existing functionality
4. **Graceful degradation**: All features fail silently if localStorage unavailable

---

## Success Metrics (Future Analytics)

- **Search usage**: % of users who use search bar
- **Empty state engagement**: Click-through rate on "Create" button
- **Time accuracy**: Compare estimated vs actual session duration
- **Progress completion**: % of partial sessions that get completed
- **Last score influence**: Do users replay low-scoring sets more?

---

## Notes

- **Why these 8?**: Highest impact/effort ratio based on UX analysis
- **Why localStorage?**: No authentication, works offline, zero server cost
- **Why skeleton over spinner?**: Better perceived performance (53% faster feel)
- **Why time estimates?**: Helps students plan sessions around available time
- **Why search?**: Essential once >20 question sets exist

---

## Related Tasks

- **Task 052**: Review Mistakes (benefits from last score display)
- **Task 053**: Topic Mastery % (uses similar progress tracking)
- **Task 055**: Design Refresh (visual improvements)
- **Task 057**: Mode-Specific UX (complements these common improvements)

---

**Last Updated**: 2026-01-24
**Estimated Completion**: 2026-01-26 (1-1.5 days)
**Priority**: High (improves core UX significantly)
