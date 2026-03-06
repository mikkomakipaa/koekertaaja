# Landing Page Accessibility Notes

## Scope
- Applies to the public front page dashboard at `/` (`src/app/page.tsx`) and its supporting components.

## Implemented Improvements
- Semantic landmarks: skip link, `<main>` region, and section headings with `aria-labelledby`.
- Navigation semantics: the dashboard hero exposes one primary button action, and the two mode cards remain direct links to the matching Play routes.
- Mode selection is text-first: quiz and flashcard cards do not rely on preview screenshots or decorative mockup imagery.
- Visible focus: custom links, mode cards, and accordion buttons have focus-visible rings with offset.
- Screen reader clarity: decorative icons are `aria-hidden`, helper text is referenced with `aria-describedby`, and hero/mode sections expose explicit headings.
- Keyboard support: desktop audience tabs use tab semantics, while the mobile accordion supports Arrow Up/Down plus Home/End and moves focus to the newly selected header.
- Touch targets: primary in-page links and CTAs meet the 48px minimum from the design system.

## Manual Verification Checklist
- Keyboard-only navigation across skip link, dashboard CTA, mode cards, desktop tabs, and mobile accordion.
- VoiceOver announcements for headings, tab state, and accordion expand/collapse state.
- Contrast checks for emerald text and focus indicators in light and dark themes.
- Zoom at 200% and 400% to confirm the single-CTA hero, stacked mode cards, and audience section remain readable with visible focus.

## Recommended Tooling
- Lighthouse accessibility audit (target 90-100).
- axe DevTools scan (0 violations).
