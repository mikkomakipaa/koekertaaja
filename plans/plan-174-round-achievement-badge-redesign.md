## Goal

Replace the current rectangular achievement badge cards on the Results and Achievements pages with a denser round-token badge system that feels collectible, keeps titles visible, and reduces visual weight. Tighten the Results page hierarchy so the header reads like a section header, the stat row has clearer emphasis, and the badge collection becomes the visual reward center.

## Why

- Current badges read more like buttons/cards than collectible achievements.
- The rectangular treatment takes too much space on both Results and Achievements pages.
- Locked and unlocked states are readable, but the visual language is heavier than the refreshed shell guidelines.
- A shared badge-token component will reduce duplication between Results and Achievements.
- The Results header currently reads like a detached floating card and visually competes with the achievement content.
- The Results stat cards are too equal in weight, which weakens scan hierarchy.

## Scope

- Shared badge token presentation for unlocked, locked, and highlighted/rare states.
- Results page header, stat row, and badges tab.
- Achievements page badge collection grid.
- Alignment with `DWF/DESIGN_GUIDELINES.md` for shell consistency, density, and restrained surface styling.

## Out of Scope

- Badge unlock logic.
- Badge definitions, names, descriptions, or conditions.
- Celebration modal redesign unless required for consistency by the implementation task.
- New progress-ring functionality.

## Implementation Direction

1. Extract the rectangular badge presentation into a shared round-token presentation API.
2. Keep `BadgeDisplay` as the interaction/details wrapper, but make its children/state styling compatible with circular tokens.
3. Redesign the Results header to behave like a restrained section header instead of a floating feature card.
4. Make the Results stat row clearer by giving numeric values stronger emphasis while keeping the cards within the shell style.
5. Render badges in a denser responsive grid with centered title labels below the circle.
6. Make locked badges subdued but readable, using a lock overlay and lower-emphasis ring/background.
7. Allow special/high-value badges to use a stronger ring/glow treatment only if that styling already exists in `badgeStyles` or can be mapped safely.

## Target Surfaces

- `src/app/play/achievements/page.tsx`
- `src/components/play/ResultsScreen.tsx`
- `src/components/badges/BadgeDisplay.tsx`
- any new shared badge-token presenter if needed under `src/components/badges/`

## Validation Focus

- Mobile density improvement versus current rectangular cards.
- Results header feels integrated into the page rather than detached from it.
- Results stat cards have a clearer hierarchy, especially for values.
- Titles remain visible without the badge body becoming a button-like card.
- Locked badges remain understandable.
- Tooltips/dialog details from `BadgeDisplay` still work.
- Dark and light mode contrast stays within the refreshed design guidelines.
