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

## Phase 1: Local Template System ✅ TEMPLATES COMPLETE

### Status (Updated 2025-01-18)
- ✅ ALL quiz templates created: english-quiz.txt, math-quiz.txt, generic-quiz.txt
- ✅ ALL flashcard templates created: english-flashcard.txt, math-flashcard.txt, generic-flashcard.txt
- ✅ ALL metadata JSON files created (grade content, distributions, difficulty)
- ⏳ Need to build PromptLoader class
- ⏳ Need to build PromptBuilder class
- ⏳ Need to refactor questionGenerator.ts
- ⏳ Need to test and remove old prompt functions

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
1. ✅ Create ALL template files from existing prompts (COMPLETE)
2. ⏳ Build PromptLoader infrastructure (Task 001)
3. ⏳ Build PromptBuilder for variable substitution (Task 002)
4. ⏳ Refactor questionGenerator.ts to use new system (Task 003)
5. ⏳ Test with local templates + remove old prompt functions (Task 004)

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

**Tasks created in `todo/` folder** for execution:
1. **Task 001**: Implement PromptLoader class (~1-1.5 hours)
2. **Task 002**: Implement PromptBuilder class (~1 hour)
3. **Task 003**: Refactor questionGenerator.ts (~1-1.5 hours)
4. **Task 004**: Test integration + remove old prompts (~1 hour)
5. (Future) Integrate Anthropic Console when API available

## Timeline Estimate

- **Phase 1 (Local Templates)**: ✅ COMPLETE (templates done)
- **Phase 1 (Infrastructure)**: 4-5 hours (tasks 001-004)
- **Phase 2 (Console Integration)**: 1-2 hours (when Console API confirmed)
- **Phase 3 (Testing & Docs)**: Included in Task 004

**Total Remaining**: ~4-5 hours of development

---
**Status**: Phase 1 templates complete (100%), infrastructure tasks ready
**Last Updated**: 2025-01-18
