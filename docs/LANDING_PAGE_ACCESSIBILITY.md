# Landing Page Accessibility Notes

## Scope
- Applies to the marketing landing page at `/` (`src/app/page.tsx`) and its supporting components.

## Implemented Improvements
- Semantic landmarks: skip link, `<main>` region, and section headings with `aria-labelledby`.
- Navigation semantics: in-page jumps use links, action-only controls use buttons.
- Visible focus: custom links and accordion buttons have focus-visible rings with offset.
- Screen reader clarity: decorative icons are `aria-hidden`, helper text is referenced with `aria-describedby`.
- Keyboard support: accordion supports Arrow Up/Down plus Home/End to switch sections.
- Touch targets: primary in-page links meet 44x44px minimum.

## Manual Verification Checklist
- Keyboard-only navigation across CTA, in-page links, tabs, and accordion.
- VoiceOver announcements for headings, tabs, and accordion expand/collapse.
- Contrast checks for emerald text and focus indicators in light and dark themes.
- Zoom at 200% and 400% to confirm layout and focus visibility.

## Recommended Tooling
- Lighthouse accessibility audit (target 90-100).
- axe DevTools scan (0 violations).
