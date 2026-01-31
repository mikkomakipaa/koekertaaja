# Task: Add unlock conditions to badge definitions

## Context

- Why this is needed: Students see locked badges but have no idea how to unlock them. Adding unlock conditions data enables tooltips to explain requirements.
- Related docs/links: Part of Badge Tooltips improvement (1 pt total)
- Related files:
  - `src/hooks/useBadges.ts` - Badge definition data

## Scope

- In scope:
  - Add unlockConditions array to BadgeDefinition interface
  - Write clear, actionable unlock conditions for all 11 badges
  - Use Finnish language for conditions
  - Ensure conditions match actual unlock logic

- Out of scope:
  - UI for displaying conditions (separate task)
  - Changing unlock logic
  - Badge icons or descriptions

## Changes

- [ ] Update BadgeDefinition interface to include unlockConditions: string[]
- [ ] Add unlock conditions for all 11 badges:
  - First session: "Suorita ensimmäinen harjoitussessiosi"
  - Perfect score: "Saa 100% pisteistä yhdessä sessiossa"
  - 3-streak: "Vastaa 3 kysymykseen oikein peräkkäin"
  - 5-streak: "Vastaa 5 kysymykseen oikein peräkkäin"
  - 10-streak: "Vastaa 10 kysymykseen oikein peräkkäin"
  - Practitioner (5 sessions): "Suorita 5 harjoitussessiota"
  - Diligent (10 sessions): "Suorita 10 harjoitussessiota"
  - Master (25 sessions): "Suorita 25 harjoitussessiota"
  - Speed demon: "Suorita sessio alle 5 minuutissa"
  - Personal best: "Saa enemmän pisteitä kuin aiempi ennätyksesi" + "Vaatii vähintään 2 suoritettua sessiota"
  - Versatile: "Kokeile molempia vaikeustasoja (Helppo ja Normaali)"

## Acceptance Criteria

- [ ] BadgeDefinition interface includes unlockConditions: string[]
- [ ] All 11 badges have unlockConditions array populated
- [ ] Conditions are clear and actionable (student knows what to do)
- [ ] Finnish language used for all conditions
- [ ] Conditions accurately match actual unlock logic in useBadges.ts
- [ ] Multiple conditions shown as array items (e.g., personal best has 2 conditions)
- [ ] TypeScript types updated and compile without errors

## Testing

- [ ] Tests to run:
  - Verify all badges have unlockConditions
  - Check Finnish language correctness
  - Compare conditions to unlock logic
  - TypeScript compilation

- [ ] New/updated tests:
  - Type check for unlockConditions field
  - Verify all badges have at least one condition
