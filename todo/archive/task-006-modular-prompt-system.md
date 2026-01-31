# Task 006: Implement Modular Prompt System (Phase 3)

## Context

- Why this is needed:
  - **Phase 3 DRY Architecture**: Eliminate duplication across all prompt templates
  - Extract common blocks (format, topic tagging, grade distributions) to shared modules
  - Current problem: Same instructions repeated in 6+ template files
  - Reduce token costs by assembling only needed blocks
  - Easier maintenance - change once, affects all prompts
  - **Effort**: 8-12 hours
  - **Impact**: ⭐⭐⭐⭐ Medium-High - easier maintenance, reduced duplication

- Related docs/links:
  - `/Documentation/PROMPT-MANAGEMENT-ANALYSIS.md` - Option B analysis
  - Phase 1 (Tasks 001-004) must be complete
  - Phase 2 (Task 005) must be complete
  - `/src/lib/prompts/PromptBuilder.ts` (created in Phase 1)

- Related files:
  - New: `/src/config/prompt-templates/core/format.txt`
  - New: `/src/config/prompt-templates/core/topic-tagging.txt`
  - New: `/src/config/prompt-templates/core/flashcard-rules.txt`
  - New: `/src/config/prompt-templates/core/grade-distributions.json`
  - New: `/src/config/prompt-templates/types/language.txt`
  - New: `/src/config/prompt-templates/types/math.txt`
  - New: `/src/config/prompt-templates/types/written.txt`
  - New: `/src/config/prompt-templates/types/skills.txt`
  - New: `/src/config/prompt-templates/types/concepts.txt`
  - New: `/src/config/prompt-templates/subjects/` (curriculum JSON files)
  - Update: `/src/lib/prompts/PromptBuilder.ts` - Module assembly logic
  - Update: `/src/lib/prompts/PromptLoader.ts` - Support module loading
  - Refactor: All existing templates to use modular architecture

## Scope

- In scope:
  - Extract common prompt blocks to `core/` directory
  - Create subject-type-specific modules in `types/` directory
  - Move curriculum content to `subjects/` JSON files
  - Consolidate all grade distributions into single JSON file
  - Update PromptBuilder to assemble prompts from modules
  - Update PromptLoader to support loading multiple modules
  - Implement prompt assembly logic with proper ordering
  - Test token reduction (expect ~20-30% reduction)
  - Verify no quality regression

- Out of scope:
  - Skill-level tagging (Phase 4)
  - Two-level topic hierarchy (future)
  - Anthropic Console integration
  - Changing AI behavior or question quality

## Changes

### Core Modules (Shared Across All Prompts)

- [ ] Create `/src/config/prompt-templates/core/format.txt`:
  - JSON schema definition
  - Response format instructions
  - Output structure requirements
  - Example JSON structure
  - Common validation rules

- [ ] Create `/src/config/prompt-templates/core/topic-tagging.txt`:
  - Topic identification rules
  - High-level vs detailed topic guidance
  - Topic balancing requirements
  - Examples of good/bad topics
  - Questions-per-topic instructions

- [ ] Create `/src/config/prompt-templates/core/flashcard-rules.txt`:
  - Active recall focus
  - Question type restrictions (no multiple_choice, true_false)
  - Explanation formatting for flashcards
  - Memorization technique guidance
  - Used only in flashcard mode

- [ ] Create `/src/config/prompt-templates/core/grade-distributions.json`:
  - Consolidate ALL distributions into single file
  - Structure: `{ [subjectType]: { [grade]: { [difficulty]: { ... } } } }`
  - Includes: language, math, written, skills, concepts
  - Includes both quiz and flashcard distributions

### Type Modules (Subject-Type-Specific Rules)

- [ ] Create `/src/config/prompt-templates/types/language.txt`:
  - Language-specific question patterns (grammar, vocabulary, reading)
  - Example questions for language subjects
  - Special instructions for English/Finnish
  - Age-appropriate language complexity guidance

- [ ] Create `/src/config/prompt-templates/types/math.txt`:
  - Math-specific question patterns (computation, word problems, geometry)
  - Number range guidance per grade
  - Calculation step-by-step instructions
  - Visual diagram suggestions (for future)

- [ ] Create `/src/config/prompt-templates/types/written.txt`:
  - Content subject patterns (fact recall, timelines, cause-effect)
  - Historical/scientific context instructions
  - Compare-contrast question guidance
  - Definition and concept questions

- [ ] Create `/src/config/prompt-templates/types/skills.txt`:
  - Skills-based patterns (technique, equipment, safety)
  - Practical application questions
  - Cultural context for art/music
  - Physical activity safety for PE

- [ ] Create `/src/config/prompt-templates/types/concepts.txt`:
  - Value-based patterns (ethics, religion, philosophy)
  - Perspective comparison questions
  - Scenario analysis guidance
  - Personal reflection questions

### Subject Curriculum Files

- [ ] Create `/src/config/prompt-templates/subjects/english.json`:
  - Structure: `{ "4": "Grade 4 curriculum...", "5": "...", "6": "..." }`
  - Extract from current english-quiz.txt
  - Per-grade learning objectives

- [ ] Create `/src/config/prompt-templates/subjects/math.json`:
  - Extract from current math-quiz.txt
  - Per-grade topics and skills

- [ ] Create curriculum JSON for all other subjects:
  - `subjects/finnish.json`
  - `subjects/history.json`
  - `subjects/biology.json`
  - `subjects/geography.json`
  - `subjects/environmental-studies.json`
  - `subjects/art.json`
  - `subjects/music.json`
  - `subjects/pe.json`
  - `subjects/religion.json`
  - `subjects/ethics.json`

### Update PromptLoader

- [ ] Add `loadModule(modulePath: string): Promise<string>` method
- [ ] Support loading multiple modules and concatenating
- [ ] Add module path validation
- [ ] Cache loaded modules to reduce file I/O
- [ ] Add module loading logs

### Update PromptBuilder

- [ ] Implement `assemblePrompt(params)` method:
  ```typescript
  async assemblePrompt(params: BuildPromptParams): Promise<string> {
    const subjectType = getSubjectType(params.subject);

    // 1. Load core modules
    const format = await loader.loadModule('core/format.txt');
    const topicRules = await loader.loadModule('core/topic-tagging.txt');

    // 2. Load type-specific module
    const typeRules = await loader.loadModule(`types/${subjectType}.txt`);

    // 3. Load subject curriculum
    const curriculum = await loadCurriculum(params.subject, params.grade);

    // 4. Load distributions from consolidated JSON
    const distributions = await loadDistributions(
      subjectType,
      params.grade,
      params.difficulty,
      params.mode
    );

    // 5. Optionally load flashcard rules
    const flashcardRules = params.mode === 'flashcard'
      ? await loader.loadModule('core/flashcard-rules.txt')
      : '';

    // 6. Assemble in correct order
    return this.concatenateModules([
      format,
      topicRules,
      typeRules,
      curriculum,
      distributions,
      flashcardRules
    ]);
  }
  ```

- [ ] Implement `loadCurriculum(subject, grade)` helper
- [ ] Implement `loadDistributions(subjectType, grade, difficulty, mode)` helper
- [ ] Implement `concatenateModules(modules)` with proper spacing
- [ ] Add variable substitution for assembled prompts
- [ ] Remove old `buildPrompt()` method (replaced by assembly)

### Refactor Existing Templates

- [ ] Delete old monolithic templates:
  - `/quiz/english-quiz.txt`
  - `/quiz/math-quiz.txt`
  - `/quiz/written-quiz.txt`
  - `/quiz/skills-quiz.txt`
  - `/quiz/concepts-quiz.txt`
  - `/flashcard/english-flashcard.txt`
  - `/flashcard/math-flashcard.txt`
  - `/flashcard/written-flashcard.txt`
  - `/flashcard/skills-flashcard.txt`
  - `/flashcard/concepts-flashcard.txt`

- [ ] Delete old metadata files:
  - `/metadata/english-distributions.json`
  - `/metadata/math-distributions.json`
  - `/metadata/written-distributions.json`
  - `/metadata/skills-distributions.json`
  - `/metadata/concepts-distributions.json`
  - All replaced by `/core/grade-distributions.json`

## Acceptance Criteria

- [ ] All core modules exist and load successfully
- [ ] All type modules exist (5 types: language, math, written, skills, concepts)
- [ ] All subject curriculum JSON files exist (11+ subjects)
- [ ] Consolidated grade-distributions.json includes all subject types
- [ ] PromptBuilder assembles prompts correctly from modules
- [ ] Assembled prompts are equivalent to old monolithic templates
- [ ] Token count reduced by 20-30% (measure with sample prompt)
- [ ] No quality regression in generated questions
- [ ] All subjects generate valid questions
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Old monolithic template files deleted

## Testing

- [ ] Tests to run:
  - Manual test: Generate English quiz → verify quality unchanged
  - Manual test: Generate Math quiz → verify quality unchanged
  - Manual test: Generate History quiz → verify written modules work
  - Manual test: Generate Art quiz → verify skills modules work
  - Manual test: Generate Religion quiz → verify concepts modules work
  - Manual test: Generate flashcards → verify flashcard rules applied
  - Compare token counts: old vs new (expect 20-30% reduction)
  - `npm run typecheck`
  - `npm run lint`

- [ ] Quality checks:
  - Question types match expected distributions
  - Topics are balanced across questions
  - Grade-appropriate content
  - No missing sections in assembled prompts
  - No duplicate instructions
  - JSON schema formatting correct

## Implementation Notes

**Module Assembly Order:**

```
1. FORMAT (JSON schema, output structure)
2. TOPIC TAGGING RULES (high-level topics, balancing)
3. SUBJECT TYPE RULES (language/math/written/skills/concepts patterns)
4. CURRICULUM CONTENT (grade-specific learning objectives)
5. GRADE DISTRIBUTIONS (question type percentages)
6. FLASHCARD RULES (optional, only for flashcard mode)
```

**Example Assembled Prompt Structure:**

```
=== FORMAT SECTION (from core/format.txt) ===
Vastaa PELKÄLLÄ JSON-objektilla. Älä lisää selityksiä...

=== TOPIC TAGGING SECTION (from core/topic-tagging.txt) ===
AIHEALUEIDEN TUNNISTAMINEN:
Tunnista 3-5 korkeantason aihealuetta...

=== SUBJECT TYPE SECTION (from types/written.txt) ===
KIRJOITETTAVIEN AINEIDEN KYSYMYSTYYPIT:
Fokusoidu faktatietoon ja ymmärrykseen...

=== CURRICULUM SECTION (from subjects/history.json, grade 5) ===
VUOSILUOKKA 5 - HISTORIAN OPETUSSUUNNITELMA:
- Suomen historia: Esihistoria, Ruotsin vallan aika...

=== DISTRIBUTIONS SECTION (from core/grade-distributions.json) ===
KYSYMYSTYYPPIEN JAKAUMA (LUOKKA 5, HELPPO):
- 60% multiple_choice
- 20% fill_blank
...

=== FLASHCARD RULES (from core/flashcard-rules.txt, only if mode=flashcard) ===
KORTTIEN ERITYISVAATIMUKSET:
Käytä VAIN täydennys-, lyhyt vastaus- ja yhdistämiskysymyksiä...
```

**Token Reduction Calculation:**

Before (monolithic):
- format section: 400 tokens (repeated 6 times)
- topic rules: 200 tokens (repeated 6 times)
- type-specific: 300 tokens
- curriculum: 500 tokens
- distributions: 200 tokens
- **Total**: ~1600 tokens per template × 6 templates = ~9600 tokens total

After (modular):
- core/format.txt: 400 tokens (loaded once)
- core/topic-tagging.txt: 200 tokens (loaded once)
- types/*.txt: 300 tokens × 5 = 1500 tokens
- subjects/*.json: 500 tokens × 11 = 5500 tokens
- core/grade-distributions.json: 1000 tokens (all distributions)
- **Total**: ~7600 tokens total

**Savings**: ~2000 tokens (21% reduction)

**Consolidated Grade Distributions JSON Structure:**

```json
{
  "language": {
    "quiz": {
      "4": {
        "helppo": { "multiple_choice": 60, ... },
        "normaali": { "multiple_choice": 35, ... }
      },
      "5": { ... },
      "6": { ... }
    },
    "flashcard": {
      "4": { "fill_blank": 60, "short_answer": 30, "matching": 10 },
      "5": { ... },
      "6": { ... }
    }
  },
  "math": { ... },
  "written": { ... },
  "skills": { ... },
  "concepts": { ... }
}
```

**PromptBuilder Assembly Example:**

```typescript
const builder = new PromptBuilder();

// Assemble prompt from modules
const assembledPrompt = await builder.assemblePrompt({
  subject: 'history',
  grade: 5,
  difficulty: 'helppo',
  mode: 'quiz',
  questionCount: 15,
  materialText: 'Chapter 3...',
  identifiedTopics: ['Ancient Rome', 'Medieval Europe', 'Renaissance']
});

// assembledPrompt contains all 6 sections concatenated
```

**Module Caching:**

To avoid reading the same file multiple times:

```typescript
class PromptLoader {
  private moduleCache: Map<string, string> = new Map();

  async loadModule(modulePath: string): Promise<string> {
    if (this.moduleCache.has(modulePath)) {
      return this.moduleCache.get(modulePath)!;
    }

    const content = await fs.readFile(`/src/config/prompt-templates/${modulePath}`, 'utf-8');
    this.moduleCache.set(modulePath, content);
    return content;
  }
}
```

**Backward Compatibility:**

No breaking changes - API remains the same:

```typescript
// Before (Task 003)
const prompt = await questionGenerator.generateQuestions({
  subject: 'english',
  grade: 5,
  difficulty: 'helppo',
  // ...
});

// After (Task 006)
const prompt = await questionGenerator.generateQuestions({
  subject: 'english',
  grade: 5,
  difficulty: 'helppo',
  // ... (same parameters)
});
```

**Success Metrics:**

- 20-30% token reduction measured
- Prompt assembly time < 50ms (cached)
- All subjects generate questions successfully
- Question quality matches pre-modular behavior
- Easier to edit prompts (change core/format.txt affects all subjects)
