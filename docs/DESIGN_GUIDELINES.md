# Design Guidelines

**Last Updated:** February 2026
**Status:** Standardized after UX/UI audit

This document defines the design system for Koekertaaja, ensuring visual consistency and polished user experience across all pages and components.

---

## Design Philosophy

**Crafted Minimalism with Personality**

Koekertaaja is an educational tool for Finnish students (grades 4-9), requiring:
- **Clarity:** Information-forward design that doesn't distract from learning
- **Approachability:** Warm, friendly interface that reduces test anxiety
- **Consistency:** Predictable patterns that build user confidence
- **Mobile-first:** Optimized for phones and tablets (primary usage context)

**Inspiration:** Notion (warmth), Linear (precision), Duolingo (encouragement)

---

## 1. Border Radius

**System:** Follow 4px grid with clear semantic meaning

```tsx
// Cards & Containers
rounded-xl: '12px'  // Standard cards, dialogs, major containers

// Interactive Elements
rounded-lg: '8px'   // Buttons, inputs, filters, tabs

// Small Components
rounded-md: '4px'   // Small UI elements, nested items
rounded-full: '9999px'  // Pills, badges, avatars

// Never use
rounded-2xl: // ❌ Too round, reserve for special hero sections only
rounded-sm: // ❌ Too subtle, doesn't provide enough visual softness
```

**Usage:**
- Question set cards: `rounded-xl`
- Difficulty buttons: `rounded-lg`
- Grade filter chips: `rounded-lg`
- Modal dialogs: `rounded-xl`
- Search inputs: `rounded-lg`
- Badge/pill elements: `rounded-full`

**Why:**
- `rounded-xl` creates friendly, approachable cards without being toy-like
- `rounded-lg` provides enough roundness for touch-friendly buttons
- Consistency builds visual rhythm and reduces cognitive load

---

## 2. Typography Scale

**Hierarchy:** Six levels from display to caption

```tsx
// Display (Hero sections, celebration screens)
display: 'text-3xl md:text-4xl font-bold tracking-tight'
// Use: Results celebration, major achievements

// Heading 1 (Page titles)
h1: 'text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100'
// Use: Browse, Create, Play page headers

// Heading 2 (Section headers, modal titles)
h2: 'text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100'
// Use: Tab content sections, dialog titles

// Heading 3 (Card titles, subsections)
h3: 'text-lg font-semibold text-gray-900 dark:text-gray-100'
// Use: Question set names, metric labels

// Heading 4 (Small headers, labels)
h4: 'text-base font-semibold text-gray-900 dark:text-gray-100'
// Use: Form labels, tab labels

// Body (Default content)
body: 'text-sm md:text-base text-gray-700 dark:text-gray-300'
// Use: Question text, descriptions, explanations

// Body Small (Secondary info)
bodySmall: 'text-sm text-gray-600 dark:text-gray-400'
// Use: Metadata, helper text

// Caption (Hints, timestamps)
caption: 'text-xs text-gray-500 dark:text-gray-400'
// Use: Timestamps, small hints, tertiary info
```

**Font Weights:**
- `font-bold` (700): Headlines, page titles
- `font-semibold` (600): Section headers, card titles
- `font-medium` (500): Emphasized body text, labels
- `font-normal` (400): Body text

**Responsive Scaling:**
- Desktop: Larger sizes for comfortable reading distance
- Mobile: Slightly smaller to maximize content density
- Use `text-sm md:text-base` pattern for body text
- Use `text-2xl md:text-3xl` for h1 headlines

---

## 3. Color System

**Foundation:** Warm neutrals for approachability

```tsx
// Light mode
background: 'white'
surface: 'gray-50'
border: 'gray-200'
text-primary: 'gray-900'
text-secondary: 'gray-600'
text-tertiary: 'gray-500'

// Dark mode
background: 'gray-900'
surface: 'gray-800'
border: 'gray-700'
text-primary: 'gray-100'
text-secondary: 'gray-400'
text-tertiary: 'gray-500'
```

**Semantic Colors:** Mode-specific with clear meaning

```tsx
// Quiz Mode (Indigo - Trust, Focus)
quiz-primary: 'indigo-600 / indigo-500 dark'
quiz-light: 'indigo-50 / indigo-900/20 dark'

// Study/Flashcard Mode (Teal - Growth, Learning)
study-primary: 'teal-600 / teal-500 dark'
study-light: 'teal-50 / teal-900/20 dark'

// Review/Mistakes (Rose - Attention, Correction)
review-primary: 'rose-600 / rose-500 dark'
review-light: 'rose-50 / rose-900/20 dark'

// Success (Green - Achievement)
success: 'green-600 / green-500 dark'
success-light: 'green-50 / green-900/20 dark'

// Warning (Amber - Caution)
warning: 'amber-600 / amber-500 dark'
warning-light: 'amber-50 / amber-900/20 dark'

// Error (Red - Alert)
error: 'red-600 / red-500 dark'
error-light: 'red-50 / red-900/20 dark'
```

**Difficulty Colors:** Visual distinction for skill levels

```tsx
helppo: {
  bg: 'from-slate-600 to-slate-700',
  icon: 'cyan-400',
  badge: 'cyan-100 / cyan-900/30 dark'
}

normaali: {
  bg: 'from-amber-500 to-amber-600',
  icon: 'amber-100',
  badge: 'amber-100 / amber-900/30 dark'
}
```

**Grade Colors:** ✅ **IMPLEMENTED** - Distinct per grade level

Centralized grade color system providing visual distinction for grades 4-9. Colors progress from warm (elementary) to cool (middle school) tones.

```tsx
// Elementary grades (warm, approachable)
grade-4: 'amber-100 / amber-900/30 dark'   // 🟡 Friendly, bright
grade-5: 'green-100 / green-900/30 dark'   // 🟢 Growth, learning
grade-6: 'emerald-100 / emerald-900/30 dark' // 🟩 Transition, progress

// Middle school grades (cool, mature)
grade-7: 'cyan-100 / cyan-900/30 dark'     // 🔵 Focus, clarity
grade-8: 'blue-100 / blue-900/30 dark'     // 🔷 Confidence, depth
grade-9: 'purple-100 / purple-900/30 dark' // 🟣 Mastery, sophistication
```

**Usage:**
```tsx
import { getGradeColors, getGradeBadgeClasses } from '@/lib/utils/grade-colors';

// Badge
<Badge className={getGradeBadgeClasses(4)}>Luokka: 4</Badge>

// Manual composition
const { bg, text, border, ring } = getGradeColors(5);
```

**Design tokens:** `colors.grade[4-9]` in `src/lib/design-tokens/colors.ts`

**Color Usage Rules:**
- Use color for **meaning only** (mode, status, grade)
- Gray builds structure, color communicates
- Avoid decorative color (every color should have purpose)
- Maintain 4.5:1 contrast for body text (WCAG AA)
- Maintain 3:1 contrast for large text and UI elements

---

## 4. Spacing Scale

**System:** 4px grid (Tailwind's space scale)

```tsx
// Spacing tokens
space-1: 4px   // gap-1  - Micro (icon-text gaps)
space-2: 8px   // gap-2  - Tight (inline chips, button icons)
space-3: 12px  // gap-3  - Standard (card children, form groups)
space-4: 16px  // gap-4  - Comfortable (sections)
space-5: 20px  // gap-5  - (rarely used)
space-6: 24px  // gap-6  - Generous (major sections)
space-8: 32px  // gap-8  - Large (page sections)

// Padding scale
p-4: 16px  // Compact cards, list items
p-5: 20px  // Standard cards
p-6: 24px  // Large containers, modals
```

**Container Padding:**
```tsx
// Compact (list items, metric cards)
compact: 'p-4'

// Standard (question cards, content cards)
standard: 'p-5'

// Large (modals, dialogs, major sections)
large: 'p-6'

// Page containers (responsive)
pageX: 'px-4 md:px-6'
pageY: 'py-6 md:py-12'
```

**Gap Spacing:**
```tsx
// Tight (icon-text, inline elements)
tight: 'gap-2'

// Standard (card internal elements)
standard: 'gap-3'

// Generous (section spacing)
generous: 'gap-4'

// Large (major sections)
large: 'gap-6'
```

**Vertical Rhythm:**
```tsx
// Form fields
'space-y-6'  // Between major form sections

// Card children
'space-y-4'  // Between card content blocks

// List items
'space-y-2'  // Between list entries

// Inline elements
'space-x-2'  // Between inline chips/badges
```

**When to Use Responsive Padding:**
✅ **Use responsive:**
- Page containers: `px-4 md:px-6`
- Very large content: `p-5 md:p-6`
- Hero sections: `p-6 md:p-8`

❌ **Don't use responsive:**
- Small cards: Always `p-4` or `p-5`
- Buttons: Always `px-4 py-3`
- List items: Always `p-4`
- Metric cards: Always `p-4` or `p-5`

---

## 5. Shadow & Elevation

**Strategy:** Hover-based for clean, flat aesthetic

```tsx
// Base state
none: ''  // Default for cards, inputs, containers

// Interactive (hover-triggered)
card: 'hover:shadow-md transition-shadow duration-150'
// Use: Question cards, clickable items

// Elevated (always visible)
elevated: 'shadow-sm'
// Use: Frosted glass sections, sticky elements

// Floating (sticky elements)
sticky: 'shadow-lg'
// Use: Sticky action bar, floating buttons

// Modal (strong elevation)
modal: 'shadow-xl'
dialog: 'shadow-2xl'
// Use: Dialogs, overlays, critical modals
```

**Button Shadows:**
```tsx
// Primary gradient buttons
primary: 'shadow-md hover:shadow-lg active:shadow-sm transition-shadow duration-150'

// Secondary/outline buttons
secondary: ''  // No shadow (border provides definition)

// Ghost buttons
ghost: ''  // No shadow
```

**Shadow Values:**
```tsx
shadow-sm:   '0 1px 2px rgba(0,0,0,0.05)'
shadow-md:   '0 4px 6px -1px rgba(0,0,0,0.1)'
shadow-lg:   '0 10px 15px -3px rgba(0,0,0,0.1)'
shadow-xl:   '0 20px 25px -5px rgba(0,0,0,0.1)'
shadow-2xl:  '0 25px 50px -12px rgba(0,0,0,0.25)'
```

**Dark Mode Shadows:**
- Shadows are less visible in dark mode
- Rely more on borders for definition
- Use `dark:border-gray-700` consistently
- Frosted glass sections use `dark:border-gray-800`

---

## 6. Button System

**Variants:** Clear hierarchy with mode-specific styling

### Primary Actions
```tsx
// Quiz Mode Primary
className="
  flex min-h-11 items-center justify-center gap-2
  rounded-lg px-4 py-3 text-sm font-semibold
  bg-gradient-to-r from-indigo-600 to-indigo-500
  hover:from-indigo-700 hover:to-indigo-600
  text-white shadow-md hover:shadow-lg
  active:scale-95 active:shadow-sm
  transition-all duration-150
  focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-indigo-500 focus-visible:ring-offset-2
"

// Study Mode Primary
className="
  flex min-h-11 items-center justify-center gap-2
  rounded-lg px-4 py-3 text-sm font-semibold
  bg-gradient-to-r from-teal-600 to-teal-500
  hover:from-teal-700 hover:to-teal-600
  text-white shadow-md hover:shadow-lg
  active:scale-95 active:shadow-sm
  transition-all duration-150
"

// Review Mode Primary
className="
  flex min-h-11 items-center justify-center gap-2
  rounded-lg px-4 py-3 text-sm font-semibold
  bg-gradient-to-r from-rose-600 to-rose-500
  hover:from-rose-700 hover:to-rose-600
  text-white shadow-md hover:shadow-lg
  active:scale-95 active:shadow-sm
  transition-all duration-150
"
```

### Secondary Actions
```tsx
className="
  flex min-h-11 items-center justify-center gap-2
  rounded-lg px-4 py-3 text-sm font-semibold
  border border-gray-300 bg-white text-gray-700
  hover:bg-gray-50 hover:border-gray-400
  dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300
  dark:hover:bg-gray-700 dark:hover:border-gray-600
  active:scale-95
  transition-all duration-150
"
```

### Ghost/Minimal
```tsx
className="
  flex min-h-11 items-center justify-center gap-2
  rounded-lg px-4 py-3 text-sm font-semibold
  text-gray-600 hover:text-gray-900
  hover:bg-gray-100
  dark:text-gray-400 dark:hover:text-gray-100
  dark:hover:bg-gray-800
  transition-colors duration-150
"
```

### Destructive
```tsx
className="
  flex min-h-11 items-center justify-center gap-2
  rounded-lg px-4 py-3 text-sm font-semibold
  bg-red-600 hover:bg-red-700 text-white
  active:scale-95
  transition-all duration-150
"
```

**Button Rules:**
- ✅ Always use `min-h-11` (44px minimum touch target)
- ✅ Always use `rounded-lg` border radius
- ✅ Always include `active:scale-95` for tactile feedback
- ✅ Primary buttons get gradients and shadows
- ✅ Secondary buttons get borders, no shadows
- ✅ All transitions are 150ms
- ❌ Never use `rounded-xl` on buttons
- ❌ Never mix solid + gradient on same button type

---

## 7. Card System

**Variants:** Standard, Compact, Elevated, Frosted

### Standard Interactive Card
```tsx
// Question set cards, clickable content
className="
  rounded-xl
  border border-gray-200 dark:border-gray-700
  bg-white dark:bg-gray-800
  p-5
  hover:shadow-md
  transition-shadow duration-150
"
```

### Compact Card
```tsx
// List items, small content blocks
className="
  rounded-xl
  border border-gray-200 dark:border-gray-700
  bg-white dark:bg-gray-800
  p-4
  hover:shadow-md
  transition-shadow duration-150
"
```

### Elevated Static Card
```tsx
// Non-interactive but visually important
className="
  rounded-xl
  border border-gray-200 dark:border-gray-700
  bg-white dark:bg-gray-800
  p-5
  shadow-sm
"
```

### Frosted Glass Card
```tsx
// Results page, special hero sections
className="
  rounded-xl
  border border-white/60 dark:border-gray-800
  bg-white/80 dark:bg-gray-900/70
  backdrop-blur-sm
  p-5 md:p-6
  shadow-sm
"
```

**Card Rules:**
- ✅ Always use `rounded-xl` (12px)
- ✅ Interactive cards use `hover:shadow-md`
- ✅ Standard cards use `p-5`, compact use `p-4`
- ✅ Dark mode borders: `dark:border-gray-700` (standard) or `dark:border-gray-800` (frosted)
- ✅ Always include `transition-shadow duration-150`
- ❌ Don't mix `rounded-2xl` (too round)
- ❌ Don't use permanent shadows on interactive cards
- ❌ Don't use responsive padding on small cards

---

## 8. Icons

**Library:** Phosphor Icons (`@phosphor-icons/react`)

**Sizing Scale:**
```tsx
xs: 12px  // Inline with text
sm: 14px  // Small UI elements
base: 16px  // Standard inline icons
md: 18px  // Section headers
lg: 20px  // Page headers, buttons
xl: 24px  // Subject icons, large headers
2xl: 32px  // Hero sections
3xl: 48px  // Celebration icons, achievements
```

**Weights:**
```tsx
regular: 'regular'    // Default, neutral
duotone: 'duotone'    // Friendly, approachable
fill: 'fill'          // Emphasis, celebration
bold: 'bold'          // Strong emphasis, errors
```

**Usage Guidelines:**
- Subject icons: 24px, duotone
- Difficulty icons: 20px, bold
- Button icons: 18px, match button intent (duotone/fill)
- Celebration icons: 48px, fill
- Metric icons: 18px, duotone
- Use icons for **clarification**, not decoration
- Every icon should have clear semantic meaning
- Always include `aria-label` for standalone icons

---

## 9. Input System

**Base Input:**
```tsx
className="
  flex h-10 w-full
  rounded-lg
  border border-gray-200 dark:border-gray-700
  bg-white dark:bg-gray-800
  px-3 py-2
  text-sm
  text-gray-900 dark:text-gray-100
  placeholder:text-gray-500 dark:placeholder:text-gray-500
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-indigo-500
  focus-visible:ring-offset-2
  disabled:cursor-not-allowed
  disabled:opacity-50
"
```

**Search Input:**
```tsx
// Desktop
className="
  w-full rounded-lg
  border border-gray-200 dark:border-gray-700
  bg-white dark:bg-gray-800
  py-3 pl-10 pr-10
  text-base
  placeholder:text-gray-400 dark:placeholder:text-gray-500
  focus:border-transparent
  focus:ring-2
  focus:ring-purple-500
"

// Mobile (CollapsibleSearch)
className="
  flex w-full items-center gap-2
  rounded-lg
  border border-gray-200 dark:border-gray-700
  bg-white dark:bg-gray-800
  px-3 py-3
  shadow-sm
"
```

**Textarea:**
```tsx
className="
  flex min-h-[90px] w-full
  rounded-lg
  border border-gray-200 dark:border-gray-700
  bg-white dark:bg-gray-800
  px-3 py-2
  text-sm
  text-gray-900 dark:text-gray-100
  placeholder:text-gray-500
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-indigo-500
"
```

**Input Rules:**
- ✅ Always use `rounded-lg` (8px)
- ✅ Standard height: `h-10` (40px)
- ✅ Search uses `py-3` (vertical padding for ~52px total)
- ✅ Focus ring: `ring-2` with mode color
- ✅ Placeholder: `text-gray-500` in both modes
- ❌ Never use native `<select>` (build custom dropdown)
- ❌ Never use `<input type="date">` (build custom picker)

---

## 10. Dark Mode

**Strategy:** Parallel design, not inverted

```tsx
// Background layers
bg-layer-0: 'white / gray-900 dark'
bg-layer-1: 'gray-50 / gray-800 dark'
bg-layer-2: 'gray-100 / gray-700 dark'

// Borders
border-standard: 'gray-200 / gray-700 dark'
border-frosted: 'white/60 / gray-800 dark'

// Text
text-primary: 'gray-900 / gray-100 dark'
text-secondary: 'gray-600 / gray-400 dark'
text-tertiary: 'gray-500 / gray-400 dark'

// Semantic colors (slightly desaturated in dark)
indigo-600 / indigo-500 dark
teal-600 / teal-500 dark
rose-600 / rose-500 dark
```

**Dark Mode Rules:**
- ✅ Border opacity lower in dark: `gray-700` not `gray-800` (except frosted)
- ✅ Shadows less prominent (borders do heavy lifting)
- ✅ Semantic colors slightly lighter in dark mode
- ✅ Maintain same border radius, spacing, typography
- ❌ Don't use pure black `#000` (too harsh)
- ❌ Don't use pure white `#FFF` in dark mode (too bright)

---

## 11. Animations & Transitions

**Timing:** Fast, purposeful, never distracting

```tsx
// Standard transition
'transition-all duration-150'

// Specific properties (more performant)
'transition-colors duration-150'
'transition-shadow duration-150'
'transition-transform duration-150'

// Easing
// Use default (ease-in-out) for most cases
// Custom: cubic-bezier(0.25, 1, 0.5, 1) for smooth ease-out
```

**Interactive Feedback:**
```tsx
// Button press
'active:scale-95'

// Shadow reveal
'hover:shadow-md transition-shadow duration-150'

// Background change
'hover:bg-gray-50 transition-colors duration-150'
```

**Animation Rules:**
- ✅ 150ms for micro-interactions (hover, focus)
- ✅ 200-250ms for larger transitions (modal open, page change)
- ✅ `active:scale-95` for all clickable elements
- ✅ Always include `transition-*` with animations
- ❌ No spring/bouncy effects (too playful)
- ❌ No animations longer than 300ms (feels sluggish)
- ❌ No animation on layout changes (causes jank)

---

## 12. Responsive Breakpoints

**Mobile-First Strategy**

```tsx
// Tailwind default breakpoints
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Laptops
xl: 1280px  // Desktops
2xl: 1536px // Large screens
```

**Usage Pattern:**
```tsx
// Base (mobile): Full width, compact spacing
className="w-full p-4 text-sm"

// Tablet: More breathing room
className="w-full p-4 md:p-6 text-sm md:text-base"

// Desktop: Fixed width, generous spacing
className="w-full max-w-4xl p-4 md:p-6 lg:p-8 text-sm md:text-base"
```

**Responsive Rules:**
- ✅ Design for 375px (iPhone SE) first
- ✅ Test on 390px (iPhone 14), 428px (iPhone 14 Pro Max)
- ✅ Use responsive padding for page containers only
- ✅ Use responsive typography for readability
- ❌ Don't use responsive padding on small cards
- ❌ Don't change layouts drastically between breakpoints
- ❌ Don't hide important features on mobile

---

## 13. Accessibility

**WCAG 2.1 Level AA Compliance**

### Color Contrast
```tsx
// Text contrast
Normal text: 4.5:1 minimum
Large text (18px+, 14px+ bold): 3.0:1 minimum
UI components: 3.0:1 minimum

// Testing
gray-900 on white: 16.5:1 ✅
gray-600 on white: 5.74:1 ✅
gray-500 on white: 4.6:1 ✅
indigo-600 on white: 4.5:1 ✅
```

### Touch Targets
```tsx
// Minimum sizes
Mobile touch target: 48×48px (WCAG 2.1 AA)
Desktop click target: 44×44px acceptable

// Implementation
min-h-11: 44px // Buttons, inputs
p-4: 16px // Add padding to reach 48px with content
```

### Keyboard Navigation
- ✅ All interactive elements focusable
- ✅ Focus rings: `focus-visible:ring-2`
- ✅ Logical tab order (use semantic HTML)
- ✅ Escape closes modals/dropdowns
- ✅ Enter/Space activates buttons
- ❌ Never disable focus outlines
- ❌ Never rely on color alone for meaning

### Screen Readers
```tsx
// Semantic HTML
<h1>, <h2>, <h3> // Use proper heading hierarchy
<button> // For clickable actions
<a> // For navigation
<label> // For form inputs

// ARIA labels
aria-label="Close dialog"
aria-current="page"
aria-expanded="true"
```

---

## 14. Component Patterns

### Modal/Dialog
```tsx
<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
    <Dialog.Content className="
      fixed left-1/2 top-1/2 z-50
      w-[92vw] max-w-lg
      -translate-x-1/2 -translate-y-1/2
      rounded-xl
      bg-white dark:bg-gray-900
      p-6
      shadow-xl
      border border-gray-200 dark:border-gray-700
    ">
      <Dialog.Title className="text-lg font-semibold mb-4">
        {title}
      </Dialog.Title>
      {children}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Tab System
```tsx
<Tabs defaultValue="overview">
  <TabsList className="
    grid w-full grid-cols-3
    rounded-xl
    bg-white/80 dark:bg-gray-900/70
    p-1
    shadow-sm
    border border-white/70 dark:border-gray-800
  ">
    <TabsTrigger value="overview" className="rounded-xl">
      Overview
    </TabsTrigger>
  </TabsList>

  <TabsContent value="overview" className="mt-6">
    {content}
  </TabsContent>
</Tabs>
```

### Badge/Chip
```tsx
// Status badge
<span className="
  inline-flex items-center gap-1
  rounded-full
  px-3 py-1
  text-xs font-medium
  bg-green-100 dark:bg-green-900/30
  text-green-800 dark:text-green-200
  ring-1 ring-inset ring-green-600/20
">
  <CheckCircle size={12} weight="fill" />
  Published
</span>

// Grade badge
<span className="
  inline-flex items-center
  rounded-full
  px-3 py-1.5
  text-xs font-medium
  bg-amber-100 dark:bg-amber-900/30
  text-amber-800 dark:text-amber-200
  ring-1 ring-inset ring-current/20
">
  Luokka: 6
</span>
```

---

## 15. Layout Patterns

### Page Container
```tsx
<div className="min-h-screen bg-white dark:bg-gray-900">
  {/* Sticky header */}
  <div className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
    <div className="max-w-4xl mx-auto px-4 py-4">
      {header}
    </div>
  </div>

  {/* Main content */}
  <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12">
    {content}
  </div>
</div>
```

### Card Grid
```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {items.map(item => (
    <Card key={item.id} />
  ))}
</div>
```

### Sticky Actions
```tsx
<div className="sticky bottom-4 z-10">
  <div className="
    rounded-xl
    bg-white/90 dark:bg-gray-900/85
    border border-white/70 dark:border-gray-800
    p-4
    shadow-lg
    backdrop-blur
  ">
    <div className="flex gap-3">
      <Button>Primary Action</Button>
      <Button variant="outline">Secondary</Button>
    </div>
  </div>
</div>
```

---

## 16. Do's and Don'ts

### ✅ Always Do
- Use 4px grid for all spacing (gap-2, gap-3, p-4, p-5, etc.)
- Include `transition-*` with hover/active states
- Use semantic HTML (`<h1>`, `<button>`, `<label>`)
- Test on mobile (375px minimum width)
- Provide focus-visible rings
- Use mode-specific colors (indigo=quiz, teal=study)
- Include `aria-label` for icon-only buttons
- Test in dark mode
- Use Phosphor icons consistently

### ❌ Never Do
- Use `rounded-2xl` on standard cards (too round)
- Mix `rounded-lg` and `rounded-xl` on same element type
- Use permanent shadows on interactive cards (hover only)
- Use responsive padding on small cards (p-4 stays p-4)
- Use arbitrary values (p-7, gap-5) off the 4px grid
- Use pure black `#000` or pure white `#FFF`
- Disable focus outlines
- Use native `<select>` or `<input type="date">`
- Use spring/bouncy animations
- Use color for decoration (always semantic)
- Create touch targets smaller than 48×48px

---

## 17. Implementation Checklist

When creating a new component:

- [ ] Border radius follows system (xl=cards, lg=buttons/inputs)
- [ ] Typography uses defined scale (h1-h4, body, caption)
- [ ] Spacing uses 4px grid (gap-2/3/4, p-4/5/6)
- [ ] Shadows follow strategy (hover:shadow-md or shadow-sm)
- [ ] Colors are semantic (mode colors, status colors)
- [ ] Dark mode variants defined
- [ ] Transitions are 150ms
- [ ] Touch targets ≥48×48px
- [ ] Focus states included
- [ ] Icons from Phosphor, correct size
- [ ] Tested on mobile (375px)
- [ ] WCAG AA contrast verified

---

## 18. Resources

**Design Tokens:**
- Colors: `tailwind.config.ts`
- Typography: See section 2
- Spacing: Tailwind default (4px grid)
- Shadows: Tailwind default
- Icons: `@phosphor-icons/react`

**Component Library:**
- Base components: `src/components/ui/`
- Patterns: `src/components/` (organized by feature)

**Testing:**
- Mobile: 375px, 390px, 428px widths
- Desktop: 1024px, 1280px, 1536px widths
- Dark mode: Toggle via system preference
- Contrast: Use browser DevTools Accessibility panel

**References:**
- WCAG 2.1 Level AA: https://www.w3.org/WAI/WCAG21/quickref/
- Touch targets: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
- Color contrast: https://webaim.org/resources/contrastchecker/

---

**Last Reviewed:** February 2026
**Next Review:** After completing tasks 100-107

For implementation tasks, see:
- `todo/task-100-standardize-border-radius.md`
- `todo/task-101-unify-button-styling.md`
- `todo/task-102-standardize-card-containers.md`
- `todo/task-103-fix-dark-mode-borders.md`
- `todo/task-104-define-typography-scale.md`
- `todo/task-105-standardize-spacing-scale.md`
- `todo/task-106-unify-shadow-strategy.md`
- `todo/task-107-fix-search-input-padding.md`
