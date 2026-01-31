# Task: Replace emojis with icons and align Create page with design guidelines

## Context

- The Create page uses emoji labels (📌📚📝🎴📊🔢) while the rest of the app uses Phosphor icons.
- Design guidelines favor consistent iconography and visual language.

## Scope

- In scope:
  - Replace emojis with Phosphor icons already used elsewhere.
  - Ensure labels and headers align with the current design system.
  - Keep layout and copy intact unless needed for alignment.
- Out of scope:
  - Major layout redesign.
  - Copy rewrites unrelated to icon replacement.

## Changes

- [ ] Update `src/app/create/page.tsx` labels to use Phosphor icons instead of emojis.
- [ ] Ensure icon sizing/weights match existing UI patterns.
- [ ] Remove emoji characters from section headings and helper text.

## Acceptance Criteria

- [ ] No emoji characters remain on the Create page.
- [ ] Icons render consistently with other pages (size, weight, color).
- [ ] Visual hierarchy is unchanged or improved.

## Testing

- [ ] Manual: Open Create page and verify all sections use icons.
