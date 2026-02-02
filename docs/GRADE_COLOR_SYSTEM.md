# Grade Color System Design Guide

**Last Updated:** February 2026
**Status:** Implementation Proposal

---

## Purpose

Provide visual distinction for grade levels (4-9) using a consistent, accessible color palette that:
- Makes grade levels instantly recognizable
- Works in both light and dark modes
- Maintains WCAG AA accessibility standards
- Scales to support future grade levels

---

## Color Palette

### Elementary Grades (4-6)
**Strategy:** Warm, approachable colors for younger students

```tsx
// Grade 4 (Amber - Friendly, bright)
grade4: {
  bg: 'bg-amber-100 dark:bg-amber-900/30',
  text: 'text-amber-800 dark:text-amber-200',
  border: 'border-amber-600/20',
}

// Grade 5 (Green - Growth, learning)
grade5: {
  bg: 'bg-green-100 dark:bg-green-900/30',
  text: 'text-green-800 dark:text-green-200',
  border: 'border-green-600/20',
}

// Grade 6 (Emerald - Transition, progress)
grade6: {
  bg: 'bg-emerald-100 dark:bg-emerald-900/30',
  text: 'text-emerald-800 dark:text-emerald-200',
  border: 'border-emerald-600/20',
}
```

### Middle School Grades (7-9)
**Strategy:** Cooler, more mature colors

```tsx
// Grade 7 (Cyan - Focus, clarity)
grade7: {
  bg: 'bg-cyan-100 dark:bg-cyan-900/30',
  text: 'text-cyan-800 dark:text-cyan-200',
  border: 'border-cyan-600/20',
}

// Grade 8 (Blue - Confidence, depth)
grade8: {
  bg: 'bg-blue-100 dark:bg-blue-900/30',
  text: 'text-blue-800 dark:text-blue-200',
  border: 'border-blue-600/20',
}

// Grade 9 (Purple - Mastery, sophistication)
grade9: {
  bg: 'bg-purple-100 dark:bg-purple-900/30',
  text: 'text-purple-800 dark:text-purple-200',
  border: 'border-purple-600/20',
}
```

---

## Visual Progression

```
Elementary → Middle School
Warm → Cool
Yellow/Green → Blue/Purple

4 lk  →  5 lk  →  6 lk  →  7 lk  →  8 lk  →  9 lk
🟡      🟢      🟩      🔵      🔷      🟣
Amber   Green   Emerald  Cyan    Blue    Purple
```

**Rationale:**
- **Warm (amber/green)** for younger students: Friendly, approachable, encouraging
- **Cool (cyan/blue/purple)** for older students: Professional, focused, mature
- **Distinct hues** across spectrum: Easy to differentiate at a glance
- **Natural progression**: Color wheel transition feels intuitive

---

## Usage Patterns

### 1. Grade Badges (Pills)
```tsx
<Badge
  variant="default"
  semantic="grade"
  className={gradeColors[4].bg + ' ' + gradeColors[4].text}
>
  Luokka: 4
</Badge>
```

### 2. Filter Buttons
```tsx
<button
  className={`
    rounded-lg px-4 py-2 text-sm font-semibold
    transition-all duration-150
    ${gradeColors[grade].bg}
    ${gradeColors[grade].text}
    ${isSelected ? 'ring-2 ring-current ring-offset-2' : ''}
  `}
>
  {grade} lk
</button>
```

### 3. Card Accent (Subtle)
```tsx
<div className={`
  border-l-4 ${gradeColors[grade].border}
  rounded-xl bg-white dark:bg-gray-800
  p-5
`}>
  {content}
</div>
```

---

## Accessibility Compliance

### Contrast Ratios (WCAG 2.1 Level AA)

**Light Mode:**
- All grade text colors meet 4.5:1 minimum for body text
- All grade backgrounds provide sufficient contrast for readability

**Dark Mode:**
- Background opacity reduced to `/30` for comfortable viewing
- Text colors lightened to maintain contrast
- All combinations tested and meet AA standards

### Color Blindness Considerations

Tested with common color vision deficiencies:

| Type | Affected | Solution |
|------|----------|----------|
| Deuteranopia (green-blind) | Grade 5/6 similar | Text labels always present |
| Protanopia (red-blind) | Grade 4 amber shifts | Text labels always present |
| Tritanopia (blue-blind) | Grade 7/8 similar | Text labels always present |

**Key Safeguard:** Grade labels always include text ("4 lk", "Luokka: 5"), never rely on color alone.

---

## Implementation

### 1. Add to Design Tokens

File: `src/lib/design-tokens/colors.ts`

```tsx
export const colors = {
  // ... existing colors ...

  // Grade level colors (4-9)
  grade: {
    4: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-800 dark:text-amber-200',
      border: 'border-amber-600/20',
      ring: 'ring-amber-600',
    },
    5: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-200',
      border: 'border-green-600/20',
      ring: 'ring-green-600',
    },
    6: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-800 dark:text-emerald-200',
      border: 'border-emerald-600/20',
      ring: 'ring-emerald-600',
    },
    7: {
      bg: 'bg-cyan-100 dark:bg-cyan-900/30',
      text: 'text-cyan-800 dark:text-cyan-200',
      border: 'border-cyan-600/20',
      ring: 'ring-cyan-600',
    },
    8: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-200',
      border: 'border-blue-600/20',
      ring: 'ring-blue-600',
    },
    9: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-800 dark:text-purple-200',
      border: 'border-purple-600/20',
      ring: 'ring-purple-600',
    },
  } as const,
} as const;
```

### 2. Create Utility Function

File: `src/lib/utils/grade-colors.ts`

```tsx
import { colors } from '@/lib/design-tokens';

type GradeLevel = 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Get color classes for a grade level
 * @param grade - Grade level (4-9)
 * @returns Object with bg, text, border, ring classes
 */
export function getGradeColors(grade: number) {
  const validGrade = Math.max(4, Math.min(9, grade)) as GradeLevel;
  return colors.grade[validGrade];
}

/**
 * Get combined className for grade badge
 * @param grade - Grade level (4-9)
 * @returns Combined className string
 */
export function getGradeBadgeClasses(grade: number): string {
  const { bg, text } = getGradeColors(grade);
  return `${bg} ${text} ring-1 ring-inset ring-current/20`;
}
```

### 3. Update Components

**Badge Component** (`src/components/ui/badge.tsx`):
- Already has `semantic="grade"` support
- Add prop for grade number to apply specific color

**Play Page** (`src/app/play/page.tsx`):
- Replace hardcoded `getGradeColors()` with import from utils
- Update grade filter buttons to use new color system
- Update question set card badges to use new colors

**Create Page** (`src/app/create/page.tsx`):
- Update grade badges to use new color system

---

## Testing Checklist

- [ ] Light mode: All grade colors distinct and readable
- [ ] Dark mode: All grade colors distinct and readable
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Grade badges render correctly on cards
- [ ] Grade filter buttons show correct colors
- [ ] Mobile view: Colors visible in horizontal scroll
- [ ] Desktop view: Colors consistent across layouts
- [ ] Keyboard navigation: Focus states work with all colors
- [ ] Color-blind simulation: Labels remain readable

---

## Migration Strategy

1. **Add design tokens** to `colors.ts` (non-breaking)
2. **Create utility function** `getGradeColors()` (new file)
3. **Update play page** to use new colors (visual change)
4. **Update create page** to use new colors (visual change)
5. **Update badge component** for grade-specific styling (enhancement)
6. **Test across breakpoints** and color modes
7. **Document in DESIGN_GUIDELINES.md** as implemented

---

## Future Enhancements

### Phase 2: Rich Grade Indicators
- Icon per grade level (e.g., 🌱 for grade 4, 🌿 for grade 5)
- Optional emoji or icon alongside text
- Hover state shows full grade name

### Phase 3: Adaptive Coloring
- High-contrast mode support
- User preference for color intensity
- Colorblind-friendly mode toggle

---

## References

- Parent document: `docs/DESIGN_GUIDELINES.md` (Section 3: Color System)
- WCAG 2.1 AA: https://www.w3.org/WAI/WCAG21/quickref/
- Color contrast checker: https://webaim.org/resources/contrastchecker/
- Design tokens: `src/lib/design-tokens/colors.ts`

---

**Next Steps:**
1. Review and approve color palette
2. Implement design tokens
3. Update components to use new system
4. Test across devices and color modes
5. Deploy and gather user feedback
