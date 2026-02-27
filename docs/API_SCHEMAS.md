# API Schemas for OpenAI Workflow Integration

This document provides API-compatible schemas for integrating question generation with external workflows (e.g., OpenAI Assistant workflows).

## Table of Contents

1. [Question Schema (JSON Schema)](#question-schema-json-schema)
2. [Question Type Contracts (AI Output)](#question-type-contracts-ai-output)
3. [Question Set Schema](#question-set-schema)
4. [API Endpoint Schema](#api-endpoint-schema)
5. [Admin API - Publish/Unpublish](#admin-api---publishunpublish)
6. [Example Payloads](#example-payloads)
7. [OpenAPI Specification](#openapi-specification)

---

## Question Schema (JSON Schema)

### Single Question Format

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["question", "type", "topic", "correct_answer", "explanation"],
  "properties": {
    "question": {
      "type": "string",
      "minLength": 5,
      "maxLength": 1000,
      "description": "The question text"
    },
    "type": {
      "type": "string",
      "enum": [
        "multiple_choice",
        "fill_blank",
        "true_false",
        "matching",
        "short_answer",
        "sequential"
      ],
      "description": "Question type"
    },
    "topic": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "High-level topic (e.g., 'Grammar', 'Vocabulary')"
    },
    "subtopic": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "Optional subtopic that refines the topic"
    },
    "skill": {
      "type": "string",
      "pattern": "^[a-z_]+$",
      "maxLength": 100,
      "description": "Skill tag in snake_case (e.g., 'verb_tenses')"
    },
    "correct_answer": {
      "oneOf": [
        { "type": "string" },
        { "type": "boolean" },
        { "type": "array" }
      ],
      "description": "The correct answer (format depends on question type)"
    },
    "explanation": {
      "type": "string",
      "minLength": 10,
      "maxLength": 2000,
      "description": "Why this answer is correct"
    },
    "options": {
      "description": "Multiple choice options (string array)",
      "type": "array",
      "items": { "type": "string" },
      "minItems": 2
    },
    "acceptable_answers": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Alternative acceptable answers for fill_blank/short_answer"
    },
    "pairs": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["left", "right"],
        "properties": {
          "left": { "type": "string" },
          "right": { "type": "string" }
        }
      },
      "minItems": 2,
      "description": "Pairs for matching questions"
    },
    "items": {
      "description": "Items for sequential questions (in scrambled order)",
      "anyOf": [
        {
          "type": "array",
          "items": { "type": "string", "minLength": 1, "maxLength": 500 },
          "minItems": 3,
          "maxItems": 8
        },
        {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["text"],
            "properties": {
              "text": { "type": "string", "minLength": 1, "maxLength": 500 },
              "year": { "type": "integer", "minimum": 1000, "maximum": 3000 }
            }
          },
          "minItems": 3,
          "maxItems": 8
        }
      ]
    },
    "correct_order": {
      "type": "array",
      "items": { "type": "integer" },
      "description": "Correct indices for sequential questions (e.g., [0, 2, 1, 3]). Must match items length and be valid indices."
    }
  }
}
```

### Question Array Format

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": {
    "$ref": "#/definitions/Question"
  },
  "minItems": 1
}
```

---

## Question Type Contracts (AI Output)

These contracts match the Zod validation rules in `src/lib/validation/schemas.ts` for AI-generated questions.

### Shared fields (all types)

- `question` (required): string, 5-1000 chars
- `type` (required): enum
- `topic` (required): string, 1-100 chars
- `correct_answer` (required): string | boolean | array (shape depends on type)
- `explanation` (required): string, 10-2000 chars
- `subtopic` (optional): string, 1-100 chars
- `skill` (optional): snake_case string, max 100 chars
- `acceptable_answers` (optional): string[]

### multiple_choice

Required fields:
- `options`: string[] with at least 2 items
- `correct_answer`: string (should match one of `options`)

Example:
```json
{
  "question": "Mikä on Suomen pääkaupunki?",
  "type": "multiple_choice",
  "topic": "Maantieto",
  "options": ["Helsinki", "Turku", "Tampere", "Oulu"],
  "correct_answer": "Helsinki",
  "explanation": "Helsinki on Suomen pääkaupunki."
}
```

### fill_blank

Required fields:
- `correct_answer`: string

Optional:
- `acceptable_answers`: string[]

Example:
```json
{
  "question": "Suomen suurin järvi on ____.",
  "type": "fill_blank",
  "topic": "Maantieto",
  "correct_answer": "Saimaa",
  "acceptable_answers": ["Saimaanjärvi"],
  "explanation": "Saimaa on Suomen suurin järvi."
}
```

### true_false

Required fields:
- `correct_answer`: boolean

Example:
```json
{
  "question": "Vesi jäätyy 0 celsiusasteessa.",
  "type": "true_false",
  "topic": "Fysiikka",
  "correct_answer": true,
  "explanation": "Puhdas vesi jäätyy 0 asteessa normaalipaineessa."
}
```

### short_answer

Required fields:
- `correct_answer`: string

Optional:
- `acceptable_answers`: string[]

Example:
```json
{
  "question": "Mikä on 7 x 8?",
  "type": "short_answer",
  "topic": "Matematiikka",
  "correct_answer": "56",
  "acceptable_answers": ["viisikymmentäkuusi"],
  "explanation": "7 kertaa 8 on 56."
}
```

### matching

Required fields:
- `pairs`: array of objects with `left` and `right`, min 2
- `correct_answer`: required by schema but not used at runtime; use an array of right-side values or an empty array

Example:
```json
{
  "question": "Yhdistä valtio ja pääkaupunki.",
  "type": "matching",
  "topic": "Maantieto",
  "pairs": [
    { "left": "Suomi", "right": "Helsinki" },
    { "left": "Ruotsi", "right": "Tukholma" },
    { "left": "Norja", "right": "Oslo" }
  ],
  "correct_answer": ["Helsinki", "Tukholma", "Oslo"],
  "explanation": "Jokaisella valtiolla on oma pääkaupunkinsa."
}
```

### sequential

Required fields:
- `items`: array of strings or `{ text, year? }`, min 3, max 8
- `correct_order`: array of indices matching `items` length; indices must be valid (0..n-1)
- `correct_answer`: required by schema; use the same array as `correct_order`

Example:
```json
{
  "question": "Järjestä vaiheet oikeaan järjestykseen.",
  "type": "sequential",
  "topic": "Biologia",
  "items": [
    { "text": "Siemen itää" },
    { "text": "Kasvi kasvaa" },
    { "text": "Kasvi kukkii" },
    { "text": "Siemenet muodostuvat" }
  ],
  "correct_order": [0, 1, 2, 3],
  "correct_answer": [0, 1, 2, 3],
  "explanation": "Kasvin elinkaari etenee siemenestä kasvuun ja siementen muodostumiseen."
}
```

## Question Set Schema

### Question Set Metadata

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "subject", "difficulty", "mode", "questions"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200,
      "description": "Question set name"
    },
    "subject": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "Subject name (e.g., 'Matematiikka', 'Englanti')"
    },
    "difficulty": {
      "type": "string",
      "enum": ["helppo", "normaali"],
      "description": "Difficulty level (Finnish: helppo=easy, normaali=normal)"
    },
    "mode": {
      "type": "string",
      "enum": ["quiz", "flashcard"],
      "description": "quiz=traditional assessment, flashcard=memorization-focused"
    },
    "grade": {
      "type": "integer",
      "minimum": 1,
      "maximum": 13,
      "description": "Grade level (1-13, Finnish school system)"
    },
    "topic": {
      "type": "string",
      "maxLength": 200,
      "description": "Broad topic (e.g., 'Algebra', 'Past Tense')"
    },
    "subtopic": {
      "type": "string",
      "maxLength": 200,
      "description": "More specific subtopic"
    },
    "questions": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Question"
      },
      "minItems": 1,
      "description": "Array of question objects"
    }
  }
}
```

---

## API Endpoint Schema

### CORS Policy (Credentialed Browser Requests)

- Credentialed cross-origin API calls are allowed only from explicit origins in `CORS_ALLOWED_ORIGINS` (comma-separated exact origins).
- No wildcard origins are used for credentialed requests.
- Requests with unknown `Origin` headers receive `403` with `{ "error": "CORS: Origin not allowed" }`.
- Requests without an `Origin` header keep same-origin default behavior.
- Allowed origins receive consistent CORS headers on both `OPTIONS` preflight and regular API responses:
  - `Access-Control-Allow-Origin: <trusted-origin>`
  - `Access-Control-Allow-Credentials: true`
  - `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token`
  - `Access-Control-Max-Age: 86400`
  - `Vary: Origin`

### POST /api/question-sets/submit

Submit generated questions to Koekertaaja from external workflow.

**Request Body:**

```json
{
  "questionSetName": "string (1-200 chars)",
  "subject": "string (1-100 chars)",
  "difficulty": "helppo" | "normaali",
  "mode": "quiz" | "flashcard",
  "grade": "integer (1-13, optional)",
  "topic": "string (max 200 chars, optional)",
  "subtopic": "string (max 200 chars, optional)",
  "questions": [
    {
      "question": "string",
      "type": "multiple_choice|fill_blank|true_false|matching|short_answer|sequential",
      "topic": "string (optional)",
      "correct_answer": "string|boolean|array",
      "explanation": "string",
      "options": ["string"] (for multiple_choice),
      "acceptable_answers": ["string"] (optional),
      "pairs": [{ "left": "string", "right": "string" }] (for matching),
      "items": ["string"] (for sequential),
      "correct_order": [0, 2, 1] (for sequential)
    }
  ]
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "code": "ABC123",
  "questionSet": {
    "id": "uuid",
    "code": "ABC123",
    "name": "Question Set Name",
    "subject": "Subject",
    "difficulty": "normaali",
    "mode": "quiz",
    "question_count": 15,
    "created_at": "2025-12-10T12:00:00Z"
  },
  "questionCount": 15
}
```

**Response (Error - 400/500):**

```json
{
  "error": "Error message",
  "details": ["Validation error 1", "Validation error 2"]
}
```

## Admin API - Publish/Unpublish

### PATCH /api/question-sets/publish

Admin-only endpoint to publish or unpublish question sets. Changes the status between `'created'` (unpublished, default for new sets) and `'published'` (visible on play pages).

**Authorization:**
- Requires authentication (valid session)
- Requires admin access (email must be in `ADMIN_EMAILS` environment variable)

**Request Body:**

```json
{
  "questionSetId": "uuid",
  "status": "created" | "published"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "questionSet": {
    "id": "uuid",
    "code": "ABC123",
    "name": "Question Set Name",
    "status": "published",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Not authenticated
  ```json
  {
    "error": "Unauthorized. Please log in."
  }
  ```

- **403 Forbidden** - Not an admin
  ```json
  {
    "error": "Forbidden. Admin access required to publish question sets."
  }
  ```

- **400 Bad Request** - Invalid request data
  ```json
  {
    "error": "Validation failed",
    "details": [
      "questionSetId: Invalid question set ID",
      "status: Status must be \"created\" or \"published\""
    ]
  }
  ```

- **404 Not Found** - Question set doesn't exist
  ```json
  {
    "error": "Question set not found"
  }
  ```

- **500 Internal Server Error** - Server error
  ```json
  {
    "error": "Failed to update question set status"
  }
  ```

**Configuration:**

Set `ADMIN_EMAILS` environment variable with comma-separated admin emails:

```bash
ADMIN_EMAILS=admin@example.com,super@example.com
```

**Example Usage:**

```bash
# Publish a question set
curl -X PATCH https://your-domain.com/api/question-sets/publish \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "questionSetId": "123e4567-e89b-12d3-a456-426614174000",
    "status": "published"
  }'

# Unpublish (revert to created status)
curl -X PATCH https://your-domain.com/api/question-sets/publish \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "questionSetId": "123e4567-e89b-12d3-a456-426614174000",
    "status": "created"
  }'
```

---

## Example Payloads

### Example 1: Multiple Choice Question (Math)

```json
{
  "question": "Mikä on 15% luvusta 200?",
  "type": "multiple_choice",
  "topic": "Prosenttilaskenta",
  "options": ["30", "25", "35", "20"],
  "correct_answer": "30",
  "explanation": "15% luvusta 200 lasketaan: 200 × 0.15 = 30. Prosentti tarkoittaa sadasosaa, eli 15% = 15/100 = 0.15."
}
```

### Example 2: Fill Blank Question (English)

```json
{
  "question": "She ___ to school every day. (verb: go)",
  "type": "fill_blank",
  "topic": "Present Simple",
  "correct_answer": "goes",
  "acceptable_answers": ["goes"],
  "explanation": "Kolmannessa persoonassa yksikössä (she/he/it) verbi saa päätteen -s tai -es. Go → goes."
}
```

### Example 3: Matching Question (Biology)

```json
{
  "question": "Yhdistä eläin sen elinympäristöön",
  "type": "matching",
  "topic": "Elinympäristöt",
  "pairs": [
    { "left": "Karhu", "right": "Metsä" },
    { "left": "Hauki", "right": "Järvi" },
    { "left": "Hylkeenpyytäjä", "right": "Arktinen alue" },
    { "left": "Käärme", "right": "Aavikko" }
  ],
  "correct_answer": ["Karhu-Metsä", "Hauki-Järvi", "Hylkeenpyytäjä-Arktinen alue", "Käärme-Aavikko"],
  "explanation": "Jokainen eläin on sopeutunut tiettyyn elinympäristöön. Karhu elää metsissä, hauki makeassa vedessä, hylkeenpyytäjä arktisilla alueilla ja käärme kuumissa aavikoissa."
}
```

### Example 4: Sequential Question (History)

```json
{
  "question": "Järjestä tapahtumat aikajärjestykseen (vanhimmasta uusimpaan)",
  "type": "sequential",
  "topic": "Suomen historia",
  "items": [
    "Suomi itsenäistyy",
    "Talvisota alkaa",
    "Suomi liittyy EU:hun",
    "Suomi ottaa euron käyttöön"
  ],
  "correct_order": [0, 1, 2, 3],
  "correct_answer": [0, 1, 2, 3],
  "explanation": "Suomi itsenäistyi 1917, talvisota alkoi 1939, EU-jäsenyys 1995, ja euro otettiin käyttöön 2002."
}
```

### Example 5: Complete Question Set (Quiz Mode)

```json
{
  "questionSetName": "Matematiikka 6. luokka - Prosenttilaskenta",
  "subject": "Matematiikka",
  "difficulty": "normaali",
  "mode": "quiz",
  "grade": 6,
  "topic": "Prosenttilaskenta",
  "questions": [
    {
      "question": "Mikä on 20% luvusta 150?",
      "type": "multiple_choice",
      "topic": "Prosenttilaskenta",
      "options": ["30", "25", "35", "20"],
      "correct_answer": "30",
      "explanation": "20% luvusta 150 = 150 × 0.20 = 30"
    },
    {
      "question": "Laske 15% luvusta 80",
      "type": "fill_blank",
      "topic": "Prosenttilaskenta",
      "correct_answer": "12",
      "acceptable_answers": ["12", "12.0"],
      "explanation": "15% × 80 = 0.15 × 80 = 12"
    },
    {
      "question": "Onko 50% sama kuin puolet?",
      "type": "true_false",
      "topic": "Prosenttilaskenta",
      "correct_answer": true,
      "explanation": "Kyllä! 50% tarkoittaa 50/100 = 1/2 eli puolet."
    }
  ]
}
```

### Example 6: Complete Question Set (Flashcard Mode)

```json
{
  "questionSetName": "Englanti 5. luokka - Irregular Verbs - Kortit",
  "subject": "Englanti",
  "difficulty": "normaali",
  "mode": "flashcard",
  "grade": 5,
  "topic": "Irregular Verbs",
  "questions": [
    {
      "question": "Anna verbin 'go' imperfektimuoto (past simple)",
      "type": "fill_blank",
      "topic": "Irregular Verbs",
      "correct_answer": "went",
      "acceptable_answers": ["went"],
      "explanation": "Verbi 'go' on epäsäännöllinen. Sen imperfektimuoto on 'went'. Esimerkki: I went to school yesterday."
    },
    {
      "question": "Täydennä lause oikealla verbillä: Yesterday, I ___ (eat) pizza.",
      "type": "fill_blank",
      "topic": "Irregular Verbs",
      "correct_answer": "ate",
      "acceptable_answers": ["ate"],
      "explanation": "Eat on epäsäännöllinen verbi. Past simple: eat → ate. 'I ate pizza' tarkoittaa 'söin pizzaa'."
    }
  ]
}
```

---

## OpenAPI Specification

```yaml
openapi: 3.0.0
info:
  title: Koekertaaja Question Generation API
  version: 1.0.0
  description: API for submitting AI-generated questions to Koekertaaja

servers:
  - url: https://koekertaaja.vercel.app/api
    description: Production server
  - url: http://localhost:3000/api
    description: Development server

paths:
  /question-sets/submit:
    post:
      summary: Submit a generated question set
      description: Submit questions generated by external workflow (OpenAI, custom pipeline, etc.)
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/QuestionSetSubmission'
      responses:
        '200':
          description: Question set created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QuestionSetResponse'
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Unauthorized
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Supabase JWT token

  schemas:
    QuestionSetSubmission:
      type: object
      required:
        - questionSetName
        - subject
        - difficulty
        - mode
        - questions
      properties:
        questionSetName:
          type: string
          minLength: 1
          maxLength: 200
          example: "Matematiikka 6. luokka - Prosenttilaskenta"
        subject:
          type: string
          minLength: 1
          maxLength: 100
          example: "Matematiikka"
        difficulty:
          type: string
          enum: [helppo, normaali]
          example: "normaali"
        mode:
          type: string
          enum: [quiz, flashcard]
          example: "quiz"
        grade:
          type: integer
          minimum: 1
          maximum: 13
          example: 6
        topic:
          type: string
          maxLength: 200
          example: "Prosenttilaskenta"
        subtopic:
          type: string
          maxLength: 200
        questions:
          type: array
          minItems: 1
          items:
            $ref: '#/components/schemas/Question'

    Question:
      type: object
      required:
        - question
        - type
        - correct_answer
        - explanation
      properties:
        question:
          type: string
          minLength: 5
          maxLength: 1000
        type:
          type: string
          enum:
            - multiple_choice
            - fill_blank
            - true_false
            - matching
            - short_answer
            - sequential
        topic:
          type: string
          minLength: 1
          maxLength: 100
        correct_answer:
          oneOf:
            - type: string
            - type: boolean
            - type: array
        explanation:
          type: string
          minLength: 10
          maxLength: 2000
        options:
          type: array
          items:
            type: string
          minItems: 2
        acceptable_answers:
          type: array
          items:
            type: string
        pairs:
          type: array
          items:
            type: object
            required: [left, right]
            properties:
              left:
                type: string
              right:
                type: string
          minItems: 2
        items:
          type: array
          items:
            type: string
          minItems: 3
          maxItems: 8
        correct_order:
          type: array
          items:
            type: integer
        max_length:
          type: integer

    QuestionSetResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        code:
          type: string
          example: "ABC123"
          description: "6-character shareable code"
        questionSet:
          type: object
          properties:
            id:
              type: string
              format: uuid
            code:
              type: string
            name:
              type: string
            subject:
              type: string
            difficulty:
              type: string
            mode:
              type: string
            status:
              type: string
              enum: [created, published]
              description: "Publishing status: 'created' (unpublished) or 'published' (visible on play pages)"
              default: created
            question_count:
              type: integer
            created_at:
              type: string
              format: date-time
        questionCount:
          type: integer
          example: 15

    ErrorResponse:
      type: object
      properties:
        error:
          type: string
          example: "Validation failed"
        details:
          type: array
          items:
            type: string
          example:
            - "question: Question must be at least 5 characters"
            - "explanation: Explanation is required"
```

---

## Validation Rules Summary

### Question Types Requirements

| Type | Required Fields | Optional Fields | Notes |
|------|----------------|-----------------|-------|
| `multiple_choice` | `options` (2+ items), `correct_answer` | - | Answer must be one of the options |
| `fill_blank` | `correct_answer` | `acceptable_answers` | Case-insensitive matching |
| `true_false` | `correct_answer` (boolean) | - | Must be true/false |
| `matching` | `pairs` (2+ pairs) | - | Each pair has `left` and `right` |
| `short_answer` | `correct_answer` | `acceptable_answers`, `max_length` | More lenient than fill_blank |
| `sequential` | `items` (3-8), `correct_order` | - | Indices must match items length |

### Flashcard Mode Restrictions

**For flashcard mode (`mode: "flashcard"`), exclude these question types:**
- ❌ `multiple_choice` (passive recognition)
- ❌ `true_false` (passive recognition)
- ❌ `sequential` (not suitable for memorization)

**Recommended for flashcards:**
- ✅ `fill_blank` (60-70% for active recall)
- ✅ `short_answer` (20-30% for detailed explanations)
- ✅ `matching` (10-20% for connections)

---

## Integration Notes

### For OpenAI Workflow

1. **Agent Output Format**: Your agents should output JSON matching the `QuestionSetSubmission` schema
2. **Topic Tagging**: Always include `topic` field for balanced question selection
3. **Explanation Quality**: Explanations should be 50-200 words with step-by-step reasoning
4. **Validation**: Validate against schemas before submission to catch errors early
5. **Error Handling**: Parse `details` array in error responses for specific validation failures

### Authentication

- Use Supabase JWT token in `Authorization: Bearer <token>` header
- Tokens obtained via Supabase Auth login flow
- Required for production; optional for local development

---

## Testing

### Quick Test with cURL

```bash
curl -X POST https://koekertaaja.vercel.app/api/question-sets/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d @test-question-set.json
```

### Sample Test File (`test-question-set.json`)

```json
{
  "questionSetName": "Test Set",
  "subject": "Matematiikka",
  "difficulty": "helppo",
  "mode": "quiz",
  "grade": 4,
  "questions": [
    {
      "question": "Mikä on 2 + 2?",
      "type": "multiple_choice",
      "topic": "Yhteenlasku",
      "options": ["3", "4", "5", "6"],
      "correct_answer": "4",
      "explanation": "2 + 2 = 4. Yhteenlasku tarkoittaa lukujen yhdistämistä."
    }
  ]
}
```

---

## Version History

- **v1.0.0** (2025-12-10): Initial schema documentation for OpenAI workflow integration
