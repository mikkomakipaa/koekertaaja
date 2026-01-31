# Task 007: Implement Skill-Level Tagging (Phase 4)

## Context

- Why this is needed:
  - **Phase 4 Advanced Feature**: Enable skill-specific practice modes
  - Current problem: No separation between grammar vs vocabulary, computation vs word problems
  - Better question quality - no mixed-skill questions
  - Enable "Grammar only" or "Computation only" practice modes
  - Better analytics - track which skills need better questions
  - Improve stratified sampling - balance by topic AND skill
  - **Effort**: 12-16 hours
  - **Impact**: ⭐⭐⭐⭐ High - enables skill-specific practice modes

- Related docs/links:
  - `/Documentation/PROMPT-MANAGEMENT-ANALYSIS.md` - Option C analysis
  - Phase 1 (Tasks 001-004) must be complete
  - Phase 2 (Task 005) must be complete
  - Phase 3 (Task 006) must be complete
  - `/src/hooks/useGameSession.ts` (stratified sampling logic)

- Related files:
  - New: `/src/config/prompt-templates/skills/language-skills.json`
  - New: `/src/config/prompt-templates/skills/math-skills.json`
  - New: `/src/config/prompt-templates/skills/written-skills.json`
  - New: `/src/config/prompt-templates/skills/skills-skills.json`
  - New: `/src/config/prompt-templates/skills/concepts-skills.json`
  - New: `/src/config/prompt-templates/core/skill-tagging.txt`
  - Update: Database schema - add `skill TEXT` column
  - Update: `/src/lib/prompts/PromptBuilder.ts` - Include skill taxonomy in prompts
  - Update: `/src/hooks/useGameSession.ts` - Stratified sampling by skill
  - Update: `/src/types/questions.ts` - Add skill field to Question type
  - Update: All type modules to include skill tagging requirements

## Scope

- In scope:
  - Define skill taxonomies for all 5 subject types
  - Add `skill` column to questions table
  - Update prompts to require skill tagging
  - Add skill validation to question schemas
  - Update stratified sampling to balance by skill within topics
  - Create skill taxonomy JSON files
  - Add skill-specific prompt instructions
  - Test skill tagging accuracy (expect 90%+ tagged)
  - Enable future skill-filtering UI

- Out of scope:
  - UI for skill filtering (future enhancement)
  - Two-level topic hierarchy (future)
  - Analytics dashboard for skill gaps
  - Skill-based difficulty adjustment

## Changes

### Database Migration

- [ ] Create `/supabase/migrations/20250131_add_skill_to_questions.sql`:
  ```sql
  ALTER TABLE questions
  ADD COLUMN skill TEXT;

  CREATE INDEX idx_questions_skill ON questions(skill);

  COMMENT ON COLUMN questions.skill IS 'Specific skill being tested (e.g., verb_tenses, addition, cause_effect)';
  ```

- [ ] Run migration in development Supabase
- [ ] Validate migration with sample inserts
- [ ] Plan production migration (after testing complete)

### Skill Taxonomy Definitions

- [ ] Create `/src/config/prompt-templates/skills/language-skills.json`:
  ```json
  {
    "grammar": [
      "verb_tenses",
      "sentence_structure",
      "parts_of_speech",
      "punctuation",
      "word_order"
    ],
    "vocabulary": [
      "word_meaning",
      "synonyms_antonyms",
      "context_clues",
      "word_families",
      "idioms"
    ],
    "reading": [
      "comprehension",
      "inference",
      "main_idea",
      "details",
      "prediction"
    ],
    "writing": [
      "sentence_formation",
      "paragraph_structure",
      "spelling",
      "capitalization"
    ]
  }
  ```

- [ ] Create `/src/config/prompt-templates/skills/math-skills.json`:
  ```json
  {
    "computation": [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "mental_math"
    ],
    "word_problems": [
      "problem_solving",
      "multi_step",
      "units_conversion",
      "estimation"
    ],
    "geometry": [
      "shapes",
      "area",
      "perimeter",
      "volume",
      "angles"
    ],
    "number_sense": [
      "place_value",
      "fractions",
      "decimals",
      "percentages",
      "number_comparison"
    ]
  }
  ```

- [ ] Create `/src/config/prompt-templates/skills/written-skills.json`:
  ```json
  {
    "recall": [
      "facts",
      "dates",
      "names",
      "definitions",
      "locations"
    ],
    "comprehension": [
      "cause_effect",
      "compare_contrast",
      "sequences",
      "main_idea",
      "summarization"
    ],
    "application": [
      "examples",
      "real_world_connections",
      "predictions",
      "scenarios"
    ],
    "analysis": [
      "patterns",
      "relationships",
      "conclusions",
      "inference"
    ]
  }
  ```

- [ ] Create `/src/config/prompt-templates/skills/skills-skills.json`:
  ```json
  {
    "technique": [
      "identification",
      "execution",
      "comparison",
      "improvement"
    ],
    "equipment": [
      "recognition",
      "usage",
      "safety",
      "maintenance"
    ],
    "culture": [
      "historical_context",
      "regional_styles",
      "famous_works",
      "artists"
    ],
    "practice": [
      "warm_up",
      "drills",
      "performance",
      "evaluation"
    ]
  }
  ```

- [ ] Create `/src/config/prompt-templates/skills/concepts-skills.json`:
  ```json
  {
    "values": [
      "identification",
      "importance",
      "application",
      "conflicts"
    ],
    "perspectives": [
      "comparison",
      "understanding",
      "empathy",
      "diversity"
    ],
    "scenarios": [
      "analysis",
      "decision_making",
      "consequences",
      "alternatives"
    ],
    "reflection": [
      "personal_connection",
      "critical_thinking",
      "self_awareness",
      "growth"
    ]
  }
  ```

### Skill Tagging Prompt Instructions

- [ ] Create `/src/config/prompt-templates/core/skill-tagging.txt`:
  ```
  SKILL TAGGING REQUIREMENTS:

  1. Each question MUST have exactly ONE skill tag
  2. Choose the PRIMARY skill being tested
  3. DO NOT mix multiple skills in a single question
  4. Use snake_case format (e.g., "verb_tenses", not "Verb Tenses")

  EXAMPLES OF GOOD SKILL TAGGING:

  ✅ GOOD - Single skill:
  Question: "Complete: I ___ to school every day."
  Skill: "verb_tenses"

  Question: "What is 45 + 27?"
  Skill: "addition"

  Question: "Why did the Roman Empire fall?"
  Skill: "cause_effect"

  ❌ BAD - Mixed skills:
  Question: "Complete the sentence AND identify the verb tense: I ___ yesterday."
  Problem: Tests both verb_tenses and grammar analysis (mixed)

  Question: "Calculate 5 × 8 and explain how multiplication works."
  Problem: Tests both multiplication and comprehension (mixed)

  SKILL SELECTION RULES:

  - If question tests grammar structure → grammar skill
  - If question tests word meaning → vocabulary skill
  - If question tests calculation → computation skill
  - If question tests problem solving → word_problems skill
  - If question tests factual recall → recall skill
  - If question tests understanding → comprehension skill

  AVAILABLE SKILLS BY SUBJECT TYPE:

  [This section will be dynamically populated based on subject type]
  ```

- [ ] Update all type modules (`types/*.txt`) to include skill taxonomy
- [ ] Add skill examples per subject type
- [ ] Add "DO NOT MIX SKILLS" warning in each type module

### Update PromptBuilder

- [ ] Add `loadSkillTaxonomy(subjectType)` method:
  ```typescript
  private async loadSkillTaxonomy(subjectType: SubjectType): Promise<string> {
    const taxonomyPath = `skills/${subjectType}-skills.json`;
    const taxonomy = await this.loadJSON(taxonomyPath);

    // Format taxonomy for prompt
    let formatted = 'AVAILABLE SKILLS:\n\n';
    for (const [category, skills] of Object.entries(taxonomy)) {
      formatted += `${category.toUpperCase()}:\n`;
      for (const skill of skills as string[]) {
        formatted += `  - ${skill}\n`;
      }
      formatted += '\n';
    }

    return formatted;
  }
  ```

- [ ] Update `assemblePrompt()` to include skill taxonomy:
  ```typescript
  const skillTagging = await loader.loadModule('core/skill-tagging.txt');
  const skillTaxonomy = await this.loadSkillTaxonomy(subjectType);

  // Insert after topic tagging, before type rules
  return this.concatenateModules([
    format,
    topicRules,
    skillTagging,  // NEW
    skillTaxonomy, // NEW
    typeRules,
    curriculum,
    distributions,
    flashcardRules
  ]);
  ```

### Update TypeScript Types

- [ ] Update `/src/types/questions.ts`:
  ```typescript
  export interface Question {
    id: string;
    question_set_id: string;
    question_text: string;
    question_type: QuestionType;
    correct_answer: CorrectAnswer;
    options?: QuestionOption[];
    explanation: string;
    image_url?: string;
    order_index: number;
    created_at: string;
    topic?: string;          // Existing
    skill?: string;          // NEW
  }
  ```

- [ ] Update Zod schemas in `/src/lib/validation/schemas.ts`:
  ```typescript
  const questionSchema = z.object({
    question_text: z.string().min(1),
    question_type: z.enum(['multiple_choice', 'fill_blank', ...]),
    correct_answer: z.union([...]),
    options: z.array(optionSchema).optional(),
    explanation: z.string(),
    image_url: z.string().optional(),
    topic: z.string().optional(),
    skill: z.string().optional(), // NEW - validate snake_case format
  });
  ```

- [ ] Add skill validation regex: `z.string().regex(/^[a-z_]+$/)`

### Update Stratified Sampling

- [ ] Update `/src/hooks/useGameSession.ts`:
  ```typescript
  function selectBalancedQuestions(
    allQuestions: Question[],
    sessionSize: number
  ): Question[] {
    // Group by topic first
    const byTopic = groupBy(allQuestions, q => q.topic);

    const selected: Question[] = [];

    // For each topic
    for (const [topic, topicQuestions] of Object.entries(byTopic)) {
      // Group by skill within topic
      const bySkill = groupBy(topicQuestions, q => q.skill);

      const questionsPerTopic = Math.ceil(sessionSize / Object.keys(byTopic).length);
      const questionsPerSkill = Math.ceil(questionsPerTopic / Object.keys(bySkill).length);

      // Sample evenly from each skill
      for (const [skill, skillQuestions] of Object.entries(bySkill)) {
        const sampled = sampleRandom(skillQuestions, questionsPerSkill);
        selected.push(...sampled);
      }
    }

    // If we have too many, trim to session size
    if (selected.length > sessionSize) {
      return sampleRandom(selected, sessionSize);
    }

    // If we have too few, fill with remaining questions
    if (selected.length < sessionSize) {
      const remaining = allQuestions.filter(q => !selected.includes(q));
      const needed = sessionSize - selected.length;
      selected.push(...sampleRandom(remaining, needed));
    }

    return selected;
  }
  ```

- [ ] Add skill-based fallback if <70% questions have skills
- [ ] Log skill distribution in session (for debugging)

### Update Question Generation Validation

- [ ] Update `/src/lib/ai/questionGenerator.ts`:
  ```typescript
  // After parsing AI response
  const validatedQuestions = [];

  for (const question of parsedQuestions) {
    // Existing validations...

    // NEW: Validate skill field
    if (!question.skill) {
      logger.warn({ question }, 'Question missing skill field');
      // Allow for now, will be addressed in prompt improvements
    } else if (!/^[a-z_]+$/.test(question.skill)) {
      logger.warn({ skill: question.skill }, 'Invalid skill format (not snake_case)');
      question.skill = question.skill.toLowerCase().replace(/[^a-z_]/g, '_');
    }

    validatedQuestions.push(question);
  }

  // Log skill coverage
  const questionsWithSkills = validatedQuestions.filter(q => q.skill);
  const skillCoverage = (questionsWithSkills.length / validatedQuestions.length) * 100;

  logger.info(
    { skillCoverage: skillCoverage.toFixed(1) },
    'Skill tagging coverage'
  );

  // Warn if coverage < 90%
  if (skillCoverage < 90) {
    logger.warn(
      { skillCoverage },
      'Low skill tagging coverage - check prompts'
    );
  }
  ```

## Acceptance Criteria

- [ ] Database migration adds `skill` column successfully
- [ ] 5 skill taxonomy JSON files exist (one per subject type)
- [ ] Skill tagging instructions added to prompts
- [ ] 90%+ generated questions have skill field populated
- [ ] Skill field uses snake_case format consistently
- [ ] Questions do NOT mix multiple skills (manual review)
- [ ] Stratified sampling balances by skill within topics
- [ ] TypeScript types include skill field
- [ ] Zod validation accepts skill field
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No quality regression in generated questions

## Testing

- [ ] Tests to run:
  - Manual test: Generate English quiz → verify skill field present
  - Manual test: Check skills are valid (from taxonomy)
  - Manual test: Verify no mixed-skill questions
  - Manual test: Generate 100 math questions → check skill coverage (expect 90%+)
  - Manual test: Play session → verify stratified sampling by skill
  - Check logs for skill coverage percentage
  - Test all 5 subject types (language, math, written, skills, concepts)
  - `npm run typecheck`
  - `npm run lint`

- [ ] Quality checks:
  - Skill tagging accuracy: 90%+
  - No questions with "grammar_and_vocabulary" (mixed skills)
  - Skill distribution roughly even within each topic
  - snake_case format consistent
  - Skills match taxonomy (no typos or invalid skills)

## Implementation Notes

**Database Migration Safety:**

```sql
-- Add column as nullable first
ALTER TABLE questions ADD COLUMN skill TEXT;

-- Backfill existing questions (optional)
-- This can be done gradually or left null for old questions
UPDATE questions
SET skill = 'unknown'
WHERE skill IS NULL AND created_at < '2025-01-31';

-- Create index for performance
CREATE INDEX idx_questions_skill ON questions(skill);
```

**Skill Taxonomy Structure:**

Each subject type has a 2-level taxonomy:
- **Level 1**: Skill category (e.g., "grammar", "computation", "recall")
- **Level 2**: Specific skill (e.g., "verb_tenses", "addition", "dates")

Questions are tagged with **Level 2** (specific skill).

**Prompt Assembly with Skills:**

```
1. FORMAT
2. TOPIC TAGGING
3. SKILL TAGGING ← NEW
4. SKILL TAXONOMY (subject-type-specific) ← NEW
5. SUBJECT TYPE RULES
6. CURRICULUM
7. DISTRIBUTIONS
8. FLASHCARD RULES
```

**Skill Validation Examples:**

```typescript
// Valid skills
"verb_tenses" ✅
"addition" ✅
"cause_effect" ✅

// Invalid skills
"Verb Tenses" ❌ (not snake_case)
"verb-tenses" ❌ (uses hyphens)
"grammar and vocabulary" ❌ (mixed skills)
"unknown_skill" ⚠️ (not in taxonomy, but format OK)
```

**Stratified Sampling Example:**

Given 60 questions with these topics and skills:

```
Topic: Grammar (20 questions)
  - verb_tenses: 10 questions
  - sentence_structure: 10 questions

Topic: Vocabulary (20 questions)
  - word_meaning: 10 questions
  - synonyms_antonyms: 10 questions

Topic: Reading (20 questions)
  - comprehension: 10 questions
  - inference: 10 questions
```

For 15-question session:
- 5 from Grammar (2-3 verb_tenses, 2-3 sentence_structure)
- 5 from Vocabulary (2-3 word_meaning, 2-3 synonyms_antonyms)
- 5 from Reading (2-3 comprehension, 2-3 inference)

**Skill Coverage Logging:**

```typescript
logger.info({
  totalQuestions: 100,
  questionsWithSkills: 95,
  skillCoverage: 95.0,
  skillDistribution: {
    verb_tenses: 15,
    addition: 20,
    cause_effect: 18,
    // ...
  }
}, 'Skill tagging report');
```

**Future Enhancements (Out of Scope):**

- UI filter: "Practice Grammar only"
- UI filter: "Practice Computation only"
- Analytics: Which skills have low question quality
- Adaptive difficulty: Increase difficulty for mastered skills
- Skill gap detection: Identify weak areas
- Skill progression tracking: Monitor improvement over time

**Migration to Production:**

1. Test in development Supabase thoroughly
2. Verify 90%+ skill coverage in generated questions
3. Run migration on production database during low-traffic time
4. Monitor for errors
5. Backfill existing questions gradually (optional)
6. Update documentation for content creators

**Success Metrics:**

- 90%+ questions have skill field populated
- Zero mixed-skill questions in manual review
- Stratified sampling distributes skills evenly
- No performance degradation in question generation
- Foundation for skill-specific practice modes
