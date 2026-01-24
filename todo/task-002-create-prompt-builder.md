# Task 002: Create PromptBuilder class for variable generation (Phase 1)

## Context

- Why this is needed:
  - **Phase 1 Foundation**: Build all template variables from generation parameters
  - Continue using **Claude API** (not migrating to OpenAI)
  - Encapsulate complex variable formatting logic separate from template loading
  - Load and format metadata JSON files (distributions, grade content, difficulty instructions)

- Related docs/links:
  - `/Prompt-separation-plan.md` (overall architecture plan)
  - `/src/config/prompt-templates/metadata/*.json` (metadata files)
  - `/src/config/prompts/english.ts` (current implementation to extract logic from)

- Related files:
  - New: `/src/lib/prompts/PromptBuilder.ts` (to be created)
  - Depends on: `/src/lib/prompts/PromptLoader.ts` (created in Task 001)
  - Metadata: `/src/config/prompt-templates/metadata/english-distributions.json`
  - Metadata: `/src/config/prompt-templates/metadata/english-grade-content.json`
  - Metadata: `/src/config/prompt-templates/metadata/math-distributions.json`
  - Metadata: `/src/config/prompt-templates/metadata/math-grade-content.json`
  - Metadata: `/src/config/prompt-templates/metadata/generic-distributions.json`
  - Metadata: `/src/config/prompt-templates/metadata/difficulty-instructions.json`

## Scope

- In scope:
  - Create `PromptBuilder` class that generates all template variables
  - Load metadata JSON files and cache them in memory
  - Format distribution data (question type percentages) into readable text
  - Format topics list with numbering and formatting
  - Calculate `questions_per_topic` value
  - Format grade-specific content sections
  - Format difficulty-specific instructions
  - Build material section text (with/without uploaded files)
  - Return complete `Record<string, string>` for all template variables
  - Support both quiz and flashcard modes

- Out of scope:
  - Template loading (handled by PromptLoader in Task 001)
  - AI API calls (remains in questionGenerator.ts)
  - Refactoring questionGenerator.ts (Task 003)

## Changes

- [ ] Create `/src/lib/prompts/PromptBuilder.ts`
- [ ] Define `BuildVariablesParams` interface matching `GenerateQuestionsParams`
- [ ] Implement `loadMetadata()` to read and cache all JSON metadata files
- [ ] Implement `formatDistribution(subject, difficulty, grade, mode)` for question type distributions
- [ ] Implement `formatTopics(topics)` to create numbered topic list with formatting
- [ ] Implement `formatGradeContent(subject, grade)` using metadata JSON
- [ ] Implement `formatDifficultyInstructions(difficulty)` using metadata JSON
- [ ] Implement `formatMaterialSection(materialText, hasFiles)` for material instructions
- [ ] Implement `buildVariables(params)` as main method returning all variables
- [ ] Calculate `material_type` based on whether files are uploaded
- [ ] Calculate `questions_per_topic` as Math.ceil(questionCount / topicCount)
- [ ] Add JSDoc comments for all public methods
- [ ] Export `PromptBuilder` class and `BuildVariablesParams` interface

## Acceptance Criteria

- [ ] `PromptBuilder` loads all 6 metadata JSON files without errors
- [ ] `buildVariables()` returns complete variable object for all templates
- [ ] Distribution formatting matches current prompt format (e.g., "60% multiple_choice")
- [ ] Topics list formatted with numbering (1., 2., 3., etc.)
- [ ] Grade content and difficulty instructions match current behavior
- [ ] Material section includes proper instructions based on uploaded files
- [ ] Works for both quiz and flashcard modes
- [ ] Type-safe interfaces with proper TypeScript types
- [ ] No runtime errors when building variables
- [ ] Code follows project TypeScript strict mode standards

## Testing

- [ ] Tests to run:
  - `npm run typecheck` (TypeScript validation)
  - Manual test: Build variables for english/grade 5/helppo and verify output
  - Manual test: Build variables with identifiedTopics and verify formatting

- [ ] New/updated tests:
  - Unit test (optional): Test distribution formatting
  - Unit test (optional): Test topic list formatting
  - Integration test in Task 003 when refactoring questionGenerator.ts

## Implementation Notes

**Metadata Files to Load:**
```typescript
{
  englishDistributions: 'english-distributions.json',
  englishGradeContent: 'english-grade-content.json',
  mathDistributions: 'math-distributions.json',
  mathGradeContent: 'math-grade-content.json',
  genericDistributions: 'generic-distributions.json',
  difficultyInstructions: 'difficulty-instructions.json'
}
```

**Variables to Generate:**
```typescript
{
  material_type: 'materiaalin' | 'kuvien ja PDF-tiedostojen',
  question_count: string,
  grade_content: string,         // From JSON metadata
  difficulty_instructions: string, // From JSON metadata
  grade_note: string,
  material_section: string,
  topic_count: string,
  topics_list: string,            // Formatted as "1. Topic A\n2. Topic B"
  questions_per_topic: string,    // Calculated
  grade_context_note: string,
  // ... plus distribution sections
}
```

**Distribution Formatting Example:**
```
KYSYMYSTYYPPIEN JAKAUMA (GRADE 5, HELPPO):
- 50% multiple_choice (monivalinta)
- 25% fill_blank (täydennys)
- 15% short_answer (lyhyt vastaus)
- 10% matching (yhdistäminen)
```

**Topic List Formatting Example:**
```
1. Grammar
2. Vocabulary
3. Reading Comprehension
```

**Example Usage:**
```typescript
const builder = new PromptBuilder();
const variables = builder.buildVariables({
  subject: 'english',
  difficulty: 'helppo',
  grade: 5,
  questionCount: 15,
  mode: 'quiz',
  materialText: 'Chapter 3...',
  identifiedTopics: ['Grammar', 'Vocabulary', 'Reading'],
  hasFiles: true
});
// Returns: { material_type: 'kuvien ja PDF-tiedostojen', ... }
```

**Grade Context Note Logic:**
- Grade provided → "ja keskity luokan [grade] oppimäärälle sopivaan vaikeustasoon"
- No grade → ""

**Material Section Logic:**
- Has files → "Alla on liitetiedostot (PDF/kuvat). Analysoi ne huolellisesti."
- Text only → "Alla on oppikirjateksti. Analysoi se huolellisesti."
