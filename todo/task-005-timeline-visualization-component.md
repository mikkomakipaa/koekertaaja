# Task: Create Timeline Visualization Component

## Context

- Why this is needed:
  - User wants horizontal timeline view for chronological ordering questions
  - Visual timeline better represents historical events, scientific processes
  - Enhances learning by showing temporal relationships spatially

- Related docs/links:
  - `/src/components/questions/SequentialQuestion.tsx` (current implementation)
  - `/DWF/design/DESIGN_SYSTEM.md` (colors, spacing, accessibility)
  - User decision: Timeline view for history/chronology questions

- Related files:
  - New: `/src/components/questions/TimelineView.tsx` (to be created)
  - Existing: `/src/components/questions/SequentialQuestion.tsx` (will integrate)
  - `/src/types/questions.ts` (types for timeline items with years)

## Scope

- In scope:
  - Create reusable `TimelineView` component for horizontal timeline display
  - Support items with optional year indicators
  - Draggable items OR arrow controls for reordering on timeline
  - Visual markers (dots/circles) for events on timeline
  - Responsive design (desktop: horizontal, mobile: vertical timeline)
  - Year labels displayed on timeline
  - Color-coded feedback (green=correct position, red=incorrect)
  - Dark mode support
  - Accessibility (ARIA labels, keyboard navigation)

- Out of scope:
  - AI prompt changes (Task 007)
  - Type/schema changes (Task 006)
  - Integration with SequentialQuestion (Task 008)
  - Database changes (keeping JSONB structure)

## Changes

- [ ] Create `/src/components/questions/TimelineView.tsx`
- [ ] Define `TimelineViewProps` interface
  - `items: Array<{text: string, year?: number}>`
  - `currentOrder: number[]`
  - `correctOrder: number[]`
  - `showExplanation: boolean`
  - `onOrderChange: (newOrder: number[]) => void`
  - `disabled?: boolean`
- [ ] Implement horizontal timeline layout
  - Timeline line (CSS or SVG)
  - Event markers (circular dots)
  - Year labels (positioned above/below timeline)
  - Item text (positioned near markers)
- [ ] Implement vertical timeline for mobile (<640px)
- [ ] Add drag-and-drop OR arrow controls for reordering
  - Prefer arrows (consistent with existing UI)
  - Consider drag-and-drop as enhancement
- [ ] Add visual feedback states
  - Pending: purple markers
  - Correct: green markers
  - Incorrect: red markers
- [ ] Add Phosphor icons (Clock, CalendarBlank for timeline theme)
- [ ] Ensure WCAG AAA contrast ratios
- [ ] Add dark mode styles

## Acceptance Criteria

- [ ] TimelineView component renders horizontally on desktop (>640px)
- [ ] TimelineView component renders vertically on mobile (<640px)
- [ ] Items with years display year labels
- [ ] Items without years display on timeline without year labels
- [ ] Users can reorder items (arrows or drag-and-drop)
- [ ] Visual feedback shows correct/incorrect positions after submission
- [ ] Component supports 3-8 items (matching validation schema)
- [ ] Dark mode styling matches design system
- [ ] Keyboard navigation works (tab, arrow keys)
- [ ] Screen reader announces item positions and year information
- [ ] Component is reusable (not coupled to SequentialQuestion)

## Testing

- [ ] Tests to run:
  - Manual: Render with 4 historical events (with years)
  - Manual: Render with 5 process steps (without years)
  - Manual: Test on mobile viewport (375px)
  - Manual: Test on desktop viewport (1280px)
  - Manual: Test dark mode toggle
  - Manual: Test keyboard navigation (tab, arrows)
  - Manual: Screen reader test (VoiceOver/NVDA)

- [ ] New/updated tests:
  - Unit test: Items render in correct positions
  - Unit test: Year labels display when present
  - Unit test: Order changes propagate to parent
  - Visual regression test (optional)

## Implementation Notes

**Component Structure:**
```typescript
interface TimelineItem {
  text: string;
  year?: number;
}

interface TimelineViewProps {
  items: TimelineItem[];
  currentOrder: number[];
  correctOrder: number[];
  showExplanation: boolean;
  onOrderChange: (newOrder: number[]) => void;
  disabled?: boolean;
}

export function TimelineView({ items, currentOrder, ... }: TimelineViewProps) {
  // Render timeline
}
```

**Desktop Layout (Horizontal):**
```
Year:    1917        1939        1952        1995
         ⬤-----------⬤-----------⬤-----------⬤
       Item 1      Item 2      Item 3      Item 4
       [↑↓]        [↑↓]        [↑↓]        [↑↓]
```

**Mobile Layout (Vertical):**
```
1917  ⬤ Item 1 [↑↓]
      |
1939  ⬤ Item 2 [↑↓]
      |
1952  ⬤ Item 3 [↑↓]
      |
1995  ⬤ Item 4 [↑↓]
```

**CSS Approach:**
```css
.timeline-container {
  display: flex;
  flex-direction: column; /* Mobile first */
  gap: 1rem;
}

@media (min-width: 640px) {
  .timeline-container {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.timeline-line {
  /* Vertical line on mobile, horizontal on desktop */
  border-left: 2px solid var(--color-purple);
}

@media (min-width: 640px) {
  .timeline-line {
    border-left: none;
    border-top: 2px solid var(--color-purple);
    width: 100%;
  }
}

.timeline-marker {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-purple);
}

.timeline-marker--correct {
  background: var(--color-green);
}

.timeline-marker--incorrect {
  background: var(--color-red);
}
```

**Arrow Controls:**
- Desktop (horizontal): Left/Right arrows
- Mobile (vertical): Up/Down arrows
- Disabled at start/end positions
- Phosphor icons: `<CaretLeft />`, `<CaretRight />`, `<CaretUp />`, `<CaretDown />`

**Year Display:**
- Position: Above timeline marker (desktop), left of marker (mobile)
- Font: Bold, 14px (desktop), 12px (mobile)
- Color: text-gray-700 dark:text-gray-300
- Optional: Only show if `item.year` exists

**Accessibility:**
```typescript
<div
  role="list"
  aria-label="Timeline with chronological events"
>
  {currentOrder.map((itemIndex, position) => (
    <div
      key={itemIndex}
      role="listitem"
      aria-label={`Position ${position + 1}: ${items[itemIndex].text}${items[itemIndex].year ? `, Year ${items[itemIndex].year}` : ''}`}
    >
      {/* Timeline item */}
    </div>
  ))}
</div>
```

**States:**
- **Pending** (before submission): Purple markers, arrows enabled
- **Correct** (after submission): Green marker if in correct position
- **Incorrect** (after submission): Red marker if in wrong position
- **Disabled** (after submission): Arrows disabled, no reordering

**Items Without Years:**
- Timeline still displays horizontally/vertically
- Markers evenly spaced
- No year labels shown
- Text labels still displayed

**Spacing Calculation:**
For items with years, calculate spacing proportionally:
```typescript
// Sort items by year to get min/max range
const years = items.map(item => item.year).filter(Boolean);
const minYear = Math.min(...years);
const maxYear = Math.max(...years);
const yearRange = maxYear - minYear;

// Position each item proportionally
const getPosition = (year: number) => {
  return ((year - minYear) / yearRange) * 100; // Percentage
};
```

**Alternative Simpler Approach:**
- Equal spacing regardless of year difference (simpler, less accurate)
- Just display year labels without proportional positioning
- Easier to implement, still educational
