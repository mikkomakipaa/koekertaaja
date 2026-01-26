# Task 07: Implement Smooth Scroll Animations

**Status:** 🔴 Not Started
**Priority:** P2 (Polish)
**Estimate:** 3 points

## Goal
Add subtle animations to enhance the landing page experience without overwhelming users or impacting performance.

## Requirements

### Animation Types

**1. Fade-in on Scroll**
- Sections fade in as user scrolls down
- Stagger animation for multiple cards/items
- Use Intersection Observer for trigger

**2. Smooth Scroll Behavior**
- Anchor links scroll smoothly to sections
- Use CSS `scroll-behavior: smooth` or JS
- No jarring jumps

**3. Button/Interactive Effects**
- Subtle hover effects (scale, shadow)
- Press/active state feedback
- Smooth transitions (200-300ms)

**4. Section Headers**
- Optional: slide up or fade in from bottom
- Keep subtle and quick

### Technical Requirements
- **Performance:** Maintain 60fps scrolling
- **Accessibility:** Respect `prefers-reduced-motion`
- **Timing:** 200-400ms for animations
- **Library:** Framer Motion (recommended) or pure CSS

### Animation Targets
- Hero section: fade in on load
- Feature cards: stagger fade-in on scroll
- Subject cards: stagger fade-in on scroll
- Buttons: hover scale (1.02-1.05)
- Section headers: fade in when visible

## Current Status
- ❌ No animations currently implemented
- Basic hover effects on buttons exist

## Acceptance Criteria
- [ ] Fade-in animations trigger on scroll (Intersection Observer)
- [ ] Animations are subtle and don't distract
- [ ] Smooth scroll works for anchor links
- [ ] Respects prefers-reduced-motion (disables animations)
- [ ] No performance issues (60fps maintained)
- [ ] Animations don't cause layout shift
- [ ] Works across browsers (Chrome, Firefox, Safari)
- [ ] Dark mode animations look good
- [ ] No flickering or janky movement

## Files to Modify
- `src/app/page.tsx` (add animation wrappers)
- Optional: `src/hooks/useScrollAnimation.ts` (custom hook)
- Optional: `src/app/globals.css` (add animation keyframes if using CSS)

## Implementation Notes

**Option A: Framer Motion (Recommended)**
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
  viewport={{ once: true }}
>
  {/* content */}
</motion.div>
```

**Option B: Pure CSS**
```css
@media (prefers-reduced-motion: no-preference) {
  .fade-in {
    animation: fadeIn 0.4s ease-out;
  }
}
```

**Prefers Reduced Motion:**
```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

- Keep animations disabled by default for accessibility
- Only enable if user hasn't set prefers-reduced-motion
- Test with DevTools (Rendering > Emulate prefers-reduced-motion)
