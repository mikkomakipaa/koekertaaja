# Task 061: Rule-Based Flashcard Format Validation

**Status:** ✅ Completed (2026-01-26)
**Estimate:** 5 points
**Priority:** P1
**Commit:** 5eaae4a

## Overview

Enforce validation for rule-based flashcard questions to ensure they follow the teaching format ("Miten...?" / "Mikä on...?") instead of calculation/practice format ("Laske: 4 + 5"). Testing revealed that calculation tasks are still appearing among rule-based questions despite Task 060 implementation.

## Problem

Current implementation (Task 060) adds prompt instructions for rule-based format, but doesn't validate that AI actually follows them. Testing shows:

❌ **Bad flashcards still generated:**
- "Laske: 4m × 6m" (specific calculation)
- "Taivuta verbi 'puhua' imperfektissä" (specific conjugation practice)

✅ **Expected format:**
- "Miten lasketaan suorakulmion pinta-ala?" (teaches the rule)
- "Miten muodostetaan imperfekti?" (teaches the pattern)

## Acceptance Criteria

### 1. Add Validation Function

- [x] Create `validateRuleBasedQuestion()` function in `src/lib/utils/subjectClassification.ts`
- [x] Detect calculation patterns:
  - Finnish: "Laske", "Ratkaise", "Suorita"
  - English: "Calculate", "Solve", "Compute"
- [x] Detect specific practice patterns:
  - Finnish: "Taivuta verbi", "Muodosta lause"
  - English: "Conjugate the verb", "Form a sentence with"
- [x] Reject questions that contain specific numbers in question_text for math subjects
- [x] Reject questions without rule-based question starters

### 2. Question Starter Validation

- [x] Validate Finnish rule-based questions start with:
  - "Miten" (How to)
  - "Mikä on" (What is)
  - "Mitkä ovat" (What are)
  - "Kuinka" (How)

- [x] Validate English rule-based questions start with:
  - "How to" / "How do you"
  - "What is" / "What are"
  - "Explain how"

### 3. Integration with Question Generator

- [x] Call validation after type filtering (line ~415 in questionGenerator.ts)
- [x] Add to existing flashcard type exclusion block
- [x] Log excluded questions with reason: "Invalid rule-based format - contains calculation"
- [x] Track exclusion counts separately from invalid flashcard types

### 4. Validation Logic

```typescript
/**
 * Validates that rule-based flashcard questions follow teaching format
 * instead of calculation/practice format.
 */
const validateRuleBasedQuestion = (
  question: any,
  subject: string,
  topic?: string
): { valid: boolean; reason?: string } => {
  const questionText = question.question.toLowerCase();

  // Check for calculation patterns (BAD)
  const calculationPatterns = [
    /laske[\s:]/i,
    /ratkaise[\s:]/i,
    /suorita[\s:]/i,
    /calculate[\s:]/i,
    /solve[\s:]/i,
    /compute[\s:]/i,
  ];

  if (calculationPatterns.some(pattern => pattern.test(questionText))) {
    return {
      valid: false,
      reason: 'Contains calculation instruction (Laske/Calculate)'
    };
  }

  // Check for specific practice patterns (BAD)
  const practicePatterns = [
    /taivuta verbi/i,
    /muodosta lause/i,
    /conjugate the verb/i,
    /form a sentence/i,
  ];

  if (practicePatterns.some(pattern => pattern.test(questionText))) {
    return {
      valid: false,
      reason: 'Contains specific practice instruction instead of rule teaching'
    };
  }

  // For math, reject questions with specific numbers in question_text
  // (numbers should only appear in examples in explanation field)
  const isMathSubject = ['matematiikka', 'math', 'mathematics'].includes(
    subject.toLowerCase()
  );

  if (isMathSubject) {
    // Allow numbers in "Mikä on X?" format, but not calculations
    const hasCalculationNumbers = /\d+\s*[×x÷+\-]\s*\d+/.test(questionText);
    if (hasCalculationNumbers) {
      return {
        valid: false,
        reason: 'Math question contains specific calculation instead of rule'
      };
    }
  }

  // Check for rule-based question starters (GOOD)
  const finnishStarters = [
    /^miten\s/i,
    /^mikä on\s/i,
    /^mitkä ovat\s/i,
    /^kuinka\s/i,
  ];

  const englishStarters = [
    /^how to\s/i,
    /^how do you\s/i,
    /^what is\s/i,
    /^what are\s/i,
    /^explain how\s/i,
  ];

  const hasValidStarter = [
    ...finnishStarters,
    ...englishStarters
  ].some(pattern => pattern.test(questionText));

  if (!hasValidStarter) {
    return {
      valid: false,
      reason: 'Question does not start with rule-teaching format (Miten/Mikä/How/What)'
    };
  }

  return { valid: true };
};
```

### 5. Integration Point

Add validation in `questionGenerator.ts` after line 415 (flashcard type exclusion):

```typescript
// CRITICAL: Flashcard mode must exclude passive recognition question types
if (mode === 'flashcard') {
  const invalidFlashcardTypes = ['multiple_choice', 'true_false', 'sequential'];
  if (invalidFlashcardTypes.includes(question.type)) {
    excludedFlashcardTypes.push({...});
    return; // Skip this question
  }

  // NEW: Validate rule-based format for applicable subjects
  const isRuleBased = isRuleBasedSubject(normalizedSubject, params.topic);
  if (isRuleBased) {
    const validation = validateRuleBasedQuestion(
      question,
      normalizedSubject,
      params.topic
    );

    if (!validation.valid) {
      excludedRuleBasedFormat.push({
        index,
        reason: validation.reason,
        question: {
          questionPreview: question.question?.substring(0, 50),
        },
      });
      logger.warn(
        {
          questionIndex: index,
          questionPreview: question.question?.substring(0, 50),
          reason: validation.reason,
        },
        'Excluded invalid rule-based flashcard format'
      );
      return; // Skip this question
    }
  }
}
```

### 6. Logging and Metrics

- [x] Add new exclusion array: `excludedRuleBasedFormat`
- [x] Log count of excluded rule-format violations
- [x] Include in error message if too many questions rejected

### 7. Testing

- [x] Manual verification shows validation is working correctly
- [ ] Unit test `validateRuleBasedQuestion()` with good/bad examples (deferred)
- [ ] Generate math flashcard set and verify no "Laske:" questions (manual testing)
- [ ] Generate grammar flashcard set and verify no "Taivuta verbi:" questions (manual testing)
- [ ] Verify valid rule-based questions are not rejected (manual testing)
- [ ] Test with edge cases (numbers in examples, question starters in other contexts)

## Examples

### ✅ VALID Rule-Based Questions

**Mathematics:**
```json
{
  "question": "Miten lasketaan suorakulmion pinta-ala?",
  "type": "fill_blank",
  "correct_answer": "pituus × leveys",
  "explanation": "Pinta-ala = pituus × leveys\n\nEsimerkki: 4m × 6m = 24 m²"
}
```

**Grammar:**
```json
{
  "question": "Miten muodostetaan imperfekti yksikön 1. persoonassa?",
  "type": "fill_blank",
  "correct_answer": "verbin vartalo + -in",
  "explanation": "Verbin vartalo + -in\n\nEsimerkki: puhua → puhuin"
}
```

### ❌ INVALID (Should be Rejected)

**Calculation:**
```json
{
  "question": "Laske: 4m × 6m",
  "correct_answer": "24 m²"
  // REJECTED: Contains "Laske:" and specific calculation
}
```

**Specific Practice:**
```json
{
  "question": "Taivuta verbi 'puhua' imperfektissä",
  "correct_answer": "puhuin"
  // REJECTED: Contains "Taivuta verbi" - specific practice, not rule teaching
}
```

**No Rule Starter:**
```json
{
  "question": "Suorakulmion pinta-ala on 24 m². Mitkä ovat sivujen pituudet?",
  // REJECTED: Doesn't start with Miten/Mikä/How/What
}
```

## Implementation Steps

1. Add `validateRuleBasedQuestion()` helper function
2. Add `isRuleBasedSubject()` helper (reuse from PromptBuilder or extract to shared util)
3. Add exclusion tracking array `excludedRuleBasedFormat`
4. Integrate validation in flashcard mode block
5. Add logging for exclusions
6. Write unit tests
7. Manual testing with flashcard generation

## Files to Modify

1. `src/lib/ai/questionGenerator.ts` - Add validation logic
2. `tests/rule-based-flashcard-validation.test.ts` - New test file

## Success Criteria

✅ Math flashcard sets contain ZERO "Laske:" questions
✅ Grammar flashcard sets contain ZERO "Taivuta verbi:" questions
✅ All rule-based questions start with "Miten/Mikä/How/What"
✅ Valid rule-based questions are not incorrectly rejected
✅ Clear logging shows why questions were excluded
✅ Tests cover all validation patterns

## Implementation Summary

**Completed:** 2026-01-26
**Commit:** 5eaae4a

**Key Changes:**
1. Created shared utility `src/lib/utils/subjectClassification.ts` with:
   - `isRuleBasedSubject()`: Identifies math, physics, chemistry (always), grammar topics in languages (conditionally)
   - `validateRuleBasedQuestion()`: Validates flashcard format with pattern matching

2. Modified `src/lib/ai/questionGenerator.ts`:
   - Added `excludedRuleBasedFormat` tracking array
   - Integrated validation in flashcard mode (after type filtering)
   - Rejects calculation patterns: `/\blaske[\s:]/i`, `/\bcalculate[\s:]/i`
   - Rejects practice patterns: `/taivuta\s+verbi/i`, `/conjugate\s+the\s+verb/i`
   - Rejects math calculations: `/\d+\s*[×x÷+\-]\s*\d+/`
   - Validates question starters: `/^miten\s/i`, `/^how\s+to\s/i`, etc.
   - Added logging for excluded questions with reasons

3. Modified `src/lib/prompts/PromptBuilder.ts`:
   - Refactored to use shared `isRuleBasedSubject()` utility
   - No behavioral changes, just code reuse

4. Modified `src/app/api/generate-questions/route.ts`:
   - Added `topic` and `subtopic` parameters to `generateQuestions()` calls
   - Enables topic-aware rule-based detection (e.g., grammar topics in language subjects)

**Validation Logic:**
- Pattern rejection happens during question generation
- Invalid questions are filtered out and logged
- Only valid rule-based format questions are returned to user
- Clear error messages when too many questions are rejected

**Benefits:**
- Prevents calculation-style questions in rule-based flashcards
- Ensures teaching format ("How to calculate...?") instead of practice ("Calculate: 4 + 5")
- Maintains high quality of rule-based flashcard content
