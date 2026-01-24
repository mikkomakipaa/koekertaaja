Perfect! All tasks completed. Let me create a summary of the changes made:

## Summary: Word-Test Prompt Targeting Improvements

I've successfully implemented exact vocabulary targeting for word tests. Here's what was changed:

### 1. **Schema Updates** (`src/lib/validation/schemas.ts:47`)
- Added `targetWords` field to `createQuestionSetSchema`:
  - Accepts array of strings (trimmed, non-empty)
  - Maximum 100 target words allowed
  - Optional field

### 2. **Prompt Template Enhancement** (`src/config/prompt-templates/types/language.txt:7`)
- Added `{{target_words_section}}` variable placeholder
- Positioned before "TÄRKEÄÄ - KYSYMYSTEN MUOTO" section
- Allows dynamic injection of required vocabulary instructions

### 3. **Prompt Builder Updates** (`src/lib/prompts/PromptBuilder.ts`)
- Added `targetWords` parameter to `BuildVariablesParams` interface (line 22)
- Implemented `formatTargetWordsSection()` method (lines 336-358):
  - Creates structured instructions for AI when target words are provided
  - Enforces exact word inclusion requirements
  - Warns against generic phrase drift
  - Provides clear guidelines for different question types (matching, translation, etc.)
- Updated `buildVariables()` to include `target_words_section` in variables (line 288)

### 4. **Question Generator Updates** (`src/lib/ai/questionGenerator.ts`)
- Added `targetWords` parameter to `GenerateQuestionsParams` interface (line 68)
- Implemented `validateTargetWordCoverage()` helper function (lines 52-97):
  - Checks all question fields (question, explanation, options, pairs, items, etc.)
  - Case-insensitive word matching
  - Returns found/missing words and coverage percentage
- Added word coverage validation after topic validation (lines 379-401):
  - Logs word coverage statistics
  - Warns if coverage is below 80%
  - Non-blocking (allows generation to continue)
- Updated logging to track target word usage (lines 91-94, 105)

### 5. **API Route Updates** (`src/app/api/generate-questions/route.ts`)
- Parse `targetWords` from FormData (comma-separated string → array) (lines 43-46)
- Include in schema validation (line 85)
- Pass to both quiz and flashcard generation calls (lines 243, 261)

### 6. **UI Updates** (`src/app/create/page.tsx`)
- Added `targetWords` state variable (line 97)
- Added input field for target words (lines 811-829):
  - Only shown for language subjects (`resolvedSubjectType === 'language'`)
  - Placeholder with example: "omena, päärynä, banaani, kirsikka, mansikka"
  - Helper text explaining comma-separated format
- Include `targetWords` in form submission (lines 198-200)

### Key Features:

✅ **Exact Word Enforcement**: AI must use EXACTLY the provided words, not generic alternatives  
✅ **Comprehensive Coverage**: Words can appear in questions, options, explanations, or pairs  
✅ **Non-Blocking Validation**: Low coverage warns but doesn't fail generation  
✅ **Language-Specific**: Only appears for language subjects  
✅ **Multi-Question Type Support**: Works with matching, translation, fill-blank, etc.  
✅ **Case-Insensitive Matching**: Flexible word detection  
✅ **Detailed Logging**: Full coverage reporting for debugging

### Example Usage:

**Input**: `omena, päärynä, banaani, kirsikka, mansikka`

**AI Behavior**:
- MUST include all 5 fruits in generated questions
- Cannot substitute with common phrases like "everyday fruits"
- Can use words in any question field (question text, options, pairs, etc.)
- Validation warns if coverage < 80%

### Testing Instructions:

1. Navigate to Create page (`/create`)
2. Select a language subject (e.g., "English")
3. Enter question set name
4. Scroll to "Pakolliset sanat" field
5. Enter: `omena, päärynä, banaani, kirsikka, mansikka`
6. Add some material text
7. Create question set
8. Verify generated questions include all target fruits

All changes are type-safe and backward compatible (targetWords is optional).
