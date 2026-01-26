# Task 01: Implement Hero Section with Clear Value Proposition

**Status:** 🟡 In Progress
**Priority:** P0 (MVP - Essential)
**Estimate:** 2 points

## Goal
Create a compelling hero section that immediately answers "What is this?" and "Is this for me?"

## Requirements

### Content Structure
- **Headline:** "Koekertaaja" with panda scholar icon ✅ (already done)
- **Sub-headline:** "Harjoittele kokeisiin ja opi uutta - Luokat 4-6"
- **Quick facts with checkmarks:**
  - ✓ Matematiikka, Äidinkieli, Ympäristöoppi
  - ✓ Kaksi harjoittelutapaa: Tietovisat & Kortit
- **Primary CTA:** Large emerald button "Aloita harjoittelu" ✅ (already done)
- **Secondary navigation:** Scroll links to audience sections (Oppilaille | Huoltajille)

### Visual Design
- Mobile-first layout
- Centered content (max-width: 2xl)
- Proper spacing (mb-12 for sections)
- Checkmark icons (use Phosphor Icons: Check or CheckCircle)
- Emerald color for primary elements

## Current Status
- ✅ Basic hero with panda icon and title exists
- ✅ Primary CTA button styled with emerald
- ❌ Missing sub-headline with grade levels
- ❌ Missing quick facts section
- ❌ Missing secondary navigation links

## Acceptance Criteria
- [ ] Sub-headline clearly states "Luokat 4-6"
- [ ] Quick facts section with checkmarks displays subjects
- [ ] Quick facts section shows two practice modes
- [ ] Secondary navigation links scroll smoothly to sections
- [ ] Mobile responsive (stacks vertically, readable on small screens)
- [ ] Dark mode looks good
- [ ] Proper semantic HTML (h1, h2, etc.)

## Files to Modify
- `src/app/page.tsx` (lines 24-31)

## Implementation Notes
- Use Phosphor Icons for checkmarks
- Ensure proper heading hierarchy (h1 for title, p for subtitle)
- Add smooth scroll behavior for navigation links
- Keep spacing consistent with existing design
