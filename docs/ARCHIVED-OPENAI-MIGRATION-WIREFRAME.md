# OpenAI Migration Architecture Wireframe

## Migration Overview

**Goal**: Replace Anthropic Claude Sonnet 4 with OpenAI (Responses API, newer-than-4o model) as the primary AI provider.

**Status**: AWAITING USER VALIDATION (UPDATED: Responses API + file inputs)

**Related Task**: `todo/task-009-migrate-claude-to-openai.md`

---

## Current Architecture (Claude Sonnet 4)

```
┌─────────────────────────────────────────────────────────────────────┐
│ User Uploads Materials (PDF, Images, Text)                         │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ API Route: /api/generate-questions                                 │
│ - Receives FormData with materials                                 │
│ - Converts PDFs to base64 (Claude natively supports PDFs)          │
│ - Converts images to base64                                        │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: Topic Identification (topicIdentifier.ts)                  │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Claude Sonnet 4 API Call                                        │ │
│ │ - Model: claude-sonnet-4-20250514                               │ │
│ │ - Max tokens: 1000                                              │ │
│ │ - Prompt: Hardcoded in topicIdentifier.ts                       │ │
│ │ - Input: Material text + base64 PDFs/images                     │ │
│ │ - Output: 3-5 high-level topics (JSON)                          │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: Question Generation (questionGenerator.ts)                 │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Parallel Execution (Promise.all)                                │ │
│ │                                                                  │ │
│ │ Task 1: Quiz Helppo                                             │ │
│ │ ┌──────────────────────────────────────────────────────────────┐│ │
│ │ │ Claude Sonnet 4 API Call                                     ││ │
│ │ │ - Model: claude-sonnet-4-20250514                            ││ │
│ │ │ - Max tokens: 16000                                          ││ │
│ │ │ - Prompt: Subject-specific (english.ts, math.ts, generic.ts) ││ │
│ │ │ - Input: Material + topics + grade + difficulty              ││ │
│ │ │ - Output: 40-400 questions (JSON)                            ││ │
│ │ └──────────────────────────────────────────────────────────────┘│ │
│ │                                                                  │ │
│ │ Task 2: Quiz Normaali                                           │ │
│ │ ┌──────────────────────────────────────────────────────────────┐│ │
│ │ │ Claude Sonnet 4 API Call                                     ││ │
│ │ │ - Same as Task 1 but difficulty: normaali                    ││ │
│ │ └──────────────────────────────────────────────────────────────┘│ │
│ │                                                                  │ │
│ │ Task 3: Flashcards (if enabled)                                 │ │
│ │ ┌──────────────────────────────────────────────────────────────┐│ │
│ │ │ Claude Sonnet 4 API Call                                     ││ │
│ │ │ - Flashcard-specific prompts (60/30/10 distribution)         ││ │
│ │ └──────────────────────────────────────────────────────────────┘│ │
│ └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: Database Storage (Supabase)                                │
│ - Create question_sets with unique 6-char codes                    │
│ - Insert questions with JSONB correct_answer                       │
│ - Return codes to UI for sharing                                   │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Files (Current)**:
- `src/lib/ai/anthropic.ts` - Claude API wrapper
- `src/lib/ai/topicIdentifier.ts` - Topic identification logic
- `src/lib/ai/questionGenerator.ts` - Question generation orchestration
- `src/config/prompts/*.ts` - Subject-specific prompts (TypeScript)
- `package.json` - `@anthropic-ai/sdk` dependency
- `.env.local` - `ANTHROPIC_API_KEY`

---

## Proposed Architecture (OpenAI Responses API)

```
┌─────────────────────────────────────────────────────────────────────┐
│ User Uploads Materials (PDF, Images, Text)                         │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ API Route: /api/generate-questions                                 │
│ - Receives FormData with materials                                 │
│ - Uploads PDFs/images as files (Responses API file inputs)         │
│ - Converts inline images to data URLs only when needed             │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: Topic Identification (topicIdentifier.ts)                  │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ OpenAI Responses API Call                                      │ │
│ │ - Model: env-configured, newer-than-4o (default TBD)            │ │
│ │ - Max tokens: 1000                                              │ │
│ │ - Prompt: Same as current (hardcoded)                           │ │
│ │ - Input: Material text + PDF/image file references              │ │
│ │ - Output: 3-5 high-level topics (JSON)                          │ │
│ │ - response_format: { type: 'json_object' }                      │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: Question Generation (questionGenerator.ts)                 │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Parallel Execution (Promise.all) - UNCHANGED                    │ │
│ │                                                                  │ │
│ │ Task 1: Quiz Helppo                                             │ │
│ │ ┌──────────────────────────────────────────────────────────────┐│ │
│ │ │ OpenAI Responses API Call                                    ││ │
│ │ │ - Model: env-configured, newer-than-4o (default TBD)          ││ │
│ │ │ - Max tokens: 16000                                          ││ │
│ │ │ - Prompt: Same subject-specific prompts                      ││ │
│ │ │ - Input: Material text + PDFs/images + topics + grade         ││ │
│ │ │ - Output: 40-200 questions (JSON)                             ││ │
│ │ │ - response_format: { type: 'json_object' }                   ││ │
│ │ └──────────────────────────────────────────────────────────────┘│ │
│ │                                                                  │ │
│ │ Task 2: Quiz Normaali                                           │ │
│ │ ┌──────────────────────────────────────────────────────────────┐│ │
│ │ │ OpenAI Responses API Call                                    ││ │
│ │ │ - Same as Task 1 but difficulty: normaali                    ││ │
│ │ └──────────────────────────────────────────────────────────────┘│ │
│ │                                                                  │ │
│ │ Task 3: Flashcards (if enabled)                                 │ │
│ │ ┌──────────────────────────────────────────────────────────────┐│ │
│ │ │ OpenAI Responses API Call                                    ││ │
│ │ │ - Flashcard-specific prompts (60/30/10 distribution)         ││ │
│ │ └──────────────────────────────────────────────────────────────┘│ │
│ └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: Database Storage (Supabase) - UNCHANGED                    │
│ - Create question_sets with unique 6-char codes                    │
│ - Insert questions with JSONB correct_answer                       │
│ - Return codes to UI for sharing                                   │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Files (Proposed)**:
- `src/lib/ai/openai.ts` - **NEW** OpenAI API wrapper
- `src/lib/ai/topicIdentifier.ts` - **UPDATED** to use OpenAI
- `src/lib/ai/questionGenerator.ts` - **UPDATED** to use OpenAI
- `src/config/prompts/*.ts` - **UNCHANGED** (same prompts)
- `src/app/api/generate-questions/route.ts` - **UPDATED** (Responses API inputs)
- `package.json` - **CHANGED**: `openai` (remove `@anthropic-ai/sdk`)
- `.env.local` - **CHANGED**: `OPENAI_API_KEY` (remove `ANTHROPIC_API_KEY`)

---

## What Changes

### 1. Dependencies

**Before**:
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.1"
  }
}
```

**After**:
```json
{
  "dependencies": {
    "openai": "^4.75.0"
  }
}
```

### 2. Environment Variables

**Before** (`.env.example`):
```bash
ANTHROPIC_API_KEY=your_anthropic_api_key
```

**After** (`.env.example`):
```bash
# AI Provider: OpenAI (Responses API)
OPENAI_API_KEY=your_openai_api_key

# Optional: Override default model (default: newer-than-4o)
# OPENAI_MODEL=gpt-4.1        # Example: balanced
# OPENAI_MODEL=gpt-4.1-mini   # Example: faster/cheaper
# OPENAI_MODEL=o1-preview     # Example: reasoning-focused, slower
```

### 3. AI Wrapper

**Before** (`src/lib/ai/anthropic.ts`):
```typescript
import Anthropic from '@anthropic-ai/sdk';

export interface MessageContent {
  type: 'text' | 'image' | 'document';
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateWithClaude(
  messages: MessageContent[],
  maxTokens = 16000
): Promise<ClaudeResponse> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    messages: [{ role: 'user', content: messages }],
    max_tokens: maxTokens,
  });

  return {
    content: response.content[0].text,
    usage: response.usage,
  };
}
```

**After** (`src/lib/ai/openai.ts`):
```typescript
import OpenAI from 'openai';

export interface MessageContent {
  type: 'text' | 'image_url' | 'input_file';
  text?: string;
  image_url?: {
    url: string; // data:image/jpeg;base64,... or https://...
  };
  input_file?: {
    file_id: string;
  };
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000,
  maxRetries: 2,
});

export async function generateWithOpenAI(
  messages: MessageContent[],
  maxTokens = 16000
): Promise<OpenAIResponse> {
  const model = process.env.OPENAI_MODEL || 'gpt-4.1';

  const response = await openai.responses.create({
    model,
    input: [
      {
        role: 'user',
        content: messages.map(msg => {
          if (msg.type === 'text') {
            return { type: 'input_text', text: msg.text || '' };
          }
          if (msg.type === 'image_url') {
            return { type: 'input_image', image_url: msg.image_url?.url || '' };
          }
          return { type: 'input_file', file_id: msg.input_file?.file_id || '' };
        }),
      },
    ],
    max_output_tokens: maxTokens,
    temperature: 1.0,
    response_format: { type: 'json_object' },
  });

  return {
    content: response.output_text || '',
    usage: response.usage,
  };
}
```

### 4. PDF Handling

**Before** (`/api/generate-questions`):
```typescript
// Claude format
if (detectedType?.mime === 'application/pdf') {
  const base64 = buffer.toString('base64');
  files.push({
    type: 'document',
    source: {
      type: 'base64',
      media_type: 'application/pdf',
      data: base64,
    },
  });
}
```

**After** (`/api/generate-questions`):
```typescript
// OpenAI Responses API - PDFs uploaded as files, referenced by file_id
if (detectedType?.mime === 'application/pdf') {
  const file = await openai.files.create({
    file: buffer,
    purpose: 'responses',
  });
  files.push({
    type: 'input_file',
    input_file: {
      file_id: file.id,
    },
  });
}
```

**Important**: Use file uploads for PDFs in the Responses API. Avoid `image_url` for PDFs.

### 5. Image Handling

**Before**:
```typescript
// Anthropic format
{
  type: 'image',
  source: {
    type: 'base64',
    media_type: detectedType.mime,
    data: base64,
  }
}
```

**After**:
```typescript
// OpenAI Responses API format
// Prefer file uploads for large images; data URLs are OK for small images
{
  type: 'image_url',
  image_url: {
    url: `data:${detectedType.mime};base64,${base64}`,
  },
}
```

---

## What Stays the Same

✅ **2-step orchestrated architecture**: Topic identification → Question generation
✅ **Parallel execution**: Promise.all() for quiz (helppo, normaali) + flashcard
✅ **Subject-specific prompts**: Same prompt text, just different API wrapper
✅ **Topic-balanced generation**: 3-5 topics, stratified sampling
✅ **Grade-specific distributions**: Helppo vs Normaali percentages
✅ **Flashcard optimization**: 60/30/10 (English), 70/20/10 (Math), 50/30/20 (Generic)
✅ **Database schema**: No migration needed (JSONB stores same data)
✅ **Frontend components**: No changes to UI or game session logic
✅ **Validation schemas**: Zod schemas unchanged
✅ **Question types**: All 6 types work identically
✅ **Shareable codes**: 6-character code generation unchanged
✅ **PDF support**: Responses API file inputs
✅ **Image support**: Responses API image inputs

---

## Cost Comparison

### Current (Claude Sonnet 4)
- **Input**: $3 per 1M tokens
- **Output**: $15 per 1M tokens
- **Typical request**: ~10k input, ~20k output
- **Cost per request**: $0.33

### Proposed (OpenAI, newer-than-4o model)
- **Input/Output**: Model-dependent (confirm current pricing)
- **Typical request**: ~10k input, ~20k output
- **Action**: Recalculate after model selection

---

## Breaking Changes

### 1. API Response Format
- **Before**: `response.content[].text`
- **After**: `response.output_text`
- **Impact**: Requires updating response parsing in wrapper

### 2. Message Content Format
- **Before**: `{ type: 'image', source: { data: '...' } }`
- **After**: `{ type: 'input_file', file_id }` for PDFs; `{ type: 'input_image', image_url }` for images
- **Impact**: Update message building in topicIdentifier + questionGenerator

### 3. PDF Message Type
- **Before**: `type: 'document'`
- **After**: `type: 'input_file'` with `file_id`
- **Impact**: Requires file upload flow in `/api/generate-questions`

### 4. Token Limits
- **Before**: Claude Sonnet 4 has 200k context
- **After**: OpenAI model varies (confirm context window)
- **Impact**: Still sufficient if question output is capped at 200

### 5. Environment Variables
- **Before**: `ANTHROPIC_API_KEY`
- **After**: `OPENAI_API_KEY` + optional `OPENAI_MODEL`
- **Impact**: Requires updating `.env.local` and Vercel env vars

---

## Migration Risks

### Low Risk ✅
✅ **Prompt Compatibility**: Same prompts likely work with new model
✅ **Cost Control**: Capped output (200 max) reduces truncation risk
✅ **Database Storage**: JSONB schema is unchanged

### Medium Risk ⚠️
⚠️ **API Response Format Changes**: Different error codes, rate limits
   - **Mitigation**: Update error handling, test all error scenarios

⚠️ **Message Format Changes**: File inputs and image formats
   - **Mitigation**: Test with sample PDFs and images

⚠️ **Large Output Truncation**: 200-question max still risks token limits
   - **Mitigation**: Cap output tokens per request; consider chunked generation

---

## Rollback Plan

If OpenAI migration causes issues:

1. **Restore package.json**:
   ```bash
   npm install @anthropic-ai/sdk
   npm uninstall openai
   ```

2. **Restore environment variables**:
   - `.env.local`: Add back `ANTHROPIC_API_KEY`
   - Vercel: Restore `ANTHROPIC_API_KEY` in project settings

3. **Restore files from git**:
   ```bash
   git checkout main src/lib/ai/anthropic.ts
   git checkout main src/lib/ai/topicIdentifier.ts
   git checkout main src/lib/ai/questionGenerator.ts
   git checkout main src/app/api/generate-questions/route.ts
   ```

4. **Delete new files**:
   ```bash
   rm src/lib/ai/openai.ts
   ```

5. **Deploy previous version**:
   ```bash
   git push origin main
   ```

**Recommendation**: Test thoroughly in development before deploying to production.

---

## Validation Questions

Before proceeding with execution, please confirm:

1. ✅ **Architecture**: Is the 2-step orchestrated flow (Topic ID → Question Generation) still correct?

2. ✅ **PDF Handling**: Use Responses API file inputs (no text extraction). Confirm this approach is acceptable.

3. ✅ **Model Selection**: Choose a newer-than-4o default (confirm exact model).
   - Alternative: `gpt-4.1` (balanced)
   - Alternative: `gpt-4.1-mini` (faster/cheaper)
   - Alternative: `o1-preview` (reasoning-focused, slower)

4. ✅ **Environment Variables**: Should model be configurable via `OPENAI_MODEL` env var?

5. ✅ **Testing Strategy**: Test in development first, or create a staging environment?

6. ✅ **Deployment Timeline**: When should this go to production?

---

## Updated Implementation Summary

**Simplified Migration**:

1. ✅ Replace `@anthropic-ai/sdk` with `openai` dependency
2. ✅ Create `src/lib/ai/openai.ts` wrapper (Responses API)
3. ✅ Update `topicIdentifier.ts` to use OpenAI + file inputs
4. ✅ Update `questionGenerator.ts` to use OpenAI
5. ✅ Update `/api/generate-questions` for file uploads (PDFs/images)
6. ✅ Delete `src/lib/ai/anthropic.ts`
7. ✅ Update environment variables
8. ✅ Test with PDFs and images
9. ✅ Deploy to production

**No separate PDF text extraction needed if Responses file inputs produce reliable results.**

---

## Prompt Management & Question Quality Improvements

### Current State Analysis

**Existing Prompt Structure** (`src/config/prompts/*.ts`):
```
english.ts          - Language-specific prompts (A1-English curriculum)
math.ts             - Math computation prompts (Finnish curriculum)
generic.ts          - Generic subject prompts (history, biology, geography, etc.)
english-flashcards.ts   - Flashcard-optimized English prompts
math-flashcards.ts      - Flashcard-optimized Math prompts
generic-flashcards.ts   - Flashcard-optimized generic prompts
```

**Each prompt file contains**:
1. `GRADE_DISTRIBUTIONS` - Hardcoded question type percentages per grade/difficulty
2. Grade-specific curriculum content (embedded in functions)
3. Difficulty instructions (embedded)
4. Question type examples (embedded)
5. JSON output schema (repeated across files)
6. Topic tagging rules (repeated across files)

**Existing Improvement Plans** (Tasks 001-004):
- ✅ Template system created: `/src/config/prompt-templates/` (6 .txt files)
- ⏳ `PromptLoader` class (Task 001) - loads templates, substitutes variables
- ⏳ `PromptBuilder` class (Task 002) - builds variable data from parameters
- ⏳ Refactor `questionGenerator.ts` (Task 003) - use new system
- ⏳ Cleanup old prompts (Task 004) - delete TypeScript prompt files

---

### Problems with Current Design

#### 1. Code Duplication
❌ **Grade distributions repeated 6 times** (each prompt file has identical structure)
❌ **JSON schema repeated 6 times** (same output format everywhere)
❌ **Topic tagging rules repeated 6 times** (identical instructions)
❌ **Question type instructions duplicated** across quiz/flashcard variants

**Impact**: Hard to maintain consistency, easy to introduce bugs when updating one file but forgetting others.

#### 2. Subject Type Confusion
❌ **Generic.ts handles too many subject types**:
- Content subjects (history, biology, geography)
- Skills subjects (art, music, PE)
- Different question patterns needed but using same prompt

**Impact**: Lower question quality for subjects with different cognitive patterns (e.g., timeline questions for history vs. concept questions for biology).

#### 3. Mixed Skill Questions
❌ **No skill-level topic tagging**:
- English: Grammar + Vocabulary mixed in one question
- Math: Computation + Word Problem mixed
- Written subjects: Fact recall + Analysis mixed

**Impact**: Harder to balance question types, students can't practice specific skills.

#### 4. Prompt Size and Token Waste
❌ **Large prompts sent on every request**:
- English prompt: ~2000 tokens (includes all examples, distributions, rules)
- Math prompt: ~1800 tokens
- Generic prompt: ~2200 tokens

**Impact**: Higher API costs, slower generation, context window waste.

#### 5. Hard to Edit for Non-Developers
❌ **TypeScript code editing required** for prompt changes
❌ **No clear separation** between prompt content and logic
❌ **Risk of breaking code** when editing prompt text

**Impact**: Can't iterate on prompts without code deployment.

---

### Improvement Options

#### **Option A: Template System Only** (Tasks 001-004)
**Status**: In progress, templates already created

**Pros**:
- ✅ Separates prompt content from code
- ✅ Easier editing (plain text files)
- ✅ Reduces code duplication

**Cons**:
- ❌ Still 6 separate template files
- ❌ Doesn't solve subject type confusion
- ❌ No skill-level topic tagging
- ❌ Duplication of common blocks across templates

**Recommendation**: **Foundation step - complete this first**, then layer on improvements.

---

#### **Option B: Modular Prompt System** (Recommended)
**Build on tasks 001-004 with subject-type modules**

**Architecture**:
```
src/config/prompt-templates/
├── core/
│   ├── format.txt              # JSON schema + output rules (shared)
│   ├── topic-tagging.txt       # Topic tagging instructions (shared)
│   └── grade-distributions.json # All distributions in one file
│
├── types/
│   ├── language.txt            # Language-specific rules (English, Finnish)
│   │                           # - Grammar vs vocabulary distinction
│   │                           # - Skill-level tagging
│   ├── math.txt                # Math-specific rules
│   │                           # - Computation vs word problems
│   │                           # - Show-your-work requirements
│   └── written.txt             # Content subjects (history, biology, geography)
│                               # - Fact recall vs analysis
│                               # - Timeline vs concept questions
│
├── subjects/
│   ├── english.json            # English-specific curriculum per grade
│   ├── math.json               # Math-specific curriculum per grade
│   └── generic.json            # Generic subject mappings
│
└── assembled/
    ├── quiz/
    │   ├── english-quiz.txt    # Final assembled template
    │   ├── math-quiz.txt
    │   └── {subject}-quiz.txt  # Auto-generated from modules
    └── flashcard/
        └── ...                 # Auto-generated flashcard variants
```

**Prompt Assembly Logic** (in `PromptBuilder.ts`):
```typescript
function buildPrompt(params: {
  subject: string;
  difficulty: Difficulty;
  grade: number;
  mode: 'quiz' | 'flashcard';
}): string {
  // 1. Determine subject type
  const subjectType = getSubjectType(params.subject); // language | math | written

  // 2. Load modules
  const format = loadModule('core/format.txt');
  const topicRules = loadModule('core/topic-tagging.txt');
  const typeRules = loadModule(`types/${subjectType}.txt`);
  const curriculum = loadModule(`subjects/${params.subject}.json`);
  const distributions = loadModule('core/grade-distributions.json');

  // 3. Extract data
  const gradeCurriculum = curriculum[params.grade];
  const distribution = distributions[params.subject][params.grade][params.difficulty];

  // 4. Assemble final prompt
  return `
${format}

${topicRules}

${typeRules}

CURRICULUM FOR GRADE ${params.grade}:
${gradeCurriculum}

QUESTION TYPE DISTRIBUTION:
${formatDistribution(distribution)}

${mode === 'flashcard' ? loadModule('core/flashcard-rules.txt') : ''}
  `.trim();
}
```

**Benefits**:
- ✅ **DRY**: Common blocks defined once
- ✅ **Clear separation**: Language vs Math vs Written subjects
- ✅ **Easy editing**: Edit type module to affect all subjects of that type
- ✅ **Skill tagging**: Type-specific skill taxonomies
- ✅ **Smaller token usage**: Assemble only needed modules

**Complexity**: Medium - requires refactoring prompt builder

---

#### **Option C: Skill-Level Topic Tagging** (Builds on Option B)

**Add explicit skill taxonomy to prompts**:

**English Skills**:
```json
{
  "skills": {
    "grammar": ["verb_tenses", "sentence_structure", "parts_of_speech"],
    "vocabulary": ["word_meaning", "synonyms", "context_clues"],
    "reading": ["comprehension", "inference", "main_idea"],
    "writing": ["sentence_formation", "paragraph_structure"]
  }
}
```

**Math Skills**:
```json
{
  "skills": {
    "computation": ["addition", "subtraction", "multiplication", "division"],
    "word_problems": ["problem_solving", "multi_step"],
    "geometry": ["shapes", "area", "perimeter"],
    "number_sense": ["place_value", "fractions", "decimals"]
  }
}
```

**Written Subjects Skills**:
```json
{
  "skills": {
    "recall": ["facts", "dates", "names", "definitions"],
    "comprehension": ["cause_effect", "compare_contrast", "sequences"],
    "application": ["examples", "real_world_connections"],
    "analysis": ["patterns", "relationships", "conclusions"]
  }
}
```

**Updated Question Schema**:
```json
{
  "question_text": "...",
  "type": "multiple_choice",
  "topic": "Grammar",           // High-level topic
  "skill": "verb_tenses",        // Specific skill
  "subtopic": "Present Simple"   // Optional detail
}
```

**Prompt Instruction**:
```
SKILL TAGGING REQUIREMENTS:
1. Each question MUST have exactly ONE skill tag
2. DO NOT mix skills in a single question
   ❌ BAD: "Complete the sentence AND identify the verb tense" (mixed skills)
   ✅ GOOD: "Complete the sentence: I ___ to school" (grammar only)
3. Tag the PRIMARY skill being tested
4. Use skill tags from the provided taxonomy

SKILL DISTRIBUTION TARGETS:
- Grammar: 40% of language questions
- Vocabulary: 30% of language questions
- Reading: 20% of language questions
- Writing: 10% of language questions
```

**Benefits**:
- ✅ **Clearer questions**: No skill mixing confusion
- ✅ **Better sampling**: Stratified by topic AND skill
- ✅ **Practice modes**: "Practice grammar only" feature
- ✅ **Quality metrics**: Track which skills need better questions

**Complexity**: Medium - requires updating prompts + database schema (add `skill` column)

---

#### **Option D: Two-Level Topics** (Builds on Option C)

**Problem**: Current "topic" is too high-level OR too detailed

**Current Inconsistency**:
- ❌ "Grammar" (too broad - what grammar?)
- ❌ "Present Simple Tense" (too narrow - limits sampling)

**Solution**: Enforce 2-level taxonomy

```
topic: "Grammar"           // High-level (for stratified sampling)
subtopic: "Verb Tenses"    // Mid-level (for focused practice)
skill: "present_simple"    // Specific skill
```

**Prompt Instruction**:
```
TOPIC HIERARCHY REQUIREMENTS:

Level 1 (topic): High-level category (3-5 categories per subject)
  Examples:
  - English: Grammar, Vocabulary, Reading, Writing
  - Math: Computation, Geometry, Number Sense, Word Problems
  - History: Ancient History, Medieval History, Modern History

Level 2 (subtopic): Mid-level grouping (5-10 per topic)
  Examples:
  - Grammar → Verb Tenses, Sentence Structure, Parts of Speech
  - Computation → Addition/Subtraction, Multiplication/Division, Fractions

Level 3 (skill): Specific skill tag from taxonomy
  Examples:
  - Verb Tenses → present_simple, past_simple, present_continuous

ALL questions must have:
- topic (Level 1) - for stratified sampling
- subtopic (Level 2) - for focused practice modes
- skill (Level 3) - for precise tracking
```

**Database Update**:
```sql
ALTER TABLE questions
  ADD COLUMN subtopic TEXT,
  ADD COLUMN skill TEXT;

-- Migrate existing data
UPDATE questions
  SET subtopic = topic,  -- Move old topic to subtopic
      topic = identify_high_level_topic(subject);
```

**Benefits**:
- ✅ **Flexible sampling**: Sample by topic OR subtopic OR skill
- ✅ **Practice modes**: "Grammar only" or "Verb Tenses only" or "Present Simple only"
- ✅ **Analytics**: Track gaps at all levels
- ✅ **Balanced generation**: 15 questions = 5 per topic (L1) → distributed across subtopics (L2)

**Complexity**: High - requires DB migration + prompt updates + UI changes

---

#### **Option E: Subject-Type Routing** (Quick Win)

**Problem**: `generic.ts` handles too many subject types

**Solution**: Split generic into 3 types

**Before**:
```
generic.ts → history, biology, geography, art, music, PE, religion, etc.
```

**After**:
```
written.ts   → history, biology, geography (content-heavy)
skills.ts    → art, music, PE (skill-based, different question patterns)
concepts.ts  → religion, ethics, philosophy (concept-based)
```

**Subject Type Mapping** (`src/config/subjects.ts`):
```typescript
export const SUBJECT_TYPE_MAPPING = {
  english: 'language',
  math: 'math',
  finnish: 'language',
  history: 'written',
  biology: 'written',
  geography: 'written',
  'environmental-studies': 'written',
  art: 'skills',
  music: 'skills',
  pe: 'skills',
  religion: 'concepts',
  ethics: 'concepts',
} as const;

export function getSubjectType(subject: string): SubjectType {
  return SUBJECT_TYPE_MAPPING[subject] || 'written'; // Default fallback
}
```

**Prompt Differentiation**:

**written.txt** (content subjects):
```
WRITTEN SUBJECT QUESTION PATTERNS:
- Fact recall (WHO, WHAT, WHEN, WHERE)
- Timeline ordering (chronological events)
- Cause-and-effect relationships
- Compare and contrast
- Definition matching

AVOID:
- Opinion questions (no "best" or "most beautiful")
- Skill demonstration (can't test in multiple choice)
```

**skills.txt** (art, music, PE):
```
SKILLS SUBJECT QUESTION PATTERNS:
- Technique identification
- Equipment/tool recognition
- Process steps
- Safety procedures
- Cultural context

AVOID:
- Subjective judgment questions
- Questions requiring physical demonstration
```

**concepts.txt** (ethics, philosophy, religion):
```
CONCEPTS SUBJECT QUESTION PATTERNS:
- Value identification
- Perspective comparison
- Scenario analysis
- Concept definition
- Application examples

EMPHASIZE:
- Multiple perspectives are valid
- Focus on understanding, not memorization
```

**Benefits**:
- ✅ **Better question quality**: Patterns match subject cognitive demands
- ✅ **Easy to implement**: Just split templates + add routing logic
- ✅ **No DB changes**: Works with existing schema

**Complexity**: Low - quick win, high impact

---

### Implementation Roadmap

**Phase 1: Foundation** (Tasks 001-004 - Already Planned)
- ✅ Template files created
- ⏳ Complete `PromptLoader` (Task 001)
- ⏳ Complete `PromptBuilder` (Task 002)
- ⏳ Refactor questionGenerator (Task 003)
- ⏳ Cleanup old prompts (Task 004)

**Phase 2: Subject-Type Routing** (Quick Win - Option E)
- Split `generic.txt` → `written.txt`, `skills.txt`, `concepts.txt`
- Add subject type mapping to `subjects.ts`
- Update `PromptBuilder` to route by subject type
- **Effort**: 2-4 hours
- **Impact**: High - better questions for all subjects

**Phase 3: Modular Prompt System** (Option B)
- Extract common blocks: `core/format.txt`, `core/topic-tagging.txt`
- Create type modules: `types/language.txt`, `types/math.txt`, `types/written.txt`
- Move distributions to JSON: `core/grade-distributions.json`
- Update `PromptBuilder` to assemble modules
- **Effort**: 8-12 hours
- **Impact**: Medium-High - easier maintenance, reduced duplication

**Phase 4: Skill-Level Tagging** (Option C - Optional)
- Define skill taxonomies per subject type
- Add `skill` column to database
- Update prompts with skill tagging requirements
- Update stratified sampling to include skills
- **Effort**: 12-16 hours
- **Impact**: High - enables skill-specific practice modes

**Phase 5: Two-Level Topics** (Option D - Long-term)
- Define topic hierarchy (L1: topic, L2: subtopic, L3: skill)
- Migrate existing data
- Update prompts with hierarchy requirements
- Add UI for hierarchy-based filtering
- **Effort**: 16-24 hours
- **Impact**: Very High - flexible practice modes, better analytics

---

### Recommendation

**Immediate** (with OpenAI migration):
1. ✅ Complete Tasks 001-004 (template system)
2. ✅ Implement **Option E** (Subject-Type Routing) - quick win

**Short-term** (1-2 weeks after migration):
3. ✅ Implement **Option B** (Modular Prompt System)

**Medium-term** (1-2 months):
4. ✅ Implement **Option C** (Skill-Level Tagging)

**Long-term** (future enhancement):
5. ⏳ Consider **Option D** (Two-Level Topics) if analytics show need

**Why this order**:
- Phases 1-2 give immediate benefits with low risk
- Phase 3 reduces maintenance burden before scaling
- Phases 4-5 add features once foundation is solid

---

---

**Status**: AWAITING USER VALIDATION

**Created**: 2025-01-18 (Updated with Responses API + prompt maintainability ideas)
**Task Reference**: `todo/task-009-migrate-claude-to-openai.md`
