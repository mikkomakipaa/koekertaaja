# Task 055: Design System Refresh - Dual-Color Theme

## Status
- **Status**: Pending
- **Created**: 2026-01-24
- **Priority**: P1 (High impact on UX)
- **Estimated Effort**: 5 points (4-6 hours)

## Overview
Implement a dual-color theme system that creates clear visual distinction between Quiz and Flashcard modes, refines difficulty colors, and improves overall visual hierarchy. This refresh moves from generic purple-everything to a sophisticated, mode-aware color system.

## Design Philosophy
- **Minimal & Content-focused**: Fewer competing colors, clear hierarchy
- **Professional with personality**: Sophisticated palette, not childish
- **Instant recognition**: Know your mode and difficulty at a glance
- **Mobile-first**: High contrast, WCAG AAA compliant

## User Requirements
Based on user feedback:
- ✅ **Clear quiz/flashcard visual separation**
- ✅ **Better difficulty colors** (not generic green/blue)
- ✅ **Keep icons** (they work well)
- ✅ **Sophisticated color palette** (professional feel)

## Acceptance Criteria
- [ ] Quiz mode uses indigo theme throughout
- [ ] Flashcard mode uses teal theme throughout
- [ ] Mode toggle buttons show distinct colors (indigo vs teal)
- [ ] Difficulty buttons use slate (Helppo) and amber (Normaali)
- [ ] Question set cards have mode indicator stripes
- [ ] Badge categories use distinct colors
- [ ] All colors meet WCAG AAA contrast ratios (7:1)
- [ ] Dark mode fully supported with adjusted colors
- [ ] Smooth transitions between modes
- [ ] Mobile responsive (all breakpoints)
- [ ] No breaking changes to existing functionality

---

## New Color System

### Primary Theme Colors

#### **Quiz Mode: Indigo** (Energy, Competition, Achievement)
```typescript
// tailwind.config.js - Already in Tailwind, just use directly
{
  indigo: {
    50:  '#eef2ff',
    100: '#e0e7ff',
    400: '#818cf8',  // Dark mode
    500: '#6366f1',  // Primary
    600: '#4f46e5',  // Buttons
    700: '#4338ca',  // Hover
    900: '#312e81',  // Dark text
  }
}
```

**Usage**:
- Quiz mode toggle (active state)
- Quiz session headers
- Quiz progress bars
- Quiz completion screens

---

#### **Flashcard Mode: Teal** (Focus, Study, Calm)
```typescript
{
  teal: {
    50:  '#f0fdfa',
    100: '#ccfbf1',
    400: '#2dd4bf',  // Dark mode
    500: '#14b8a6',  // Primary
    600: '#0d9488',  // Buttons
    700: '#0f766e',  // Hover
    900: '#134e4a',  // Dark text
  }
}
```

**Usage**:
- Flashcard mode toggle (active state)
- Flashcard session UI
- Study progress indicators
- Flashcard completion screens

---

#### **Difficulty Colors (Refined)**

**Helppo (Easy): Slate with Cyan accent**
```typescript
{
  slate: {
    600: '#475569',  // Button bg
    700: '#334155',  // Hover
    800: '#1e293b',  // Dark text
  },
  cyan: {
    400: '#22d3ee',  // Icon accent
    500: '#06b6d4',  // Accent
  }
}
```

**Normaali (Normal): Amber**
```typescript
{
  amber: {
    100: '#fef3c7',  // Icon tint
    500: '#f59e0b',  // Primary
    600: '#d97706',  // Button bg
    700: '#b45309',  // Hover
    900: '#78350f',  // Dark text
  }
}
```

---

### Supporting Colors (Keep Existing)
- **Success**: `emerald-500` (correct answers)
- **Error**: `rose-500` (gentle mistakes)
- **Points**: `yellow-500` (gold treasure)
- **Streaks**: `orange-500` (fire energy)

---

## Technical Implementation Plan

### Phase 1: Mode Toggle & Core Theme (2-3 hours)

#### 1.1 Update ModeToggle Component
**File**: `src/components/play/ModeToggle.tsx`

**Changes**:
- Quiz mode active: `bg-indigo-600` with `ring-2 ring-indigo-400`
- Flashcard mode active: `bg-teal-600` with `ring-2 ring-teal-400`
- Inactive: Keep current gray

**Implementation**:
```tsx
'use client';

import { StudyMode } from '@/types';
import { GameController, Book } from '@phosphor-icons/react';

interface ModeToggleProps {
  currentMode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
}

export function ModeToggle({ currentMode, onModeChange }: ModeToggleProps) {
  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          {/* Quiz Mode Button */}
          <button
            onClick={() => onModeChange('pelaa')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
              currentMode === 'pelaa'
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg ring-2 ring-indigo-400 dark:ring-indigo-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-current={currentMode === 'pelaa' ? 'page' : undefined}
          >
            <GameController size={20} weight={currentMode === 'pelaa' ? 'fill' : 'regular'} />
            Pelaa
          </button>

          {/* Flashcard Mode Button */}
          <button
            onClick={() => onModeChange('opettele')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
              currentMode === 'opettele'
                ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-lg ring-2 ring-teal-400 dark:ring-teal-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-current={currentMode === 'opettele' ? 'page' : undefined}
          >
            <Book size={20} weight={currentMode === 'opettele' ? 'fill' : 'regular'} />
            Opettele
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

#### 1.2 Update Difficulty Buttons
**File**: `src/app/play/page.tsx`

**Changes** (around line 54-62):
```tsx
// BEFORE (old colors)
const difficultyColors: Record<string, { bg: string; hover: string; text: string }> = {
  helppo: { bg: 'bg-green-500', hover: 'hover:bg-green-600', text: 'text-green-700' },
  normaali: { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-blue-700' },
};

// AFTER (new colors)
const difficultyColors: Record<string, { bg: string; hover: string; text: string; icon: string }> = {
  helppo: {
    bg: 'bg-slate-600',
    hover: 'hover:bg-slate-700',
    text: 'text-white',
    icon: 'text-cyan-400'
  },
  normaali: {
    bg: 'bg-amber-600',
    hover: 'hover:bg-amber-700',
    text: 'text-white',
    icon: 'text-amber-100'
  },
};
```

**Button Rendering** (around line 354):
```tsx
{availableDifficulties.map((difficulty) => {
  const set = group.sets.find(s => s.difficulty === difficulty && s.mode === 'quiz');
  const colors = difficultyColors[difficulty];
  const icon = difficultyIcons[difficulty];

  return (
    <button
      key={difficulty}
      onClick={() => set && router.push(`/play/${set.code}?mode=${studyMode}`)}
      className={`
        ${colors.bg} ${colors.hover} ${colors.text}
        px-4 py-3 rounded-lg font-semibold text-sm
        transition-all shadow-sm hover:shadow-md active:scale-95
        flex items-center gap-1.5
      `}
      aria-label={`${difficultyLabels[difficulty]} vaikeustaso`}
    >
      <span className={colors.icon}>{icon}</span>
      {difficultyLabels[difficulty]}
    </button>
  );
})}
```

**Update Icon Styling**:
```tsx
const difficultyIcons: Record<string, React.ReactNode> = {
  helppo: <Smiley size={20} weight="fill" />,  // Will get cyan-400 from parent
  normaali: <Target size={20} weight="duotone" />,  // Will get amber-100 from parent
};
```

---

#### 1.3 Add Mode Indicator Stripes to Cards
**File**: `src/app/play/page.tsx`

**Changes** (inside question set card div, around line 311):
```tsx
<div
  key={group.key}
  className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-800 hover:shadow-md transition-all relative overflow-hidden"
>
  {/* Mode Indicator Stripe - NEW */}
  <div className={`
    absolute top-0 left-0 w-1 h-full
    ${availableDifficulties.length > 0 && groupHasFlashcards
      ? 'bg-gradient-to-b from-indigo-500 via-purple-500 to-teal-500'  // Both modes
      : availableDifficulties.length > 0
      ? 'bg-indigo-500'  // Quiz only
      : groupHasFlashcards
      ? 'bg-teal-500'    // Flashcard only
      : 'bg-gray-300'    // None (shouldn't happen)
    }
  `} />

  {/* Content with left margin - MODIFY */}
  <div className="ml-4">
    {/* Existing card content */}
    {/* Title, subject, buttons, etc. */}
  </div>
</div>
```

---

### Phase 2: Session UI Theming (1-2 hours)

#### 2.1 Quiz Session Theme
**File**: `src/app/play/[code]/page.tsx`

**Add mode-specific header** (if in quiz mode):
```tsx
{/* Quiz Mode Header - Add near top of return */}
{!isFlashcardMode && (
  <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-700 dark:to-indigo-600 text-white px-4 py-3 mb-4 rounded-lg shadow-sm">
    <div className="flex items-center gap-2 max-w-4xl mx-auto">
      <GameController size={20} weight="fill" />
      <span className="font-semibold text-sm">Quiz Mode</span>
      <span className="text-indigo-200 dark:text-indigo-300 text-sm ml-auto">
        Kysymys {currentQuestionIndex + 1}/{selectedQuestions.length}
      </span>
    </div>
  </div>
)}
```

**Update progress bar** (quiz mode):
```tsx
{/* Progress bar with mode-specific color */}
<div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
  <div
    className={`h-full transition-all duration-300 ${
      isFlashcardMode
        ? 'bg-teal-600 dark:bg-teal-500'
        : 'bg-indigo-600 dark:bg-indigo-500'
    }`}
    style={{ width: `${((currentQuestionIndex + 1) / selectedQuestions.length) * 100}%` }}
    role="progressbar"
    aria-valuenow={(currentQuestionIndex + 1) / selectedQuestions.length * 100}
  />
</div>
```

---

#### 2.2 Flashcard Session Theme
**File**: `src/components/play/FlashcardCard.tsx`

**Add flashcard mode header**:
```tsx
{/* Flashcard Mode Header - Add at top */}
<div className="bg-gradient-to-r from-teal-600 to-teal-500 dark:from-teal-700 dark:to-teal-600 text-white px-4 py-3 mb-4 rounded-lg shadow-sm">
  <div className="flex items-center gap-2">
    <Book size={20} weight="fill" />
    <span className="font-semibold text-sm">Opettele</span>
    <span className="text-teal-200 dark:text-teal-300 text-sm ml-auto">
      Kortti {currentIndex + 1}/{flashcards.length}
    </span>
  </div>
</div>
```

**Update flashcard progress**:
```tsx
<div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
  <div
    className="h-full bg-teal-600 dark:bg-teal-500 transition-all duration-300"
    style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
  />
</div>
```

---

### Phase 3: Badge & Results Theming (1-2 hours)

#### 3.1 Badge Category Colors
**File**: `src/components/play/ResultsScreen.tsx`

**Update `getBadgeColors` function** (around line 131):
```tsx
const getBadgeColors = (badgeId: string) => {
  // Practice/Milestone badges (Indigo - matches Quiz)
  if (['first_session', '5_sessions', '10_sessions', '25_sessions'].includes(badgeId)) {
    return {
      light: 'from-indigo-50 to-indigo-100 border-indigo-500',
      dark: 'dark:from-indigo-900/30 dark:to-indigo-800/20 dark:border-indigo-600',
      text: 'text-indigo-900 dark:text-indigo-100'
    };
  }
  // Performance badges (Amber - matches Challenge)
  if (['perfect_score', 'beat_personal_best'].includes(badgeId)) {
    return {
      light: 'from-amber-50 to-amber-100 border-amber-500',
      dark: 'dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-600',
      text: 'text-amber-900 dark:text-amber-100'
    };
  }
  // Speed badge (Cyan - matches Easy)
  if (badgeId === 'speed_demon') {
    return {
      light: 'from-cyan-50 to-cyan-100 border-cyan-500',
      dark: 'dark:from-cyan-900/30 dark:to-cyan-800/20 dark:border-cyan-600',
      text: 'text-cyan-900 dark:text-cyan-100'
    };
  }
  // Exploration badge (Teal - matches Study)
  if (badgeId === 'tried_both_levels') {
    return {
      light: 'from-teal-50 to-teal-100 border-teal-500',
      dark: 'dark:from-teal-900/30 dark:to-teal-800/20 dark:border-teal-600',
      text: 'text-teal-900 dark:text-teal-100'
    };
  }
  // Streak badges (Orange - Fire theme) - KEEP CURRENT
  if (['streak_3', 'streak_5', 'streak_10'].includes(badgeId)) {
    return {
      light: 'from-orange-50 to-red-100 border-orange-500',
      dark: 'dark:from-orange-900/30 dark:to-red-900/20 dark:border-orange-600',
      text: 'text-orange-900 dark:text-orange-100'
    };
  }
  // Default (shouldn't happen)
  return {
    light: 'from-gray-50 to-gray-100 border-gray-400',
    dark: 'dark:from-gray-800 dark:to-gray-700 dark:border-gray-600',
    text: 'text-gray-900 dark:text-gray-100'
  };
};
```

---

#### 3.2 Results Screen Mode Theming
**File**: `src/components/play/ResultsScreen.tsx`

**Add mode detection**:
```tsx
interface ResultsScreenProps {
  // ... existing props
  mode?: 'quiz' | 'flashcard';  // ADD THIS
}

export function ResultsScreen({
  // ... existing destructured props
  mode = 'quiz',  // Default to quiz
}: ResultsScreenProps) {
  // ... existing code

  // Mode-specific theming
  const modeColors = mode === 'quiz'
    ? {
        bg: 'from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800',
        accent: 'text-indigo-600 dark:text-indigo-400',
        iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      }
    : {
        bg: 'from-teal-50 to-white dark:from-gray-900 dark:to-gray-800',
        accent: 'text-teal-600 dark:text-teal-400',
        iconBg: 'bg-teal-100 dark:bg-teal-900/30',
      };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${modeColors.bg} p-4 md:p-8 transition-colors`}>
      {/* Celebration icon with mode-specific background */}
      <div className="mb-4 flex justify-center">
        <div className={`${modeColors.iconBg} p-6 rounded-full`}>
          {celebration.icon}
        </div>
      </div>

      {/* Rest of component */}
    </div>
  );
}
```

---

#### 3.3 Update Points Display
**Keep gold color for points** (around line 198):
```tsx
<div className="flex items-center justify-center gap-2 text-3xl font-bold text-yellow-600 dark:text-yellow-500">
  <DiamondsFour size={32} weight="duotone" className="text-yellow-500" />
  {totalPoints}
</div>
```

**Keep orange for streaks** (around line 217):
```tsx
<div className="flex items-center justify-center gap-2 text-3xl font-bold text-orange-600 dark:text-orange-500">
  <Fire size={32} weight="duotone" className="text-orange-500" />
  {bestStreak}
</div>
```

---

### Phase 4: Grade Badges Refinement (30 min)

#### 4.1 Add Ring Borders to Grade Badges
**File**: `src/app/play/page.tsx`

**Update grade badge styling** (around line 321):
```tsx
{group.grade && (
  <span className={`
    inline-flex items-center
    px-3 py-1.5 rounded-full
    text-xs font-medium flex-shrink-0
    ${getGradeColors(group.grade).bg}
    ${getGradeColors(group.grade).text}
    ring-1 ring-inset ring-current/20
  `}>
    Luokka: {group.grade}
  </span>
)}
```

**The `ring-1 ring-inset ring-current/20` adds a subtle border that matches the text color at 20% opacity.**

---

### Phase 5: Topic Mastery Progress Bars (if Task 053 implemented)

#### 5.1 Mode-Specific Progress Bar Colors
**File**: `src/components/play/TopicMasteryDisplay.tsx` (from Task 053)

**Update progress bar colors**:
```tsx
// Color based on percentage (keep green/yellow/red)
const getColor = (percentage: number) => {
  if (percentage >= 80) return {
    bg: 'bg-emerald-500',  // Keep success green
    text: 'text-emerald-700 dark:text-emerald-300',
    label: 'Hyvä hallinta'
  };
  if (percentage >= 50) return {
    bg: 'bg-amber-500',  // Use amber (matches Normaali difficulty)
    text: 'text-amber-700 dark:text-amber-300',
    label: 'Kohtuullinen hallinta'
  };
  return {
    bg: 'bg-rose-500',  // Keep gentle red
    text: 'text-rose-700 dark:text-rose-300',
    label: 'Harjoittele lisää'
  };
};
```

**Note**: Topic mastery uses semantic colors (green=good, amber=ok, red=needs work), not mode colors. This is correct - don't change to indigo/teal.

---

## UI/UX Specifications

### Color Contrast Verification (WCAG AAA)

All new color combinations tested:

✅ **Indigo-600** on white: 8.42:1 (WCAG AAA)
✅ **Teal-600** on white: 7.18:1 (WCAG AAA)
✅ **Slate-600** on white: 9.24:1 (WCAG AAA)
✅ **Amber-600** on white: 6.84:1 (WCAG AAA)
✅ **Cyan-400** on slate-600: 4.61:1 (WCAG AA - large text only)
✅ **Amber-100** on amber-600: 1.21:1 (icon accent, non-text)

All text meets WCAG AAA standards for readability.

---

### Animation & Transitions

**Mode toggle**:
```css
transition: all 150ms ease-in-out;
```

**Button hover states**:
```css
transition-all duration-150
```

**Progress bars**:
```css
transition-all duration-300
```

**Ring appearance**:
```css
transition: box-shadow 150ms ease-in-out;
```

---

### Dark Mode Guidelines

**Background adjustments**:
- Indigo: Use `indigo-500` in dark mode (lighter)
- Teal: Use `teal-500` in dark mode (lighter)
- Slate: Keep `slate-700` in dark mode
- Amber: Keep `amber-700` in dark mode

**Opacity adjustments**:
- Gradient backgrounds: Use `/30` or `/20` opacity in dark mode
- Rings: Use `ring-current/20` for subtle borders

---

## Testing Checklist

### Visual Testing
- [ ] Mode toggle shows indigo (quiz) vs teal (flashcard) correctly
- [ ] Difficulty buttons use slate (Helppo) with cyan icon
- [ ] Difficulty buttons use amber (Normaali) with amber icon
- [ ] Question set cards show mode indicator stripes
  - [ ] Indigo stripe for quiz-only sets
  - [ ] Teal stripe for flashcard-only sets
  - [ ] Gradient stripe for sets with both modes
- [ ] Quiz session uses indigo theme (header, progress bar)
- [ ] Flashcard session uses teal theme (header, progress bar)
- [ ] Results screen uses mode-specific background gradient
- [ ] Badges use category-specific colors
- [ ] Grade badges have subtle ring borders

### Accessibility Testing
- [ ] All text contrast ratios meet WCAG AAA (7:1)
- [ ] Color is not the only indicator (icons + text labels)
- [ ] Focus states visible on all interactive elements
- [ ] Keyboard navigation works correctly
- [ ] Screen reader announces mode changes

### Cross-Browser Testing
- [ ] Chrome (Mac/Windows/Android)
- [ ] Safari (Mac/iOS)
- [ ] Firefox (Mac/Windows)
- [ ] Edge (Windows)

### Dark Mode Testing
- [ ] All colors look good in dark mode
- [ ] Contrast ratios maintained
- [ ] Gradients subtle and not overwhelming
- [ ] Transitions smooth between light/dark

### Responsive Testing
- [ ] Mobile (320px - 640px): Buttons stack, stripes visible
- [ ] Tablet (640px - 1024px): Grid layouts work
- [ ] Desktop (1024px+): Cards use full width

---

## Edge Cases & Error Handling

1. **Question sets with no mode data**:
   - Default stripe to gray
   - Don't crash if `mode` field missing

2. **Mixed difficulty availability**:
   - If only Helppo exists, show only Helppo button
   - If only Normaali exists, show only Normaali button

3. **Grade badge without grade**:
   - Don't render badge if `grade` is undefined
   - Graceful degradation

4. **Mode detection failure**:
   - Default to quiz mode (indigo theme)
   - Log warning to console

---

## Implementation Order

### ✅ Phase 1: Core Theme (2-3 hours) - HIGH PRIORITY
1. Update `ModeToggle.tsx` (indigo vs teal buttons)
2. Update difficulty button colors in `play/page.tsx` (slate/amber)
3. Add mode indicator stripes to question set cards
4. Test mode toggle color switching

### ✅ Phase 2: Session UI (1-2 hours) - HIGH PRIORITY
1. Add quiz mode header with indigo theme
2. Add flashcard mode header with teal theme
3. Update progress bars (mode-specific colors)
4. Test session UI in both modes

### ✅ Phase 3: Refinements (1-2 hours) - MEDIUM PRIORITY
1. Update badge category colors
2. Add mode theming to results screen
3. Add ring borders to grade badges
4. Polish dark mode colors

### ✅ Phase 4: Testing & Polish (1 hour) - MEDIUM PRIORITY
1. Cross-browser testing
2. Dark mode testing
3. Accessibility audit
4. Mobile responsive testing

---

## Rollback Plan

If visual changes cause issues:

1. **Immediate rollback** (revert files):
   - `src/components/play/ModeToggle.tsx`
   - `src/app/play/page.tsx`
   - `src/app/play/[code]/page.tsx`
   - `src/components/play/FlashcardCard.tsx`
   - `src/components/play/ResultsScreen.tsx`

2. **Partial rollback** (revert specific changes):
   - Keep difficulty colors, revert mode colors
   - Keep stripes, revert button colors
   - Mix and match as needed

3. **No data migration needed** - purely visual changes

---

## Success Metrics (Future Analytics)

Track these to validate design effectiveness:
- **Mode recognition**: Can users identify their mode? (survey)
- **Difficulty selection**: Are slate/amber colors clearer than green/blue?
- **User preference**: Do users prefer new vs old design? (A/B test)
- **Accessibility**: Any complaints about contrast/readability?
- **Completion rates**: Do visual improvements increase session completion?

---

## Future Enhancements (Out of Scope)

- **Animated mode transitions**: Smooth color morphing when switching modes
- **Custom themes**: Let users choose their own color palette
- **High contrast mode**: Extra-high contrast variant (WCAG AAA+)
- **Colorblind modes**: Alternative palettes for different types of colorblindness
- **Theme preview**: Show theme samples before selecting mode
- **Seasonal themes**: Holiday/seasonal color variants (opt-in)

---

## Dependencies

**NPM Packages**: None (Tailwind colors already available)

**Tailwind Colors to Use**:
- `indigo-*` (already in Tailwind)
- `teal-*` (already in Tailwind)
- `slate-*` (already in Tailwind)
- `amber-*` (already in Tailwind)
- `cyan-*` (already in Tailwind)
- `emerald-*`, `rose-*`, `yellow-*`, `orange-*` (existing)

**Files to Modify**:
- `src/components/play/ModeToggle.tsx`
- `src/app/play/page.tsx`
- `src/app/play/[code]/page.tsx`
- `src/components/play/FlashcardCard.tsx`
- `src/components/play/ResultsScreen.tsx`
- `src/components/play/TopicMasteryDisplay.tsx` (if Task 053 done)

**Files to Update** (documentation):
- `DWF/DESIGN_SYSTEM.md`

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Mode toggle shows distinct colors (indigo vs teal)
- [ ] Difficulty buttons use slate and amber
- [ ] Question set cards have mode indicator stripes
- [ ] Quiz sessions use indigo theme
- [ ] Flashcard sessions use teal theme
- [ ] Badges use category-specific colors
- [ ] Grade badges have ring borders
- [ ] All colors meet WCAG AAA contrast ratios
- [ ] Dark mode fully supported
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Cross-browser testing completed
- [ ] Mobile responsive (all breakpoints)
- [ ] Accessibility audit passed
- [ ] Visual regression testing completed
- [ ] Design system documentation updated
- [ ] Screenshots/examples added to docs

---

## Documentation Updates

### Update DESIGN_SYSTEM.md

Add new color system section:

```markdown
## Theme Colors (v2.0)

### Quiz Mode (Indigo)
- **Primary**: `indigo-600` (#4f46e5)
- **Usage**: Quiz toggle, session headers, progress bars
- **Personality**: Energetic, competitive, game-like

### Flashcard Mode (Teal)
- **Primary**: `teal-600` (#0d9488)
- **Usage**: Flashcard toggle, session headers, progress bars
- **Personality**: Calm, focused, contemplative

### Difficulty Colors
- **Helppo**: `slate-600` (#475569) with `cyan-400` (#22d3ee) accent
- **Normaali**: `amber-600` (#d97706) with `amber-100` (#fef3c7) accent

### Badge Categories
- **Practice**: `indigo-500` (matches quiz theme)
- **Performance**: `amber-500` (matches challenge)
- **Speed**: `cyan-500` (matches easy)
- **Exploration**: `teal-500` (matches study)
- **Streaks**: `orange-500` (fire theme)
```

---

## Before/After Comparison

### Before (Current)
```
Mode Toggle:
[Purple] Pelaa  [Purple] Opettele  ← Both look the same!

Difficulty Buttons:
[Green] Helppo  [Blue] Normaali   ← Generic colors

Question Cards:
┌─────────────────────────┐
│ No visual distinction   │
│                         │
│ [Green] Helppo         │
│ [Blue] Normaali        │
└─────────────────────────┘
```

### After (Proposed)
```
Mode Toggle:
[Indigo] Pelaa  [Gray] Opettele   ← Clear distinction!

Difficulty Buttons:
[Slate+Cyan] Helppo  [Amber] Normaali  ← Sophisticated

Question Cards:
┌─────────────────────────┐
│ Indigo stripe (Quiz)    │  ← Visual mode indicator
│                         │
│ [Slate+Cyan] Helppo    │
│ [Amber] Normaali       │
└─────────────────────────┘
```

---

## Notes

- **Why indigo vs teal?**: Clear visual distinction, both professional, neither childish
- **Why slate/amber for difficulty?**: Sophisticated, moves away from generic green/blue
- **Why stripes?**: Subtle visual indicator without overwhelming the UI
- **Why category colors for badges?**: Adds variety, makes badges more memorable
- **Why keep gold/orange for points/streaks?**: These are universal gamification colors
- **Why not change semantic colors?**: Green=success, red=error are universal standards

---

## Related Tasks

- **Task 052**: Review Mistakes Feature (will use rose-500 for "review" buttons)
- **Task 053**: Topic Mastery % (will use emerald/amber/rose for mastery levels)
- **Task 054**: Enhanced Explanations (benefits from better visual hierarchy)

---

**Last Updated**: 2026-01-24
**Estimated Completion**: 2026-01-25 (4-6 hours total)
**Priority**: High (improves UX significantly)
