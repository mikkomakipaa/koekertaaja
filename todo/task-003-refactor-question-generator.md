# Task 003: Refactor questionGenerator.ts to use PromptLoader and PromptBuilder (Phase 1)

## Context

- Why this is needed:
  - **Phase 1 Foundation**: Replace old prompt generation functions with new template-based system
  - Continue using **Claude API** with Anthropic SDK (no provider change)
  - Simplify questionGenerator.ts by removing prompt logic
  - Complete the prompt separation architecture migration

- Related docs/links:
  - `/Prompt-separation-plan.md` (overall architecture plan)
  - `/DWF/AGENTS.md` (project patterns and structure)
  - Task 001 (PromptLoader implementation)
  - Task 002 (PromptBuilder implementation)

- Related files:
  - `/src/lib/ai/questionGenerator.ts` (to be refactored)
  - `/src/lib/prompts/PromptLoader.ts` (created in Task 001)
  - `/src/lib/prompts/PromptBuilder.ts` (created in Task 002)
  - `/src/config/prompts/*.ts` (old prompts to be replaced)

## Scope

- In scope:
  - Refactor `generateQuestions()` function to use PromptLoader + PromptBuilder
  - Replace all calls to `getEnglishPrompt()`, `getMathPrompt()`, `getGenericPrompt()`
  - Replace all calls to flashcard prompt functions
  - Remove imports from `/src/config/prompts/*.ts`
  - Add imports for PromptLoader and PromptBuilder
  - Maintain all existing function parameters and return types (no breaking changes)
  - Keep all existing validation, logging, and error handling
  - Preserve topic identification logic and question validation
  - Keep shuffling and all post-processing logic

- Out of scope:
  - Changing function signatures or API contracts
  - Modifying validation schemas
  - Updating tests (will be done in Task 004)
  - Removing old prompt files (Task 004)

## Changes

- [ ] Import `PromptLoader` and `PromptBuilder` at top of questionGenerator.ts
- [ ] Remove imports from `/src/config/prompts/*.ts` files
- [ ] In `generateQuestions()`, before AI call:
  - Instantiate `PromptLoader` and `PromptBuilder`
  - Call `builder.buildVariables(params)` with all parameters
  - Determine template path based on subject + mode (quiz/flashcard)
  - Call `loader.buildPrompt({ template, variables })` to get final prompt
- [ ] Replace the long if/else chain (lines 80-105) with new prompt building logic
- [ ] Keep all existing materialFiles processing logic (lines 54-78)
- [ ] Keep all existing AI response parsing and validation (lines 107+)
- [ ] Ensure `materialText` is passed to PromptBuilder
- [ ] Ensure `identifiedTopics` is passed to PromptBuilder
- [ ] Ensure `grade` is passed to PromptBuilder
- [ ] Add error handling for template loading failures
- [ ] Update logger messages to reflect new prompt loading approach

## Acceptance Criteria

- [ ] `generateQuestions()` no longer calls any functions from `/src/config/prompts/*.ts`
- [ ] All 6 prompt types work (english/math/generic × quiz/flashcard)
- [ ] Generated questions are identical to before refactoring (same AI prompts)
- [ ] No TypeScript errors (`npm run typecheck` passes)
- [ ] No breaking changes to API route (`/api/generate-questions`)
- [ ] Error messages are clear if template loading fails
- [ ] All existing parameters (subject, difficulty, grade, mode, topics) still work
- [ ] Topic balancing still functions correctly
- [ ] Logging output shows template loading steps

## Testing

- [ ] Tests to run:
  - `npm run typecheck` (TypeScript validation)
  - `npm run lint` (ESLint)
  - Manual test: Generate questions with english/quiz/helppo
  - Manual test: Generate flashcards with math/flashcard
  - Manual test: Generate with identifiedTopics and verify topic field
  - Check logs to verify PromptLoader is being used

- [ ] New/updated tests:
  - Verify generated prompts match old behavior (compare outputs)
  - Ensure all 6 combinations work (3 subjects × 2 modes)
  - Test error handling when template file is missing (optional)

## Implementation Notes

**Current Flow (OLD):**
```typescript
// Lines 80-105: Big if/else chain
if (mode === 'flashcard') {
  if (subject === 'english') {
    prompt = getEnglishFlashcardsPrompt(...);
  } else if (subject === 'math') {
    prompt = getMathFlashcardsPrompt(...);
  } else {
    prompt = getGenericFlashcardsPrompt(...);
  }
} else {
  if (subject === 'english') {
    prompt = getEnglishPrompt(...);
  } // ... etc
}
```

**New Flow:**
```typescript
// Instantiate loader and builder
const loader = new PromptLoader();
const builder = new PromptBuilder();

// Build variables from parameters
const variables = builder.buildVariables({
  subject,
  difficulty,
  grade,
  questionCount,
  materialText,
  identifiedTopics,
  mode,
  hasFiles: !!(materialFiles && materialFiles.length > 0)
});

// Load and build prompt from template
const templatePath = getTemplatePath(subject, mode, difficulty);
const prompt = await loader.buildPrompt({
  templatePath,
  variables
});
```

**Template Path Logic:**
```typescript
function getTemplatePath(subject: Subject, mode: 'quiz' | 'flashcard', difficulty?: Difficulty): string {
  const subjectLower = subject.toLowerCase();
  const subjectKey = (subjectLower === 'english' || subjectLower === 'englanti') ? 'english'
    : (subjectLower === 'math' || subjectLower === 'matematiikka') ? 'math'
    : 'generic';

  return `${mode}/${subjectKey}-${mode}.txt`;
}
```

**Error Handling:**
```typescript
try {
  const prompt = await loader.buildPrompt(...);
} catch (error) {
  logger.error({ error, subject, mode }, 'Failed to load prompt template');
  throw new Error(`Prompt template loading failed: ${error.message}`);
}
```

**Preserve Existing Behavior:**
- Keep all parameter validation
- Keep all file processing (PDF, images, text)
- Keep all AI response parsing
- Keep all question validation with Zod schemas
- Keep all logging statements (add template loading logs)
- Keep all error handling
- Keep option shuffling logic
- Keep topic field validation

**Subject Normalization:**
Current code normalizes subject to lowercase and checks for Finnish/English names. Keep this logic when determining template path.

**Parameters to Pass to PromptBuilder:**
```typescript
{
  subject,
  difficulty,        // Only for quiz mode
  grade,
  questionCount,
  materialText,
  identifiedTopics,
  mode,
  hasFiles: !!(materialFiles?.length)
}
```
