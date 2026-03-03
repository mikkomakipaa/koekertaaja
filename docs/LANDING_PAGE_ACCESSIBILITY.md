# Landing Page Accessibility Notes

## Scope
- Applies to the public front page dashboard at `/` (`src/app/page.tsx`) and its supporting components.

## Implemented Improvements
- Semantic landmarks: skip link, `<main>` region, and section headings with `aria-labelledby`.
- Navigation semantics: in-page jumps use links, dashboard entry actions use buttons, and mode shortcuts use links.
- Mode selection is text-first: quiz and flashcard cards do not rely on preview screenshots or decorative mockup imagery.
- Visible focus: custom links, mode cards, and accordion buttons have focus-visible rings with offset.
- Screen reader clarity: decorative icons are `aria-hidden`, helper text is referenced with `aria-describedby`.
- Keyboard support: accordion supports Arrow Up/Down plus Home/End to switch sections and moves focus to the newly selected header.
- Touch targets: primary in-page links and CTAs meet the 48px minimum from the design system.

## Manual Verification Checklist
- Keyboard-only navigation across dashboard CTA, mode shortcuts, tabs, and accordion.
- VoiceOver announcements for headings, tabs, and accordion expand/collapse.
- Contrast checks for emerald text and focus indicators in light and dark themes.
- Zoom at 200% and 400% to confirm layout and focus visibility.

## Recommended Tooling
- Lighthouse accessibility audit (target 90-100).
- axe DevTools scan (0 violations).
