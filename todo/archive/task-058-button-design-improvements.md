# Task 058: Button Design System Improvements

## Status
- **Status**: Pending
- **Created**: 2026-01-25
- **Priority**: P1 (High visual impact)
- **Estimated Effort**: 3 points (3-4 hours)

## Overview
Refine and polish all button designs across the browse/play page for a more cohesive, professional, and delightful user experience. Focus on grade filter buttons (currently plain), difficulty buttons (add depth), and establishing a consistent button design system with unified shadows, transitions, and hover states.

## Problem Statement
Current button designs are inconsistent:
- **Grade filter buttons**: Very plain (just black/gray backgrounds), lack visual interest
- **Difficulty buttons**: Good foundation but missing depth and polish
- **Review button**: Functional but could be gentler and more refined
- **No unified design system**: Inconsistent shadows, transitions, and hover states

## User Requirements
Based on screenshot analysis:
- ✅ **Grade filters need visual improvement** - Currently weakest element
- ✅ **Add subtle depth and shadows** - Make buttons feel tactile
- ✅ **Consistent hover/active states** - Predictable interactions
- ✅ **Better focus indicators** - Accessibility and keyboard navigation
- ✅ **Professional polish** - Cohesive design system

## Acceptance Criteria
- [ ] Difficulty button icons replaced (Smiley/Target → Circle/CirclesFour)
- [ ] Grade filter buttons have icons and better styling
- [ ] All buttons use consistent shadow system (sm, md, lg)
- [ ] Hover states are smooth and predictable (150ms transitions)
- [ ] Active states use scale-95 transform consistently
- [ ] Focus rings visible and accessible (2px ring with offset)
- [ ] Dark mode fully supported with adjusted shadows
- [ ] Mobile touch targets ≥44px (iOS HIG, Android Material)
- [ ] No breaking changes to existing functionality

---

## Design System: Button Variants

### 1. Primary Buttons (Quiz/Flashcard Mode)
**Usage**: Main action buttons (difficulty selection, flashcard entry)

**Specifications**:
```tsx
// Quiz Difficulty Buttons (Helppo, Normaali)
className={`
  ${colors.bg} ${colors.hover} ${colors.text}
  px-4 py-3 rounded-lg
  font-semibold text-sm
  shadow-md hover:shadow-lg active:shadow-sm
  active:scale-95
  transition-all duration-150
  flex items-center gap-1.5
  ring-offset-2 ring-offset-white dark:ring-offset-gray-900
  focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400
`}

// Flashcard Button (Opettele)
className="
  bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600
  text-white
  px-6 py-3 rounded-lg
  font-semibold text-sm
  shadow-md hover:shadow-lg active:shadow-sm
  active:scale-95
  transition-all duration-150
  flex items-center gap-2
  ring-offset-2 ring-offset-white dark:ring-offset-gray-900
  focus-visible:ring-2 focus-visible:ring-teal-500 dark:focus-visible:ring-teal-400
"
```

---

### 2. Secondary Buttons (Review Mistakes)
**Usage**: Important but not primary actions

**Specifications**:
```tsx
// Review Button (Gentler Rose instead of harsh Red)
className="
  bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700
  text-white
  px-4 py-3 rounded-lg
  font-semibold text-sm
  shadow-md hover:shadow-lg active:shadow-sm
  active:scale-95
  transition-all duration-150
  flex items-center gap-1.5
  ring-offset-2 ring-offset-white dark:ring-offset-gray-900
  focus-visible:ring-2 focus-visible:ring-rose-500 dark:focus-visible:ring-rose-400
"
```

---

### 3. Filter Buttons (Grade Selection)
**Usage**: Grade filters (Kaikki, Luokka: 4, Luokka: 6)

**Problem**: Currently very plain (black/gray only)

**Solution**: Add icons, better active states, subtle shadows

**Specifications**:

#### "Kaikki" Button
```tsx
<button
  onClick={() => setSelectedGrade(null)}
  className={`
    flex items-center gap-2
    px-4 py-2.5 rounded-lg
    text-sm font-semibold
    transition-all duration-150
    ${selectedGrade === null
      ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md ring-2 ring-indigo-400 dark:ring-indigo-300'
      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
    }
    ring-offset-2 ring-offset-white dark:ring-offset-gray-900
    focus-visible:ring-2 focus-visible:ring-indigo-500
    active:scale-95
  `}
>
  <ListNumbers size={16} weight={selectedGrade === null ? 'fill' : 'regular'} />
  Kaikki
</button>
```

#### "Luokka: X" Buttons
```tsx
{availableGrades.map((grade) => {
  const colors = getGradeColors(grade);
  const isActive = selectedGrade === grade;

  return (
    <button
      key={grade}
      onClick={() => setSelectedGrade(grade)}
      className={`
        flex items-center gap-2
        px-4 py-2.5 rounded-lg
        text-sm font-semibold
        transition-all duration-150
        ring-offset-2 ring-offset-white dark:ring-offset-gray-900
        focus-visible:ring-2 focus-visible:ring-indigo-500
        active:scale-95
        ${isActive
          ? `${colors.bg} ${colors.text} shadow-md ring-2 ring-current/40`
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
        }
      `}
    >
      <GraduationCap size={16} weight={isActive ? 'fill' : 'regular'} />
      Luokka: {grade}
    </button>
  );
})}
```

---

### 4. Shadow System (Consistent Depth)

**Three-tier shadow system**:

```tsx
// Small (default state)
shadow-sm
// Tailwind: 0 1px 2px 0 rgb(0 0 0 / 0.05)

// Medium (hover state)
shadow-md
// Tailwind: 0 4px 6px -1px rgb(0 0 0 / 0.1)

// Large (active/focus state)
shadow-lg
// Tailwind: 0 10px 15px -3px rgb(0 0 0 / 0.1)
```

**Dark mode adjustments**:
- Shadows are less visible in dark mode
- Use slightly stronger shadows: `dark:shadow-md` → `dark:shadow-lg`
- Or add subtle borders: `ring-1 ring-white/10`

---

### 5. Transition System (Consistent Timing)

**All interactive elements**:
```tsx
transition-all duration-150
// Covers: background, shadow, transform, border, ring
```

**Hover effects**:
- Background color change: `150ms`
- Shadow increase: `150ms`
- Border change: `150ms`

**Active effects** (instant feedback):
- Scale transform: `active:scale-95` (happens immediately, no delay)

---

## Implementation Plan

### Phase 1: Grade Filter Button Improvements (1.5 hours)

#### 1.1 Add Icons to Grade Filters
**File**: `src/app/play/page.tsx`

**Import new icons** (add to existing imports around line 12-33):
```tsx
import {
  // ... existing imports
  GraduationCap,  // ADD THIS
  ListNumbers,    // Already imported
} from '@phosphor-icons/react';
```

**Update "Kaikki" button** (around line 623-632):
```tsx
<button
  onClick={() => setSelectedGrade(null)}
  className={`
    flex items-center gap-2
    px-4 py-2.5 rounded-lg
    text-sm font-semibold
    transition-all duration-150
    ring-offset-2 ring-offset-white dark:ring-offset-gray-900
    focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400
    active:scale-95
    ${
      selectedGrade === null
        ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md ring-2 ring-indigo-400 dark:ring-indigo-300'
        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
    }
  `}
>
  <ListNumbers size={16} weight={selectedGrade === null ? 'fill' : 'regular'} />
  Kaikki
</button>
```

**Update "Luokka: X" buttons** (around line 633-649):
```tsx
{availableGrades.map((grade) => {
  const colors = getGradeColors(grade);
  const isActive = selectedGrade === grade;

  return (
    <button
      key={grade}
      onClick={() => setSelectedGrade(grade)}
      className={`
        flex items-center gap-2
        px-4 py-2.5 rounded-lg
        text-sm font-semibold
        transition-all duration-150
        ring-offset-2 ring-offset-white dark:ring-offset-gray-900
        focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400
        active:scale-95
        ${
          isActive
            ? `${colors.bg} ${colors.text} shadow-md ring-2 ring-current/40`
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
        }
      `}
    >
      <GraduationCap size={16} weight={isActive ? 'fill' : 'regular'} />
      Luokka: {grade}
    </button>
  );
})}
```

**Key improvements**:
- ✅ Icons (ListNumbers for "Kaikki", GraduationCap for grades)
- ✅ Active state uses indigo-600 (matches quiz theme)
- ✅ Inactive state uses white/gray with subtle border
- ✅ Shadow on active state only
- ✅ Ring on active state (ring-current/40 for subtle glow)
- ✅ Icon weight changes (fill when active, regular when inactive)
- ✅ Active scale transform
- ✅ Focus-visible ring for keyboard navigation

---

### Phase 2: Difficulty Button Refinements (1 hour)

#### 2.0 Replace Emoji-Style Icons with Professional Difficulty Indicators
**File**: `src/app/play/page.tsx`

**Problem**: Current icons (Smiley, Target) are from old emoji-based design

**Solution**: Use professional difficulty indicators that match the design system

**Update difficultyIcons constant** (around line 73-76):

**BEFORE** (old emoji design):
```tsx
const difficultyIcons: Record<string, ReactNode> = {
  helppo: <Smiley size={20} weight="fill" className="inline" />,
  normaali: <Target size={20} weight="duotone" className="inline" />,
};
```

**AFTER** (professional indicators):

**Option 1: Circle Complexity** (Recommended - Clean & Professional)
```tsx
const difficultyIcons: Record<string, ReactNode> = {
  helppo: <Circle size={20} weight="bold" className="inline" />,      // Single circle = simple
  normaali: <CirclesFour size={20} weight="bold" className="inline" />, // Multiple circles = complex
};
```

**Option 2: Signal Bars** (Familiar pattern like WiFi/cellular signal)
```tsx
const difficultyIcons: Record<string, ReactNode> = {
  helppo: <ChartBar size={20} weight="duotone" className="inline" />,    // Lower bars
  normaali: <ChartBarHorizontal size={20} weight="duotone" className="inline" />, // Higher bars
};
```

**Option 3: Star Rating** (Universally understood difficulty metaphor)
```tsx
const difficultyIcons: Record<string, ReactNode> = {
  helppo: <Star size={20} weight="bold" className="inline" />,         // 1 star = easy
  normaali: <Star size={20} weight="fill" className="inline" />,       // Filled star = harder
};
```

**Option 4: Trend/Slope** (Indicates difficulty progression)
```tsx
const difficultyIcons: Record<string, ReactNode> = {
  helppo: <TrendUp size={20} weight="bold" className="inline" />,      // Gentle slope
  normaali: <ChartLineUp size={20} weight="bold" className="inline" />, // Steeper climb
};
```

**Recommendation**: Use **Option 1 (Circle/CirclesFour)** because:
- ✅ Clean, minimal, professional
- ✅ Clear visual distinction (one vs many)
- ✅ Matches "content-focused" design philosophy
- ✅ No cognitive overhead (simpler = easier, complex = harder)
- ✅ Works well with duotone weight in both light/dark mode

**Import new icons** (add to existing imports around line 12-33):
```tsx
import {
  // ... existing imports
  Circle,        // ADD THIS
  CirclesFour,   // ADD THIS
} from '@phosphor-icons/react';
```

**Remove old imports** (if not used elsewhere):
```tsx
// REMOVE THESE if only used for difficulty buttons:
Smiley,
Target,
```

---

#### 2.1 Add Enhanced Shadows and Focus States
**File**: `src/app/play/page.tsx`

**Update difficulty button rendering** (around line 312-322):
```tsx
{availableDifficulties.map((difficulty) => {
  const set = group.sets.find((s) => s.difficulty === difficulty && s.mode === 'quiz');
  const colors = difficultyColors[difficulty];
  const icon = difficultyIcons[difficulty];

  return (
    <button
      key={difficulty}
      onClick={() => set && router.push(`/play/${set.code}?mode=${studyMode}`)}
      className={`
        ${colors.bg} ${colors.hover} ${colors.text}
        px-4 py-3 rounded-lg
        font-semibold text-sm
        shadow-md hover:shadow-lg active:shadow-sm
        active:scale-95
        transition-all duration-150
        flex items-center gap-1.5
        ring-offset-2 ring-offset-white dark:ring-offset-gray-900
        focus-visible:ring-2 focus-visible:ring-offset-2
        ${difficulty === 'helppo'
          ? 'focus-visible:ring-cyan-400 dark:focus-visible:ring-cyan-300'
          : 'focus-visible:ring-amber-400 dark:focus-visible:ring-amber-300'
        }
      `}
      aria-label={`${difficultyLabels[difficulty]} vaikeustaso`}
    >
      <span className={colors.icon}>{icon}</span>
      {difficultyLabels[difficulty]}
    </button>
  );
})}
```

**Changes**:
- ✅ Replaced emoji-style icons (Smiley, Target) with professional indicators (Circle, CirclesFour)
- ✅ Enhanced shadow progression: `shadow-md` → `hover:shadow-lg` → `active:shadow-sm`
- ✅ Focus-visible ring with offset
- ✅ Difficulty-specific focus ring colors (cyan for Helppo, amber for Normaali)
- ✅ Consistent transition timing

---

#### 2.2 Update Flashcard Button
**File**: `src/app/play/page.tsx`

**Update "Opettele" button** (around line 328-340):
```tsx
<button
  onClick={() => {
    const flashcardSet = group.sets.find((s) => s.mode === 'flashcard');
    if (flashcardSet) {
      router.push(`/play/${flashcardSet.code}?mode=opettele`);
    }
  }}
  className="
    bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600
    text-white
    px-6 py-3 rounded-lg
    font-semibold text-sm
    shadow-md hover:shadow-lg active:shadow-sm
    active:scale-95
    transition-all duration-150
    flex items-center gap-2
    ring-offset-2 ring-offset-white dark:ring-offset-gray-900
    focus-visible:ring-2 focus-visible:ring-teal-400 dark:focus-visible:ring-teal-300
  "
  aria-label="Opettele korttien avulla"
>
  <Book size={20} weight="duotone" />
  Opettele
</button>
```

**Changes**:
- ✅ Enhanced shadow progression
- ✅ Focus-visible ring (teal color)
- ✅ Consistent transition timing

---

### Phase 3: Review Button Refinements (30 minutes)

#### 3.1 Soften Red to Rose
**File**: `src/app/play/page.tsx`

**Update review button** (around line 345-354):
```tsx
{studyMode === 'pelaa' && reviewCandidate && (
  <button
    onClick={() => router.push(`/play/${reviewCandidate.set.code}?mode=review`)}
    className="
      bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700
      text-white
      px-4 py-3 rounded-lg
      font-semibold text-sm
      shadow-md hover:shadow-lg active:shadow-sm
      active:scale-95
      transition-all duration-150
      flex items-center gap-1.5
      ring-offset-2 ring-offset-white dark:ring-offset-gray-900
      focus-visible:ring-2 focus-visible:ring-rose-400 dark:focus-visible:ring-rose-300
    "
    aria-label="Kertaa virheet"
  >
    <ArrowCounterClockwise size={20} weight="duotone" className="inline" />
    Kertaa virheet ({reviewCandidate.count})
  </button>
)}
```

**Changes**:
- ✅ Changed from `red-500` to `rose-500` (gentler, less alarming)
- ✅ Enhanced shadow progression
- ✅ Focus-visible ring (rose color)
- ✅ Icon weight changed to `duotone` (consistent with other buttons)
- ✅ Consistent transition timing

---

### Phase 4: Polish & Dark Mode (1 hour)

#### 4.1 Dark Mode Shadow Enhancements

**Add dark mode shadow utilities** to buttons:

For primary buttons (difficulty, flashcard):
```tsx
className="
  shadow-md hover:shadow-lg active:shadow-sm
  dark:shadow-lg dark:hover:shadow-xl dark:active:shadow-md
"
```

For filter buttons (active state):
```tsx
className="
  shadow-md
  dark:shadow-lg dark:ring-1 dark:ring-white/10
"
```

**Why?** Dark mode shadows are less visible, so we:
- Increase shadow size by one level
- Add subtle white ring for definition

---

#### 4.2 Touch Target Compliance

**Verify all buttons meet minimum touch target**:
- iOS Human Interface Guidelines: ≥44px
- Android Material Design: ≥48px
- Our target: ≥44px

**Current button heights**:
- Difficulty buttons: `py-3` (12px padding) + text (≈16px) + border (2px) = **~40px** ❌
- Grade filters: `py-2.5` (10px padding) + text (≈14px) + border (2px) = **~38px** ❌

**Fix**: Increase vertical padding:

**Difficulty/Flashcard/Review buttons**:
```tsx
py-3  →  py-3.5
// New height: ~44px ✅
```

**Grade filter buttons**:
```tsx
py-2.5  →  py-3
// New height: ~42px ✅ (acceptable for secondary actions)
```

---

## UI/UX Specifications

### Button Size Guidelines

| Button Type | Padding (X) | Padding (Y) | Font Size | Height | Use Case |
|-------------|-------------|-------------|-----------|--------|----------|
| Primary (Difficulty) | `px-4` (16px) | `py-3.5` (14px) | `text-sm` | ~44px | Main actions |
| Secondary (Review) | `px-4` (16px) | `py-3.5` (14px) | `text-sm` | ~44px | Important actions |
| Filter (Grade) | `px-4` (16px) | `py-3` (12px) | `text-sm` | ~42px | Filter controls |
| Tertiary (Text) | `px-3` (12px) | `py-2` (8px) | `text-sm` | ~34px | Low priority |

---

### Color Palette (Button-Specific)

**Primary Actions**:
- Helppo: `slate-600` → `slate-700` (dark gray)
- Normaali: `amber-600` → `amber-700` (warm orange)
- Flashcard: `teal-600` → `teal-700` (calm teal)

**Secondary Actions**:
- Review: `rose-500` → `rose-600` (gentle red, not alarming)

**Filter Actions**:
- Active (Kaikki): `indigo-600` (matches quiz theme)
- Active (Grade): Grade-specific colors (amber, emerald, etc.)
- Inactive: `white` with `border-gray-300` (subtle, non-intrusive)

---

### Accessibility Specifications

**Focus Indicators** (WCAG 2.1 SC 2.4.7):
```tsx
focus-visible:ring-2
focus-visible:ring-offset-2
focus-visible:ring-{color}-500
```

**Minimum touch targets** (WCAG 2.1 SC 2.5.5):
- All interactive elements: ≥44px height
- Adequate spacing: ≥8px gap between buttons

**Color contrast** (WCAG AAA 7:1):
- ✅ White text on slate-600: 9.24:1
- ✅ White text on amber-600: 6.84:1
- ✅ White text on teal-600: 7.18:1
- ✅ White text on rose-500: 6.52:1
- ✅ White text on indigo-600: 8.42:1

**Keyboard navigation**:
- All buttons focusable via Tab
- Focus-visible ring appears only on keyboard focus (not mouse click)
- Enter/Space to activate

---

## Testing Checklist

### Visual Testing
- [ ] Difficulty buttons show new professional icons (Circle for Helppo, CirclesFour for Normaali)
- [ ] Old emoji-style icons (Smiley, Target) are completely removed
- [ ] Grade filter buttons show icons (ListNumbers, GraduationCap)
- [ ] "Kaikki" uses indigo when active, white when inactive
- [ ] "Luokka: X" uses grade colors when active, white when inactive
- [ ] Difficulty buttons (Helppo, Normaali) have enhanced shadows
- [ ] Flashcard button (Opettele) has enhanced shadows
- [ ] Review button uses rose (not red) and has shadows
- [ ] All buttons have smooth hover transitions (150ms)
- [ ] All buttons scale down on active state (scale-95)

### Accessibility Testing
- [ ] All buttons ≥44px height (iOS HIG compliant)
- [ ] Focus rings visible on keyboard navigation
- [ ] Focus rings NOT visible on mouse click
- [ ] Tab order logical (top to bottom, left to right)
- [ ] Enter and Space keys activate buttons
- [ ] ARIA labels present where needed
- [ ] Color contrast meets WCAG AAA (7:1)
- [ ] Screen reader announces button labels correctly

### Cross-Browser Testing
- [ ] Chrome (Mac/Windows/Android)
- [ ] Safari (Mac/iOS)
- [ ] Firefox (Mac/Windows)
- [ ] Edge (Windows)

### Dark Mode Testing
- [ ] Grade filters visible in dark mode
- [ ] Shadows visible in dark mode (increased by one level)
- [ ] Focus rings visible in dark mode
- [ ] Border colors appropriate in dark mode
- [ ] Inactive button borders visible but subtle

### Responsive Testing
- [ ] Mobile (320px - 640px): Buttons stack, touch targets ≥44px
- [ ] Tablet (640px - 1024px): Buttons flow wrap correctly
- [ ] Desktop (1024px+): Buttons display inline

### Interaction Testing
- [ ] Click/tap activates button
- [ ] Hover shows shadow increase
- [ ] Active shows scale-95 transform
- [ ] Focus shows ring (keyboard only)
- [ ] Disabled state (if applicable) shows reduced opacity
- [ ] Loading state (if applicable) shows spinner

---

## Edge Cases & Error Handling

1. **No grades available**:
   - Don't render grade filter section
   - Graceful degradation

2. **Only one grade available**:
   - Still show "Kaikki" and one grade button
   - User can toggle between them

3. **Long grade numbers** (9, 10, 11):
   - Text should not wrap
   - Adequate padding maintained

4. **Many difficulty buttons**:
   - Buttons wrap to next line if needed
   - Maintain gap-2 spacing

5. **Touch device hover states**:
   - Hover states skip on touch devices (handled by Tailwind)
   - Active states still work

---

## Implementation Order

### ✅ Phase 1: Grade Filter Improvements (1.5 hours) - HIGH PRIORITY
1. Add GraduationCap icon import
2. Update "Kaikki" button with icon and new styling
3. Update "Luokka: X" buttons with icons and new styling
4. Test active/inactive states
5. Test dark mode

### ✅ Phase 2: Difficulty Button Refinements (1 hour) - HIGH PRIORITY
1. Replace emoji-style icons (Smiley, Target) with professional indicators (Circle, CirclesFour)
2. Add enhanced shadow progression
3. Add focus-visible rings
4. Adjust vertical padding (py-3 → py-3.5)
5. Test hover/active/focus states with new icons

### ✅ Phase 3: Review Button Refinements (30 minutes) - MEDIUM PRIORITY
1. Change red-500 to rose-500
2. Change icon weight to duotone
3. Add enhanced shadows and focus ring
4. Adjust vertical padding

### ✅ Phase 4: Dark Mode Polish (1 hour) - MEDIUM PRIORITY
1. Test all buttons in dark mode
2. Adjust shadow levels
3. Add subtle white rings where needed
4. Final cross-browser testing

---

## Rollback Plan

If button changes cause issues:

1. **Immediate rollback** (revert file):
   - `src/app/play/page.tsx` (only button sections)
   - Keep other changes intact

2. **Partial rollback** (revert specific changes):
   - Keep grade filter icons, revert colors
   - Keep shadows, revert focus rings
   - Mix and match as needed

3. **No data migration needed** - purely visual changes

---

## Success Metrics

Track these to validate design effectiveness:
- **Visual hierarchy**: Are grade filters more discoverable?
- **User preference**: Do users prefer new vs old buttons? (survey)
- **Interaction rate**: Are filters used more after redesign?
- **Accessibility**: Any complaints about contrast/focus indicators?
- **Performance**: No layout shift or reflow issues?

---

## Future Enhancements (Out of Scope)

- **Button loading states**: Spinner animation when navigating
- **Button disabled states**: Visual indication for unavailable actions
- **Button tooltips**: Hover tooltips explaining each difficulty level
- **Animated transitions**: Smooth color morphing on hover
- **Custom button shapes**: Rounded-full variants for pill-shaped buttons
- **Icon-only buttons**: For compact layouts on small screens

---

## Dependencies

**NPM Packages**: None (Tailwind + Phosphor Icons already installed)

**New Icons**:
- `GraduationCap` (for grade filter buttons)
- `Circle` (for Helppo difficulty - replaces Smiley)
- `CirclesFour` (for Normaali difficulty - replaces Target)

**Icons to Remove** (if not used elsewhere):
- `Smiley` (old emoji design)
- `Target` (old emoji design)

**Files to Modify**:
- `src/app/play/page.tsx` (all button implementations)

**Files to Update** (documentation):
- `DWF/DESIGN_SYSTEM.md` (add button design system section)

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Difficulty icons replaced with professional indicators (Circle/CirclesFour)
- [ ] Grade filter buttons have icons and refined styling
- [ ] All buttons use consistent shadow system
- [ ] All buttons have 150ms transitions
- [ ] All buttons use active:scale-95 transform
- [ ] All buttons have focus-visible rings
- [ ] All buttons meet ≥44px touch target
- [ ] Dark mode fully supported with enhanced shadows
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Cross-browser testing completed
- [ ] Mobile responsive (all breakpoints)
- [ ] Accessibility audit passed (WCAG AAA)
- [ ] Visual regression testing completed
- [ ] Design system documentation updated

---

## Before/After Comparison

### Before (Current)

**Grade Filters**:
```
[Black] Kaikki  [Gray] Luokka: 4  [Gray] Luokka: 6
← Plain, no visual interest
```

**Difficulty Buttons**:
```
[Slate] 😊 Helppo  [Amber] 🎯 Normaali
← Emoji-style icons, functional but flat
```

**Review Button**:
```
[Red] Kertaa virheet (2)
← Too harsh/alarming
```

### After (Proposed)

**Grade Filters**:
```
[Indigo + Icon] 📊 Kaikki  [White + Icon] 🎓 Luokka: 4  [White + Icon] 🎓 Luokka: 6
← Icons, better contrast, active state indication
```

**Difficulty Buttons**:
```
[Slate + Shadow] ○ Helppo  [Amber + Shadow] ◉ Normaali
← Professional icons (Circle/CirclesFour), depth, tactile, polished
```

**Review Button**:
```
[Rose + Shadow] ↺ Kertaa virheet (2)
← Gentler, refined
```

---

## Notes

- **Why replace Smiley/Target icons?**: Old emoji-based design lacks professionalism; Circle/CirclesFour are cleaner, minimal, and match the content-focused design philosophy
- **Why Circle vs CirclesFour?**: Clear visual metaphor (simple = easy, complex = harder) without cognitive overhead
- **Why icons for grade filters?**: Improves scannability and visual interest
- **Why indigo for "Kaikki"?**: Matches quiz theme, indicates "all modes"
- **Why rose instead of red?**: Red feels like error/danger; rose is gentler
- **Why shadow progression?**: Provides tactile feedback (button appears to move)
- **Why focus-visible?**: Only shows focus ring on keyboard nav, not mouse click
- **Why scale-95 on active?**: Provides instant feedback that button was clicked

---

## Related Tasks

- **Task 055**: Design System Refresh (established dual-color theme)
- **Task 056**: Common UX Improvements (where buttons will be used)
- **Task 057**: Mode-Specific UX Improvements (in-session button designs)

---

**Last Updated**: 2026-01-25
**Estimated Completion**: 2026-01-25 (3-4 hours total)
**Priority**: High (improves visual hierarchy and UX)
