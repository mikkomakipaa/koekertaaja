# Koekertaaja Design System

**Version**: 1.0
**Last Updated**: 2026-01-18
**Target Audience**: Primary school students (ages 10-12, grades 4-6)

---

## Design Principles

### 1. Age-Appropriate & Playful
- **Primary users**: 10-12 year old students
- **Context**: iPad/tablet in living room, bedroom, car rides
- **Needs**: Large touch targets, clear text, fun but not childish
- **Tone**: Encouraging, positive, educational but not boring

### 2. Gamification Without Pressure
- **Points & streaks**: Visible but not competitive
- **Badges**: Personal achievements, no public leaderboards
- **Progress**: Personal bests, not comparisons with others
- **Celebrations**: Positive reinforcement, no shaming for mistakes

### 3. Mobile-First & Touch-Friendly
- **Primary device**: iPad Air (10.9"), iPhone (6.1")
- **Touch targets**: Minimum 48px (iOS) / 48dp (Android)
- **Large text**: Minimum 16px base for young eyes
- **High contrast**: Easy to read on bright screens (outdoor use)

### 4. Dark Mode Support
- **System preference**: Automatic detection via `prefers-color-scheme`
- **Smooth transitions**: CSS transitions for mode switching
- **WCAG AAA**: Enhanced contrast ratios in dark mode
- **No toggle**: Respects system setting only

### 5. Accessibility-First
- **Font size**: 16px base, 18-24px for body text
- **Color contrast**: WCAG AAA (7:1 for normal text, 4.5:1 for large)
- **Touch targets**: 48px minimum
- **Keyboard navigation**: Full support
- **Screen readers**: Proper ARIA labels and semantic HTML

---

## Color Palette

### Primary Colors (Gamification)

**Purple** - Primary brand color (badges, achievements)
Conveys: Creativity, achievement, magic, fun

- `purple-50`: `#faf5ff` - Lightest tint
- `purple-100`: `#f3e8ff`
- `purple-200`: `#e9d5ff`
- `purple-300`: `#d8b4fe`
- `purple-400`: `#c084fc`
- `purple-500`: `#a855f7` ⭐ Primary
- `purple-600`: `#9333ea`
- `purple-700`: `#7e22ce`
- `purple-800`: `#6b21a8`
- `purple-900`: `#581c87`

**Amber** - Points & highlights
Conveys: Warmth, achievement, value, treasure

- `amber-50`: `#fffbeb`
- `amber-100`: `#fef3c7`
- `amber-200`: `#fde68a`
- `amber-300`: `#fcd34d`
- `amber-400`: `#fbbf24`
- `amber-500`: `#f59e0b` ⭐ Points
- `amber-600`: `#d97706`
- `amber-700`: `#b45309`
- `amber-800`: `#92400e`
- `amber-900`: `#78350f`

**Orange** - Streaks & energy
Conveys: Energy, activity, fire, momentum

- `orange-50`: `#fff7ed`
- `orange-100`: `#ffedd5`
- `orange-200`: `#fed7aa`
- `orange-300`: `#fdba74`
- `orange-400`: `#fb923c`
- `orange-500`: `#f97316` ⭐ Streaks
- `orange-600`: `#ea580c`
- `orange-700`: `#c2410c`
- `orange-800`: `#9a3412`
- `orange-900`: `#7c2d12`

**Blue** - Information & calm
Conveys: Knowledge, learning, trust, calm

- `blue-50`: `#eff6ff`
- `blue-100`: `#dbeafe`
- `blue-200`: `#bfdbfe`
- `blue-300`: `#93c5fd`
- `blue-400`: `#60a5fa`
- `blue-500`: `#3b82f6` ⭐ Info
- `blue-600`: `#2563eb`
- `blue-700`: `#1d4ed8`
- `blue-800`: `#1e40af`
- `blue-900`: `#1e3a8a`

**Green** - Success & correct answers
Conveys: Correctness, growth, success, positive

- `green-50`: `#f0fdf4`
- `green-100`: `#dcfce7`
- `green-200`: `#bbf7d0`
- `green-300`: `#86efac`
- `green-400`: `#4ade80`
- `green-500`: `#22c55e` ⭐ Success
- `green-600`: `#16a34a`
- `green-700`: `#15803d`
- `green-800`: `#166534`
- `green-900`: `#14532d`

### Neutral Colors (UI Foundation)

**Gray** - Text, backgrounds, borders

- `gray-50`: `#f9fafb` - Lightest background
- `gray-100`: `#f3f4f6` - Subtle background
- `gray-200`: `#e5e7eb` - Borders, dividers
- `gray-300`: `#d1d5db` - Disabled states
- `gray-400`: `#9ca3af` - Placeholders
- `gray-500`: `#6b7280` - Secondary text
- `gray-600`: `#4b5563` - Body text (light mode)
- `gray-700`: `#374151` - Headings (light mode)
- `gray-800`: `#1f2937` - Strong emphasis
- `gray-900`: `#111827` - Black (light mode)

**White & Black**

- `white`: `#ffffff`
- `black`: `#000000`

### Dark Mode Colors

**Background Hierarchy**:
- Primary background: `#0f172a` (slate-900)
- Secondary background: `#1e293b` (slate-800)
- Tertiary background: `#334155` (slate-700)

**Text Hierarchy**:
- Primary text: `#f1f5f9` (slate-100)
- Secondary text: `#cbd5e1` (slate-300)
- Disabled text: `#64748b` (slate-500)

**Borders**:
- Subtle borders: `#334155` (slate-700)
- Strong borders: `#475569` (slate-600)

### Semantic Colors

**Success** - Correct answer, achievement unlocked
- Light mode: `green-500` (#22c55e)
- Dark mode: `green-400` (#4ade80)
- Background: `green-50` / `green-900/10`

**Error** - Wrong answer (but gentle!)
- Light mode: `red-500` (#ef4444)
- Dark mode: `red-400` (#f87171)
- Background: `red-50` / `red-900/10`

**Warning** - Important info, caution
- Light mode: `amber-500` (#f59e0b)
- Dark mode: `amber-400` (#fbbf24)
- Background: `amber-50` / `amber-900/10`

**Info** - Neutral information
- Light mode: `blue-500` (#3b82f6)
- Dark mode: `blue-400` (#60a5fa)
- Background: `blue-50` / `blue-900/10`

---

## Typography

### Font Family

**Primary Font**: System font stack (native, fast, familiar)
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

**Benefits**:
- Fast loading (no web fonts)
- Familiar to users (native iOS/Android fonts)
- Good readability on all devices

### Font Sizes

**Scale**: 1.25 (Major Third)

- `text-xs`: 12px (0.75rem) - Captions, metadata
- `text-sm`: 14px (0.875rem) - Secondary text
- `text-base`: 16px (1rem) - Body text
- `text-lg`: 18px (1.125rem) - Emphasized body
- `text-xl`: 20px (1.25rem) - Small headings
- `text-2xl`: 24px (1.5rem) - Section headings
- `text-3xl`: 30px (1.875rem) - Page titles
- `text-4xl`: 36px (2.25rem) - Hero text

**Age-Appropriate Sizing**:
- Body text: `text-lg` (18px) minimum for young readers
- Question text: `text-xl` (20px) for emphasis
- Headings: `text-2xl` to `text-3xl` for clarity
- Small text: `text-sm` (14px) minimum (never smaller)

### Font Weights

- `font-normal`: 400 - Body text
- `font-medium`: 500 - Emphasized text
- `font-semibold`: 600 - Headings
- `font-bold`: 700 - Strong emphasis

### Line Height

- **Tight**: 1.25 (headings)
- **Normal**: 1.5 (body text)
- **Relaxed**: 1.75 (long-form content)

**Age-Appropriate**: Use `leading-relaxed` (1.75) for question text to improve readability

---

## Spacing

### Spacing Scale (Tailwind)

- `0`: 0px
- `1`: 4px (0.25rem)
- `2`: 8px (0.5rem)
- `3`: 12px (0.75rem)
- `4`: 16px (1rem)
- `5`: 20px (1.25rem)
- `6`: 24px (1.5rem)
- `8`: 32px (2rem)
- `10`: 40px (2.5rem)
- `12`: 48px (3rem)
- `16`: 64px (4rem)
- `20`: 80px (5rem)

### Common Patterns

- **Card padding**: `p-6` (24px) mobile, `p-8` (32px) desktop
- **Button padding**: `px-6 py-3` (24px × 12px)
- **Stack spacing**: `space-y-4` (16px) between elements
- **Section spacing**: `mt-8` or `mt-12` (32-48px)
- **Touch target**: Minimum 48px (`h-12 w-12`)

---

## Components

### Buttons

**Primary Button** (CTA: "Aloita harjoittelu", "Luo kysymykset")
```tsx
<button className="
  bg-purple-600 hover:bg-purple-700
  text-white font-semibold
  px-6 py-3 rounded-lg
  min-h-[48px] min-w-[48px]
  transition-colors
  dark:bg-purple-500 dark:hover:bg-purple-600
">
  Aloita harjoittelu
</button>
```

**Secondary Button** (Less emphasis: "Peruuta", "Takaisin")
```tsx
<button className="
  bg-gray-200 hover:bg-gray-300
  text-gray-900 font-medium
  px-6 py-3 rounded-lg
  min-h-[48px]
  transition-colors
  dark:bg-gray-700 dark:hover:bg-gray-600
  dark:text-gray-100
">
  Peruuta
</button>
```

**Icon Button** (Copy code, delete)
```tsx
<button className="
  p-3 rounded-lg
  hover:bg-gray-100 dark:hover:bg-gray-800
  min-h-[48px] min-w-[48px]
  transition-colors
">
  <Copy size={24} weight="duotone" />
</button>
```

### Cards

**Question Set Card**
```tsx
<div className="
  bg-white dark:bg-gray-800
  border border-gray-200 dark:border-gray-700
  rounded-lg p-6
  shadow-sm hover:shadow-md
  transition-shadow
">
  {/* Card content */}
</div>
```

**Badge Display** (Unlocked achievement)
```tsx
<div className="
  bg-purple-50 dark:bg-purple-900/20
  border-2 border-purple-500
  rounded-lg p-4
  text-center
">
  <Sparkle size={32} weight="duotone" className="text-purple-500" />
  <p className="font-semibold text-purple-700 dark:text-purple-300">
    Ensimmäinen Harjoitus
  </p>
</div>
```

### Inputs

**Text Input**
```tsx
<input
  type="text"
  className="
    w-full px-4 py-3
    bg-white dark:bg-gray-800
    border-2 border-gray-300 dark:border-gray-600
    rounded-lg
    text-lg
    focus:border-purple-500 focus:ring-2 focus:ring-purple-200
    dark:focus:ring-purple-800
    transition-colors
  "
  placeholder="Syötä koodi..."
/>
```

**File Upload**
```tsx
<label className="
  block w-full p-8
  border-2 border-dashed border-gray-300 dark:border-gray-600
  rounded-lg
  hover:border-purple-500 hover:bg-purple-50
  dark:hover:bg-purple-900/10
  cursor-pointer
  transition-colors
">
  <Upload size={48} weight="duotone" className="mx-auto text-gray-400" />
  <p className="text-center mt-4">Lataa PDF tai kuva</p>
  <input type="file" className="sr-only" />
</label>
```

---

## Icons

### Phosphor Icons

**Library**: `phosphor-react`
**Weight**: `duotone` (primary), `regular` (secondary)
**Size**: 16px (sm), 24px (md), 32px (lg), 48px (xl)

### Icon Usage

**Points** (DiamondsFour, duotone, amber):
```tsx
<DiamondsFour size={24} weight="duotone" className="text-amber-500" />
```

**Streaks** (Fire, duotone, orange):
```tsx
<Fire size={24} weight="duotone" className="text-orange-500" />
```

**Badges** (Context-specific):
- Sparkle: First achievement
- Star: Performance
- Fire: Streak achievements
- Barbell: Effort/practice milestones
- Target: Accuracy
- Rocket: Speed
- Lightning: Quick completion
- Palette: Exploration

**Subjects**:
- GlobeHemisphereWest: Geography
- MathOperations: Math
- Scroll: History
- Atom: Science
- Book: Generic subject

**Actions**:
- Copy: Copy to clipboard
- Trash: Delete
- Plus: Add/create
- Check: Confirm/correct
- X: Cancel/incorrect

### Icon Guidelines

- **Always include ARIA labels**: `aria-label="Pisteet"`
- **Consistent sizing**: 24px for inline, 32px for prominent, 48px for hero
- **Color coding**: Match icon color to semantic meaning
- **Duotone for depth**: Primary icons use duotone weight
- **Regular for simplicity**: Secondary/less important icons use regular weight

---

## Animations & Transitions

### Transition Durations

- **Fast**: 150ms - Hover states, small changes
- **Medium**: 300ms - Modal open/close, page transitions
- **Slow**: 500ms - Celebrations, badge unlocks

### Common Transitions

**Hover states**:
```css
transition: all 150ms ease-in-out;
/* or Tailwind */
transition-colors duration-150
```

**Modal/Dialog**:
```css
transition: opacity 300ms ease-in-out, transform 300ms ease-out;
```

**Badge unlock celebration**:
```css
@keyframes bounce-in {
  0% { transform: scale(0) rotate(-45deg); opacity: 0; }
  50% { transform: scale(1.1) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

animation: bounce-in 500ms ease-out;
```

### Animation Guidelines

- **Respect `prefers-reduced-motion`**: Disable decorative animations
- **Keep animations short**: 300-500ms maximum
- **Use sparingly**: Only for important moments (badge unlocks, correct answers)
- **Test on devices**: Ensure smooth 60fps on iPad/iPhone

---

## Layouts

### Grid System

**Mobile-first breakpoints** (Tailwind):
- `sm`: 640px (large phone)
- `md`: 768px (tablet)
- `lg`: 1024px (laptop)
- `xl`: 1280px (desktop)

**Common Grid Patterns**:

**Badge Grid** (2 columns mobile, 3-4 desktop):
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {/* Badge items */}
</div>
```

**Question Set List** (1 column mobile, 2 desktop):
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Question set cards */}
</div>
```

### Container

**Max width**: 1280px (xl)
```tsx
<div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
  {/* Content */}
</div>
```

---

## Accessibility

### WCAG AAA Compliance

**Text Contrast Ratios**:
- Normal text (<18px): 7:1 minimum
- Large text (≥18px): 4.5:1 minimum
- UI components: 3:1 minimum

**Color Combinations** (WCAG AAA compliant):

Light mode:
- `gray-900` on `white` ✅ 17.03:1
- `purple-700` on `white` ✅ 7.02:1
- `gray-700` on `gray-50` ✅ 9.43:1

Dark mode:
- `gray-100` on `slate-900` ✅ 15.38:1
- `purple-300` on `slate-900` ✅ 7.58:1
- `gray-200` on `slate-800` ✅ 11.24:1

### Keyboard Navigation

**Focus States**:
```css
focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
dark:focus:ring-offset-slate-900
```

**Tab Order**: Logical, top-to-bottom, left-to-right

**Skip Links**:
```tsx
<a href="#main" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Screen Readers

**Semantic HTML**:
- `<main>` for primary content
- `<nav>` for navigation
- `<article>` for question cards
- `<button>` for interactive elements (not `<div>`)

**ARIA Labels**:
```tsx
<button aria-label="Kopioi koodi leikepöydälle">
  <Copy size={24} />
</button>
```

---

## Design Tokens (CSS Variables)

### Light Mode
```css
:root {
  --color-primary: #a855f7; /* purple-500 */
  --color-points: #f59e0b; /* amber-500 */
  --color-streaks: #f97316; /* orange-500 */
  --color-success: #22c55e; /* green-500 */
  --color-error: #ef4444; /* red-500 */

  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;

  --border-radius-sm: 0.375rem; /* 6px */
  --border-radius-md: 0.5rem; /* 8px */
  --border-radius-lg: 0.75rem; /* 12px */
}
```

### Dark Mode
```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #a855f7; /* purple-500 - same */
    --color-points: #fbbf24; /* amber-400 - lighter */
    --color-streaks: #fb923c; /* orange-400 - lighter */
    --color-success: #4ade80; /* green-400 - lighter */
    --color-error: #f87171; /* red-400 - lighter */

    --color-bg-primary: #0f172a;
    --color-bg-secondary: #1e293b;
    --color-text-primary: #f1f5f9;
    --color-text-secondary: #cbd5e1;
  }
}
```

---

## Usage Examples

### Creating a New Page

```tsx
export default function QuestionPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page header */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Harjoittele kysymyksiä
        </h1>

        {/* Content card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          {/* Question content */}
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex gap-4">
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            Seuraava
          </button>
          <button className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium px-6 py-3 rounded-lg transition-colors">
            Lopeta
          </button>
        </div>
      </div>
    </main>
  );
}
```

### Badge Component

```tsx
import { Sparkle } from '@phosphor-icons/react';

export function BadgeCard({ badge, unlocked }: { badge: Badge; unlocked: boolean }) {
  return (
    <div className={`
      rounded-lg p-4 text-center transition-all
      ${unlocked
        ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500'
        : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 opacity-50'
      }
    `}>
      <Sparkle
        size={32}
        weight="duotone"
        className={unlocked ? 'text-purple-500' : 'text-gray-400'}
      />
      <p className={`
        mt-2 font-semibold text-sm
        ${unlocked
          ? 'text-purple-700 dark:text-purple-300'
          : 'text-gray-600 dark:text-gray-400'
        }
      `}>
        {badge.name}
      </p>
    </div>
  );
}
```

---

## Maintenance

### Quarterly Reviews

1. **Check contrast ratios** - Run automated tools (axe DevTools)
2. **Test on devices** - iOS Safari, Android Chrome
3. **User feedback** - Any complaints about readability, colors?
4. **Icon consistency** - All icons using duotone weight?
5. **Dark mode** - All new components support dark mode?

### Design System Updates

**Document in**:
- This file (DESIGN_SYSTEM.md)
- `tailwind.config.js` (for custom colors/spacing)
- Component Storybook (future)

**When to update**:
- Adding new badge categories (new icon + color)
- Changing brand colors (rare, requires stakeholder approval)
- New component patterns (document in COMPONENTS.md)

---

**Next Steps**:
1. ✅ Implement dark mode CSS variables
2. ✅ Audit all components for WCAG AAA compliance
3. 🔄 Create Storybook for component library (future)
4. ✅ Document badge icon mapping in COMPONENTS.md
