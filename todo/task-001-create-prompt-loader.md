# Task 001: Create PromptLoader class for template-based prompts (Phase 1)

## Context

- Why this is needed:
  - **Phase 1 Foundation**: Separate prompt content from code logic for easier maintenance
  - Continue using **Claude API** (not migrating to OpenAI)
  - Enable non-developers to edit prompts without touching TypeScript code
  - Foundation for future modular prompt architecture (Phases 2-4)

- Related docs/links:
  - `/Prompt-separation-plan.md` (overall architecture plan)
  - `/DWF/AGENTS.md` (project structure and patterns)
  - `/src/config/prompt-templates/` (template files already created)

- Related files:
  - New: `/src/lib/prompts/PromptLoader.ts` (to be created)
  - Templates: `/src/config/prompt-templates/quiz/*.txt`
  - Templates: `/src/config/prompt-templates/flashcard/*.txt`

## Scope

- In scope:
  - Create `PromptLoader` class that loads template files from filesystem
  - Implement `loadTemplate(path: string): Promise<string>` method
  - Implement `substituteVariables(template: string, vars: Record<string, string>): string` method
  - Implement `buildPrompt(config: PromptConfig): Promise<string>` method
  - Add TypeScript interfaces for `PromptConfig` and template paths
  - Support both quiz and flashcard template types
  - Handle file read errors gracefully with informative error messages

- Out of scope:
  - Anthropic Console integration (Phase 2 - future)
  - Building variable data (handled by PromptBuilder in Task 002)
  - Refactoring questionGenerator.ts (Task 003)

## Changes

- [ ] Create `/src/lib/prompts/PromptLoader.ts`
- [ ] Define `PromptConfig` interface with subject, mode (quiz/flashcard), difficulty (optional)
- [ ] Define template path constants mapping subject+mode to file paths
- [ ] Implement `loadTemplate()` to read .txt files from `/src/config/prompt-templates/`
- [ ] Implement `substituteVariables()` using regex to replace `{{variable}}` placeholders
- [ ] Implement `buildPrompt()` that loads template and substitutes variables
- [ ] Add error handling for missing templates or invalid paths
- [ ] Add JSDoc comments for all public methods
- [ ] Export `PromptLoader` class and `PromptConfig` interface

## Acceptance Criteria

- [ ] `PromptLoader` class can load all 6 template files (3 quiz, 3 flashcard)
- [ ] Variable substitution correctly replaces all `{{variable}}` placeholders
- [ ] Throws clear error if template file doesn't exist
- [ ] Type-safe `PromptConfig` interface with Subject, Difficulty, mode fields
- [ ] `buildPrompt()` returns complete prompt string ready for AI API
- [ ] No runtime errors when loading templates
- [ ] Code follows project TypeScript strict mode standards

## Testing

- [ ] Tests to run:
  - `npm run typecheck` (TypeScript validation)
  - Manual test: Load english-quiz.txt and verify content
  - Manual test: Substitute variables and verify output

- [ ] New/updated tests:
  - Unit test (optional): Test variable substitution with sample template
  - Integration test in Task 003 when refactoring questionGenerator.ts

## Implementation Notes

**Template Path Structure:**
```
quiz/english-quiz.txt
quiz/math-quiz.txt
quiz/generic-quiz.txt
flashcard/english-flashcard.txt
flashcard/math-flashcard.txt
flashcard/generic-flashcard.txt
```

**Example Usage:**
```typescript
const loader = new PromptLoader();
const prompt = await loader.buildPrompt({
  subject: 'english',
  mode: 'quiz',
  difficulty: 'helppo',
  variables: {
    question_count: '15',
    grade_content: '...',
    // ... other variables from PromptBuilder
  }
});
```

**Variable Substitution:**
- Replace `{{variable_name}}` with provided value
- Preserve formatting and whitespace
- Throw error if required variable is missing from vars object

**Error Messages:**
- "Template not found: quiz/english-quiz.txt"
- "Missing required variable: {{question_count}}"
- "Invalid subject for template loading: xyz"
