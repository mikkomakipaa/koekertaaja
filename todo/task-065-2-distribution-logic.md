# Task 065.2: Distribution Logic

**Status:** 🟡 In Progress
**Estimate:** 2 points
**Priority:** P1
**Parent:** Task 065
**Started:** 2026-01-27

## Overview

Use enhanced topic coverage percentages to intelligently distribute questions across topics, matching material emphasis instead of arbitrary AI decisions.

## Problem Statement

**Current (Phase 1):**
- Enhanced topics returned with coverage: [0.45, 0.35, 0.20]
- But coverage data is ignored - converted to simple strings
- AI arbitrarily decides question distribution
- Result: 15 geometry, 20 arithmetic, 5 numbers (doesn't match material!)

**Target (Phase 2):**
- Use coverage percentages for distribution
- Material is 45% geometry → 45% of questions about geometry
- Result: 18 geometry, 14 arithmetic, 8 numbers (matches material!)

## Implementation Steps

### Step 1: Return Enhanced Topics from identifyTopicsFromMaterial
Currently returns `string[]`, should return full `EnhancedTopic[]`

```typescript
// Before
return getSimpleTopics(topicAnalysis); // ["Geometria", "Laskutoimitukset"]

// After
return topicAnalysis; // Full enhanced data
```

Update consumers to handle enhanced topics.

### Step 2: Create Distribution Calculator

```typescript
// src/lib/utils/questionDistribution.ts

import { EnhancedTopic } from '@/lib/ai/topicIdentifier';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ module: 'questionDistribution' });

export interface TopicDistribution {
  topic: string;
  targetCount: number;
  coverage: number;
  keywords: string[];
  subtopics: string[];
  difficulty: string;
}

/**
 * Calculate question distribution based on topic coverage
 */
export function calculateDistribution(
  topics: EnhancedTopic[],
  totalQuestions: number
): TopicDistribution[] {
  const distribution = topics.map(topic => {
    // Calculate target based on coverage
    const targetCount = Math.round(totalQuestions * topic.coverage);

    return {
      topic: topic.name,
      targetCount,
      coverage: topic.coverage,
      keywords: topic.keywords,
      subtopics: topic.subtopics,
      difficulty: topic.difficulty,
    };
  });

  // Verify total matches (rounding may cause ±1 difference)
  const distributedTotal = distribution.reduce((sum, d) => sum + d.targetCount, 0);

  if (distributedTotal !== totalQuestions) {
    logger.warn(
      {
        requested: totalQuestions,
        distributed: distributedTotal,
        difference: totalQuestions - distributedTotal,
      },
      'Distribution rounding caused mismatch, adjusting largest topic'
    );

    // Adjust largest topic to match exactly
    const largest = distribution.reduce((max, d) =>
      d.targetCount > max.targetCount ? d : max
    );
    largest.targetCount += (totalQuestions - distributedTotal);
  }

  logger.info(
    {
      totalQuestions,
      distribution: distribution.map(d => ({
        topic: d.topic,
        count: d.targetCount,
        percentage: Math.round(d.coverage * 100),
      })),
    },
    'Calculated question distribution'
  );

  return distribution;
}
```

### Step 3: Update Question Generator Prompt

Modify PromptBuilder to include distribution guidance:

```typescript
// Add to BuildVariablesParams
enhancedTopics?: EnhancedTopic[];

// In buildVariables()
if (params.enhancedTopics) {
  const distribution = calculateDistribution(
    params.enhancedTopics,
    params.questionCount
  );

  // Add to template variables
  topic_distribution: formatDistribution(distribution);
}

private formatDistribution(distribution: TopicDistribution[]): string {
  return distribution.map(d =>
    `- ${d.topic}: ${d.targetCount} kysymystä (${Math.round(d.coverage * 100)}%)\n` +
    `  Avainsanat: ${d.keywords.join(', ')}\n` +
    `  Aliaihealueet: ${d.subtopics.join(', ')}`
  ).join('\n');
}
```

Update prompt template to use distribution:

```
AIHEALUEIDEN JAKAUMA:
{topic_distribution}

TÄRKEÄÄ: Noudata tätä jakaumaa tarkasti. Luo TÄSMÄLLEEN oikea määrä kysymyksiä
jokaisesta aihealueesta. Käytä annettuja avainsanoja ja aliaihealueita.
```

### Step 4: Update API Routes

Modify shared utilities to pass enhanced topics:

```typescript
// src/lib/api/questionGeneration.ts

export async function identifyTopicsFromMaterial(
  request: Pick<GenerationRequest, 'subject' | 'grade' | 'materialText' | 'materialFiles'>
): Promise<TopicAnalysisResult> {
  const topicAnalysis = await identifyTopics({
    subject: request.subject,
    grade: request.grade,
    materialText: request.materialText,
    materialFiles: request.materialFiles,
  });

  logger.info(
    {
      enhancedTopics: topicAnalysis.topics.map(t => ({
        name: t.name,
        coverage: t.coverage,
        keywords: t.keywords.length,
      })),
      topicCount: topicAnalysis.topics.length,
      metadata: topicAnalysis.metadata,
    },
    'Enhanced topics identified successfully'
  );

  return topicAnalysis; // Return full enhanced data
}

// Update generateQuizSets and generateFlashcardSet
export async function generateQuizSets(
  request: QuizGenerationRequest,
  enhancedTopics?: EnhancedTopic[]
): Promise<QuestionSetResult[]> {
  const results: QuestionSetResult[] = [];

  for (const difficulty of request.difficulties) {
    const questions = await generateQuestions({
      // ... existing params
      enhancedTopics, // NEW: Pass enhanced topics
    });
    // ...
  }

  return results;
}
```

### Step 5: Add Logging and Metrics

```typescript
// After generation, log actual vs expected distribution
const actualDistribution = topics.map(topic => {
  const count = questions.filter(q =>
    topic.keywords.some(k =>
      q.question_text.toLowerCase().includes(k.toLowerCase())
    )
  ).length;

  return {
    topic: topic.name,
    expected: Math.round(totalQuestions * topic.coverage),
    actual: count,
    deviation: Math.abs(count - Math.round(totalQuestions * topic.coverage)),
  };
});

logger.info(
  {
    distribution: actualDistribution,
    totalDeviation: actualDistribution.reduce((sum, d) => sum + d.deviation, 0),
  },
  'Question distribution accuracy'
);
```

## Acceptance Criteria

- [x] `identifyTopicsFromMaterial()` returns full `TopicAnalysisResult`
- [x] `calculateDistribution()` function created
- [x] Distribution matches coverage percentages (±1 rounding)
- [x] Question generator receives distribution guidance
- [x] Prompt template includes distribution section
- [x] API routes pass enhanced topics
- [x] Logging shows expected vs actual distribution
- [ ] Manual test: 50 questions with [0.45, 0.35, 0.20] coverage → [23, 18, 9] distribution
- [ ] TypeScript compilation passes

## Example

### Input
```typescript
const topics = [
  { name: "Geometria", coverage: 0.45, keywords: ["pinta-ala", "piiri"] },
  { name: "Laskutoimitukset", coverage: 0.35, keywords: ["yhteenlasku"] },
  { name: "Luvut", coverage: 0.20, keywords: ["kokonaisluvut"] }
];
const questionCount = 50;
```

### Output
```typescript
[
  { topic: "Geometria", targetCount: 23, coverage: 0.45 },      // 45% of 50 = 22.5 → 23
  { topic: "Laskutoimitukset", targetCount: 17, coverage: 0.35 }, // 35% of 50 = 17.5 → 17
  { topic: "Luvut", targetCount: 10, coverage: 0.20 }          // 20% of 50 = 10
]
// Total: 23 + 17 + 10 = 50 ✓
```

## Benefits

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Coverage accuracy | ~65% | ~90% | +38% |
| Question waste | ~30% | ~5% | -83% |
| User satisfaction | Baseline | +25% | Better match |

## Files to Modify/Create

- 📄 `src/lib/utils/questionDistribution.ts` - New calculator
- ✏️ `src/lib/api/questionGeneration.ts` - Return/use enhanced topics
- ✏️ `src/lib/ai/questionGenerator.ts` - Accept enhancedTopics param
- ✏️ `src/lib/prompts/PromptBuilder.ts` - Use distribution in prompt
- ✏️ `src/app/api/generate-questions/quiz/route.ts` - Pass topics
- ✏️ `src/app/api/generate-questions/flashcard/route.ts` - Pass topics
- ✏️ `src/app/api/identify-topics/route.ts` - Return enhanced data

## Testing Strategy

1. Generate 50-question quiz with math material
2. Verify distribution matches coverage
3. Check logs for expected vs actual
4. Verify keywords appear in questions

## Migration Notes

- Backward compatible - enhanced topics optional
- Falls back to legacy behavior if not provided
- Gradual rollout via feature flag possible

## Success Metrics

- Distribution deviation < 2 questions per topic
- Keyword coverage > 90% per topic
- User-reported quality improvement
