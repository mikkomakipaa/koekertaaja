# Task 02: Create Two Modes Section with Visual Comparison

**Status:** 🔴 Not Started
**Priority:** P0 (MVP - Essential)
**Estimate:** 3 points

## Goal
Visually explain the two study modes (Quiz vs Flashcards) with clear differentiation and color coding.

## Requirements

### Section Structure
- **Section title:** "Kaksi tapaa harjoitella"
- Two side-by-side cards (stack on mobile)
- Cards have distinct visual identity with color coding

### Tietovisat (Quiz Mode) Card
- **Icon:** GameController (indigo color - #4f46e5)
- **Title:** "Tietovisat"
- **Description:** "Testaa tietosi monivalintatehtävillä, täydennys- ja muilla kysymyksillä. Kerää pisteitä ja rakenna putkia!"
- **Features list:**
  - Pisteet
  - Putket
  - Saavutukset

### Kortit (Flashcard Mode) Card
- **Icon:** Cards (teal color - #14b8a6)
- **Title:** "Kortit"
- **Description:** "Harjoittele aktiivista muistamista korttiharjoittelulla. Opettele uutta rauhalliseen tahtiin."
- **Features list:**
  - Toista niin monta kertaa kuin haluat
  - Oma tahti
  - Ei painetta

### Visual Design
- Cards use rounded-xl borders
- Subtle shadows on hover
- Icons should be duotone weight, size 32px
- Grid layout: 1 column (mobile), 2 columns (tablet+)
- Proper spacing between cards (gap-4 or gap-6)

## Current Status
- ❌ Basic features list exists but not visually separated by mode
- ❌ Missing clear visual distinction between quiz and flashcard
- ❌ No color coding by mode type

## Acceptance Criteria
- [ ] Section clearly separates Quiz and Flashcard modes
- [ ] Each mode has distinct color (indigo vs teal)
- [ ] Cards are side-by-side on tablet/desktop
- [ ] Cards stack vertically on mobile
- [ ] Icons are properly sized and colored
- [ ] Descriptions are clear and concise
- [ ] Features listed with proper formatting
- [ ] Dark mode styling works
- [ ] Hover effects are subtle and smooth

## Files to Modify
- `src/app/page.tsx` (lines 44-91 - refactor features section)

## Implementation Notes
- Replace current flat features list with two distinct cards
- Use Card component from `@/components/ui/card` if available
- Keep existing icons (GameController, Cards) from Phosphor
- Consider extracting to separate component if complex
- Maintain mobile-first approach
