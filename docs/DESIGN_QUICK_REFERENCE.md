# Design System Quick Reference

**One-page cheat sheet for common patterns**

---

## Border Radius

```tsx
Cards:    rounded-xl  (12px)
Buttons:  rounded-lg  (8px)
Inputs:   rounded-lg  (8px)
Badges:   rounded-full
```

---

## Typography

```tsx
h1:        text-2xl md:text-3xl font-bold
h2:        text-xl md:text-2xl font-bold
h3:        text-lg font-semibold
h4:        text-base font-semibold
body:      text-sm md:text-base
bodySmall: text-sm text-gray-600 dark:text-gray-400
caption:   text-xs text-gray-500 dark:text-gray-400
```

---

## Colors

```tsx
Quiz:   indigo-600 / indigo-500 dark
Study:  teal-600 / teal-500 dark
Review: rose-600 / rose-500 dark

Success: green-600
Warning: amber-600
Error:   red-600

Grades: 4=amber, 5=green, 6=emerald, 7=cyan, 8=blue, 9=purple
Use: getGradeBadgeClasses(grade) from '@/lib/utils/grade-colors'

Border:  gray-200 / gray-700 dark
Border (frosted): white/60 / gray-800 dark
```

---

## Spacing

```tsx
Padding:
  Compact:  p-4  (16px)
  Standard: p-5  (20px)
  Large:    p-6  (24px)

Gaps:
  Tight:     gap-2  (8px)
  Standard:  gap-3  (12px)
  Generous:  gap-4  (16px)
```

---

## Shadows

```tsx
Interactive card:
  hover:shadow-md transition-shadow duration-150

Elevated section:
  shadow-sm

Primary button:
  shadow-md hover:shadow-lg active:shadow-sm

Modal:
  shadow-xl
```

---

## Buttons

### Primary (Quiz)
```tsx
className="
  flex min-h-11 items-center justify-center gap-2
  rounded-lg px-4 py-3 text-sm font-semibold
  bg-gradient-to-r from-indigo-600 to-indigo-500
  hover:from-indigo-700 hover:to-indigo-600
  text-white shadow-md hover:shadow-lg
  active:scale-95 active:shadow-sm
  transition-all duration-150
"
```

### Secondary
```tsx
className="
  flex min-h-11 items-center justify-center gap-2
  rounded-lg px-4 py-3 text-sm font-semibold
  border border-gray-300 bg-white text-gray-700
  hover:bg-gray-50 hover:border-gray-400
  dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300
  dark:hover:bg-gray-700
  active:scale-95
  transition-all duration-150
"
```

---

## Cards

### Standard
```tsx
className="
  rounded-xl
  border border-gray-200 dark:border-gray-700
  bg-white dark:bg-gray-800
  p-5
  hover:shadow-md
  transition-shadow duration-150
"
```

### Compact
```tsx
className="
  rounded-xl
  border border-gray-200 dark:border-gray-700
  bg-white dark:bg-gray-800
  p-4
  hover:shadow-md
  transition-shadow duration-150
"
```

### Frosted (Results page)
```tsx
className="
  rounded-xl
  border border-white/60 dark:border-gray-800
  bg-white/80 dark:bg-gray-900/70
  backdrop-blur-sm
  p-5 shadow-sm
"
```

---

## Inputs

```tsx
className="
  flex h-10 w-full
  rounded-lg
  border border-gray-200 dark:border-gray-700
  bg-white dark:bg-gray-800
  px-3 py-2
  text-sm
  placeholder:text-gray-500 dark:placeholder:text-gray-500
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-indigo-500
"
```

---

## Icons

```tsx
Sizes:
  sm:   14px
  base: 16px
  md:   18px
  lg:   20px
  xl:   24px
  2xl:  32px
  3xl:  48px

Weights:
  regular  - Default
  duotone  - Friendly
  fill     - Emphasis
  bold     - Strong
```

---

## Animations

```tsx
Standard:
  transition-all duration-150

Specific (better performance):
  transition-colors duration-150
  transition-shadow duration-150
  transition-transform duration-150

Button press:
  active:scale-95
```

---

## Common Patterns

### Page Container
```tsx
<div className="min-h-screen bg-white dark:bg-gray-900">
  <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12">
    {content}
  </div>
</div>
```

### Modal
```tsx
<Dialog.Content className="
  fixed left-1/2 top-1/2 z-50
  w-[92vw] max-w-lg
  -translate-x-1/2 -translate-y-1/2
  rounded-xl bg-white dark:bg-gray-900
  p-6 shadow-xl
  border border-gray-200 dark:border-gray-700
">
```

### Sticky Actions Bar
```tsx
<div className="sticky bottom-4 z-10">
  <div className="
    rounded-xl
    bg-white/90 dark:bg-gray-900/85
    border border-white/70 dark:border-gray-800
    p-4 shadow-lg backdrop-blur
  ">
    <div className="flex gap-3">
      {buttons}
    </div>
  </div>
</div>
```

---

## Checklist for New Components

- [ ] `rounded-xl` for cards, `rounded-lg` for buttons/inputs
- [ ] Spacing uses 4px grid (gap-2/3/4, p-4/5/6)
- [ ] Dark mode: `dark:border-gray-700`, `dark:bg-gray-800`
- [ ] Transitions: `duration-150`
- [ ] Touch targets: `min-h-11` (44px minimum)
- [ ] Focus states: `focus-visible:ring-2`
- [ ] Mode colors: indigo (quiz), teal (study), rose (review)
- [ ] Icons from Phosphor, proper size
- [ ] Shadows: `hover:shadow-md` or `shadow-sm`
- [ ] Typography from scale (h1-h4, body, caption)

---

**Full guidelines:** See `docs/DESIGN_GUIDELINES.md`
