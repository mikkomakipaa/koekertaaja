# Map Question Accessibility Testing Guide

## Overview

This document provides a comprehensive checklist for testing the accessibility of map questions in Koekertaaja. The implementation follows WCAG 2.1 AA standards and includes keyboard navigation, screen reader support, and text-based fallback modes.

---

## Testing Requirements

### Browser Support
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### Screen Readers to Test
- **macOS/iOS**: VoiceOver
- **Windows**: NVDA (free), JAWS (if available)
- **Android**: TalkBack
- **Chrome**: ChromeVox extension

### Devices
- Desktop/laptop (all browsers)
- Tablet (iPad, Android)
- Mobile phone (iPhone, Android)

---

## Accessibility Testing Checklist

### 1. Keyboard Navigation

#### Region Selection (Button Mode)

- [ ] **Tab Navigation**
  - Press Tab to navigate between region buttons
  - All region buttons are reachable via Tab
  - Focus indicator is clearly visible (blue ring)
  - Tab order follows a logical sequence (left-to-right, top-to-bottom)

- [ ] **Arrow Key Navigation**
  - Arrow Down/Right moves focus to next region
  - Arrow Up/Left moves focus to previous region
  - Home key moves to first region
  - End key moves to last region
  - Focus wraps around (last → first when pressing Down)

- [ ] **Selection Keys**
  - Enter key selects/deselects focused region
  - Space key selects/deselects focused region
  - Visual feedback when region is selected

- [ ] **Escape Key**
  - Escape key clears all selections (multi-select mode)
  - No errors or unexpected behavior

- [ ] **Alphanumeric Quick Navigation**
  - Pressing 'f' jumps to "Finland" (first match)
  - Pressing 's' jumps to "Sweden" (first match)
  - Works for all first letters

#### Text Fallback Mode

- [ ] **Search Input**
  - Tab focuses on search input
  - Type to filter regions
  - Arrow Down/Up navigates filtered results
  - Enter selects highlighted region

- [ ] **Dropdown Navigation**
  - All regions in dropdown are keyboard accessible
  - Arrow keys navigate dropdown items
  - Enter selects item
  - Escape closes dropdown

- [ ] **Selected Regions**
  - Tab to selected region chips (multi-select)
  - Tab to remove button (×)
  - Enter/Space removes region

#### Map Controls

- [ ] **Zoom Controls**
  - Tab to zoom in button
  - Tab to zoom out button
  - Enter/Space activates zoom
  - Focus indicator visible

- [ ] **Mode Toggle**
  - Tab to "Tekstivalinta" / "Näytä kartta" button
  - Enter/Space toggles between map and text mode
  - Focus remains on toggle button after switch

---

### 2. Screen Reader Support

#### VoiceOver (macOS/iOS)

**Test Setup:**
- macOS: Cmd+F5 to enable VoiceOver
- iOS: Settings → Accessibility → VoiceOver → On

**Tests:**

- [ ] **Map Image Announcement**
  - VoiceOver announces map alt text
  - Description includes instruction (e.g., "Interactive map with 5 regions")

- [ ] **Region Button Announcements**
  - Each button announces region name
  - Selection state announced ("selected" or not)
  - Correct/incorrect state announced (in review mode)
  - Example: "Finland, button, selected, correct answer"

- [ ] **Focus Change Announcements**
  - Moving between regions announces new region name
  - Selection change announces action: "Finland selected. 3 regions selected."

- [ ] **ARIA Live Region**
  - Live announcements work for selection changes
  - No duplicate or excessive announcements

- [ ] **Text Fallback Mode**
  - Search input announced with label
  - Dropdown role announced: "listbox"
  - Each region option announced
  - Selected state announced
  - Filter results announced: "5 results available"

#### NVDA (Windows)

**Test Setup:**
- Download NVDA from https://www.nvaccess.org/
- Install and launch
- Use Insert+Q to quit

**Tests:**

- [ ] **Region Buttons**
  - NVDA announces button role
  - Region name announced
  - Selection state announced (aria-pressed)
  - Navigate with arrow keys in browse mode

- [ ] **Map Description**
  - NVDA reads map alt text
  - aria-describedby content announced

- [ ] **Text Fallback Search**
  - Input field label announced
  - Combobox role announced
  - Autocomplete behavior announced

- [ ] **Keyboard Commands**
  - Tab navigation works correctly
  - Virtual cursor (arrow keys) works in forms mode
  - Focus mode (Insert+Space) enables interaction

#### JAWS (Windows)

**Test Setup:**
- JAWS is commercial software (40-minute demo available)
- Similar testing to NVDA

**Tests:**

- [ ] Region button announcements work
- [ ] ARIA attributes properly announced
- [ ] Live regions update correctly
- [ ] Forms mode interactions work

---

### 3. Focus Indicators

#### Visual Focus Testing

- [ ] **Light Mode**
  - Blue ring visible on focused region button
  - Ring has sufficient contrast (3:1 minimum)
  - Ring does not overlap text
  - Ring visible on all interactive elements

- [ ] **Dark Mode**
  - Focus ring visible in dark theme
  - Contrast sufficient against dark background
  - Color does not rely solely on blue (accessibility for color blindness)

- [ ] **High Contrast Mode (Windows)**
  - Open Settings → Ease of Access → High Contrast
  - Enable high contrast theme
  - Focus indicators still visible
  - All interactive elements distinguishable

- [ ] **Focus Order**
  - Focus order is logical and predictable
  - No focus traps (can escape all elements)
  - Skip links work if implemented

---

### 4. Text Fallback Mode

#### Functionality

- [ ] **Toggle Button**
  - "Tekstivalinta" button visible
  - Clicking toggles to text mode
  - Button label changes to "Näytä kartta"
  - Map/text content swaps correctly

- [ ] **Search Functionality**
  - Type query to filter regions
  - Fuzzy matching works (e.g., "finl" matches "Finland")
  - Empty search shows all regions
  - No results message displays correctly

- [ ] **Multi-Select**
  - Multiple regions can be selected
  - Selected regions display as chips below input
  - Chip remove (×) button works
  - Clear all functionality (if applicable)

- [ ] **Single-Select**
  - Only one region can be selected
  - Previous selection cleared when new region selected
  - Selected region displays below input

- [ ] **Aliases**
  - Search for "Suomi" finds "Finland"
  - All aliases in question data work

---

### 5. Automated Accessibility Testing

#### axe DevTools

**Setup:**
- Install axe DevTools extension (Chrome/Firefox)
- Navigate to map question page
- Open DevTools → axe DevTools tab
- Click "Scan ALL of my page"

**Acceptance Criteria:**
- [ ] **0 Critical Issues**
- [ ] **0 Serious Issues**
- [ ] **0 Moderate Issues** (or documented/justified)
- [ ] Common issues to check:
  - All images have alt text
  - All form inputs have labels
  - Color contrast passes (4.5:1 for text, 3:1 for UI)
  - All interactive elements have accessible names
  - ARIA attributes valid and used correctly

#### Lighthouse Accessibility Audit

**Setup:**
- Open Chrome DevTools
- Navigate to Lighthouse tab
- Select "Accessibility" only
- Click "Analyze page load"

**Acceptance Criteria:**
- [ ] **Accessibility Score ≥ 95/100**
- [ ] Review flagged issues
- [ ] Fix or justify any deductions

#### WAVE (WebAIM)

**Setup:**
- Install WAVE extension or use online tool
- Navigate to map question page
- Run analysis

**Checks:**
- [ ] No errors reported
- [ ] All alerts reviewed and justified
- [ ] Proper heading structure
- [ ] Form labels present
- [ ] ARIA usage correct

---

### 6. Mobile Accessibility

#### iOS VoiceOver

**Test Procedure:**
1. Enable VoiceOver: Settings → Accessibility → VoiceOver
2. Navigate to map question in Safari
3. Swipe right/left to navigate regions
4. Double-tap to select region
5. Test text fallback mode

**Checks:**
- [ ] All regions announced correctly
- [ ] Selection state announced
- [ ] Text fallback search works with VoiceOver
- [ ] No focus traps or navigation issues

#### Android TalkBack

**Test Procedure:**
1. Enable TalkBack: Settings → Accessibility → TalkBack
2. Navigate to map question in Chrome
3. Swipe to navigate regions
4. Double-tap to select

**Checks:**
- [ ] Similar to iOS VoiceOver tests
- [ ] Gestures work correctly
- [ ] No navigation issues

---

### 7. Color Contrast and Visual Accessibility

#### Color Contrast Ratios (WCAG AA)

Use Chrome DevTools Contrast Checker or WebAIM Contrast Checker.

- [ ] **Text on Backgrounds**
  - Normal text: ≥ 4.5:1 contrast
  - Large text (≥18pt or 14pt bold): ≥ 3:1 contrast
  - Region labels on map: sufficient contrast

- [ ] **Interactive Elements**
  - Button text: ≥ 4.5:1 contrast
  - Focus indicators: ≥ 3:1 contrast
  - Selected state colors: ≥ 3:1 contrast

- [ ] **Correct/Incorrect Indicators**
  - Green (correct): not solely relying on color (icon included)
  - Red (incorrect): not solely relying on color (icon included)
  - Patterns/icons supplement color

#### Color Blindness Simulation

**Tools:**
- Chrome DevTools → Rendering → Emulate vision deficiencies
- Test with Protanopia, Deuteranopia, Tritanopia

**Checks:**
- [ ] Selected regions distinguishable (not just color change)
- [ ] Correct/incorrect regions identifiable (icons present)
- [ ] Focus indicators visible

---

### 8. Reduced Motion

#### Test Procedure

**macOS:**
- System Preferences → Accessibility → Display → Reduce motion

**Windows:**
- Settings → Ease of Access → Display → Show animations in Windows

**CSS Media Query:**
```css
@media (prefers-reduced-motion: reduce) {
  /* Animations disabled */
}
```

**Checks:**
- [ ] No unnecessary animations
- [ ] Transitions reduced or removed
- [ ] No auto-playing animations
- [ ] Critical interactions still work without animation

---

## Test Scenarios

### Scenario 1: Single Region Selection (Keyboard Only)

**Steps:**
1. Load map question with single region selection
2. Tab to first region button
3. Press Arrow Down to navigate to third region
4. Press Enter to select
5. Verify selection visual feedback
6. Press Tab to next question button

**Expected:**
- All steps work without mouse
- Focus visible at all times
- Selection announced by screen reader
- Can complete question with keyboard only

### Scenario 2: Multi-Region Selection (Screen Reader)

**Steps:**
1. Enable VoiceOver/NVDA
2. Navigate to map question
3. Hear map description
4. Navigate to region buttons
5. Hear each region name and state
6. Select 3 regions with Enter
7. Hear announcement: "3 regions selected"
8. Submit answer

**Expected:**
- All interactions announced clearly
- Selection state always announced
- No confusion about current state
- Can complete question with screen reader only

### Scenario 3: Text Fallback Mode

**Steps:**
1. Load map question
2. Click "Tekstivalinta" button
3. Type "norja" in search
4. See Norway in results
5. Select Norway
6. Verify selection displayed
7. Remove selection with × button
8. Toggle back to map view

**Expected:**
- All steps work smoothly
- Search filters correctly
- Selection state clear
- No loss of state when toggling modes

---

## Common Issues and Fixes

### Issue: Focus indicator not visible
**Fix:** Ensure `outline` or `box-shadow` has sufficient contrast and outlineOffset

### Issue: Screen reader not announcing selection
**Fix:** Add `aria-live="polite"` region with status updates

### Issue: Keyboard navigation skips regions
**Fix:** Check `tabIndex` is set correctly; use 0 for focusable, -1 for not

### Issue: Text fallback dropdown not closing
**Fix:** Add click-outside handler or Escape key listener

### Issue: High contrast mode colors broken
**Fix:** Use `@media (prefers-contrast: high)` and test in Windows HC mode

---

## Compliance Checklist

### WCAG 2.1 Level AA Criteria

- [x] **1.1.1 Non-text Content**: All images have alt text
- [x] **1.3.1 Info and Relationships**: Proper ARIA roles and labels
- [x] **1.4.3 Contrast (Minimum)**: 4.5:1 for text, 3:1 for UI
- [x] **2.1.1 Keyboard**: All functionality accessible via keyboard
- [x] **2.1.2 No Keyboard Trap**: Can escape all interactive elements
- [x] **2.4.3 Focus Order**: Logical and predictable
- [x] **2.4.7 Focus Visible**: Visible focus indicator always present
- [x] **3.2.1 On Focus**: No unexpected context changes
- [x] **3.3.2 Labels or Instructions**: All inputs have labels
- [x] **4.1.2 Name, Role, Value**: Proper ARIA for all controls
- [x] **4.1.3 Status Messages**: ARIA live regions for dynamic updates

---

## Resources

### Tools
- **axe DevTools**: https://www.deque.com/axe/devtools/
- **WAVE**: https://wave.webaim.org/
- **Lighthouse**: Built into Chrome DevTools
- **NVDA Screen Reader**: https://www.nvaccess.org/
- **Color Contrast Analyzer**: https://www.tpgi.com/color-contrast-checker/

### Guidelines
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
- **WebAIM**: https://webaim.org/

### Testing Guides
- **VoiceOver Guide**: https://webaim.org/articles/voiceover/
- **NVDA Guide**: https://webaim.org/articles/nvda/
- **Mobile Accessibility**: https://www.w3.org/WAI/standards-guidelines/mobile/

---

## Sign-Off

- [ ] All manual tests passed
- [ ] All automated tests passed (axe, Lighthouse)
- [ ] Tested with screen readers (VoiceOver, NVDA)
- [ ] Tested on mobile devices
- [ ] No accessibility regressions
- [ ] Documentation updated

**Tester:** _______________
**Date:** _______________
**Notes:** _______________
