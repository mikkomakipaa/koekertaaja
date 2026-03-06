# Topic Identification Enhancement Proposal

## Problem Statement

Current topic identification returns minimal data (just topic names), wasting the deep analysis already performed. This leads to suboptimal question distribution and no validation of coverage.

## Current Output (Suboptimal)

```typescript
{
  topics: ["Geometria", "Laskutoimitukset", "Luvut"],
  primarySubject: "Matematiikka"
}
```

## Proposed Enhanced Output

```typescript
{
  topics: [
    {
      name: "Geometria",
      coverage: 0.45,           // 45% of material
      difficulty: "normaali",    // Estimated difficulty
      keywords: ["suorakulmio", "pinta-ala", "piiri", "kolmio"],
      suggestedQuestions: 18,    // For 40-question set
      subtopics: [
        "Pinta-alat",
        "Piiri ja kehä",
        "Geometriset muodot"
      ],
      importance: "high"         // Based on material emphasis
    },
    {
      name: "Laskutoimitukset",
      coverage: 0.35,
      difficulty: "helppo",
      keywords: ["yhteenlasku", "vähennyslasku", "kertolasku", "jakolasku"],
      suggestedQuestions: 14,
      subtopics: [
        "Peruslaskutoimitukset",
        "Laskujärjestys"
      ],
      importance: "medium"
    },
    {
      name: "Luvut",
      coverage: 0.20,
      difficulty: "helppo",
      keywords: ["kokonaisluvut", "desimaaliluvut", "murtoluvut"],
      suggestedQuestions: 8,
      subtopics: [
        "Lukujen vertailu",
        "Lukujen pyöristäminen"
      ],
      importance: "medium"
    }
  ],
  primarySubject: "Matematiikka",
  metadata: {
    totalConcepts: 12,           // Distinct concepts identified
    estimatedDifficulty: "normaali",
    materialType: "textbook",     // vs "worksheet", "notes"
    gradeLevel: 5,
    completeness: 0.85            // How thoroughly material covers subject
  }
}
```

## Benefits of Enhanced Output

### 1. Intelligent Question Distribution

**Before:**
```
AI arbitrarily creates:
- 15 Geometria questions
- 20 Laskutoimitukset questions
- 5 Luvut questions
(Doesn't match material emphasis!)
```

**After:**
```typescript
// Use coverage percentages for distribution
const distribution = topics.map(topic => ({
  topic: topic.name,
  count: Math.round(questionCount * topic.coverage)
}));

// Result matches material:
// - 18 Geometria (45%)
// - 14 Laskutoimitukset (35%)
// - 8 Luvut (20%)
```

### 2. Difficulty-Aware Generation

```typescript
// Generate easier quiz for topics marked "helppo"
if (topic.difficulty === "helppo") {
  // Focus on recognition and basic application
  questionTypeDistribution = {
    multiple_choice: 0.5,
    fill_blank: 0.3,
    true_false: 0.2
  };
} else {
  // More challenging for "normaali"
  questionTypeDistribution = {
    multiple_choice: 0.3,
    fill_blank: 0.4,
    short_answer: 0.3
  };
}
```

### 3. Keyword-Guided Generation

```typescript
// Ensure target keywords appear in questions
const prompt = `
Generate questions covering these specific concepts:
${topic.keywords.map(k => `- ${k}`).join('\n')}

Subtopics to cover:
${topic.subtopics.map(st => `- ${st}`).join('\n')}
`;
```

### 4. Coverage Validation

```typescript
// After generation, validate coverage
function validateCoverage(
  questions: Question[],
  topics: EnhancedTopic[]
): CoverageReport {
  const coverage = topics.map(topic => {
    const questionsForTopic = questions.filter(q =>
      topic.keywords.some(keyword =>
        q.question_text.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    const actualCoverage = questionsForTopic.length / questions.length;
    const expectedCoverage = topic.coverage;
    const deviation = Math.abs(actualCoverage - expectedCoverage);

    return {
      topic: topic.name,
      expected: expectedCoverage,
      actual: actualCoverage,
      deviation,
      missing: deviation > 0.15 // Warning if >15% deviation
    };
  });

  return {
    coverage,
    warnings: coverage.filter(c => c.missing)
  };
}
```

### 5. Adaptive Quiz Length

```typescript
// Suggest minimum question count based on material depth
function calculateOptimalQuestionCount(
  topics: EnhancedTopic[]
): { min: number; recommended: number; max: number } {
  const totalConcepts = topics.reduce(
    (sum, t) => sum + (t.metadata?.totalConcepts || t.subtopics.length),
    0
  );

  return {
    min: totalConcepts * 2,      // At least 2 questions per concept
    recommended: totalConcepts * 4, // 4 questions per concept
    max: totalConcepts * 8       // Max 8 per concept
  };
}

// Example: Material with 12 concepts
// min: 24, recommended: 48, max: 96
// User requesting 200 questions would get warning
```

### 6. Smart Retry Strategy

```typescript
// If quiz generation fails for one topic, retry just that topic
async function generateWithTopicRetry(
  topics: EnhancedTopic[],
  questionCount: number
) {
  const results = [];

  for (const topic of topics) {
    const topicQuestions = Math.round(questionCount * topic.coverage);

    try {
      const questions = await generateQuestions({
        subject,
        topic: topic.name,
        subtopics: topic.subtopics,
        keywords: topic.keywords,
        questionCount: topicQuestions,
        difficulty: topic.difficulty
      });

      results.push({ topic: topic.name, questions });
    } catch (error) {
      // Retry only this topic, others continue
      console.warn(`Topic ${topic.name} failed, retrying...`);
      // ... retry logic
    }
  }

  return results;
}
```

## Implementation Phases

### Phase 1: Enhanced Data Structure (2 points)
- Update `TopicAnalysisResult` interface
- Modify `identifyTopics()` prompt to return richer JSON
- Add validation for new fields

### Phase 2: Distribution Logic (2 points)
- Calculate question distribution from coverage percentages
- Pass distribution to question generator
- Log coverage stats

### Phase 3: Coverage Validation (2 points)
- Implement `validateCoverage()` function
- Warn if topics are under-represented
- Optionally regenerate missing coverage

### Phase 4: Difficulty Mapping (1 point)
- Use topic difficulty to adjust question types
- Validate difficulty consistency

## Example Prompt Update

**Current:**
```
Tunnista materiaalist 3-5 KORKEANTASON aihealuetta...

JSON VASTAUSMUOTO:
{
  "topics": [
    "Aihealue 1",
    "Aihealue 2"
  ]
}
```

**Enhanced:**
```
Analysoi materiaali ja tunnista 3-5 aihealuetta täydellisine metatietoineen...

JSON VASTAUSMUOTO:
{
  "topics": [
    {
      "name": "Aihealue 1",
      "coverage": 0.4,
      "difficulty": "helppo|normaali|vaikea",
      "keywords": ["avainsana1", "avainsana2"],
      "subtopics": ["Aliaihealue 1", "Aliaihealue 2"],
      "importance": "high|medium|low"
    }
  ],
  "metadata": {
    "totalConcepts": 10,
    "estimatedDifficulty": "normaali",
    "completeness": 0.85
  }
}

OHJEET:
- coverage: Kuinka suuren osan materiaalista tämä aihealue kattaa (summa = 1.0)
- keywords: 3-5 keskeistä käsitettä tälle aihealueelle
- subtopics: 2-4 aliaihealuetta
- importance: Kuinka keskeinen aihealue on oppimistavoitteille
```

## Backward Compatibility

```typescript
// Legacy support - extract simple string array
function getSimpleTopics(enhanced: EnhancedTopicAnalysis): string[] {
  return enhanced.topics.map(t => t.name);
}

// Gradual migration
const legacyFormat = getSimpleTopics(topicAnalysis);
const enhancedFormat = topicAnalysis.topics; // Use when ready
```

## Expected Improvements

| Metric | Current | Enhanced | Improvement |
|--------|---------|----------|-------------|
| Coverage accuracy | ~65% | ~90% | +38% |
| User satisfaction | Baseline | +25% | Better distribution |
| Retry granularity | All-or-nothing | Per-topic | Faster recovery |
| Question quality | Good | Excellent | Keyword targeting |
| Material utilization | 70% | 95% | Less waste |

## Next Steps

1. Review and approve enhanced data structure
2. Implement Phase 1 (enhanced output)
3. Test with sample materials
4. Measure coverage accuracy improvements
5. Roll out Phases 2-4 incrementally
