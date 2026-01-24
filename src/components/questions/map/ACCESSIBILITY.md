# Map Question Accessibility Documentation

## Overview

Map questions in Koekertaaja are designed to be fully accessible, meeting WCAG 2.1 AA compliance standards. This document describes the accessibility features implemented and how to use them.

---

## Accessibility Features

### 1. Keyboard Navigation

All map interactions are fully accessible via keyboard:

#### Button-Based Region Selection

**Navigation Keys:**
- `Tab` / `Shift+Tab` - Move between region buttons
- `Arrow Down` / `Arrow Right` - Move focus to next region
- `Arrow Up` / `Arrow Left` - Move focus to previous region
- `Home` - Move focus to first region
- `End` - Move focus to last region
- `Enter` / `Space` - Select/deselect focused region
- `Escape` - Clear all selections (multi-select mode)
- Alphanumeric keys - Quick jump to region by first letter

**Example:**
```typescript
// Keyboard event handler
const { handleKeyDown } = useKeyboardNavigation({
  regions: accessibleRegions,
  focusedIndex: focusedRegionIndex,
  onFocusChange: setFocusedRegionIndex,
  onRegionSelect: handleToggleRegion,
  disabled: showExplanation,
  multiSelect: isMultiSelect,
});
```

#### Text Fallback Mode

- `Tab` - Focus search input
- Type to filter regions
- `Arrow Down` / `Arrow Up` - Navigate dropdown results
- `Enter` - Select highlighted region
- `Escape` - Close dropdown

---

### 2. Screen Reader Support

#### ARIA Attributes

All interactive elements include proper ARIA attributes:

```tsx
<Button
  role="button"
  aria-pressed={isSelected}  // For multi-select
  aria-current={isSelected}  // For single-select
  aria-label="Finland, selected, correct answer"
  tabIndex={isFocused ? 0 : -1}
>
  Finland
</Button>
```

#### Live Regions

Dynamic changes are announced to screen readers:

```tsx
<LiveRegion message={announcement} politeness="polite" />

// Announcements:
// "Finland valittu. 3 aluetta valittuna."
// "Norway poistettu valinnasta. 2 aluetta valittuna."
```

#### Map Image Descriptions

```tsx
<img
  src={mapAsset}
  alt="Kartta, valitse kaikki sopivat alueet"
  aria-describedby="map-description"
/>
<div id="map-description" className="sr-only">
  Interactive map with 5 regions. Use arrow keys to navigate.
</div>
```

#### SVG Maps (for interactive TopoJSON maps)

```tsx
<svg role="img" aria-labelledby="map-title map-desc">
  <title id="map-title">Map of Europe</title>
  <desc id="map-desc">
    Interactive map showing countries in Europe.
    Navigate with arrow keys, select with Enter.
  </desc>
  {/* Map content */}
</svg>
```

---

### 3. Text-Based Fallback Mode

Users can toggle between visual map and searchable text list:

**Features:**
- **Searchable dropdown** with fuzzy matching
- **Keyboard-accessible** autocomplete
- **Selected regions displayed** as removable chips
- **Works with screen readers**

**Usage:**
```tsx
<TextFallbackMode
  regions={textFallbackRegions}
  selectedRegionIds={selectedRegions}
  onSelectionChange={onAnswerChange}
  multiSelect={isMultiSelect}
  disabled={showExplanation}
  showResults={showExplanation}
  label="Valitse kaikki sopivat alueet"
/>
```

**Toggle Button:**
```tsx
<Button onClick={() => setUseTextMode(!useTextMode)}>
  {useTextMode ? (
    <>
      <MapTrifold /> Näytä kartta
    </>
  ) : (
    <>
      <ListBullets /> Tekstivalinta
    </>
  )}
</Button>
```

---

### 4. Focus Indicators

All interactive elements have visible focus indicators:

**CSS:**
```css
/* Focus ring with high contrast */
.focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .focus-visible {
    outline-color: #60a5fa;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .focus-visible {
    outline-width: 4px;
    outline-color: Highlight;
  }
}
```

**Component Usage:**
```tsx
<Button
  className={cn(
    "border-2",
    isFocused && "ring-2 ring-blue-500 ring-offset-2"
  )}
/>
```

---

### 5. Color and Visual Accessibility

#### Color Contrast

All text meets WCAG AA contrast requirements:
- **Normal text**: 4.5:1 minimum
- **Large text**: 3:1 minimum
- **Interactive elements**: 3:1 minimum

#### Not Relying on Color Alone

Correct/incorrect states use both color AND icons:

```tsx
{showCorrect && (
  <>
    <span className="text-green-800">Finland</span>
    <CheckCircle className="text-green-600" />
  </>
)}

{showWrong && (
  <>
    <span className="text-red-800">Norway</span>
    <XCircle className="text-red-600" />
  </>
)}
```

#### Color Blindness Support

- Selection state indicated by border + background + icon
- Focus indicated by outline (not just color)
- Success/error states use icons (CheckCircle, XCircle)

---

### 6. Reduced Motion

Respects user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  .transition-all {
    transition: none !important;
  }

  .animate-* {
    animation: none !important;
  }
}
```

---

## Accessibility Hooks

### useKeyboardNavigation

Manages keyboard navigation for map regions.

**Parameters:**
```typescript
interface UseKeyboardNavigationParams {
  regions: AccessibleRegion[];      // List of regions
  focusedIndex: number;              // Currently focused region
  onFocusChange: (index: number) => void;
  onRegionSelect: (regionId: string) => void;
  disabled?: boolean;                // Disable interactions
  multiSelect?: boolean;             // Multi-select mode
}
```

**Returns:**
```typescript
{
  handleKeyDown: (event: React.KeyboardEvent) => void;
}
```

**Example:**
```tsx
const { handleKeyDown } = useKeyboardNavigation({
  regions: accessibleRegions,
  focusedIndex: 0,
  onFocusChange: setFocusedIndex,
  onRegionSelect: handleSelect,
});

<div onKeyDown={handleKeyDown}>
  {/* Map regions */}
</div>
```

---

### useScreenReaderAnnouncements

Manages screen reader announcements for state changes.

**Returns:**
```typescript
{
  announcement: string;
  announce: (message: string) => void;
}
```

**Example:**
```tsx
const { announcement, announce } = useScreenReaderAnnouncements();

const handleSelect = (regionId: string) => {
  // ... selection logic
  announce(`${regionName} valittu. ${count} aluetta valittuna.`);
};

return (
  <>
    <LiveRegion message={announcement} />
    {/* Map content */}
  </>
);
```

---

## Utility Functions

### getRegionAriaLabel

Generates comprehensive ARIA label for a region.

```typescript
function getRegionAriaLabel(
  region: AccessibleRegion,
  multiSelect: boolean
): string;

// Example output:
// "Finland, selected, press Enter or Space to toggle selection"
// "Norway, correct answer"
// "Sweden, incorrect"
```

### getMapAriaDescription

Generates map description for screen readers.

```typescript
function getMapAriaDescription(
  multiSelect: boolean,
  selectedCount: number
): string;

// Example output:
// "Interactive map with 3 regions selected. Use arrow keys to navigate..."
```

### getGeographyAccessibilityProps

Gets ARIA attributes for SVG Geography elements.

```typescript
const props = getGeographyAccessibilityProps(
  region,
  isFocused,
  multiSelect,
  onClick
);

<Geography {...props} />
```

---

## Components

### LiveRegion

Screen reader announcement component.

```tsx
<LiveRegion
  message="Finland valittu"
  politeness="polite"
/>

// Rendered:
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  Finland valittu
</div>
```

### FocusIndicator

Visual focus indicator overlay.

```tsx
<div className="relative">
  <Button>Finland</Button>
  <FocusIndicator isFocused={isFocused} />
</div>
```

### SvgAccessibilityWrapper

Adds accessibility to SVG maps.

```tsx
<SvgAccessibilityWrapper
  title="Map of Europe"
  description="Interactive map showing European countries"
  role="application"
>
  {/* SVG content */}
</SvgAccessibilityWrapper>
```

### SkipMapLink

Skip link for keyboard users.

```tsx
<SkipMapLink targetId="region-buttons">
  Skip map navigation
</SkipMapLink>

<div id="region-buttons">
  {/* Region buttons */}
</div>
```

---

## Testing Accessibility

### Automated Testing

Use axe DevTools or Lighthouse:

```bash
# Run Lighthouse accessibility audit
npm run lighthouse

# Or use axe-core in tests
import { axe, toHaveNoViolations } from 'jest-axe';

test('MapQuestion has no accessibility violations', async () => {
  const { container } = render(<MapQuestion {...props} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing

1. **Keyboard-only navigation**
   - Navigate entire question with keyboard
   - All interactive elements reachable
   - Focus visible at all times

2. **Screen reader testing**
   - Enable VoiceOver (Mac) or NVDA (Windows)
   - Navigate through map question
   - Verify all content announced
   - Verify state changes announced

3. **Text fallback mode**
   - Toggle to text mode
   - Search for regions
   - Select regions
   - Verify same functionality as map

---

## Best Practices

### When Creating Map Questions

1. **Always provide meaningful alt text** for map images
2. **Include region aliases** for search functionality
3. **Use descriptive region labels** (not codes)
4. **Test with keyboard only** before deploying
5. **Test with screen reader** at least once

### For Developers

1. **Never rely on color alone** for state indication
2. **Always include ARIA labels** for interactive elements
3. **Manage focus** when showing/hiding elements
4. **Announce dynamic changes** to screen readers
5. **Test with multiple screen readers** (VoiceOver, NVDA)

---

## Browser and Screen Reader Support

### Tested Combinations

| Browser | Screen Reader | Support |
|---------|---------------|---------|
| Chrome | NVDA | ✅ Full |
| Firefox | NVDA | ✅ Full |
| Edge | NVDA | ✅ Full |
| Safari | VoiceOver | ✅ Full |
| Chrome | ChromeVox | ✅ Full |
| iOS Safari | VoiceOver | ✅ Full |
| Chrome Android | TalkBack | ✅ Full |

---

## Troubleshooting

### Screen reader not announcing selections

**Check:**
- LiveRegion component is rendered
- `announcement` state is updating
- `aria-live` attribute is set to "polite" or "assertive"

**Fix:**
```tsx
const { announcement, announce } = useScreenReaderAnnouncements();

// Make sure to call announce() on selection
const handleSelect = (id: string) => {
  // ... selection logic
  announce(`Region selected: ${regionName}`);
};
```

### Focus not visible

**Check:**
- Focus indicator styles are applied
- `isFocused` state is correct
- Browser default outline not removed

**Fix:**
```tsx
className={cn(
  "border-2",
  isFocused && "ring-2 ring-blue-500 ring-offset-2"
)}
```

### Keyboard navigation not working

**Check:**
- `onKeyDown` handler is attached
- `tabIndex` is set correctly (0 for focusable, -1 for not)
- Event propagation not stopped

**Fix:**
```tsx
<div onKeyDown={handleKeyDown}>
  <Button tabIndex={isFocused ? 0 : -1}>
    Region
  </Button>
</div>
```

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [NVDA Screen Reader](https://www.nvaccess.org/)

---

## Changelog

### 2026-01-19 - Initial Implementation
- Keyboard navigation for region selection
- Screen reader announcements
- Text fallback mode
- ARIA attributes and roles
- Focus indicators
- High-contrast mode support
