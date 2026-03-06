# Plan: Front Page Dashboard Revision

## Goal

Revise the public front page at `/` so it behaves like a clean product dashboard rather than a marketing page.

## Target Outcome

- Keep the page public.
- Reduce marketing emphasis and preview-heavy presentation.
- Align CTA behavior with the Play page mental model.
- Remove large preview screenshots from the mode cards.
- Preserve the "Kenelle Koekertaaja on?" section at the bottom.
- Keep the page visually consistent with existing Koekertaaja surfaces.

## Desired Information Architecture

1. Header / hero
2. Unified primary CTA
3. Mode selection cards
4. Audience section at the bottom

## Implementation Notes

- Reuse existing design primitives instead of introducing a separate landing style system.
- Use Play-page-compatible CTA logic for unfinished quiz / flashcard continuation where possible.
- Keep the front page lightweight and mobile-first.
- Avoid product-copy bloat and decorative mockups.

## Key Files

- [page.tsx](/Users/mikko.makipaa/koekertaaja/src/app/page.tsx)
- [AudienceTabs.tsx](/Users/mikko.makipaa/koekertaaja/src/components/landing/AudienceTabs.tsx)
- [ARIATabBar.tsx](/Users/mikko.makipaa/koekertaaja/src/components/layout/ARIATabBar.tsx)
- [page.tsx](/Users/mikko.makipaa/koekertaaja/src/app/play/page.tsx)
- [DESIGN_GUIDELINES.md](/Users/mikko.makipaa/koekertaaja/DWF/DESIGN_GUIDELINES.md)
- [USER_JOURNEYS.md](/Users/mikko.makipaa/koekertaaja/DWF/USER_JOURNEYS.md)
- [LANDING_PAGE_ACCESSIBILITY.md](/Users/mikko.makipaa/koekertaaja/plans/docs-archive/LANDING_PAGE_ACCESSIBILITY.md)

## Task Breakdown

1. Replace the current hero/CTA area with a cleaner dashboard-style entry section and unified CTA behavior.
2. Replace screenshot preview cards with simpler mode cards that match the Play-page action language.
3. Validate layout consistency, mobile behavior, and accessibility expectations for the revised public page.
