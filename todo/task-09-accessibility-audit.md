# Task 09: Accessibility Audit and Improvements

**Status:** 🔴 Not Started
**Priority:** P2 (Polish)
**Estimate:** 3 points

## Goal
Comprehensive accessibility review and improvements for the landing page to ensure WCAG AA compliance and excellent screen reader experience.

## Requirements

### 1. Semantic HTML
- [ ] Proper heading hierarchy (h1 → h2 → h3, no skipping)
- [ ] Use semantic elements (section, article, nav, main)
- [ ] Add landmark roles where appropriate
- [ ] Lists use proper `<ul>`, `<ol>`, or `<li>` elements
- [ ] Buttons vs links: buttons for actions, links for navigation

### 2. ARIA Labels & Attributes
- [ ] Icon-only buttons have aria-label
- [ ] Complex interactions have aria-describedby
- [ ] Tab components use proper ARIA (aria-selected, aria-controls)
- [ ] Accordion uses proper ARIA (aria-expanded)
- [ ] Screen reader announcements are clear
- [ ] No redundant ARIA (don't over-label)

### 3. Keyboard Navigation
- [ ] All interactive elements keyboard accessible
- [ ] Focus states visible (ring, outline, or custom)
- [ ] Tab order is logical (matches visual order)
- [ ] No keyboard traps
- [ ] Skip to content link (optional, if page is long)
- [ ] Enter/Space activate buttons
- [ ] Arrow keys work for tabs/accordions

### 4. Color Contrast (WCAG AA)
- [ ] Body text: 4.5:1 ratio minimum
- [ ] Large text (18px+ or 14px+ bold): 3:1 ratio
- [ ] Emerald on white: verify contrast
- [ ] Emerald on dark background: verify contrast
- [ ] Links have 3:1 contrast with surrounding text
- [ ] Icon colors meet 3:1 ratio
- [ ] Focus indicators: 3:1 contrast

### 5. Images & Icons
- [ ] All images have descriptive alt text
- [ ] Decorative images use alt=""
- [ ] Icons have proper labels (aria-label or visually-hidden text)
- [ ] Panda scholar image has meaningful alt text
- [ ] Screenshots have descriptive alt text

### 6. Forms & Interactive Elements
- [ ] Buttons have clear, descriptive text
- [ ] No "click here" or vague labels
- [ ] Interactive elements min 44x44px (mobile touch targets)
- [ ] Error messages are clear and associated with inputs
- [ ] Status messages use aria-live if dynamic

## Testing Checklist

### Automated Testing
- [ ] Run Lighthouse accessibility audit (target: 90-100)
- [ ] Run axe DevTools scan (target: 0 violations)
- [ ] Check color contrast with DevTools or online tool
- [ ] Validate HTML (W3C validator)

### Manual Testing
- [ ] Test keyboard-only navigation (no mouse)
- [ ] Test with screen reader (VoiceOver on Mac, NVDA on Windows)
- [ ] Test with browser zoom (200%, 400%)
- [ ] Test with high contrast mode
- [ ] Test on mobile with TalkBack/VoiceOver

### Browser/Device Testing
- [ ] Chrome + ChromeVox
- [ ] Safari + VoiceOver (Mac/iOS)
- [ ] Firefox + NVDA (Windows)
- [ ] Mobile Safari + VoiceOver (iOS)
- [ ] Chrome + TalkBack (Android)

## Current Status
- ✅ Basic semantic HTML in place
- ✅ Some ARIA labels exist
- ❌ Comprehensive audit not yet done
- ❌ Screen reader testing not done

## Acceptance Criteria
- [ ] Lighthouse accessibility score: 90-100
- [ ] axe DevTools: 0 violations, 0 warnings
- [ ] All color contrast ratios verified and pass WCAG AA
- [ ] Keyboard navigation works flawlessly
- [ ] Screen reader announces all content clearly
- [ ] Focus states visible on all interactive elements
- [ ] No accessibility regressions on mobile
- [ ] Documentation updated with a11y notes

## Files to Modify
- `src/app/page.tsx` (main landing page)
- Any landing page components created

## Tools & Resources

**Testing Tools:**
- Lighthouse (Chrome DevTools)
- axe DevTools (browser extension)
- WAVE (browser extension)
- Color Contrast Checker: https://coolors.co/contrast-checker
- W3C HTML Validator: https://validator.w3.org/

**Screen Readers:**
- Mac: VoiceOver (Cmd+F5)
- Windows: NVDA (free) or JAWS
- iOS: VoiceOver (Settings > Accessibility)
- Android: TalkBack (Settings > Accessibility)

**Guidelines:**
- WCAG 2.1 AA: https://www.w3.org/WAI/WCAG21/quickref/
- WebAIM: https://webaim.org/resources/

## Implementation Notes

**Common Fixes:**
```tsx
// Icon-only button
<button aria-label="Close menu">
  <X size={24} />
</button>

// Decorative image
<Image src="/decorative.png" alt="" role="presentation" />

// Focus visible
className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"

// Skip to content
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to content
</a>
```

**Heading Hierarchy:**
```tsx
<h1>Koekertaaja</h1>          // Page title
<h2>Kaksi tapaa harjoitella</h2>  // Section title
<h3>Tietovisat</h3>           // Subsection
```
