# Task 06: Add Screenshots or Mockups to Landing Page

**Status:** 🔴 Not Started
**Priority:** P2 (Polish)
**Estimate:** 3 points

## Goal
Add visual examples showing quiz mode and flashcard mode in action to help users understand what to expect.

## Requirements

### Screenshots Needed
1. **Quiz mode in action**
   - Show question with multiple choice options
   - Display score, streak, or progress indicator
   - Should look appealing and clear

2. **Flashcard mode in action**
   - Show a flashcard with question or answer
   - Display navigation or flip action
   - Show the calm, focused interface

### Technical Requirements
- **Format:** WebP for modern browsers, PNG fallback
- **Optimization:** Compress images (use sharp, imagemin, or online tools)
- **Sizing:**
  - Mobile: max 400px width
  - Desktop: max 600px width
- **Loading:** Use lazy loading (Next.js Image component)
- **Aspect ratio:** Maintain original, use object-fit if needed

### Placement Options
**Option A:** In "Two Modes" section
- Side-by-side with mode descriptions
- Visual proof of what each mode offers

**Option B:** Separate "See it in action" section
- Dedicated showcase area
- Larger screenshots with captions

## Current Status
- ❌ Not implemented yet
- Need to capture screenshots first

## Acceptance Criteria
- [ ] Quiz mode screenshot captured and optimized
- [ ] Flashcard mode screenshot captured and optimized
- [ ] Images compressed (WebP format, <200KB each)
- [ ] Added to landing page with Next.js Image component
- [ ] Lazy loading enabled
- [ ] Proper alt text for accessibility
- [ ] Responsive sizing (smaller on mobile)
- [ ] Dark mode compatible (consider borders/shadows)
- [ ] Images don't cause layout shift (width/height specified)

## Files to Create/Modify
- Capture screenshots and save to: `public/screenshots/`
  - `quiz-mode.png` (and `.webp`)
  - `flashcard-mode.png` (and `.webp`)
- Modify: `src/app/page.tsx` (add images to appropriate section)

## Implementation Notes
- Use Next.js Image component for automatic optimization
- Consider adding subtle border or shadow for definition
- Screenshots should show real content (not placeholder text)
- Ensure no personal/sensitive information in screenshots
- Test image loading performance with Lighthouse
- Add loading="lazy" for images below the fold
