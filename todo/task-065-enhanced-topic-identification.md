# Task 065: Enhanced Topic Identification

**Status:** 🟡 In Progress
**Estimate:** 7 points
**Priority:** P1
**Started:** 2026-01-27

## Overview

Enhance topic identification to return rich metadata (coverage percentages, keywords, difficulty, subtopics) instead of just topic names. This enables intelligent question distribution, coverage validation, and smarter retry logic.

## Problem Statement

Current topic identification returns minimal data:
```typescript
{ topics: ["Geometria", "Laskutoimitukset", "Luvut"] }
```

This wastes the deep analysis already performed and leads to:
- ❌ Arbitrary question distribution (not matching material emphasis)
- ❌ No coverage validation
- ❌ No keyword targeting
- ❌ No difficulty awareness
- ❌ All-or-nothing retry (can't retry just one topic)

## Proposed Solution

Enhanced topic output with rich metadata:
```typescript
{
  topics: [
    {
      name: "Geometria",
      coverage: 0.45,              // 45% of material
      difficulty: "normaali",
      keywords: ["pinta-ala", "piiri", "suorakulmio"],
      subtopics: ["Pinta-alat", "Geometriset muodot"],
      importance: "high"
    }
  ],
  metadata: {
    totalConcepts: 12,
    estimatedDifficulty: "normaali",
    completeness: 0.85
  }
}
```

## Implementation Phases

### Phase 1: Enhanced Data Structure (2 points) ✅ Completed
- Update type definitions
- Modify AI prompt for rich output
- Add validation logic
- Test with sample materials

**Completed:** 2026-01-27
**Commit:** d47a60e

### Phase 2: Distribution Logic (2 points) 🔴 Not Started
- Calculate question distribution from coverage
- Pass distribution to question generator
- Log coverage stats

### Phase 3: Coverage Validation (2 points) 🔴 Not Started
- Implement coverage validation function
- Warn if topics under-represented
- Optional regeneration for missing coverage

### Phase 4: Difficulty Mapping (1 point) 🔴 Not Started
- Use topic difficulty for question type selection
- Validate difficulty consistency

## Expected Benefits

| Metric | Current | Enhanced | Improvement |
|--------|---------|----------|-------------|
| Coverage accuracy | ~65% | ~90% | +38% |
| Question waste | ~30% | ~5% | -83% |
| Retry granularity | All-or-nothing | Per-topic | Faster |
| User satisfaction | Baseline | +25% | Better distribution |

## Acceptance Criteria

### Phase 1 ✅
- [x] Enhanced `TopicAnalysisResult` interface with all metadata fields
- [x] Updated AI prompt to request rich JSON output
- [x] Validation for coverage sum = 1.0 ± 0.05
- [x] Validation for keywords (3-5 per topic)
- [x] Validation for subtopics (2-4 per topic)
- [x] Backward compatibility function `getSimpleTopics()`
- [x] TypeScript compilation passes
- [x] All consumers updated to use getSimpleTopics()
- [ ] Manual testing with sample materials (deferred to integration testing)

### Phase 2
- [ ] Distribution calculator based on coverage percentages
- [ ] Integration with question generator
- [ ] Logging for distribution stats

### Phase 3
- [ ] Coverage validation function
- [ ] Keyword-based coverage detection
- [ ] Warning system for under-represented topics

### Phase 4
- [ ] Difficulty-aware question type distribution
- [ ] Difficulty consistency validation

## Files to Modify/Create

### Phase 1
- ✏️ `src/lib/ai/topicIdentifier.ts` - Enhanced types and prompt
- ✏️ `src/lib/prompts/PromptBuilder.ts` - Use enhanced data
- 📄 `src/lib/utils/topicAnalysis.ts` - Validation utilities

### Phase 2
- 📄 `src/lib/utils/questionDistribution.ts` - Distribution calculator
- ✏️ `src/lib/ai/questionGenerator.ts` - Use distribution data

### Phase 3
- 📄 `src/lib/utils/coverageValidation.ts` - Coverage validator

### Phase 4
- ✏️ `src/lib/prompts/PromptBuilder.ts` - Difficulty-based type selection

## Related Tasks

- Task 064 Phase 2: Split Endpoints ✅ Completed (benefits from enhanced topics)
- Task 064 Phase 3: Retry Logic 🔴 Not Started (will benefit from per-topic retry)

## Migration Strategy

**Backward Compatible Approach:**
1. Add enhanced fields to existing interface (all optional initially)
2. Update AI prompt to return enhanced data
3. Provide `getSimpleTopics()` helper for legacy code
4. Gradually migrate consumers to use enhanced data
5. Make fields required after migration complete

## Rollback Plan

If issues arise:
1. Revert AI prompt to simple format
2. Legacy code continues working via `getSimpleTopics()`
3. No database changes needed

## Success Metrics

- Coverage accuracy: 65% → 90%
- Question waste: 30% → 5%
- User satisfaction: +25% (measured via feedback)
- Retry success rate: +40% (per-topic retry vs all)
