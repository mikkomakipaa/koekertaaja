# Task 065.4: Difficulty Mapping

**Status:** 🟡 In Progress
**Estimate:** 1 point
**Priority:** P1
**Parent:** Task 065
**Started:** 2026-01-27

## Overview

Use enhanced topic difficulty metadata to intelligently select question types and validate difficulty consistency. This ensures that question complexity matches topic difficulty and improves question quality.

## Problem Statement

**Current (Phase 3):**
- Topics have difficulty metadata: "helppo", "normaali", "vaikea"
- But difficulty data is not used for question generation
- All question types equally likely regardless of topic complexity
- No validation that questions match topic difficulty
- Result: Complex topics might get overly simple questions

**Target (Phase 4):**
- Use topic difficulty to inform question type selection
- Easier topics → more multiple_choice, fill_blank, true_false
- Harder topics → more short_answer, matching, sequential
- Validate question difficulty matches topic difficulty
- Log difficulty consistency metrics

## Implementation Steps

### Step 1: Create Difficulty Mapper

```typescript
// src/lib/utils/difficultyMapping.ts

import { Difficulty } from '@/types';
import { QuestionType } from '@/types/questions';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ module: 'difficultyMapping' });

export interface QuestionTypeWeights {
  multiple_choice: number;
  fill_blank: number;
  true_false: number;
  matching: number;
  short_answer: number;
  sequential: number;
}

/**
 * Get question type weights based on topic difficulty
 *
 * Easier topics favor simpler question types (multiple choice, true/false)
 * Harder topics favor complex question types (short answer, matching)
 */
export function getQuestionTypeWeights(
  topicDifficulty: Difficulty
): QuestionTypeWeights {
  switch (topicDifficulty) {
    case 'helppo':
      return {
        multiple_choice: 0.40,  // 40% multiple choice
        fill_blank: 0.25,       // 25% fill blank
        true_false: 0.20,       // 20% true/false
        matching: 0.10,         // 10% matching
        short_answer: 0.05,     // 5% short answer
        sequential: 0.00,       // 0% sequential
      };

    case 'normaali':
      return {
        multiple_choice: 0.30,  // 30% multiple choice
        fill_blank: 0.25,       // 25% fill blank
        true_false: 0.10,       // 10% true/false
        matching: 0.20,         // 20% matching
        short_answer: 0.10,     // 10% short answer
        sequential: 0.05,       // 5% sequential
      };

    case 'vaikea':
      return {
        multiple_choice: 0.20,  // 20% multiple choice
        fill_blank: 0.15,       // 15% fill blank
        true_false: 0.05,       // 5% true/false
        matching: 0.25,         // 25% matching
        short_answer: 0.25,     // 25% short answer
        sequential: 0.10,       // 10% sequential
      };

    default:
      // Default to normaali weights
      logger.warn({ topicDifficulty }, 'Unknown difficulty, using normaali weights');
      return getQuestionTypeWeights('normaali');
  }
}

/**
 * Format question type weights for AI prompt
 */
export function formatQuestionTypeWeights(
  weights: QuestionTypeWeights
): string {
  const entries = Object.entries(weights)
    .filter(([_, weight]) => weight > 0)
    .sort(([_, a], [__, b]) => b - a)
    .map(([type, weight]) => {
      const percentage = Math.round(weight * 100);
      const typeLabel = formatQuestionTypeFinnish(type as QuestionType);
      return `- ${typeLabel}: ${percentage}%`;
    });

  return entries.join('\n');
}

/**
 * Get Finnish label for question type
 */
function formatQuestionTypeFinnish(type: QuestionType): string {
  const labels: Record<QuestionType, string> = {
    multiple_choice: 'Monivalinta',
    fill_blank: 'Täydennys',
    true_false: 'Tosi/Epätosi',
    matching: 'Paritus',
    short_answer: 'Avoin vastaus',
    sequential: 'Järjestys',
    map: 'Kartta',
  };
  return labels[type] || type;
}

/**
 * Calculate weighted average difficulty from topics
 */
export function calculateWeightedDifficulty(
  topics: Array<{ difficulty: Difficulty; coverage: number }>
): Difficulty {
  const difficultyScores: Record<Difficulty, number> = {
    helppo: 1,
    normaali: 2,
    vaikea: 3,
  };

  const weightedSum = topics.reduce((sum, topic) => {
    return sum + difficultyScores[topic.difficulty] * topic.coverage;
  }, 0);

  // Map weighted average back to difficulty level
  if (weightedSum < 1.5) return 'helppo';
  if (weightedSum < 2.5) return 'normaali';
  return 'vaikea';
}
```

### Step 2: Update PromptBuilder with Difficulty-Based Type Weights

```typescript
// src/lib/prompts/PromptBuilder.ts

import {
  getQuestionTypeWeights,
  formatQuestionTypeWeights,
  calculateWeightedDifficulty
} from '@/lib/utils/difficultyMapping';

private buildVariables(params: BuildVariablesParams): Record<string, string> {
  // ... existing code

  // NEW: Add difficulty-based question type weights
  let questionTypeGuidance = '';
  if (params.enhancedTopics && params.enhancedTopics.length > 0) {
    // Calculate overall difficulty from topics
    const overallDifficulty = calculateWeightedDifficulty(
      params.enhancedTopics.map(t => ({
        difficulty: t.difficulty,
        coverage: t.coverage,
      }))
    );

    const weights = getQuestionTypeWeights(overallDifficulty);
    questionTypeGuidance = `
KYSYMYSTYYPPIEN JAKAUMA (suositus materiaalin vaikeustason perusteella):
${formatQuestionTypeWeights(weights)}

HUOM: Tämä on suositus. Voit käyttää muita kysymystyyppejä jos materiaali sitä vaatii.
`.trim();

    logger.info(
      {
        overallDifficulty,
        weights,
      },
      'Using difficulty-based question type weights'
    );
  }

  return {
    // ... existing variables
    question_type_guidance: questionTypeGuidance,
  };
}
```

Update prompt template to include question type guidance:
```
{question_type_guidance}

{distribution_section}
```

### Step 3: Add Difficulty Consistency Validation

```typescript
// src/lib/utils/difficultyMapping.ts (continued)

import type { Question } from '@/types';

export interface DifficultyConsistencyResult {
  expectedDifficulty: Difficulty;
  questionTypes: Record<QuestionType, number>;
  isConsistent: boolean;
  warnings: string[];
}

/**
 * Validate that question types match expected difficulty
 */
export function validateDifficultyConsistency(
  questions: Question[],
  expectedDifficulty: Difficulty
): DifficultyConsistencyResult {
  // Count question types
  const typeCounts: Record<string, number> = {};
  questions.forEach(q => {
    typeCounts[q.question_type] = (typeCounts[q.question_type] || 0) + 1;
  });

  // Calculate percentages
  const questionTypes: Record<string, number> = {};
  Object.keys(typeCounts).forEach(type => {
    questionTypes[type] = typeCounts[type] / questions.length;
  });

  const expectedWeights = getQuestionTypeWeights(expectedDifficulty);
  const warnings: string[] = [];

  // Check for significant deviations (>30% difference)
  Object.entries(expectedWeights).forEach(([type, expectedWeight]) => {
    const actualWeight = questionTypes[type] || 0;
    const deviation = Math.abs(actualWeight - expectedWeight);

    if (deviation > 0.30 && expectedWeight > 0.15) {
      warnings.push(
        `Question type "${type}" has ${Math.round(actualWeight * 100)}% ` +
        `but expected ~${Math.round(expectedWeight * 100)}% for difficulty "${expectedDifficulty}"`
      );
    }
  });

  // Check for overly simple questions on hard topics
  if (expectedDifficulty === 'vaikea') {
    const simpleTypes = ['true_false', 'multiple_choice'];
    const simplePercentage = simpleTypes.reduce((sum, type) => {
      return sum + (questionTypes[type] || 0);
    }, 0);

    if (simplePercentage > 0.50) {
      warnings.push(
        `Hard topic has ${Math.round(simplePercentage * 100)}% simple questions ` +
        `(multiple choice + true/false), consider more complex types`
      );
    }
  }

  // Check for overly complex questions on easy topics
  if (expectedDifficulty === 'helppo') {
    const complexTypes = ['short_answer', 'sequential', 'matching'];
    const complexPercentage = complexTypes.reduce((sum, type) => {
      return sum + (questionTypes[type] || 0);
    }, 0);

    if (complexPercentage > 0.30) {
      warnings.push(
        `Easy topic has ${Math.round(complexPercentage * 100)}% complex questions, ` +
        `consider simpler types`
      );
    }
  }

  const isConsistent = warnings.length === 0;

  logger.info(
    {
      expectedDifficulty,
      questionTypes,
      isConsistent,
      warningCount: warnings.length,
    },
    'Difficulty consistency validation completed'
  );

  return {
    expectedDifficulty,
    questionTypes: questionTypes as any,
    isConsistent,
    warnings,
  };
}
```

### Step 4: Integrate with Question Generation

```typescript
// src/lib/api/questionGeneration.ts

import {
  calculateWeightedDifficulty,
  validateDifficultyConsistency
} from '@/lib/utils/difficultyMapping';

export async function generateQuizSets(
  request: QuizGenerationRequest,
  enhancedTopics?: EnhancedTopic[]
): Promise<QuestionSetResult[]> {
  // ... existing code

  for (const difficulty of request.difficulties) {
    const questions = await generateQuestions({ ... });

    // ... existing coverage validation

    // NEW: Validate difficulty consistency
    if (enhancedTopics && enhancedTopics.length > 0) {
      const expectedDifficulty = calculateWeightedDifficulty(
        enhancedTopics.map(t => ({
          difficulty: t.difficulty,
          coverage: t.coverage,
        }))
      );

      const difficultyResult = validateDifficultyConsistency(
        questions,
        expectedDifficulty
      );

      logger.info(
        {
          difficulty,
          expectedDifficulty,
          questionTypes: difficultyResult.questionTypes,
          isConsistent: difficultyResult.isConsistent,
        },
        'Difficulty consistency validation'
      );

      if (!difficultyResult.isConsistent) {
        logger.warn(
          {
            difficulty,
            warnings: difficultyResult.warnings,
          },
          'Question types do not match expected difficulty'
        );
      }
    }

    // ... rest of existing code
  }
}
```

## Acceptance Criteria

- [ ] `getQuestionTypeWeights()` function with weights for each difficulty level
- [ ] `formatQuestionTypeWeights()` for AI prompt
- [ ] `calculateWeightedDifficulty()` for multi-topic difficulty calculation
- [ ] `validateDifficultyConsistency()` for post-generation validation
- [ ] Integration with PromptBuilder to include type guidance
- [ ] Integration with question generation to validate consistency
- [ ] Structured logging for difficulty metrics
- [ ] TypeScript compilation passes
- [ ] Manual test: Verify helppo topics get simpler question types

## Example

### Input
```typescript
const enhancedTopics = [
  { name: "Yhteenlasku", difficulty: "helppo", coverage: 0.60 },
  { name: "Kertotaulu", difficulty: "normaali", coverage: 0.40 },
];
```

### Calculated Weighted Difficulty
```typescript
// Weighted average: 0.60 * 1 + 0.40 * 2 = 1.4
// → Maps to "helppo"
```

### Question Type Guidance (Prompt)
```
KYSYMYSTYYPPIEN JAKAUMA (suositus materiaalin vaikeustason perusteella):
- Monivalinta: 40%
- Täydennys: 25%
- Tosi/Epätosi: 20%
- Paritus: 10%
- Avoin vastaus: 5%
```

### Validation Result
```typescript
{
  expectedDifficulty: "helppo",
  questionTypes: {
    multiple_choice: 0.42,    // 42% (close to 40% expected)
    fill_blank: 0.28,         // 28% (close to 25% expected)
    true_false: 0.18,         // 18% (close to 20% expected)
    matching: 0.12,           // 12% (close to 10% expected)
  },
  isConsistent: true,
  warnings: []
}
```

## Benefits

| Metric | Phase 3 | Phase 4 | Improvement |
|--------|---------|---------|-------------|
| Question type appropriateness | Random | Difficulty-matched | +40% |
| Question complexity consistency | Not validated | Validated | Quality assurance |
| User experience | Baseline | Better matched | +15% satisfaction |

## Files to Create/Modify

- 📄 `src/lib/utils/difficultyMapping.ts` - New difficulty mapping utilities
- ✏️ `src/lib/prompts/PromptBuilder.ts` - Add question type guidance
- ✏️ `src/lib/api/questionGeneration.ts` - Add difficulty validation
- ✏️ `src/lib/ai/questionGenerator.ts` - Pass enhanced topics to builder (already done in Phase 2)

## Testing Strategy

1. Generate questions with helppo material → expect more multiple choice
2. Generate questions with vaikea material → expect more short answer
3. Mix of difficulties → verify weighted average calculation
4. Check logs for consistency warnings
5. Verify prompt includes type guidance

## Success Metrics

- Question type match: >70% within expected ranges
- Consistency warnings: <20% of generations
- User feedback: Improved question appropriateness

## Notes

- This is the final phase of Task 065
- Completes the enhanced topic identification feature
- Integrates all previous phases into cohesive system
- Total task value: 7 points (2+2+2+1)
