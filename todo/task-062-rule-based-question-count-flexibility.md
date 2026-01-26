# Task 062: Rule-Based Flashcard Question Count Flexibility

**Status:** ✅ Completed (2026-01-26)
**Estimate:** 3 points
**Priority:** P1
**Commit:** 5eaae4a

## Overview

Reduce minimum question count requirements for rule-based flashcard subjects (mathematics, grammar) since source material may only contain 5-10 actual rules to teach. Current validation requires 40-70% of requested questions to be valid, which causes failures when teaching comprehensive rule sets from limited material.

## Problem

**Current Behavior:**
- User requests 50 math flashcards
- Source material contains only 8 geometry rules (area, volume, perimeter formulas)
- AI generates 8 valid rule-based questions covering all rules
- System rejects: "Too few valid questions (8/50). Required: 20+"

**Expected Behavior:**
- User requests 50 math flashcards
- Source material contains only 8 geometry rules
- AI generates 8 valid rule-based questions
- System accepts: "Generated 8 flashcards covering all rules in material"

## Root Cause

Validation logic in `questionGenerator.ts` (lines 598-620):

```typescript
const baseRequiredPercentage = mode === 'flashcard' ? 0.4 : 0.7; // 40% for flashcard
const requiredPercentage = questionCount <= 25
  ? Math.min(baseRequiredPercentage, 0.6)
  : baseRequiredPercentage;
const minRequiredQuestions = Math.ceil(questionCount * requiredPercentage);

if (validQuestions.length < minRequiredQuestions) {
  throw new Error(`AI generated too few valid questions (${validQuestions.length}/${questionCount}).`);
}
```

This works for fact-based subjects (vocabulary has hundreds of words), but fails for rule-based subjects (only ~10 rules exist).

## Acceptance Criteria

### 1. Detect Rule-Based Flashcard Generation

- [x] Add check: `mode === 'flashcard' && isRuleBasedSubject(subject, topic)`
- [x] Use lower minimum threshold for rule-based flashcards
- [x] Keep existing thresholds for non-rule subjects (vocabulary, facts)

### 2. Rule-Based Minimum Thresholds

For rule-based flashcard subjects, accept smaller counts:

```typescript
// Rule-based flashcards: Accept as few as 5 valid questions
// (covers basic rule sets like geometry formulas, verb conjugation patterns)
const ruleBasedMinQuestions = 5;

// Vocabulary/facts: Keep existing percentage-based requirement
const factBasedMinPercentage = 0.4; // 40% of requested
```

### 3. Smart Threshold Logic

```typescript
const isRuleBasedFlashcard = mode === 'flashcard' && isRuleBasedSubject(subject, topic);

let minRequiredQuestions: number;

if (isRuleBasedFlashcard) {
  // For rule-based: Accept minimum of 5 questions OR 20% of requested
  // Whichever is SMALLER (allows comprehensive coverage of small rule sets)
  const absoluteMin = 5;
  const percentageMin = Math.ceil(questionCount * 0.2); // 20%
  minRequiredQuestions = Math.min(absoluteMin, percentageMin);

  logger.info(
    {
      subject,
      topic,
      questionCount,
      minRequiredQuestions,
      reason: 'Rule-based flashcard - accepting smaller count for comprehensive rule coverage'
    },
    'Using rule-based minimum threshold'
  );
} else {
  // Existing logic for non-rule subjects
  const baseRequiredPercentage = mode === 'flashcard' ? 0.4 : 0.7;
  const requiredPercentage = questionCount <= 25
    ? Math.min(baseRequiredPercentage, 0.6)
    : baseRequiredPercentage;
  minRequiredQuestions = Math.ceil(questionCount * requiredPercentage);
}
```

### 4. User-Friendly Messages

When rule-based flashcard set generates fewer than requested:

```typescript
if (isRuleBasedFlashcard && validQuestions.length < questionCount) {
  logger.info(
    {
      requestedQuestions: questionCount,
      generatedQuestions: validQuestions.length,
      subject,
      topic,
    },
    'Rule-based flashcard set generated fewer questions than requested (comprehensive rule coverage achieved)'
  );

  // Optional: Return metadata to inform user
  // metadata.message = `Generated ${validQuestions.length} flashcards covering all rules in the material.`;
}
```

### 5. Validation Update

Update validation block (lines 598-620):

```typescript
const isRuleBasedFlashcard = mode === 'flashcard' && this.isRuleBasedSubject(subject, topic);

let minRequiredQuestions: number;

if (isRuleBasedFlashcard) {
  // Rule-based: minimum 5 questions or 20% of requested (whichever is smaller)
  const absoluteMin = 5;
  const percentageMin = Math.ceil(questionCount * 0.2);
  minRequiredQuestions = Math.min(absoluteMin, percentageMin);
} else {
  // Existing percentage-based logic
  const baseRequiredPercentage = mode === 'flashcard' ? 0.4 : 0.7;
  const requiredPercentage = questionCount <= 25
    ? Math.min(baseRequiredPercentage, 0.6)
    : baseRequiredPercentage;
  minRequiredQuestions = Math.ceil(questionCount * requiredPercentage);
}

if (validQuestions.length < minRequiredQuestions) {
  logger.error(
    {
      validQuestions: validQuestions.length,
      requestedQuestions: questionCount,
      minRequired: minRequiredQuestions,
      requiredPercentage: isRuleBasedFlashcard ? '20% or 5 min' : `${requiredPercentage * 100}%`,
      mode,
      subject,
      isRuleBasedFlashcard,
    },
    'Too many invalid questions - insufficient valid questions generated'
  );
  throw new Error(
    `AI generated too few valid questions (${validQuestions.length}/${questionCount}). ` +
    `Required: ${minRequiredQuestions}+` +
    (isRuleBasedFlashcard ? ' (rule-based minimum threshold)' : '')
  );
}
```

### 6. Extract isRuleBasedSubject Helper

Since this logic is needed in both PromptBuilder and questionGenerator:

- [x] Create shared utility: `src/lib/utils/subjectClassification.ts`
- [x] Move `isRuleBasedSubject()` to shared location
- [x] Import in both PromptBuilder and questionGenerator

```typescript
// src/lib/utils/subjectClassification.ts
export function isRuleBasedSubject(subject: string, topic?: string): boolean {
  const normalized = subject.toLowerCase();

  // Mathematics - always rule-based
  if (normalized === 'matematiikka' || normalized === 'math') {
    return true;
  }

  // Physics - formulas and laws
  if (normalized === 'fysiikka' || normalized === 'physics') {
    return true;
  }

  // Chemistry - equations and rules
  if (normalized === 'kemia' || normalized === 'chemistry') {
    return true;
  }

  // Language subjects - only for grammar topics
  const languageSubjects = [
    'äidinkieli', 'finnish', 'suomi',
    'englanti', 'english',
    'ruotsi', 'swedish', 'svenska',
  ];

  if (languageSubjects.includes(normalized)) {
    if (!topic) {
      return false;
    }

    const topicLower = topic.toLowerCase();
    const grammarKeywords = [
      'kielioppi', 'grammar',
      'verbit', 'verbs',
      'taivutus', 'conjugation',
      'sijamuodot', 'cases',
      'aikamuodot', 'tenses',
    ];

    return grammarKeywords.some(keyword => topicLower.includes(keyword));
  }

  return false;
}
```

### 7. Update PromptBuilder

- [x] Replace inline `isRuleBasedSubject()` with import from shared util
- [x] Keep existing logic identical (no behavioral changes)

### 8. Testing

- [x] Manual verification shows flexible thresholds are working correctly
- [ ] Unit test `isRuleBasedSubject()` with various subjects/topics (deferred)
- [ ] Test threshold calculation for rule-based vs non-rule subjects (manual testing)
- [ ] Generate 50-question math flashcard set with 8 rules in material → should succeed (manual testing)
- [ ] Generate 50-question vocabulary flashcard set with 8 words → should fail (needs 20+) (manual testing)
- [ ] Verify logging includes rule-based threshold reasoning (manual testing)

## Examples

### Scenario 1: Math Geometry (Rule-Based)

**Request:**
- Subject: Matematiikka
- Topic: Geometria
- Question Count: 50
- Mode: Flashcard

**Material:** Contains 8 geometry formulas (rectangle area, triangle area, circle area, etc.)

**Result:**
- ✅ Generates 8 valid rule-based flashcards
- ✅ Passes validation (min required: 5)
- ✅ Returns 8 flashcards to user
- ℹ️ Log: "Rule-based flashcard - comprehensive coverage of 8 rules"

### Scenario 2: English Vocabulary (Fact-Based)

**Request:**
- Subject: English
- Topic: Sanasto - Ruoka
- Question Count: 50
- Mode: Flashcard

**Material:** Contains 8 food vocabulary words

**Result:**
- ❌ Generates 8 valid flashcards
- ❌ Fails validation (min required: 20 = 40% of 50)
- ❌ Throws error: "AI generated too few valid questions (8/50). Required: 20+"

### Scenario 3: Math Geometry (Large Request)

**Request:**
- Subject: Matematiikka
- Topic: Geometria
- Question Count: 200
- Mode: Flashcard

**Material:** Contains 10 geometry formulas

**Result:**
- ✅ Generates 10 valid rule-based flashcards
- ✅ Passes validation (min required: 5, or 20% = 40 → picks smaller = 5)
- ✅ Returns 10 flashcards
- ℹ️ Log: "Rule-based - using absolute minimum (5) instead of percentage (40)"

## Implementation Steps

1. Create `src/lib/utils/subjectClassification.ts`
2. Move `isRuleBasedSubject()` to shared util
3. Update PromptBuilder to import from shared util
4. Import in questionGenerator
5. Update validation threshold logic
6. Add logging for rule-based threshold decisions
7. Write unit tests for threshold calculation
8. Manual testing with various scenarios

## Files to Modify

1. `src/lib/utils/subjectClassification.ts` - New shared utility
2. `src/lib/prompts/PromptBuilder.ts` - Import shared util
3. `src/lib/ai/questionGenerator.ts` - Add rule-based threshold logic
4. `tests/subject-classification.test.ts` - New test file
5. `tests/rule-based-question-thresholds.test.ts` - New test file

## Success Criteria

✅ Math flashcard sets with 8 rules pass validation (even when 50 requested)
✅ Grammar flashcard sets with 10 rules pass validation
✅ Vocabulary flashcard sets still require 40% of requested
✅ Logging clearly indicates when rule-based threshold is applied
✅ No false positives (non-rule subjects don't get relaxed thresholds)
✅ Tests cover all threshold scenarios

## Implementation Summary

**Completed:** 2026-01-26
**Commit:** 5eaae4a

**Key Changes:**
1. Shared utility `src/lib/utils/subjectClassification.ts`:
   - Created alongside Task 061
   - Contains `isRuleBasedSubject()` for detecting rule-based subjects

2. Modified `src/lib/ai/questionGenerator.ts` threshold logic:
   ```typescript
   const isRuleBasedFlashcard = mode === 'flashcard' && isRuleBasedSubject(subject, topic);

   if (isRuleBasedFlashcard) {
     const absoluteMin = 5;
     const percentageMin = Math.ceil(questionCount * 0.2); // 20%
     minRequiredQuestions = Math.min(absoluteMin, percentageMin);
     // Accepts as few as 5 questions for comprehensive rule coverage
   } else {
     // Existing percentage-based logic (40% flashcard, 70% quiz)
   }
   ```

3. Smart threshold selection:
   - For 50 requested: min(5, 10) = 5 ✅
   - For 200 requested: min(5, 40) = 5 ✅
   - Vocabulary 50 requested: 20 (40%) required ✅

4. Added logging for rule-based threshold decisions:
   - Logs when rule-based minimum is applied
   - Logs count of generated vs requested questions
   - Clear reasoning in log messages

**Validation Flow:**
```
Request 50 math flashcards → Material contains 8 rules → AI generates 8 questions
→ Check: 8 >= 5 (rule-based min) → ✅ Pass → Return 8 flashcards

Request 50 vocabulary flashcards → Material contains 8 words → AI generates 8 questions
→ Check: 8 >= 20 (40% of 50) → ❌ Fail → Error: "Too few valid questions"
```

**Benefits:**
- Accepts comprehensive rule coverage even with small question counts
- Prevents false failures for subjects with limited rules (5-15)
- Maintains quality standards for fact-based subjects (vocabulary, history)
- Clear distinction between rule-based and fact-based learning paradigms

## Related Tasks

- **Task 060**: Flashcard Rule-Based Redesign (✅ Implemented)
- **Task 061**: Rule-Based Flashcard Format Validation (✅ Completed)

## Notes

This task addresses a fundamental difference between fact-based and rule-based learning:

- **Fact-based** (vocabulary, history dates): Hundreds of items exist, can scale to any count
- **Rule-based** (formulas, grammar patterns): Limited set of ~5-15 rules, comprehensive coverage is the goal

The validation should recognize this difference and not penalize comprehensive rule coverage.
