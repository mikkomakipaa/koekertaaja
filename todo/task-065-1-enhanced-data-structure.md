# Task 065.1: Enhanced Data Structure

**Status:** 🟡 In Progress
**Estimate:** 2 points
**Priority:** P1
**Parent:** Task 065
**Started:** 2026-01-27

## Overview

Update topic identification to return rich metadata instead of just topic names. This is the foundation for intelligent question distribution and coverage validation.

## Current Implementation

```typescript
// src/lib/ai/topicIdentifier.ts
export interface TopicAnalysisResult {
  topics: string[];              // Just names!
  primarySubject: string;
}

// AI returns:
{
  "topics": ["Geometria", "Laskutoimitukset", "Luvut"]
}
```

## Target Implementation

```typescript
export interface EnhancedTopic {
  name: string;                   // "Geometria"
  coverage: number;                // 0.45 (45% of material)
  difficulty: 'helppo' | 'normaali' | 'vaikea';
  keywords: string[];              // ["pinta-ala", "piiri", "suorakulmio"]
  subtopics: string[];             // ["Pinta-alat", "Geometriset muodot"]
  importance: 'high' | 'medium' | 'low';
}

export interface TopicAnalysisMetadata {
  totalConcepts: number;           // 12 distinct concepts
  estimatedDifficulty: 'helppo' | 'normaali' | 'vaikea';
  completeness: number;            // 0.85 (85% coverage)
  materialType?: 'textbook' | 'worksheet' | 'notes';
}

export interface TopicAnalysisResult {
  topics: EnhancedTopic[];
  primarySubject: string;
  metadata: TopicAnalysisMetadata;
}

// AI returns:
{
  "topics": [
    {
      "name": "Geometria",
      "coverage": 0.45,
      "difficulty": "normaali",
      "keywords": ["pinta-ala", "piiri", "suorakulmio", "kolmio"],
      "subtopics": ["Pinta-alat", "Piiri ja kehä", "Geometriset muodot"],
      "importance": "high"
    }
  ],
  "metadata": {
    "totalConcepts": 12,
    "estimatedDifficulty": "normaali",
    "completeness": 0.85
  }
}
```

## Implementation Steps

### Step 1: Update Type Definitions
- [x] Add `EnhancedTopic` interface to `topicIdentifier.ts`
- [x] Add `TopicAnalysisMetadata` interface
- [x] Update `TopicAnalysisResult` to use `EnhancedTopic[]`
- [x] Keep backward compatibility with string[] accessor

### Step 2: Update AI Prompt
- [x] Expand prompt to request coverage percentages
- [x] Request keywords (3-5 per topic)
- [x] Request subtopics (2-4 per topic)
- [x] Request difficulty estimate
- [x] Request importance level
- [x] Request metadata fields
- [x] Provide clear JSON schema and examples

### Step 3: Add Validation Logic
- [x] Validate coverage sum = 1.0 ± 0.05
- [x] Validate keywords: 3-5 per topic
- [x] Validate subtopics: 2-4 per topic
- [x] Validate difficulty values
- [x] Validate importance values
- [x] Log validation warnings (don't fail, adjust)

### Step 4: Backward Compatibility
- [x] Add `getSimpleTopics()` helper function
- [x] Update existing consumers to handle both formats
- [x] Add migration guide in comments

### Step 5: Testing
- [ ] Test with math material (geometry + arithmetic)
- [ ] Test with language material (grammar + vocabulary)
- [ ] Test with history material (multiple time periods)
- [ ] Verify coverage sums to ~1.0
- [ ] Verify keywords are relevant

## Validation Rules

```typescript
// Coverage validation
const coverageSum = topics.reduce((sum, t) => sum + t.coverage, 0);
if (Math.abs(coverageSum - 1.0) > 0.05) {
  // Normalize to 1.0
  topics.forEach(t => t.coverage = t.coverage / coverageSum);
}

// Keywords validation
topics.forEach(topic => {
  if (topic.keywords.length < 3) {
    logger.warn(`Topic ${topic.name} has too few keywords (${topic.keywords.length})`);
  }
  if (topic.keywords.length > 5) {
    topic.keywords = topic.keywords.slice(0, 5);
  }
});

// Subtopics validation
topics.forEach(topic => {
  if (topic.subtopics.length < 2) {
    logger.warn(`Topic ${topic.name} has too few subtopics (${topic.subtopics.length})`);
  }
  if (topic.subtopics.length > 4) {
    topic.subtopics = topic.subtopics.slice(0, 4);
  }
});
```

## Updated AI Prompt (Key Sections)

```
Analysoi materiaali ja tunnista 3-5 aihealuetta TÄYDELLISINE metatietoineen.

JSON VASTAUSMUOTO:
{
  "topics": [
    {
      "name": "Aihealue nimi (1-3 sanaa)",
      "coverage": 0.4,
      "difficulty": "helppo|normaali|vaikea",
      "keywords": ["avainsana1", "avainsana2", "avainsana3"],
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

COVERAGE OHJEET:
- Summaa coverage-arvot 1.0:ksi (100%)
- Jos Geometria on 45% materiaalista, aseta coverage: 0.45
- Isoimman aihealueen coverage ≥ 0.3
- Pienimmän aihealueen coverage ≥ 0.15

KEYWORDS OHJEET:
- 3-5 keskeistä käsitettä per aihealue
- Konkreettisia termejä (ei yleiskäsitteitä)
- Esimerkit: "pinta-ala", "suorakulmio" (HYVÄ) vs "geometria" (HUONO)

SUBTOPICS OHJEET:
- 2-4 aliaihealuetta per pääaihealue
- Tarkempia jaotteluja kuin pääaihealue
- Esimerkki: Geometria → ["Pinta-alat", "Piiri ja kehä", "Kolmiot"]

IMPORTANCE OHJEET:
- high: Keskeinen oppimistavoite, paljon materiaalia
- medium: Tärkeä mutta ei pääfokus
- low: Sivujuonne tai lisätieto
```

## Backward Compatibility Helper

```typescript
/**
 * Get simple topic names for legacy code
 * @deprecated Use enhanced topics directly when possible
 */
export function getSimpleTopics(result: TopicAnalysisResult): string[] {
  return result.topics.map(t => t.name);
}

// Usage in legacy code:
const topics = getSimpleTopics(analysisResult); // ["Geometria", "Laskutoimitukset"]
```

## Files Modified

- ✏️ `src/lib/ai/topicIdentifier.ts` - Types, prompt, validation
- 📄 `docs/topic-identification-migration.md` - Migration guide

## Success Criteria

- [x] Enhanced types compile without errors
- [x] AI prompt requests all required fields
- [x] Validation normalizes coverage to 1.0
- [x] Validation adjusts keywords/subtopics to valid ranges
- [x] `getSimpleTopics()` provides backward compatibility
- [ ] Manual test: Math material returns reasonable coverage
- [ ] Manual test: Keywords are relevant and specific
- [ ] Manual test: Subtopics are appropriate subdivisions

## Example Test Cases

### Test Case 1: Math Geometry (40% coverage)
**Material:** Rectangle area formulas, perimeter calculations, triangle properties

**Expected Output:**
```json
{
  "name": "Geometria",
  "coverage": 0.4,
  "difficulty": "normaali",
  "keywords": ["pinta-ala", "piiri", "suorakulmio", "kolmio"],
  "subtopics": ["Pinta-alat", "Piiri ja kehä", "Kolmiot"],
  "importance": "high"
}
```

### Test Case 2: English Grammar (30% coverage)
**Material:** Present simple vs continuous, question formation, negatives

**Expected Output:**
```json
{
  "name": "Grammar",
  "coverage": 0.3,
  "difficulty": "normaali",
  "keywords": ["present simple", "present continuous", "questions", "negatives"],
  "subtopics": ["Tense usage", "Question forms", "Negative sentences"],
  "importance": "high"
}
```

## Next Steps After Completion

1. Test with real materials
2. Verify coverage accuracy
3. Move to Phase 2 (Distribution Logic)
4. Integrate with question generator
