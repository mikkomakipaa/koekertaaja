# Prompt Separation Architecture Plan

## Overview
Separate prompts from code to enable management via Anthropic Console while maintaining local fallback.

## Directory Structure
```
src/config/
├── prompt-templates/          # Local template files (fallback)
│   ├── quiz/
│   │   ├── english-quiz.txt
│   │   ├── math-quiz.txt
│   │   └── generic-quiz.txt
│   ├── flashcard/
│   │   ├── english-flashcard.txt
│   │   ├── math-flashcard.txt
│   │   └── generic-flashcard.txt
│   └── metadata/              # Supporting data
│       ├── english-grade-content.json
│       ├── english-distributions.json
│       ├── math-grade-content.json
│       ├── math-distributions.json
│       ├── generic-distributions.json
│       └── difficulty-instructions.json
├── promptIds.ts               # Maps to Anthropic Console prompts
└── prompts/                   # OLD (to be deprecated)
    ├── english.ts
    ├── math.ts
    └── ...
```

## Phase 1: Local Template System ✅ IN PROGRESS

### Status
- ✅ Created english-quiz.txt template with {{variables}}
- ✅ Created metadata JSON files (grade content, distributions, difficulty)
- ⏳ Need to create remaining templates (math, generic, flashcards)
- ⏳ Need to build PromptLoader class

### Components

**1. Template Files** (`src/config/prompt-templates/`)
- Plain text files with `{{variable}}` placeholders
- Can be uploaded to Anthropic Console manually
- Version controlled in git

**2. PromptLoader** (`src/lib/prompts/PromptLoader.ts`)
```typescript
class PromptLoader {
  // Load template from file
  async loadTemplate(path: string): Promise<string>

  // Substitute variables
  substituteVariables(template: string, vars: Record<string, string>): string

  // Build complete prompt
  async buildPrompt(config: PromptConfig): Promise<string>
}
```

**3. Prompt Builder** (`src/lib/prompts/PromptBuilder.ts`)
```typescript
class PromptBuilder {
  // Load metadata (grade content, distributions)
  private loadMetadata()

  // Format distribution text
  private formatDistribution(grade, difficulty)

  // Format topics list
  private formatTopics(topics)

  // Build all variables for template
  buildVariables(params): Record<string, string>
}
```

## Phase 2: Anthropic Console Integration (FUTURE)

### When Templates Are Ready on Console

**1. Prompt ID Configuration** (`src/config/promptIds.ts`)
```typescript
export const PROMPT_IDS = {
  english: {
    quiz: {
      helppo: 'prompt_eng_quiz_easy_v1',    // From Console
      normaali: 'prompt_eng_quiz_norm_v1'
    },
    flashcard: 'prompt_eng_flash_v1'
  },
  // ... etc
};
```

**2. Enhanced PromptLoader**
```typescript
class PromptLoader {
  // Try Console first, fallback to local
  async loadPrompt(promptId: string): Promise<string> {
    try {
      return await this.loadFromConsole(promptId);
    } catch (error) {
      logger.warn('Console unavailable, using local fallback');
      return await this.loadFromFile(promptId);
    }
  }

  private async loadFromConsole(id: string): Promise<string> {
    // Call Anthropic API with prompt ID
    const response = await anthropic.prompts.get({ id });
    return response.template;
  }
}
```

## Phase 3: Refactor Question Generator

### Current Flow
```typescript
// OLD: Function generates prompt
const prompt = getEnglishPrompt(difficulty, count, grade);
const response = await generateWithClaude(prompt, files);
```

### New Flow
```typescript
// NEW: Loader builds prompt from template
const loader = new PromptLoader();
const builder = new PromptBuilder();

const variables = builder.buildVariables({
  subject, difficulty, grade, questionCount,
  material, identifiedTopics
});

const prompt = await loader.buildPrompt({
  template: 'english-quiz',    // or promptId from Console
  variables
});

const response = await generateWithClaude(prompt, files);
```

## Migration Steps

### For Developers (Now)
1. ✅ Create template files from existing prompts
2. ✅ Build PromptLoader infrastructure
3. ⏳ Refactor questionGenerator.ts to use PromptLoader
4. ⏳ Test with local templates
5. ⏳ Remove old prompt functions (english.ts, math.ts, etc.)

### For Product Team (Later)
1. Review/edit template `.txt` files locally
2. Test changes by running app with local templates
3. When satisfied, upload to Anthropic Console
4. Update `promptIds.ts` with Console prompt IDs
5. App automatically switches to Console prompts (with local fallback)

## Benefits

✅ **Separation of Concerns**: Prompts separate from code logic
✅ **Version Control**: Templates in git, Console provides versioning too
✅ **Easy Editing**: Product team can edit text files
✅ **Flexible**: Can use local OR Console, with fallback
✅ **No Breaking Changes**: Gradual migration, old code works during transition
✅ **Cost Optimization**: Console may offer prompt caching (future)

## Risks & Mitigation

⚠️ **Risk**: Anthropic Console prompt API might not exist as expected
✅ **Mitigation**: Phase 1 works entirely locally, Console is optional enhancement

⚠️ **Risk**: Complex variable substitution logic
✅ **Mitigation**: PromptBuilder encapsulates all logic, templates are clean

⚠️ **Risk**: Template and code can drift out of sync
✅ **Mitigation**: Type-safe variable validation, runtime checks

## Next Steps

1. Complete remaining template files (math, generic, flashcards)
2. Implement PromptLoader and PromptBuilder classes
3. Create migration script to convert remaining prompts
4. Refactor questionGenerator.ts
5. Test thoroughly with local templates
6. Document process for product team
7. (Future) Integrate Anthropic Console when ready

## Timeline Estimate

- **Phase 1 (Local Templates)**: 2-3 hours remaining
- **Phase 2 (Console Integration)**: 1-2 hours (when Console API confirmed)
- **Phase 3 (Testing & Docs)**: 1 hour

**Total**: ~4-6 hours of development

---
**Status**: Phase 1 in progress (30% complete)
**Last Updated**: 2025-12-03
