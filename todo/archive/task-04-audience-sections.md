# Task 04: Create Audience-Specific Sections

**Status:** 🔴 Not Started
**Priority:** P1 (Enhanced)
**Estimate:** 5 points

## Goal
Create tabs or accordion sections that speak directly to different audiences (pupils and guardians) with tailored messaging and tone.

## Requirements

### UI Pattern
- **Desktop (md+):** Tabs with horizontal navigation
- **Mobile:** Accordion or stacked sections
- Smooth transitions between tabs
- Active tab indicator (underline or background)

### Section: Oppilaille (For Pupils)
**Tone:** Fun, encouraging, kid-friendly

**Content:**
- 🎯 **Valmistaudu kokeisiin**
  - Harjoittele omaan tahtiin ennen koetta

- 🎮 **Opi hauskasti**
  - Kerää pisteitä, rakenna putkia ja avaa saavutuksia

- 📚 **Opettele missä vain**
  - Puhelimella, tabletilla tai tietokoneella

- ✨ **Saat välitöntä palautetta**
  - Kertaa virheet ja opi niistä

**Icons:** Target, GameController, DeviceMobile, Sparkle

### Section: Huoltajille (For Guardians)
**Tone:** Professional, trustworthy, value-focused

**Content:**
- ✓ **Turvallinen ympäristö**
  - Ei mainoksia, ei häiriöitä. Keskity oppimiseen.

- ✓ **Opetussuunnitelman mukaan**
  - Sisällöt tukevat koulun opetusta

- ✓ **Suunniteltu tukemaan oppimista**
  - Selitykset auttavat ymmärtämään asian

- ✓ **Seuranta ja edistyminen**
  - Näe lapsesi harjoittelun tulokset ja edistyminen

**Icons:** ShieldCheck, BookOpenText, BrainCircuit, ChartLineUp

## Current Status
- ❌ Not implemented yet
- This is a new major section

## Acceptance Criteria
- [ ] Tab navigation works smoothly on desktop
- [ ] Accordion or stacked sections work on mobile
- [ ] Content tone matches audience (fun vs professional)
- [ ] All icons properly imported and displayed
- [ ] Active tab has clear visual indicator
- [ ] Keyboard accessible (tab through, enter to select)
- [ ] Screen reader friendly (proper ARIA labels)
- [ ] Dark mode styling works
- [ ] Smooth animations (200-300ms)
- [ ] Mobile touch-friendly (44px+ touch targets)

## Files to Create/Modify
- `src/app/page.tsx` (add new section)
- Optional: `src/components/landing/AudienceTabs.tsx` (if extracting component)

## Implementation Notes
- Consider using Radix UI Tabs or Accordion for accessibility
- Icons: Use Phosphor Icons with duotone weight
- Color scheme: Keep neutral, use emerald for active state
- Spacing: Generous padding for readability
- Respect prefers-reduced-motion for animations
- May need to install additional packages for tabs/accordion
