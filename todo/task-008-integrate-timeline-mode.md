# Task: Integrate Timeline Mode into SequentialQuestion Component

## Context

- Why this is needed:
  - Connect TimelineView component (Task 005) to SequentialQuestion
  - Auto-detect when to show timeline vs list view
  - Support both year-based and non-year-based sequential questions
  - Provide seamless UX across different question types

- Related docs/links:
  - Task 005: TimelineView component (must be completed first)
  - Task 006: Year indicator types (must be completed first)
  - `/src/components/questions/SequentialQuestion.tsx` (current implementation)
  - User decision: Timeline mode based on question data, not subject

- Related files:
  - `/src/components/questions/SequentialQuestion.tsx` (update)
  - `/src/components/questions/TimelineView.tsx` (created in Task 005)
  - `/src/types/questions.ts` (updated in Task 006)

## Scope

- In scope:
  - Update SequentialQuestion to support both list and timeline views
  - Auto-detect view mode based on whether items have year fields
  - Pass props to TimelineView component
  - Maintain backward compatibility with existing list-based questions
  - Ensure answer checking works for both modes
  - Keep all existing features (shuffle, visual feedback, explanation)

- Out of scope:
  - Creating TimelineView component (Task 005)
  - Type/schema changes (Task 006)
  - AI prompt changes (Task 007)

## Changes

- [ ] Update `/src/components/questions/SequentialQuestion.tsx`:
  - Import TimelineView component
  - Import SequentialItem type
  - Add auto-detection logic for timeline vs list mode
  - Render TimelineView when items have years
  - Render current list view when items don't have years
  - Normalize items to SequentialItem[] format (backward compatibility)
  - Pass correct props to both components
  - Ensure state management works for both views
  - Keep existing shuffle logic
  - Keep existing answer checking logic

## Acceptance Criteria

- [ ] SequentialQuestion automatically shows timeline view for questions with years
- [ ] SequentialQuestion automatically shows list view for questions without years
- [ ] Both views share same state (currentOrder, showExplanation)
- [ ] Both views use same answer checking logic
- [ ] Backward compatibility: old questions (string[] items) render as list view
- [ ] New questions with years render as timeline view
- [ ] Visual feedback (correct/incorrect) works in both views
- [ ] Correct order display (after wrong answer) works in both views
- [ ] TypeScript compilation passes (`npm run typecheck`)
- [ ] No visual regression in existing list view behavior

## Testing

- [ ] Tests to run:
  - Manual: Load question with years → should show timeline
  - Manual: Load question without years → should show list
  - Manual: Load old question (string[] items) → should show list
  - Manual: Answer correctly in timeline view → green markers
  - Manual: Answer incorrectly in timeline view → red markers, show correct order
  - Manual: Answer correctly in list view → green badges
  - Manual: Answer incorrectly in list view → red badges, show correct order
  - Manual: Test on mobile viewport (both views responsive)
  - `npm run typecheck`

- [ ] New/updated tests:
  - Unit test: Auto-detection logic chooses timeline when years present
  - Unit test: Auto-detection logic chooses list when no years
  - Unit test: Item normalization handles string[] format
  - Unit test: Item normalization handles SequentialItem[] format

## Implementation Notes

**Auto-Detection Logic:**
```typescript
// Detect if items have year fields
const hasYears = question.items.some(item =>
  typeof item === 'object' && 'year' in item && item.year !== undefined
);

const displayMode: 'list' | 'timeline' = hasYears ? 'timeline' : 'list';
```

**Item Normalization:**
```typescript
// Helper to normalize items to SequentialItem[] format
const normalizeItems = (items: string[] | SequentialItem[]): SequentialItem[] => {
  // Old format: string[]
  if (typeof items[0] === 'string') {
    return (items as string[]).map(text => ({ text }));
  }
  // New format: SequentialItem[]
  return items as SequentialItem[];
};

const normalizedItems = normalizeItems(question.items);
```

**Component Structure:**
```typescript
export function SequentialQuestion({
  question,
  userAnswer,
  showExplanation,
  onAnswerChange,
}: SequentialQuestionProps) {
  const [currentOrder, setCurrentOrder] = useState<number[]>([]);

  // Normalize items
  const normalizedItems = normalizeItems(question.items);

  // Auto-detect display mode
  const displayMode = normalizedItems.some(item => item.year !== undefined)
    ? 'timeline'
    : 'list';

  // Initialize: shuffle items on mount
  useEffect(() => {
    if (userAnswer && userAnswer.length > 0) {
      setCurrentOrder(userAnswer);
    } else {
      const indices = normalizedItems.map((_, i) => i);
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setCurrentOrder(indices);
      onAnswerChange(indices);
    }
  }, [normalizedItems]);

  // Move handlers (shared by both views)
  const moveUp = (index: number) => {
    if (index === 0 || showExplanation) return;
    const newOrder = [...currentOrder];
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    setCurrentOrder(newOrder);
    onAnswerChange(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === currentOrder.length - 1 || showExplanation) return;
    const newOrder = [...currentOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setCurrentOrder(newOrder);
    onAnswerChange(newOrder);
  };

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <div className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-start gap-2">
        <ListNumbers size={24} weight="duotone" className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
        <MathText>{question.question_text}</MathText>
      </div>

      {/* Render Timeline or List View */}
      {displayMode === 'timeline' ? (
        <TimelineView
          items={normalizedItems}
          currentOrder={currentOrder}
          correctOrder={question.correct_order}
          showExplanation={showExplanation}
          onOrderChange={onAnswerChange}
          onMoveUp={moveUp}
          onMoveDown={moveDown}
        />
      ) : (
        <ListView
          items={normalizedItems}
          currentOrder={currentOrder}
          correctOrder={question.correct_order}
          showExplanation={showExplanation}
          onMoveUp={moveUp}
          onMoveDown={moveDown}
        />
      )}

      {/* Correct Order Display (shared, after wrong answer) */}
      {showExplanation && JSON.stringify(currentOrder) !== JSON.stringify(question.correct_order) && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-600 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Oikea järjestys:
          </h4>
          <ol className="space-y-2">
            {question.correct_order.map((itemIndex, position) => {
              const item = normalizedItems[itemIndex];
              return (
                <li key={position} className="flex items-start gap-2 text-blue-900 dark:text-blue-100">
                  <span className="font-bold">{position + 1}.</span>
                  {item.year && <span className="font-semibold text-blue-700 dark:text-blue-300">{item.year} -</span>}
                  <MathText>{item.text}</MathText>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
```

**Extract List View to Separate Component (Optional Refactor):**
```typescript
// ListView component (extracted from current implementation)
interface ListViewProps {
  items: SequentialItem[];
  currentOrder: number[];
  correctOrder: number[];
  showExplanation: boolean;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

function ListView({ items, currentOrder, correctOrder, showExplanation, onMoveUp, onMoveDown }: ListViewProps) {
  // Current list rendering logic (lines 74-153 of SequentialQuestion.tsx)
  // Extract and clean up
}
```

**Shared State Management:**
- `currentOrder` state managed in parent (SequentialQuestion)
- Both ListView and TimelineView receive same state
- Both views call same `onMoveUp`/`onMoveDown` handlers
- Answer checking happens in parent component

**Props to Pass to TimelineView:**
```typescript
<TimelineView
  items={normalizedItems}           // SequentialItem[] with text + optional year
  currentOrder={currentOrder}       // Current order indices [2, 0, 1, 3]
  correctOrder={question.correct_order}  // Correct order indices
  showExplanation={showExplanation} // Whether to show feedback
  onOrderChange={onAnswerChange}    // Callback when order changes
  onMoveUp={moveUp}                 // Move item up callback
  onMoveDown={moveDown}             // Move item down callback
/>
```

**Backward Compatibility Test:**
Old question from database:
```json
{
  "items": ["Item A", "Item B", "Item C"],
  "correct_order": [0, 1, 2]
}
```

Should:
1. Normalize to `[{text: "Item A"}, {text: "Item B"}, {text: "Item C"}]`
2. Detect no years → use list view
3. Render exactly as before (no visual change)

**New Question from AI:**
```json
{
  "items": [
    {"text": "Suomi itsenäistyi", "year": 1917},
    {"text": "Talvisota alkoi", "year": 1939}
  ],
  "correct_order": [0, 1]
}
```

Should:
1. Keep as SequentialItem[]
2. Detect years present → use timeline view
3. Render horizontal timeline with year markers

**Error Handling:**
- If items is undefined → show error message
- If items.length < 3 → show error message (should be caught by validation)
- If correct_order.length !== items.length → show error message
- Gracefully handle mixed formats (some items with years, some without)

**Future Enhancement (Out of Scope):**
- Manual toggle between timeline/list view (user preference)
- Animate transitions when items move
- Drag-and-drop support in timeline view
