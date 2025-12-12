# Add Questions to Existing Question Set (One-Time Operation)

This guide shows how to add more questions to an existing question set using MCP Supabase tools.

---

## Step 1: Find Your Question Set

### Option A: Search by Code

```sql
SELECT id, code, name, subject, difficulty, mode, question_count, created_at
FROM question_sets
WHERE code = 'ABC123';  -- Replace with your 6-character code
```

### Option B: Search by Name

```sql
SELECT id, code, name, subject, difficulty, mode, question_count, created_at
FROM question_sets
WHERE name ILIKE '%search term%'
ORDER BY created_at DESC
LIMIT 10;
```

### Option C: List Recent Question Sets

```sql
SELECT id, code, name, subject, difficulty, mode, question_count, created_at
FROM question_sets
ORDER BY created_at DESC
LIMIT 20;
```

**📝 Save the `id` and current `question_count` - you'll need these!**

---

## Step 2: Check Current Questions

See what questions already exist and find the next `order_index`:

```sql
SELECT
  order_index,
  question_text,
  question_type,
  topic
FROM questions
WHERE question_set_id = 'YOUR_UUID_HERE'
ORDER BY order_index DESC
LIMIT 5;
```

**📝 Note the highest `order_index` - your new questions will start at `highest + 1`**

---

## Step 3: Insert New Questions

### Example: Add 3 New Questions

Assume:
- Question Set ID: `550e8400-e29b-41d4-a716-446655440000`
- Current question count: `15`
- Highest order_index: `14`
- New questions will be: `15`, `16`, `17`

```sql
-- Insert 3 new questions
INSERT INTO questions (
  question_set_id,
  question_text,
  question_type,
  topic,
  correct_answer,
  options,
  explanation,
  order_index
)
VALUES
  -- Question 1 (order_index = 15)
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Mikä on 25% luvusta 200?',
    'multiple_choice',
    'Prosenttilaskenta',
    '"50"'::jsonb,
    '["50", "40", "60", "45"]'::jsonb,
    '25% luvusta 200 = 200 × 0.25 = 50',
    15
  ),
  -- Question 2 (order_index = 16)
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Laske 10% luvusta 350',
    'fill_blank',
    'Prosenttilaskenta',
    '"35"'::jsonb,
    '{"acceptable_answers": ["35", "35.0"]}'::jsonb,
    '10% × 350 = 0.10 × 350 = 35',
    16
  ),
  -- Question 3 (order_index = 17)
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Onko 75% sama kuin 3/4?',
    'true_false',
    'Prosenttilaskenta',
    'true'::jsonb,
    NULL,
    'Kyllä! 75% = 75/100 = 3/4',
    17
  );
```

---

## Step 4: Update Question Count

After inserting questions, update the `question_count` in the question set:

```sql
-- Update question count
UPDATE question_sets
SET question_count = question_count + 3  -- Replace 3 with number of questions added
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

### Or Calculate Automatically

```sql
-- Automatically count and update
UPDATE question_sets
SET question_count = (
  SELECT COUNT(*)
  FROM questions
  WHERE question_set_id = question_sets.id
)
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

---

## Step 5: Verify Changes

### Check Updated Question Count

```sql
SELECT id, code, name, question_count
FROM question_sets
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

### List All Questions (including new ones)

```sql
SELECT
  order_index,
  question_text,
  question_type,
  topic
FROM questions
WHERE question_set_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY order_index;
```

### Check Topic Distribution

```sql
SELECT
  topic,
  COUNT(*) as question_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM questions WHERE question_set_id = '550e8400-e29b-41d4-a716-446655440000'), 1) as percentage
FROM questions
WHERE question_set_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY topic
ORDER BY question_count DESC;
```

---

## Complete Example: Using MCP Tools

### Using `execute_sql` Tool

```javascript
// Step 1: Find question set
const findResult = await mcp.execute_sql({
  query: "SELECT id, question_count FROM question_sets WHERE code = $1",
  params: ["ABC123"]
});

const questionSetId = findResult.rows[0].id;
const currentCount = findResult.rows[0].question_count;

// Step 2: Find next order_index
const orderResult = await mcp.execute_sql({
  query: `
    SELECT COALESCE(MAX(order_index), -1) + 1 as next_index
    FROM questions
    WHERE question_set_id = $1
  `,
  params: [questionSetId]
});

const nextIndex = orderResult.rows[0].next_index;

// Step 3: Insert new questions
const newQuestions = [
  {
    question: "Mikä on 25% luvusta 200?",
    type: "multiple_choice",
    topic: "Prosenttilaskenta",
    correct_answer: "50",
    options: ["50", "40", "60", "45"],
    explanation: "25% luvusta 200 = 200 × 0.25 = 50"
  },
  // ... more questions
];

for (let i = 0; i < newQuestions.length; i++) {
  const q = newQuestions[i];
  await mcp.execute_sql({
    query: `
      INSERT INTO questions (
        question_set_id, question_text, question_type, topic,
        correct_answer, options, explanation, order_index
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    params: [
      questionSetId,
      q.question,
      q.type,
      q.topic,
      JSON.stringify(q.correct_answer),
      JSON.stringify(q.options),
      q.explanation,
      nextIndex + i
    ]
  });
}

// Step 4: Update question count
await mcp.execute_sql({
  query: `
    UPDATE question_sets
    SET question_count = question_count + $1
    WHERE id = $2
  `,
  params: [newQuestions.length, questionSetId]
});

console.log(`Added ${newQuestions.length} questions to set ${questionSetId}`);
```

---

## Quick Reference: Question Type Templates

### Multiple Choice

```sql
INSERT INTO questions (question_set_id, question_text, question_type, topic, correct_answer, options, explanation, order_index)
VALUES (
  'YOUR_UUID',
  'Question text here?',
  'multiple_choice',
  'Topic Name',
  '"Correct Answer"'::jsonb,
  '["Option 1", "Option 2", "Option 3", "Option 4"]'::jsonb,
  'Explanation why this is correct',
  NEXT_ORDER_INDEX
);
```

### Fill Blank

```sql
INSERT INTO questions (question_set_id, question_text, question_type, topic, correct_answer, options, explanation, order_index)
VALUES (
  'YOUR_UUID',
  'Question with blank ___',
  'fill_blank',
  'Topic Name',
  '"correct answer"'::jsonb,
  '{"acceptable_answers": ["correct answer", "alternative"]}'::jsonb,
  'Explanation',
  NEXT_ORDER_INDEX
);
```

### True/False

```sql
INSERT INTO questions (question_set_id, question_text, question_type, topic, correct_answer, options, explanation, order_index)
VALUES (
  'YOUR_UUID',
  'Statement to evaluate',
  'true_false',
  'Topic Name',
  'true'::jsonb,  -- or 'false'::jsonb
  NULL,
  'Explanation',
  NEXT_ORDER_INDEX
);
```

### Matching

```sql
INSERT INTO questions (question_set_id, question_text, question_type, topic, correct_answer, options, explanation, order_index)
VALUES (
  'YOUR_UUID',
  'Match the items',
  'matching',
  'Topic Name',
  '["Item1-Match1", "Item2-Match2"]'::jsonb,
  '{
    "pairs": [
      {"left": "Item 1", "right": "Match 1"},
      {"left": "Item 2", "right": "Match 2"},
      {"left": "Item 3", "right": "Match 3"}
    ]
  }'::jsonb,
  'Explanation',
  NEXT_ORDER_INDEX
);
```

### Short Answer

```sql
INSERT INTO questions (question_set_id, question_text, question_type, topic, correct_answer, options, explanation, order_index)
VALUES (
  'YOUR_UUID',
  'Question requiring short answer',
  'short_answer',
  'Topic Name',
  '"Expected answer"'::jsonb,
  '{"acceptable_answers": ["answer", "alt"], "max_length": 100}'::jsonb,
  'Explanation',
  NEXT_ORDER_INDEX
);
```

### Sequential

```sql
INSERT INTO questions (question_set_id, question_text, question_type, topic, correct_answer, options, explanation, order_index)
VALUES (
  'YOUR_UUID',
  'Put these in order',
  'sequential',
  'Topic Name',
  '[0, 1, 2, 3]'::jsonb,
  '{
    "items": ["First", "Second", "Third", "Fourth"],
    "correct_order": [0, 1, 2, 3]
  }'::jsonb,
  'Explanation of correct order',
  NEXT_ORDER_INDEX
);
```

---

## Using Transaction (Recommended)

Wrap everything in a transaction to ensure consistency:

```sql
BEGIN;

-- 1. Get question set info
SELECT id, question_count FROM question_sets WHERE code = 'ABC123';

-- 2. Insert new questions
INSERT INTO questions (...) VALUES (...);
INSERT INTO questions (...) VALUES (...);
INSERT INTO questions (...) VALUES (...);

-- 3. Update count
UPDATE question_sets SET question_count = question_count + 3 WHERE id = 'UUID_HERE';

-- 4. Verify
SELECT question_count FROM question_sets WHERE id = 'UUID_HERE';

-- If everything looks good:
COMMIT;

-- If something went wrong:
-- ROLLBACK;
```

---

## Common Pitfalls to Avoid

### ❌ Don't: Use duplicate order_index

```sql
-- BAD: Reusing order_index = 0
INSERT INTO questions (..., order_index) VALUES (..., 0);  -- Will cause issues!
```

✅ **Do: Use next available order_index**

```sql
-- GOOD: Get next index first
SELECT MAX(order_index) + 1 FROM questions WHERE question_set_id = 'UUID';
```

### ❌ Don't: Forget to update question_count

```sql
-- BAD: Insert questions but forget to update count
INSERT INTO questions (...) VALUES (...);
-- question_count is now wrong!
```

✅ **Do: Always update question_count**

```sql
-- GOOD: Update count after inserting
UPDATE question_sets SET question_count = question_count + 3 WHERE id = 'UUID';
```

### ❌ Don't: Mix up JSONB format

```sql
-- BAD: Incorrect JSONB format
correct_answer = '30'  -- Missing quotes and ::jsonb cast
```

✅ **Do: Use proper JSONB format**

```sql
-- GOOD: Proper JSONB format
correct_answer = '"30"'::jsonb  -- String in JSON needs double quotes
```

### ❌ Don't: Add flashcard-incompatible questions to flashcard sets

```sql
-- BAD: Adding multiple_choice to flashcard set
INSERT INTO questions (..., question_type) VALUES (..., 'multiple_choice')
WHERE question_set has mode = 'flashcard';
```

✅ **Do: Check mode first**

```sql
-- GOOD: Verify mode before adding questions
SELECT mode FROM question_sets WHERE id = 'UUID';
-- If flashcard, only use: fill_blank, short_answer, matching
```

---

## Troubleshooting

### Issue: "Foreign key violation"

**Error**: `insert or update on table "questions" violates foreign key constraint`

**Solution**: Verify the question_set_id exists:
```sql
SELECT id, code, name FROM question_sets WHERE id = 'YOUR_UUID';
```

### Issue: "Duplicate order_index"

**Problem**: Multiple questions with same order_index cause undefined behavior

**Solution**: Check for duplicates and fix:
```sql
-- Find duplicates
SELECT order_index, COUNT(*)
FROM questions
WHERE question_set_id = 'YOUR_UUID'
GROUP BY order_index
HAVING COUNT(*) > 1;

-- Fix: Reorder all questions sequentially
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY order_index, created_at) - 1 as new_index
  FROM questions
  WHERE question_set_id = 'YOUR_UUID'
)
UPDATE questions
SET order_index = ordered.new_index
FROM ordered
WHERE questions.id = ordered.id;
```

### Issue: "Question count mismatch"

**Problem**: `question_count` in question_sets doesn't match actual count

**Solution**: Recalculate:
```sql
-- Fix question count
UPDATE question_sets
SET question_count = (
  SELECT COUNT(*) FROM questions WHERE question_set_id = question_sets.id
)
WHERE id = 'YOUR_UUID';
```

---

## Advanced: Bulk Add from JSON

If you have many questions in JSON format:

```sql
-- Example: Insert from JSON array
INSERT INTO questions (question_set_id, question_text, question_type, topic, correct_answer, options, explanation, order_index)
SELECT
  'YOUR_UUID',
  q->>'question',
  q->>'type',
  q->>'topic',
  (q->>'correct_answer')::jsonb,
  (q->'options')::jsonb,
  q->>'explanation',
  (q->>'order_index')::integer
FROM jsonb_array_elements('[
  {
    "question": "Question 1?",
    "type": "multiple_choice",
    "topic": "Topic",
    "correct_answer": "Answer",
    "options": ["A", "B", "C", "D"],
    "explanation": "Because...",
    "order_index": 15
  },
  {
    "question": "Question 2?",
    "type": "fill_blank",
    "topic": "Topic",
    "correct_answer": "Answer",
    "options": {"acceptable_answers": ["Answer"]},
    "explanation": "Because...",
    "order_index": 16
  }
]'::jsonb) as q;
```

---

## Summary Checklist

- [ ] Found question set ID using code or name
- [ ] Checked current question count and highest order_index
- [ ] Prepared new questions with correct JSONB format
- [ ] Verified question types are compatible with set mode (quiz/flashcard)
- [ ] Inserted questions with sequential order_index values
- [ ] Updated question_count in question_sets table
- [ ] Verified changes with SELECT queries
- [ ] Tested question set in app (visit `/play/CODE`)

---

**Need Help?** Check the main MCP integration guide: `docs/MCP_SUPABASE_INTEGRATION.md`
