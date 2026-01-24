# Task: Add Year Indicator Support to Sequential Questions

## Context

- Why this is needed:
  - User wants explicit year field for chronological questions
  - Timeline visualization (Task 005) needs year data
  - Cleaner than parsing years from text
  - Enables proportional timeline spacing

- Related docs/links:
  - `/src/types/questions.ts` (SequentialQuestion interface)
  - `/src/lib/validation/schemas.ts` (aiQuestionSchema)
  - User decision: Explicit year field, keep JSONB structure

- Related files:
  - `/src/types/questions.ts` (update SequentialQuestion type)
  - `/src/lib/validation/schemas.ts` (update validation)
  - `/src/lib/ai/questionGenerator.ts` (parse AI response)
  - `/src/lib/supabase/write-queries.ts` (JSONB storage)

## Scope

- In scope:
  - Update `SequentialQuestion` type to support items with optional years
  - Update Zod validation schema for year fields
  - Ensure backward compatibility (years are optional)
  - Keep JSONB database structure (no migration)
  - Update question parsing logic in questionGenerator.ts

- Out of scope:
  - Database migration (keeping JSONB)
  - Timeline component implementation (Task 005)
  - AI prompt changes (Task 007)
  - UI integration (Task 008)

## Changes

- [ ] Update `/src/types/questions.ts`:
  - Define `SequentialItem` interface with `text` and optional `year`
  - Update `SequentialQuestion` interface to use `SequentialItem[]`
  - Maintain backward compatibility with `string[]` items

- [ ] Update `/src/lib/validation/schemas.ts`:
  - Add validation for `items` as array of objects with `text` and optional `year`
  - Validate year is a reasonable number (e.g., 1000-3000)
  - Accept both old format (`string[]`) and new format (`SequentialItem[]`)
  - Update superRefine logic for sequential questions

- [ ] Update `/src/lib/ai/questionGenerator.ts`:
  - Parse AI response for sequential items (handle both formats)
  - Convert to `SequentialItem[]` format before storing

- [ ] Update `/src/lib/supabase/write-queries.ts`:
  - Ensure JSONB correctly stores items with year fields
  - No schema changes (JSONB handles nested objects)

- [ ] Update existing components to handle both formats gracefully:
  - `/src/components/questions/SequentialQuestion.tsx` (temporary, full update in Task 008)
  - Add type guard to detect item format

## Acceptance Criteria

- [ ] `SequentialQuestion` type supports items as `SequentialItem[]`
- [ ] Items can have optional `year?: number` field
- [ ] Validation accepts both old (`string[]`) and new (`SequentialItem[]`) formats
- [ ] Year validation ensures reasonable values (1000-3000 range)
- [ ] AI-generated questions with years parse correctly
- [ ] Existing sequential questions without years still work
- [ ] TypeScript compilation passes (`npm run typecheck`)
- [ ] No breaking changes to existing question data

## Testing

- [ ] Tests to run:
  - `npm run typecheck` (TypeScript validation)
  - Manual: Create question with years (text + year)
  - Manual: Create question without years (text only)
  - Manual: Load existing sequential question (backward compatibility)

- [ ] New/updated tests:
  - Unit test: Validation accepts string[] format (old)
  - Unit test: Validation accepts SequentialItem[] format (new)
  - Unit test: Year validation rejects invalid years (<1000, >3000)
  - Unit test: Question parsing handles both formats

## Implementation Notes

**Type Definitions (`types/questions.ts`):**
```typescript
// New: Item with optional year
export interface SequentialItem {
  text: string;
  year?: number;
}

// Updated: Support both formats
export interface SequentialQuestion extends BaseQuestion {
  question_type: 'sequential';
  items: SequentialItem[];  // New format (preferred)
  correct_order: number[];  // Unchanged
}

// Helper type guard
export function isSequentialItemArray(items: any): items is SequentialItem[] {
  return Array.isArray(items) && items.every(
    item => typeof item === 'object' && 'text' in item
  );
}

export function isStringArray(items: any): items is string[] {
  return Array.isArray(items) && items.every(item => typeof item === 'string');
}
```

**Validation Schema Updates (`schemas.ts`):**
```typescript
export const aiQuestionSchema = z.object({
  // ... existing fields
  items: z.union([
    // New format: Array of objects with text + optional year
    z.array(z.object({
      text: z.string().min(1, 'Item text must not be empty').max(500),
      year: z.number().int().min(1000).max(3000).optional()
    })).min(3).max(8),
    // Old format: Array of strings (backward compatibility)
    z.array(z.string()).min(3).max(8)
  ]).optional(),
  // ... rest of schema
}).superRefine((data, ctx) => {
  // ... existing validations

  if (data.type === 'sequential') {
    // Items validation (new logic)
    if (!data.items || data.items.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Sequential questions must have at least 3 items',
        path: ['items'],
      });
    }

    // Normalize items to count length
    const itemCount = Array.isArray(data.items)
      ? data.items.length
      : 0;

    if (!data.correct_order || data.correct_order.length !== itemCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Sequential correct_order must match items length',
        path: ['correct_order'],
      });
    }
  }
});
```

**Question Generator Parsing (`questionGenerator.ts`):**
```typescript
// In generateQuestions() after AI response parsing
const normalizedQuestions = parsedQuestions.map(q => {
  if (q.type === 'sequential' && q.items) {
    // Convert old format (string[]) to new format (SequentialItem[])
    if (typeof q.items[0] === 'string') {
      q.items = q.items.map(text => ({ text }));
    }
  }
  return q;
});
```

**Database Storage (No Changes Needed):**
JSONB `correct_answer` field already handles nested objects:
```json
{
  "items": [
    {"text": "Suomen itsenäistyminen", "year": 1917},
    {"text": "Talvisota alkoi", "year": 1939},
    {"text": "Helsinki olympialaiset", "year": 1952},
    {"text": "Suomi liittyi EU:hun", "year": 1995}
  ],
  "correct_order": [0, 1, 2, 3]
}
```

**Backward Compatibility:**
Old questions stored as:
```json
{
  "items": ["Item 1", "Item 2", "Item 3"],
  "correct_order": [0, 1, 2]
}
```

Will be converted to:
```json
{
  "items": [
    {"text": "Item 1"},
    {"text": "Item 2"},
    {"text": "Item 3"}
  ],
  "correct_order": [0, 1, 2]
}
```

**Component Compatibility (Temporary Fix):**
In `SequentialQuestion.tsx`, add type guard:
```typescript
// Helper to normalize items
const normalizeItems = (items: string[] | SequentialItem[]): SequentialItem[] => {
  if (typeof items[0] === 'string') {
    return (items as string[]).map(text => ({ text }));
  }
  return items as SequentialItem[];
};

// Use in component
const normalizedItems = normalizeItems(question.items);
```

**Year Validation Rules:**
- Minimum: 1000 (reasonable historical range)
- Maximum: 3000 (allow future events for science fiction, far future scenarios)
- Optional: Not all sequential questions need years
- Integer only (no decimal years)

**Error Messages:**
- "Item text must not be empty"
- "Year must be between 1000 and 3000"
- "Sequential questions must have at least 3 items"
- "Sequential correct_order must match items length"
