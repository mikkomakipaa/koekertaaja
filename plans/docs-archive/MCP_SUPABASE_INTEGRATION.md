# MCP Supabase Integration Guide

This guide shows how to insert AI-generated questions directly into Supabase using MCP (Model Context Protocol) from your OpenAI workflow.

## Database Schema

### Table: `question_sets`

```sql
CREATE TABLE question_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,                    -- Shareable 6-char code (e.g., "ABC123")
  name TEXT NOT NULL,                                 -- Question set name
  subject VARCHAR(50) NOT NULL,                       -- Subject (e.g., "Matematiikka")
  grade INTEGER,                                      -- Grade level (1-13, optional)
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('helppo', 'normaali')),
  mode VARCHAR(20) NOT NULL DEFAULT 'quiz' CHECK (mode IN ('quiz', 'flashcard')),
  topic TEXT,                                         -- Broad topic (optional)
  subtopic TEXT,                                      -- Specific subtopic (optional)
  question_count INTEGER NOT NULL,                    -- Total questions in set
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `questions`

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_set_id UUID REFERENCES question_sets(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,                        -- Question text
  question_type VARCHAR(50) NOT NULL,                 -- Question type (see below)
  topic TEXT,                                         -- High-level topic for stratified sampling
  correct_answer JSONB NOT NULL,                      -- Answer (format varies by type)
  options JSONB,                                      -- Options for multiple_choice, pairs for matching, etc.
  explanation TEXT NOT NULL,                          -- Why answer is correct
  image_url TEXT,                                     -- Optional image URL
  order_index INTEGER NOT NULL,                       -- Display order
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Question Types

- `multiple_choice` - Multiple choice (4 options)
- `fill_blank` - Fill in the blank (text input)
- `true_false` - True/False question
- `matching` - Match pairs
- `short_answer` - Short text answer
- `sequential` - Order items in sequence

---

## Step-by-Step: Insert Questions via MCP

### Step 1: Generate Unique Code

Generate a random 6-character alphanumeric code (A-Z, 0-9):

```sql
-- Helper to generate random code (you can also generate client-side)
SELECT upper(substring(md5(random()::text), 1, 6)) as code;
```

**Client-side generation (recommended):**
```javascript
function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
```

### Step 2: Insert Question Set

```sql
INSERT INTO question_sets (
  code,
  name,
  subject,
  grade,
  difficulty,
  mode,
  topic,
  subtopic,
  question_count
) VALUES (
  'ABC123',                                -- Your generated code
  'Matematiikka 6. luokka - Prosenttilaskenta',
  'Matematiikka',
  6,
  'normaali',
  'quiz',                                  -- 'quiz' or 'flashcard'
  'Prosenttilaskenta',
  NULL,
  15                                       -- Number of questions you'll insert
)
RETURNING id, code;
```

**Save the returned `id` - you'll need it for inserting questions!**

### Step 3: Insert Questions

#### Multiple Choice Question

```sql
INSERT INTO questions (
  question_set_id,
  question_text,
  question_type,
  topic,
  correct_answer,
  options,
  explanation,
  order_index
) VALUES (
  'UUID_FROM_STEP_2',                     -- Replace with actual UUID
  'Mikä on 20% luvusta 150?',
  'multiple_choice',
  'Prosenttilaskenta',
  '"30"'::jsonb,                          -- Correct answer as JSON string
  '["30", "25", "35", "20"]'::jsonb,      -- Array of options
  '20% luvusta 150 = 150 × 0.20 = 30',
  0                                       -- First question (0-indexed)
);
```

#### Fill Blank Question

```sql
INSERT INTO questions (
  question_set_id,
  question_text,
  question_type,
  topic,
  correct_answer,
  options,                                -- Store acceptable_answers here
  explanation,
  order_index
) VALUES (
  'UUID_FROM_STEP_2',
  'Laske 15% luvusta 80',
  'fill_blank',
  'Prosenttilaskenta',
  '"12"'::jsonb,                          -- Correct answer
  '{"acceptable_answers": ["12", "12.0"]}'::jsonb,  -- Alternative answers
  '15% × 80 = 0.15 × 80 = 12',
  1
);
```

#### True/False Question

```sql
INSERT INTO questions (
  question_set_id,
  question_text,
  question_type,
  topic,
  correct_answer,
  options,
  explanation,
  order_index
) VALUES (
  'UUID_FROM_STEP_2',
  'Onko 50% sama kuin puolet?',
  'true_false',
  'Prosenttilaskenta',
  'true'::jsonb,                          -- Boolean value
  NULL,
  'Kyllä! 50% tarkoittaa 50/100 = 1/2 eli puolet.',
  2
);
```

#### Matching Question

```sql
INSERT INTO questions (
  question_set_id,
  question_text,
  question_type,
  topic,
  correct_answer,
  options,                                -- Store pairs here
  explanation,
  order_index
) VALUES (
  'UUID_FROM_STEP_2',
  'Yhdistä eläin sen elinympäristöön',
  'matching',
  'Elinympäristöt',
  '["Karhu-Metsä", "Hauki-Järvi"]'::jsonb,  -- Correct pairings (for validation)
  '{
    "pairs": [
      {"left": "Karhu", "right": "Metsä"},
      {"left": "Hauki", "right": "Järvi"},
      {"left": "Hylkeenpyytäjä", "right": "Arktinen alue"}
    ]
  }'::jsonb,
  'Jokainen eläin on sopeutunut tiettyyn elinympäristöön.',
  3
);
```

#### Sequential Question

```sql
INSERT INTO questions (
  question_set_id,
  question_text,
  question_type,
  topic,
  correct_answer,
  options,                                -- Store items and correct_order here
  explanation,
  order_index
) VALUES (
  'UUID_FROM_STEP_2',
  'Järjestä tapahtumat aikajärjestykseen',
  'sequential',
  'Suomen historia',
  '[0, 1, 2, 3]'::jsonb,                  -- Correct order indices
  '{
    "items": [
      "Suomi itsenäistyy",
      "Talvisota alkaa",
      "Suomi liittyy EU:hun",
      "Suomi ottaa euron käyttöön"
    ],
    "correct_order": [0, 1, 2, 3]
  }'::jsonb,
  'Suomi itsenäistyi 1917, talvisota 1939, EU 1995, euro 2002.',
  4
);
```

#### Short Answer Question

```sql
INSERT INTO questions (
  question_set_id,
  question_text,
  question_type,
  topic,
  correct_answer,
  options,                                -- Store max_length and acceptable_answers
  explanation,
  order_index
) VALUES (
  'UUID_FROM_STEP_2',
  'Mitä tarkoittaa sana "photosynthesis" suomeksi?',
  'short_answer',
  'Vocabulary',
  '"fotosynteesi"'::jsonb,
  '{
    "acceptable_answers": ["fotosynteesi", "yhteyttäminen"],
    "max_length": 50
  }'::jsonb,
  'Photosynthesis = fotosynteesi (kasvien tapa tuottaa energiaa valosta).',
  5
);
```

---

## Complete Example: Batch Insert

### Using PostgreSQL Transaction

```sql
-- Start transaction
BEGIN;

-- 1. Insert question set
INSERT INTO question_sets (
  code, name, subject, grade, difficulty, mode, topic, question_count
) VALUES (
  'MATH01',
  'Matematiikka 6. luokka - Prosenttilaskenta',
  'Matematiikka',
  6,
  'normaali',
  'quiz',
  'Prosenttilaskenta',
  3
)
RETURNING id;

-- Save the returned ID, then use it below (replace UUID_HERE with actual UUID)

-- 2. Insert questions
INSERT INTO questions (question_set_id, question_text, question_type, topic, correct_answer, options, explanation, order_index)
VALUES
  -- Question 1: Multiple Choice
  (
    'UUID_HERE',
    'Mikä on 20% luvusta 150?',
    'multiple_choice',
    'Prosenttilaskenta',
    '"30"'::jsonb,
    '["30", "25", "35", "20"]'::jsonb,
    '20% luvusta 150 = 150 × 0.20 = 30',
    0
  ),
  -- Question 2: Fill Blank
  (
    'UUID_HERE',
    'Laske 15% luvusta 80',
    'fill_blank',
    'Prosenttilaskenta',
    '"12"'::jsonb,
    '{"acceptable_answers": ["12", "12.0"]}'::jsonb,
    '15% × 80 = 0.15 × 80 = 12',
    1
  ),
  -- Question 3: True/False
  (
    'UUID_HERE',
    'Onko 50% sama kuin puolet?',
    'true_false',
    'Prosenttilaskenta',
    'true'::jsonb,
    NULL,
    'Kyllä! 50% tarkoittaa 50/100 = 1/2 eli puolet.',
    2
  );

-- Commit transaction
COMMIT;
```

---

## MCP Tool Usage (from OpenAI Workflow)

### Using `execute_sql` Tool

```javascript
// Step 1: Insert question set
const insertSetResult = await mcp.execute_sql({
  query: `
    INSERT INTO question_sets (code, name, subject, grade, difficulty, mode, topic, question_count)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, code;
  `,
  params: [
    generateCode(),           // $1: code
    questionSetName,          // $2: name
    subject,                  // $3: subject
    grade,                    // $4: grade
    difficulty,               // $5: difficulty
    mode,                     // $6: mode
    topic,                    // $7: topic
    questions.length          // $8: question_count
  ]
});

const questionSetId = insertSetResult.rows[0].id;

// Step 2: Insert questions
for (let i = 0; i < questions.length; i++) {
  const q = questions[i];

  await mcp.execute_sql({
    query: `
      INSERT INTO questions (
        question_set_id, question_text, question_type, topic,
        correct_answer, options, explanation, order_index
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `,
    params: [
      questionSetId,                                    // $1
      q.question,                                       // $2
      q.type,                                           // $3
      q.topic,                                          // $4
      JSON.stringify(q.correct_answer),                 // $5
      JSON.stringify(q.options || q.pairs || q.items),  // $6
      q.explanation,                                    // $7
      i                                                 // $8
    ]
  });
}
```

---

## JSONB Field Reference

### `correct_answer` Format by Question Type

| Type | Format | Example |
|------|--------|---------|
| `multiple_choice` | String | `"30"` |
| `fill_blank` | String | `"12"` |
| `true_false` | Boolean | `true` or `false` |
| `matching` | Array of strings | `["Karhu-Metsä", "Hauki-Järvi"]` |
| `short_answer` | String | `"fotosynteesi"` |
| `sequential` | Array of integers | `[0, 1, 2, 3]` |

### `options` Format by Question Type

| Type | Field | Format | Example |
|------|-------|--------|---------|
| `multiple_choice` | Direct array | `["opt1", "opt2", ...]` | `["30", "25", "35", "20"]` |
| `fill_blank` | `acceptable_answers` | `{"acceptable_answers": [...]}` | `{"acceptable_answers": ["12", "12.0"]}` |
| `true_false` | `NULL` | - | - |
| `matching` | `pairs` | `{"pairs": [{"left": "...", "right": "..."}]}` | See example above |
| `short_answer` | `acceptable_answers`, `max_length` | `{"acceptable_answers": [...], "max_length": 50}` | See example above |
| `sequential` | `items`, `correct_order` | `{"items": [...], "correct_order": [...]}` | See example above |

---

## Validation Checklist

Before inserting, validate:

- ✅ **Code uniqueness**: 6 characters, alphanumeric uppercase
- ✅ **Difficulty**: Must be `"helppo"` or `"normaali"`
- ✅ **Mode**: Must be `"quiz"` or `"flashcard"`
- ✅ **Flashcard restrictions**: No `multiple_choice`, `true_false`, or `sequential`
- ✅ **Topic coverage**: 70%+ questions should have topics
- ✅ **Question count**: Matches actual number of questions inserted
- ✅ **Order index**: Sequential starting from 0
- ✅ **JSONB format**: Valid JSON for `correct_answer` and `options`
- ✅ **Grade range**: 1-13 (if provided)

---

## Testing Your Integration

### Verify Question Set Created

```sql
SELECT * FROM question_sets WHERE code = 'YOUR_CODE';
```

### Verify Questions Inserted

```sql
SELECT
  q.order_index,
  q.question_text,
  q.question_type,
  q.topic,
  q.correct_answer,
  q.options
FROM questions q
WHERE q.question_set_id = 'YOUR_UUID'
ORDER BY q.order_index;
```

### Test Topic Distribution

```sql
SELECT
  topic,
  COUNT(*) as question_count
FROM questions
WHERE question_set_id = 'YOUR_UUID'
GROUP BY topic
ORDER BY question_count DESC;
```

---

## Common Issues & Solutions

### Issue 1: Duplicate Code Error

**Error**: `duplicate key value violates unique constraint "question_sets_code_key"`

**Solution**: Generate a new code and retry insertion.

### Issue 2: Invalid JSONB Format

**Error**: `invalid input syntax for type json`

**Solution**: Ensure you're using valid JSON and casting with `::jsonb`:
```sql
-- ❌ Wrong
correct_answer = '30'

-- ✅ Correct
correct_answer = '"30"'::jsonb
```

### Issue 3: Foreign Key Violation

**Error**: `insert or update on table "questions" violates foreign key constraint`

**Solution**: Ensure `question_set_id` matches the UUID from Step 2.

### Issue 4: Check Constraint Violation

**Error**: `new row for relation "question_sets" violates check constraint`

**Solution**: Verify `difficulty` is exactly `"helppo"` or `"normaali"` (lowercase Finnish).

---

## Example: Complete Python Script

```python
import random
import string
import psycopg2
import json

def generate_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def insert_question_set(conn, questions_data):
    cur = conn.cursor()

    # Generate unique code
    code = generate_code()

    try:
        # Insert question set
        cur.execute("""
            INSERT INTO question_sets (code, name, subject, grade, difficulty, mode, topic, question_count)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, code;
        """, (
            code,
            questions_data['name'],
            questions_data['subject'],
            questions_data.get('grade'),
            questions_data['difficulty'],
            questions_data['mode'],
            questions_data.get('topic'),
            len(questions_data['questions'])
        ))

        question_set_id, code = cur.fetchone()
        print(f"Created question set with code: {code}")

        # Insert questions
        for i, q in enumerate(questions_data['questions']):
            cur.execute("""
                INSERT INTO questions (
                    question_set_id, question_text, question_type, topic,
                    correct_answer, options, explanation, order_index
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                question_set_id,
                q['question'],
                q['type'],
                q.get('topic'),
                json.dumps(q['correct_answer']),
                json.dumps(q.get('options') or q.get('pairs') or q.get('items')),
                q['explanation'],
                i
            ))

        conn.commit()
        print(f"Inserted {len(questions_data['questions'])} questions")
        return code

    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
        raise

# Usage
conn = psycopg2.connect("your_connection_string")
code = insert_question_set(conn, your_questions_data)
conn.close()
```

---

## Next Steps

1. **Generate questions** in your OpenAI workflow
2. **Use MCP `execute_sql`** tool to insert directly into Supabase
3. **Return the code** to the user for accessing questions
4. **Test** by navigating to `https://koekertaaja.vercel.app/play/{CODE}`
