# Task 065.3: Coverage Validation

**Status:** 🟡 In Progress
**Estimate:** 2 points
**Priority:** P1
**Parent:** Task 065
**Started:** 2026-01-27

## Overview

Implement validation to verify that generated questions actually cover all identified topics according to the calculated distribution. Use keyword-based detection and topic analysis to ensure no topics are under-represented.

## Problem Statement

**Current (Phase 2):**
- Distribution calculated: [23 geometry, 17 arithmetic, 10 numbers]
- Questions generated with distribution guidance
- But no validation of actual coverage
- AI might ignore instructions or misinterpret keywords
- Result: Unknown if distribution was followed

**Target (Phase 3):**
- After generation, validate actual vs expected distribution
- Use keyword matching to detect topic coverage
- Warn if topics under-represented (>20% deviation)
- Log coverage metrics for monitoring
- Optionally trigger per-topic retry if needed

## Implementation Steps

### Step 1: Create Coverage Validator

```typescript
// src/lib/utils/coverageValidation.ts

import { EnhancedTopic } from '@/lib/ai/topicIdentifier';
import { TopicDistribution } from './questionDistribution';
import { createLogger } from '@/lib/logger';
import type { Question } from '@/types';

const logger = createLogger({ module: 'coverageValidation' });

export interface TopicCoverage {
  topic: string;
  expectedCount: number;
  actualCount: number;
  deviation: number;
  deviationPercent: number;
  matchedKeywords: string[];
  coveredSubtopics: string[];
  isUnderRepresented: boolean;
}

export interface CoverageValidationResult {
  totalQuestions: number;
  coverageByTopic: TopicCoverage[];
  overallDeviation: number;
  isAcceptable: boolean;
  warnings: string[];
}

/**
 * Validate that questions cover topics according to distribution
 */
export function validateCoverage(
  questions: Question[],
  distribution: TopicDistribution[]
): CoverageValidationResult {
  const coverageByTopic = distribution.map(dist => {
    // Find questions matching this topic's keywords
    const matchedQuestions = questions.filter(q =>
      matchesTopicKeywords(q, dist.keywords)
    );

    const actualCount = matchedQuestions.length;
    const deviation = actualCount - dist.targetCount;
    const deviationPercent = Math.abs((deviation / dist.targetCount) * 100);

    // Check which keywords appear in questions
    const matchedKeywords = dist.keywords.filter(keyword =>
      matchedQuestions.some(q =>
        q.question_text.toLowerCase().includes(keyword.toLowerCase()) ||
        q.correct_answer?.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    // Check which subtopics are covered
    const coveredSubtopics = dist.subtopics.filter(subtopic =>
      matchedQuestions.some(q =>
        q.question_text.toLowerCase().includes(subtopic.toLowerCase())
      )
    );

    return {
      topic: dist.topic,
      expectedCount: dist.targetCount,
      actualCount,
      deviation,
      deviationPercent,
      matchedKeywords,
      coveredSubtopics,
      isUnderRepresented: deviationPercent > 20 && deviation < 0,
    };
  });

  const overallDeviation = coverageByTopic.reduce(
    (sum, c) => sum + Math.abs(c.deviation),
    0
  );

  const warnings: string[] = [];

  // Check for under-represented topics
  coverageByTopic.forEach(coverage => {
    if (coverage.isUnderRepresented) {
      warnings.push(
        `Topic "${coverage.topic}" is under-represented: ` +
        `expected ${coverage.expectedCount}, got ${coverage.actualCount} ` +
        `(${Math.round(coverage.deviationPercent)}% deviation)`
      );
    }

    // Check for missing keywords
    const missingKeywords = coverage.matchedKeywords.length;
    const totalKeywords = distribution.find(d => d.topic === coverage.topic)?.keywords.length || 0;
    if (missingKeywords < totalKeywords * 0.5) {
      warnings.push(
        `Topic "${coverage.topic}" has low keyword coverage: ` +
        `${missingKeywords}/${totalKeywords} keywords found`
      );
    }

    // Check for uncovered subtopics
    const uncoveredSubtopics =
      (distribution.find(d => d.topic === coverage.topic)?.subtopics.length || 0) -
      coverage.coveredSubtopics.length;
    if (uncoveredSubtopics > 0) {
      warnings.push(
        `Topic "${coverage.topic}" missing ${uncoveredSubtopics} subtopics`
      );
    }
  });

  // Overall deviation threshold: 10% of total questions
  const isAcceptable = overallDeviation <= questions.length * 0.1;

  logger.info(
    {
      totalQuestions: questions.length,
      overallDeviation,
      isAcceptable,
      coverageByTopic: coverageByTopic.map(c => ({
        topic: c.topic,
        expected: c.expectedCount,
        actual: c.actualCount,
        deviation: c.deviation,
      })),
    },
    'Coverage validation completed'
  );

  if (warnings.length > 0) {
    logger.warn({ warnings }, 'Coverage validation warnings');
  }

  return {
    totalQuestions: questions.length,
    coverageByTopic,
    overallDeviation,
    isAcceptable,
    warnings,
  };
}

/**
 * Check if question matches topic keywords
 */
function matchesTopicKeywords(
  question: Question,
  keywords: string[]
): boolean {
  const searchText = [
    question.question_text,
    question.correct_answer,
    ...(question.wrong_answers || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Match if any keyword appears in question/answers
  return keywords.some(keyword =>
    searchText.includes(keyword.toLowerCase())
  );
}

/**
 * Get detailed coverage report as formatted string
 */
export function formatCoverageReport(
  result: CoverageValidationResult
): string {
  const lines: string[] = [
    '=== Coverage Validation Report ===',
    `Total Questions: ${result.totalQuestions}`,
    `Overall Deviation: ${result.overallDeviation} questions`,
    `Status: ${result.isAcceptable ? '✓ PASS' : '✗ FAIL'}`,
    '',
    'Coverage by Topic:',
  ];

  result.coverageByTopic.forEach(coverage => {
    const status = coverage.isUnderRepresented ? '⚠️' : '✓';
    lines.push(
      `${status} ${coverage.topic}: ${coverage.actualCount}/${coverage.expectedCount} ` +
      `(deviation: ${coverage.deviation >= 0 ? '+' : ''}${coverage.deviation})`
    );
    lines.push(`  Keywords: ${coverage.matchedKeywords.join(', ')}`);
    lines.push(`  Subtopics: ${coverage.coveredSubtopics.join(', ')}`);
  });

  if (result.warnings.length > 0) {
    lines.push('', 'Warnings:');
    result.warnings.forEach(warning => lines.push(`  - ${warning}`));
  }

  return lines.join('\n');
}
```

### Step 2: Integrate with Question Generator

Update `src/lib/api/questionGeneration.ts`:

```typescript
import { validateCoverage, formatCoverageReport } from '@/lib/utils/coverageValidation';

export async function generateQuizSets(
  request: QuizGenerationRequest,
  enhancedTopics?: EnhancedTopic[]
): Promise<QuestionSetResult[]> {
  // ... existing code

  for (const difficulty of request.difficulties) {
    const questions = await generateQuestions({ ... });

    // NEW: Validate coverage if distribution was used
    if (distribution) {
      const coverageResult = validateCoverage(questions, distribution);

      logger.info(
        {
          difficulty,
          coverage: coverageResult.coverageByTopic,
          isAcceptable: coverageResult.isAcceptable,
        },
        'Coverage validation for quiz set'
      );

      // Log detailed report in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(formatCoverageReport(coverageResult));
      }

      // Warn if coverage is poor
      if (!coverageResult.isAcceptable) {
        logger.warn(
          {
            difficulty,
            warnings: coverageResult.warnings,
            overallDeviation: coverageResult.overallDeviation,
          },
          'Generated questions do not meet coverage targets'
        );
      }
    }

    // ... rest of existing code
  }

  return results;
}
```

Same pattern for `generateFlashcardSet()`.

### Step 3: Add Coverage Metrics to Response (Optional)

```typescript
// Optionally include coverage metrics in API response for debugging
return NextResponse.json({
  success: true,
  questionSets: [...],
  // NEW: Coverage info (optional, for debugging)
  coverage: coverageResult ? {
    isAcceptable: coverageResult.isAcceptable,
    overallDeviation: coverageResult.overallDeviation,
    byTopic: coverageResult.coverageByTopic.map(c => ({
      topic: c.topic,
      expected: c.expectedCount,
      actual: c.actualCount,
    })),
  } : undefined,
});
```

## Acceptance Criteria

- [ ] `validateCoverage()` function created
- [ ] Keyword-based topic detection implemented
- [ ] Subtopic coverage tracking
- [ ] Deviation calculation (expected vs actual)
- [ ] Warning system for under-represented topics (>20% deviation)
- [ ] Integration with quiz and flashcard generation
- [ ] Structured logging for coverage metrics
- [ ] Coverage report formatting function
- [ ] TypeScript compilation passes
- [ ] Manual test: Verify warnings appear for poor coverage

## Example

### Input
```typescript
const questions = [
  { question_text: "Mikä on neliön pinta-ala?", ... },      // geometry
  { question_text: "Laske 5 + 3", ... },                   // arithmetic
  { question_text: "Mikä on neliön piiri?", ... },         // geometry
  // ... 47 more questions
];

const distribution = [
  { topic: "Geometria", targetCount: 23, keywords: ["pinta-ala", "piiri"] },
  { topic: "Laskutoimitukset", targetCount: 17, keywords: ["laske", "yhteenlasku"] },
  { topic: "Luvut", targetCount: 10, keywords: ["kokonaisluku", "desimaaliluku"] },
];
```

### Output
```typescript
{
  totalQuestions: 50,
  coverageByTopic: [
    {
      topic: "Geometria",
      expectedCount: 23,
      actualCount: 22,          // 1 under
      deviation: -1,
      deviationPercent: 4.3,
      matchedKeywords: ["pinta-ala", "piiri"],
      coveredSubtopics: ["Pinta-alat", "Geometriset muodot"],
      isUnderRepresented: false  // <20% deviation
    },
    {
      topic: "Laskutoimitukset",
      expectedCount: 17,
      actualCount: 20,          // 3 over
      deviation: 3,
      deviationPercent: 17.6,
      matchedKeywords: ["laske", "yhteenlasku"],
      coveredSubtopics: ["Yhteenlasku", "Vähennyslasku"],
      isUnderRepresented: false
    },
    {
      topic: "Luvut",
      expectedCount: 10,
      actualCount: 8,           // 2 under
      deviation: -2,
      deviationPercent: 20.0,
      matchedKeywords: ["kokonaisluku"],
      coveredSubtopics: ["Kokonaisluvut"],
      isUnderRepresented: false  // exactly 20%, not >20%
    }
  ],
  overallDeviation: 6,          // 1+3+2
  isAcceptable: true,           // 6 <= 50*0.1 = 5 (borderline)
  warnings: [
    "Topic \"Luvut\" has low keyword coverage: 1/2 keywords found"
  ]
}
```

## Benefits

| Metric | Phase 2 | Phase 3 | Improvement |
|--------|---------|---------|-------------|
| Coverage visibility | None | Full metrics | +100% |
| Under-represented detection | Manual | Automatic | Saves time |
| Keyword tracking | No | Yes | Quality assurance |
| Retry decision | Guess | Data-driven | +50% accuracy |

## Files to Create/Modify

- 📄 `src/lib/utils/coverageValidation.ts` - New validation utilities
- ✏️ `src/lib/api/questionGeneration.ts` - Add validation calls
- ✏️ `src/app/api/generate-questions/quiz/route.ts` - Optional: Include coverage in response
- ✏️ `src/app/api/generate-questions/flashcard/route.ts` - Optional: Include coverage in response

## Testing Strategy

1. Generate questions with known material (e.g., 50% topic A, 30% topic B, 20% topic C)
2. Verify coverage validation detects distribution
3. Manually create poor coverage scenario (all questions one topic)
4. Verify warnings appear
5. Check logs for coverage metrics

## Success Metrics

- Validation accuracy: 90%+ correct topic detection
- Warning precision: <5% false positives
- Warning recall: >95% catch under-represented topics
- Performance: <100ms validation overhead

## Future Enhancements (Not in Scope)

- Automatic retry for under-represented topics
- Semantic similarity matching (beyond keyword matching)
- Coverage-based quality scoring
- Historical coverage trending
