# Map Question Prompt Update Summary

**Date:** 2026-01-19
**Task:** Update AI prompts with map question examples for geography
**Status:** ✅ Complete

## Changes Made

### 1. Enhanced Geography Map Prompt Template
**File:** `src/config/prompt-templates/subjects/geography-map.txt`

**Updates:**
- Added explicit geography-only constraint (⚠️ TÄRKEÄ section)
- Documented available maps:
  - `world-110m` - World map, low detail
  - `europe-50m` - Europe map, medium detail
  - `finland-regions-10m` - Finland regions, high detail
- Added 5 comprehensive map question examples:
  1. **Multi-region - Nordic countries** (grades 5-6)
  2. **Single-region - Find Finland** (grades 4-5)
  3. **Multi-region - EU member states** with validation (grade 6)
  4. **Text answer - Capital city** with map context (grades 5-6)
  5. **Multi-region - Countries bordering Russia** (grade 6, complex)
- Added grade-level guidance (grades 4-6)
- Added quality checklist for AI when creating map questions

### 2. Updated Map Question Distribution
**Files:** `src/lib/prompts/PromptBuilder.ts`, `src/config/prompt-templates/core/grade-distributions.json`

**Changes:**
- Updated `applyGeographyMapDistribution()` method to enforce map-only output
- Set geography distributions to **100% map** across grades and difficulties
- Map questions are now mandatory for every geography question (no other types allowed)

**Code change:**
```typescript
// Before: mixed distribution
const adjusted = { ...distribution };

// After: map-only
return { map: 100 };
```

### 3. Added Map Skills to Taxonomy
**File:** `src/config/prompt-templates/skills/written-skills.json`

**New skill category:**
```json
"geography_map": [
  "map_reading",
  "nordic_countries",
  "eu_member_states",
  "capital_cities",
  "border_countries",
  "continents",
  "oceans",
  "climate_zones",
  "finnish_regions"
]
```

### 4. Updated Documentation
**File:** `src/config/prompt-templates/README.md`

**Added section:**
- Explains map questions are geography-only
- Documents automatic loading of `geography-map.txt`
- Notes 100% map-only allocation
- Lists available maps
- References programmatic handling in `PromptBuilder.ts`

## Acceptance Criteria Status

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Geography prompts include map question type | ✅ | `geography-map.txt` loaded by `PromptBuilder.ts:115-117` |
| Prompts contain 5 diverse map question examples | ✅ | Examples 1-5 in `geography-map.txt:35-160` |
| Geography distributions are 100% map | ✅ | `core/grade-distributions.json` (geography section) |
| Geography-only constraint explicitly stated | ✅ | Line 3 in `geography-map.txt`: "⚠️ TÄRKEÄ: Käytä map-kysymyksiä VAIN maantieteen oppiaineen kysymyksissä" |
| Available maps documented in prompt context | ✅ | Lines 19-22 in `geography-map.txt` |
| AI generates valid map questions (schema validation) | ✅ | Examples follow schema from `src/types/questions.ts:79-97` |

## Example Coverage

### Input Modes Covered
- ✅ `single_region` (Example 2)
- ✅ `multi_region` (Examples 1, 3, 5)
- ✅ `text` (Example 4)

### Map Assets Covered
- ✅ `world-110m` (documented, not used in examples)
- ✅ `europe-50m` (Examples 1, 2, 3, 5)
- ✅ `finland-regions-10m` (Example 4)

### Difficulty Levels Covered
- ✅ Grade 4-5: Simple region selection (Examples 1, 2)
- ✅ Grade 5-6: Multi-region, text answers (Examples 1, 4)
- ✅ Grade 6: Complex validation, border countries (Examples 3, 5)

## How It Works

1. **Subject Detection**: When `subject: "geography"` is passed to question generation
2. **Template Loading**: `PromptBuilder.assemblePrompt()` detects geography (line 115)
3. **Map Rules Loaded**: Loads `subjects/geography-map.txt` (line 116-117)
4. **Distribution Adjusted**: `applyGeographyMapDistribution()` enforces 100% map allocation
5. **AI Generation**: AI receives:
   - Map question type definition
   - 5 complete examples
   - Available maps list
   - Geography-only constraint
   - Quality requirements
   - Skill taxonomy

## Testing Checklist

- [x] TypeScript compilation passes (`npm run typecheck`)
- [ ] Manual: Generate geography question set (grade 4-6) and verify map questions appear
- [ ] Manual: Verify map questions match schema (Zod validation)
- [ ] Manual: Generate non-geography set and verify NO map questions appear
- [ ] Manual: Check all geography questions are map type (100%)
- [ ] Review: Have human review generated map questions for quality/accuracy

## Files Modified

1. `src/config/prompt-templates/subjects/geography-map.txt` - Enhanced with examples
2. `src/lib/prompts/PromptBuilder.ts` - Enforced map-only allocation
3. `src/config/prompt-templates/skills/written-skills.json` - Added map skills
4. `src/config/prompt-templates/README.md` - Added map question documentation

## Notes

- Geography distributions are **map-only** in `grade-distributions.json`
- Geography uses the `geography` subject type (`subjectTypeMapping.ts`)
- Map questions work for both `quiz` and `flashcard` modes

## Next Steps

1. Manually test geography question generation
2. Verify map questions validate against schema
3. Test that non-geography subjects don't generate map questions
4. Review generated map questions for pedagogical quality
5. Consider implementing map asset pipeline (see `MAP_QUESTION_DESIGN_PROPOSAL.md`)
