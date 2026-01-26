# Task 05: Add "How It Works" Section

**Status:** 🔴 Not Started
**Priority:** P1 (Enhanced)
**Estimate:** 2 points

## Goal
Create a simple 4-step guide showing users how to get started with the app.

## Requirements

### Section Structure
- **Section title:** "Näin se toimii"
- 4 numbered steps in clear sequence
- Clean, easy-to-scan layout

### Steps Content

**1️⃣ Valitse aihe**
- Selaa kysymyssarjoja luokittain ja aihealueittain

**2️⃣ Valitse tila**
- Tietovisat tai Kortit

**3️⃣ Aloita harjoittelu**
- Vastaa kysymyksiin ja opi

**4️⃣ Tarkista tulokset**
- Näe edistymisesi ja kerää saavutuksia

### Visual Design
- Mobile: Stack vertically with clear step numbers
- Desktop: Consider horizontal timeline or 2x2 grid
- Large, prominent step numbers (1-4)
- Icons for each step (optional but recommended)
- Proper spacing between steps
- Use emerald for step numbers or active states

### Optional Icons
- Step 1: FolderOpen or MagnifyingGlass
- Step 2: Swap or Cards
- Step 3: Play or PencilSimple
- Step 4: ChartBar or Trophy

## Current Status
- ❌ Not implemented yet

## Acceptance Criteria
- [ ] Section title is clear
- [ ] All 4 steps displayed in order
- [ ] Step numbers are prominent and styled
- [ ] Descriptions are concise and clear
- [ ] Mobile responsive (vertical stack)
- [ ] Desktop layout is clean (horizontal or grid)
- [ ] Optional icons enhance understanding
- [ ] Dark mode styling works
- [ ] Proper spacing and visual hierarchy
- [ ] Semantic HTML (ordered list recommended)

## Files to Modify
- `src/app/page.tsx` (add new section before final CTA)

## Implementation Notes
- Use `<ol>` (ordered list) for semantic HTML
- Style list numbers with custom CSS or use divs with aria-label
- Keep descriptions short (1-2 sentences max)
- Consider using CSS counters for step numbers
- Ensure step numbers are accessible (not decorative only)
- Maintain consistent spacing with other sections
