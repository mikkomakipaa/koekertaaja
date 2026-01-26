# Task 03: Add Subject Areas Showcase Section

**Status:** 🔴 Not Started
**Priority:** P0 (MVP - Essential)
**Estimate:** 3 points

## Goal
Show what subjects and topics can be practiced with clear visual hierarchy and appealing layout.

## Requirements

### Section Structure
- **Section title:** "Mitä voit harjoitella?"
- Visual grid/list of subjects with icons and topics

### Subjects & Topics

**📐 Matematiikka (Blue)**
- Laskutoimitukset
- Geometria
- Ongelmanratkaisu

**✏️ Äidinkieli (Rose/Pink)**
- Kielioppi
- Luetun ymmärtäminen
- Sanaluokat

**🌍 Ympäristöoppi (Green)**
- Suomen maantiede
- Historia
- Yhteiskuntaoppi

### Additional Elements
- "... ja paljon muuta!" teaser text
- Optional: Link to browse all question sets

### Visual Design
- Grid layout: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Each subject is a card or bordered section
- Large emoji or icon for each subject
- Topic bullets or list below subject name
- Rounded corners (rounded-xl)
- Subtle background color variations per subject

## Current Status
- ❌ Not implemented yet
- Note: Subjects are mentioned in proposal but not on current landing page

## Acceptance Criteria
- [ ] Section title is clear and prominent
- [ ] All three subjects displayed with icons
- [ ] 3-4 example topics per subject
- [ ] Grid layout responsive (1/2/3 columns)
- [ ] Color coding per subject (blue/rose/green)
- [ ] "... ja paljon muuta!" teaser included
- [ ] Dark mode styling works well
- [ ] Proper spacing and visual hierarchy
- [ ] Accessible (semantic HTML, proper contrast)

## Files to Modify
- `src/app/page.tsx` (add new section after "Two Modes" section)

## Implementation Notes
- Use emojis for subject icons or Phosphor Icons alternatives
- Color scheme:
  - Matematiikka: text-blue-600 dark:text-blue-400
  - Äidinkieli: text-rose-600 dark:text-rose-400
  - Ympäristöoppi: text-green-600 dark:text-green-400
- Keep consistent with existing card styling
- Consider using grid with gap-6 for spacing
- Optional: Add hover effects on cards
