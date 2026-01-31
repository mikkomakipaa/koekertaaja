# Question Generation Flow - Wiring Diagram

**Last Updated**: 2025-01-18
**Status**: Current production architecture + planned prompt separation enhancements

---

## 🎯 Executive Summary

**Current AI Model**: Claude Sonnet 4 (`claude-sonnet-4-20250514`) - NOT GPT/OpenAI
**Architecture**: Orchestrated AI with 2-step process (topic identification → question generation)
**Simultaneous Creation**: ✅ YES - Quiz and Flashcard sets created in parallel
**Prompt Separation**: ⏳ Planned (Tasks 001-004 in todo/)

---

## 📊 Current Flow Diagram (Production)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                                │
│                     /create page (Client)                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Submit Form
                                  │ • questionSetName
                                  │ • subject, grade
                                  │ • questionCount (pool size: 40-400)
                                  │ • examLength (session: 5-20)
                                  │ • materialText (optional)
                                  │ • files[] (PDFs/images, max 2 files)
                                  │ • generationMode: 'quiz' | 'flashcard' | 'both'
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API ROUTE: /api/generate-questions                │
│                         (Server-side)                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  🔒 Authentication Check                                             │
│     └─ requireAuth() - Supabase session validation                  │
│                                                                       │
│  ⏱️ Rate Limiting                                                     │
│     └─ 5 requests/hour per user (IP + session)                       │
│     └─ Returns 429 + Retry-After + X-RateLimit-* headers             │
│                                                                       │
│  ✅ Input Validation                                                 │
│     └─ Zod schema: createQuestionSetSchema                          │
│     └─ File validation: type, size (2MB/file, 2 files max)          │
│     └─ Total size check: 4.5MB limit (Vercel Hobby tier)            │
│                                                                       │
│  📤 File Processing                                                  │
│     └─ Convert PDFs/images to base64                                │
│     └─ Magic byte validation (fileTypeFromBuffer)                   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│              STEP 1: Topic Identification (Orchestrated)             │
│                    lib/ai/topicIdentifier.ts                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  📝 Single-Purpose Prompt                                            │
│     Purpose: Identify 3-5 high-level topics from material           │
│     Prompt: Hardcoded in topicIdentifier.ts (Finnish)               │
│     Input:                                                           │
│       • subject, grade                                               │
│       • materialText (if provided)                                   │
│       • materialFiles[] (base64 PDFs/images)                         │
│                                                                       │
│  🤖 AI Call                                                          │
│     └─ Claude Sonnet 4 (claude-sonnet-4-20250514)                   │
│     └─ Max tokens: 1000 (small, focused task)                       │
│     └─ Timeout: 120s                                                 │
│     └─ Retries: 2                                                    │
│                                                                       │
│  📊 Response Processing                                              │
│     └─ Parse JSON: { topics: ["Topic1", "Topic2", "Topic3"] }       │
│     └─ Validate: 3-5 topics required                                │
│     └─ Adjust: Add subject if <3, trim to 5 if >5                   │
│                                                                       │
│  ✅ Output                                                           │
│     └─ TopicAnalysisResult:                                          │
│         • topics: string[] (3-5 high-level topics)                  │
│         • primarySubject: string                                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│          STEP 2: Question Generation (Parallel Execution)            │
│                  lib/ai/questionGenerator.ts                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  🔀 Parallel Tasks Based on generationMode                          │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  IF generationMode === 'quiz' OR 'both':                    │    │
│  │                                                               │    │
│  │  📝 Task 1: Helppo Quiz Questions                           │    │
│  │     • Difficulty: 'helppo'                                   │    │
│  │     • Count: questionCount (40-400 from user)                │    │
│  │     • Mode: 'quiz'                                           │    │
│  │     • Topics: identifiedTopics[] from Step 1                 │    │
│  │     • Prompt: getEnglishPrompt() | getMathPrompt() |         │    │
│  │               getGenericPrompt()                             │    │
│  │     • Prompt location: src/config/prompts/*.ts               │    │
│  │                                                               │    │
│  │  📝 Task 2: Normaali Quiz Questions                         │    │
│  │     • Difficulty: 'normaali'                                 │    │
│  │     • Count: questionCount (40-400 from user)                │    │
│  │     • Mode: 'quiz'                                           │    │
│  │     • Topics: identifiedTopics[] from Step 1                 │    │
│  │     • Prompt: Same prompt functions (difficulty-aware)       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  IF generationMode === 'flashcard' OR 'both':               │    │
│  │                                                               │    │
│  │  📝 Task 3: Flashcard Questions                             │    │
│  │     • Difficulty: 'normaali' (placeholder)                   │    │
│  │     • Count: topicCount × 10 (auto-calculated)               │    │
│  │       Example: 3 topics = 30 flashcards                      │    │
│  │     • Mode: 'flashcard'                                      │    │
│  │     • Topics: identifiedTopics[] from Step 1                 │    │
│  │     • Prompt: getEnglishFlashcardsPrompt() |                 │    │
│  │               getMathFlashcardsPrompt() |                    │    │
│  │               getGenericFlashcardsPrompt()                   │    │
│  │     • Prompt location: src/config/prompts/*-flashcards.ts    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  🤖 AI Calls (Parallel Execution with Promise.all)                  │
│     Each task:                                                       │
│     └─ Claude Sonnet 4 (claude-sonnet-4-20250514)                   │
│     └─ Max tokens: 16000 (large, complex task)                      │
│     └─ Timeout: 120s                                                 │
│     └─ Retries: 2                                                    │
│                                                                       │
│  📊 Response Processing (Per Task)                                   │
│     └─ Parse JSON array of questions                                │
│     └─ Validate with Zod: aiQuestionArraySchema                     │
│     └─ Graceful handling: Accept ≥70% valid questions               │
│     └─ Shuffle options for multiple_choice questions                │
│     └─ Convert to Question[] type                                   │
│                                                                       │
│  ✅ Output (Per Task)                                                │
│     └─ Questions: Question[] (validated and processed)              │
│     └─ Mode: 'quiz' | 'flashcard'                                   │
│     └─ Difficulty: 'helppo' | 'normaali' (quiz only)                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│            STEP 3: Database Storage (Sequential per Set)             │
│                  lib/supabase/write-queries.ts                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  🔄 For Each Generation Result (Loop)                               │
│                                                                       │
│  📝 Generate Set Metadata                                            │
│     Quiz set name: "{questionSetName} - Helppo" | "- Normaali"      │
│     Flashcard set name: "{questionSetName} - Kortit"                │
│                                                                       │
│  🔑 Generate Unique Code                                             │
│     └─ 6-character code (A-Z0-9)                                     │
│     └─ Collision handling: Retry up to 50 times                     │
│     └─ Crypto.randomBytes for randomness                            │
│                                                                       │
│  💾 Create Question Set                                              │
│     Table: question_sets                                             │
│     Columns:                                                         │
│       • id: UUID (auto)                                              │
│       • code: VARCHAR(6) UNIQUE                                      │
│       • name: TEXT (difficulty/mode suffix)                          │
│       • subject: VARCHAR(50)                                         │
│       • grade: INTEGER (optional)                                    │
│       • difficulty: VARCHAR(20)                                      │
│       • mode: VARCHAR(20) ('quiz' | 'flashcard')                    │
│       • topic: TEXT (optional)                                       │
│       • question_count: INTEGER                                      │
│       • created_at: TIMESTAMPTZ                                      │
│                                                                       │
│  💾 Create Questions                                                 │
│     Table: questions                                                 │
│     Columns:                                                         │
│       • id: UUID (auto)                                              │
│       • question_set_id: UUID (FK)                                   │
│       • question_text: TEXT                                          │
│       • question_type: VARCHAR(50)                                   │
│       • correct_answer: JSONB (flexible structure)                  │
│       • options: JSONB (for multiple_choice, matching, etc.)        │
│       • explanation: TEXT                                            │
│       • topic: TEXT (from identifiedTopics)                         │
│       • order_index: INTEGER                                         │
│                                                                       │
│  🔐 Security                                                          │
│     └─ Service role key (bypasses RLS)                              │
│     └─ Server-side only (API route)                                 │
│     └─ Public read via RLS policies                                 │
│                                                                       │
│  ✅ Output (Per Set)                                                 │
│     └─ QuestionSet with code                                         │
│     └─ Questions[] linked to set                                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API RESPONSE TO CLIENT                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  📊 Response Structure                                               │
│     {                                                                 │
│       success: true,                                                 │
│       message: "Created X question sets",                            │
│       questionSets: [                                                │
│         {                                                             │
│           code: "ABC123",         // Shareable code                  │
│           name: "Historia - Helppo",                                 │
│           difficulty: "helppo",                                      │
│           mode: "quiz",                                              │
│           questionCount: 100                                         │
│         },                                                            │
│         {                                                             │
│           code: "XYZ789",                                            │
│           name: "Historia - Normaali",                               │
│           difficulty: "normaali",                                    │
│           mode: "quiz",                                              │
│           questionCount: 100                                         │
│         },                                                            │
│         {                                                             │
│           code: "FLS456",                                            │
│           name: "Historia - Kortit",                                 │
│           difficulty: "normaali",                                    │
│           mode: "flashcard",                                         │
│           questionCount: 30        // 3 topics × 10 cards            │
│         }                                                             │
│       ],                                                              │
│       totalQuestions: 230                                            │
│     }                                                                 │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   UI: Success Confirmation Screen                     │
│                      /create page (Client)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  🎉 Success Message                                                  │
│     "Kysymykset on luotu onnistuneesti!"                             │
│                                                                       │
│  📊 Display Question Sets                                            │
│     For each set:                                                    │
│       • Mode badge (Quiz/Flashcard)                                  │
│       • Difficulty badge (Helppo/Normaali)                           │
│       • Shareable code: ABC123                                       │
│       • Copy button (copies code to clipboard)                       │
│       • Direct link: /play/ABC123                                    │
│       • Question count                                               │
│                                                                       │
│  🔗 Actions                                                           │
│     • Copy codes for sharing                                         │
│     • Navigate to /play/[code] to practice                           │
│     • Create another question set (reset form)                       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Generation Mode Scenarios

### Scenario 1: Quiz Only (`generationMode: 'quiz'`)
**Input**: User unchecks flashcard checkbox
**Output**: 2 question sets
- Set 1: Helppo (40-400 questions)
- Set 2: Normaali (40-400 questions)

### Scenario 2: Flashcard Only (`generationMode: 'flashcard'`)
**Input**: User checks only flashcard checkbox, unchecks quiz
**Output**: 1 question set
- Set 1: Kortit (topicCount × 10 questions)

### Scenario 3: Both (`generationMode: 'both'`) - DEFAULT
**Input**: User checks flashcard checkbox (quiz always enabled)
**Output**: 3 question sets
- Set 1: Helppo (40-400 questions)
- Set 2: Normaali (40-400 questions)
- Set 3: Kortit (topicCount × 10 questions)

**Parallel Execution**: All 3 sets generated simultaneously via `Promise.all()`

---

## 🤖 AI Model Configuration

**Current Model**: Claude Sonnet 4
- Model ID: `claude-sonnet-4-20250514`
- Provider: Anthropic
- API Key: `ANTHROPIC_API_KEY` (environment variable)

**NOT USING**:
- ❌ OpenAI GPT models
- ❌ GPT-4, GPT-3.5, GPT-5 (doesn't exist)

**Configuration**: `src/lib/ai/anthropic.ts`

---

## 🔐 Environment Variables (Current)

### Required
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Anthropic AI
ANTHROPIC_API_KEY=your_anthropic_api_key  # Claude Sonnet 4
```

### Optional
```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

### Planned (Prompt Separation - Tasks 001-004)
```bash
# Future: Anthropic Console Integration (Phase 2)
# These would enable loading prompts from Anthropic Console
# Currently NOT implemented - prompts are in code

# ANTHROPIC_CONSOLE_PROMPT_ID_ENGLISH_QUIZ=prompt_eng_quiz_v1
# ANTHROPIC_CONSOLE_PROMPT_ID_MATH_QUIZ=prompt_math_quiz_v1
# ANTHROPIC_CONSOLE_PROMPT_ID_GENERIC_QUIZ=prompt_gen_quiz_v1
# ANTHROPIC_CONSOLE_PROMPT_ID_ENGLISH_FLASHCARD=prompt_eng_flash_v1
# ANTHROPIC_CONSOLE_PROMPT_ID_MATH_FLASHCARD=prompt_math_flash_v1
# ANTHROPIC_CONSOLE_PROMPT_ID_GENERIC_FLASHCARD=prompt_gen_flash_v1
# ANTHROPIC_CONSOLE_ENABLED=false  # Toggle Console vs local templates
```

**Note**: Prompt separation (Tasks 001-004) will introduce local template files FIRST, then optionally add Console integration in Phase 2.

---

## 📁 Prompt Storage (Current Architecture)

### Topic Identification Prompt
**Location**: `src/lib/ai/topicIdentifier.ts` (hardcoded)
**Purpose**: Identify 3-5 high-level topics
**Language**: Finnish
**Size**: ~1000 tokens max

### Question Generation Prompts
**Location**: `src/config/prompts/*.ts` (TypeScript functions)

**Quiz Prompts**:
- `src/config/prompts/english.ts` → `getEnglishPrompt()`
- `src/config/prompts/math.ts` → `getMathPrompt()`
- `src/config/prompts/generic.ts` → `getGenericPrompt()`

**Flashcard Prompts**:
- `src/config/prompts/english-flashcards.ts` → `getEnglishFlashcardsPrompt()`
- `src/config/prompts/math-flashcards.ts` → `getMathFlashcardsPrompt()`
- `src/config/prompts/generic-flashcards.ts` → `getGenericFlashcardsPrompt()`

**Characteristics**:
- TypeScript functions (not plain text)
- Embedded metadata (distributions, grade content)
- Variable substitution in code
- Difficulty-aware logic

---

## 🔮 Future: Prompt Separation Architecture (Planned)

### Phase 1: Local Templates (Tasks 001-004)
**Goal**: Separate prompts from code

**New Structure**:
```
src/config/prompt-templates/
├── quiz/
│   ├── english-quiz.txt       ✅ Created
│   ├── math-quiz.txt          ✅ Created
│   └── generic-quiz.txt       ✅ Created
├── flashcard/
│   ├── english-flashcard.txt  ✅ Created
│   ├── math-flashcard.txt     ✅ Created
│   └── generic-flashcard.txt  ✅ Created
└── metadata/
    ├── english-distributions.json      ✅ Created
    ├── math-distributions.json         ✅ Created
    ├── generic-distributions.json      ✅ Created
    ├── english-grade-content.json      ✅ Created
    ├── math-grade-content.json         ✅ Created
    └── difficulty-instructions.json    ✅ Created
```

**New Components** (To Be Created):
- `src/lib/prompts/PromptLoader.ts` - Load templates, substitute variables
- `src/lib/prompts/PromptBuilder.ts` - Build variable data from params

**Migration** (Task 003):
- Refactor `questionGenerator.ts` to use PromptLoader + PromptBuilder
- Remove old prompt functions (`getEnglishPrompt()`, etc.)
- Keep same AI API calls (no change to Claude integration)

**Benefits**:
- Product team can edit `.txt` files directly
- Version control for prompts (git)
- No code changes needed for prompt tweaks
- Foundation for Console integration

### Phase 2: Anthropic Console (Future)
**Goal**: Optional prompt management via Anthropic Console

**Implementation**:
- PromptLoader tries Console first, falls back to local templates
- Environment variables control which prompts come from Console
- Local templates remain as reliable fallback

**Status**: Not yet planned (Phase 1 must complete first)

---

## ❓ Validation Questions

### Question 1: Simultaneous Quiz + Flashcard Creation
**Current Behavior**: ✅ YES - Generated in parallel via `Promise.all()`

**Details**:
- User checks flashcard checkbox → `generationMode: 'both'`
- API creates 3 tasks: Helppo quiz, Normaali quiz, Flashcards
- All 3 execute in parallel (not sequential)
- Total time: ~20-30 seconds (similar to quiz-only)
- Database saves all 3 sets with unique codes

**Confirmation Needed**: Is this the desired behavior, or should they be sequential?

**Recommended**: Keep parallel execution for speed.

---

### Question 2: Separated Prompts for Topic ID vs Questions
**Current Behavior**: ✅ YES - Two separate AI calls

**Step 1 Prompt** (Topic Identification):
- **Purpose**: Identify 3-5 topics only
- **Location**: `src/lib/ai/topicIdentifier.ts` (hardcoded)
- **Size**: Small (~1000 tokens)
- **Output**: JSON `{topics: [...]}`

**Step 2 Prompt** (Question Generation):
- **Purpose**: Generate questions with topic tags
- **Location**: `src/config/prompts/*.ts` (functions)
- **Size**: Large (~16000 tokens)
- **Output**: JSON array of questions
- **Receives**: `identifiedTopics[]` from Step 1

**Rationale**: Separation of concerns improves:
- Topic quality (focused AI call)
- Question balance (stratified sampling)
- Debugging (can test topic ID independently)

**Confirmation Needed**: Should we keep this orchestrated approach, or merge into single AI call?

**Recommended**: Keep separated for better topic quality.

---

### Question 3: Prompt Separation for Topic ID
**Current**: Topic ID prompt is HARDCODED in `topicIdentifier.ts`

**Future Options**:
1. **Keep hardcoded** (simpler, prompt rarely changes)
2. **Add to template system** (consistency with question prompts)
3. **Make configurable** (allow subject-specific topic prompts)

**Question**: Should topic identification prompt be part of the template system (Tasks 001-004)?

**Recommended**: Keep hardcoded for now (KISS principle). Can add later if needed.

---

### Question 4: AI Model - Claude vs GPT
**User Mentioned**: "AI model GPT 5.2?"

**Current Reality**:
- ✅ **Using**: Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- ❌ **NOT using**: OpenAI GPT models
- ❌ **GPT 5.2 doesn't exist** (latest is GPT-4 as of 2025-01)

**Question**: Did you intend to switch to OpenAI GPT models, or was this a misunderstanding?

**Implications of Switching**:
- Requires new API key (`OPENAI_API_KEY`)
- Different API SDK (`openai` npm package)
- Different pricing model
- Different rate limits
- Code changes in `src/lib/ai/anthropic.ts`

**Recommended**: Stay with Claude Sonnet 4 unless there's a specific reason to switch.

---

### Question 5: Environment Variable Naming
**Current**: `ANTHROPIC_API_KEY`

**If Adding Prompt Separation** (Phase 2):
- `ANTHROPIC_CONSOLE_ENABLED=true/false`
- `ANTHROPIC_CONSOLE_PROMPT_ID_*` (per prompt)

**Question**: Are these naming conventions acceptable, or do you prefer different names?

---

## 📝 Summary of Open Questions

1. ✅ **Simultaneous creation**: Confirm parallel execution is desired (currently: YES)
2. ✅ **Separated prompts**: Confirm 2-step process is desired (currently: YES)
3. ❓ **Topic ID templating**: Should topic prompt be in template system?
4. ❓ **AI Model**: Clarify Claude vs GPT - stay with Claude or switch?
5. ❓ **Env var names**: Approve naming for prompt separation variables?

---

**Next Steps**:
1. User answers validation questions
2. Execute Tasks 001-004 (prompt separation) if approved
3. Execute Tasks 005-008 (timeline visualization) if approved
4. Update environment variable documentation

---

**Related Files**:
- `/src/app/api/generate-questions/route.ts` - Main API orchestration
- `/src/lib/ai/topicIdentifier.ts` - Step 1: Topic identification
- `/src/lib/ai/questionGenerator.ts` - Step 2: Question generation
- `/src/lib/ai/anthropic.ts` - Claude API wrapper
- `/src/config/prompts/*.ts` - Current prompt functions
- `/src/config/prompt-templates/**/*` - Future template files (ready)
