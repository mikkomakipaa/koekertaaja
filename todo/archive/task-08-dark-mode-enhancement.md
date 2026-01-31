# Task 08: Enhance Dark Mode Styling for Landing Page

**Status:** 🔴 Not Started
**Priority:** P2 (Polish)
**Estimate:** 2 points

## Goal
Review and improve dark mode appearance across all landing page sections to ensure excellent readability and visual appeal.

## Requirements

### Dark Mode Checklist

**Color Contrast (WCAG AA)**
- [ ] All text meets 4.5:1 ratio for body text
- [ ] Large text meets 3:1 ratio
- [ ] Emerald primary on dark backgrounds: verify contrast
- [ ] Links and interactive elements: clear visibility

**Section-by-Section Review**
- [ ] Hero section - text contrast, icon visibility
- [ ] Two modes section - card backgrounds not too dark/bright
- [ ] Subject showcase - icons and colored text readable
- [ ] Audience sections - tab indicators clear
- [ ] How it works - step numbers visible
- [ ] Footer - consistent with page styling
- [ ] All buttons - proper hover/active states

**Visual Polish**
- [ ] Panda scholar icon: check visibility on dark background
- [ ] Card borders: subtle but visible
- [ ] Shadows: adjust for dark mode (lighter shadows)
- [ ] Screenshots/images: ensure borders for definition
- [ ] Section dividers: subtle separation

**Transitions**
- [ ] Smooth transition when toggling dark mode
- [ ] No flashing or jarring color changes
- [ ] Color variables properly defined

## Current Status
- ✅ Basic dark mode variables defined in `globals.css`
- ✅ Emerald primary color has dark mode variant
- ❌ Need to test all sections thoroughly
- ❌ May need adjustments for specific components

## Acceptance Criteria
- [ ] All sections look good in dark mode
- [ ] Color contrast ratios verified (use DevTools)
- [ ] Emerald primary color works on dark backgrounds
- [ ] Panda icon visible and clear
- [ ] Card backgrounds have proper contrast
- [ ] No readability issues
- [ ] Screenshots/images have proper borders
- [ ] Smooth toggle transitions
- [ ] Tested on multiple devices/browsers
- [ ] No accessibility warnings in audit

## Files to Modify
- `src/app/page.tsx` (adjust dark: classes as needed)
- `src/app/globals.css` (only if color variables need tweaking)

## Testing Tools
- Chrome DevTools: Rendering > Emulate prefers-color-scheme: dark
- Contrast checker: https://coolors.co/contrast-checker
- Lighthouse audit: Check accessibility score
- axe DevTools: Check for contrast issues

## Implementation Notes

**Current Dark Mode Variables (globals.css):**
```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 142.1 70.6% 45.3%; /* Emerald */
  --card: 217.2 32.6% 17.5%;
  /* ... */
}
```

**Common Patterns:**
```tsx
// Text with dark mode
className="text-gray-900 dark:text-gray-100"

// Backgrounds
className="bg-white dark:bg-gray-800"

// Borders
className="border-gray-200 dark:border-gray-700"

// Subtle backgrounds
className="bg-gray-50 dark:bg-gray-900"
```

**Panda Icon:**
- If icon not visible, consider adding light background circle
- Or use CSS filter/mix-blend-mode for adaptation
