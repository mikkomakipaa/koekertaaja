# Task 064.1: Server-Side Partial Success Handling

**Status:** 🔴 Not Started
**Estimate:** 3 points
**Priority:** P0
**Parent Task:** Task 064 - Reliable Question Generation Architecture (Phase 1)

## Overview

Replace `Promise.all()` with `Promise.allSettled()` in `/api/generate-questions` to handle partial success. Save successful question sets even if some generations fail, and return detailed success/failure information to the client.

## Current Problem

When generating mode='both' (2 quiz sets + 1 flashcard):
- If flashcard generation fails → entire request fails
- Successfully generated quiz sets are lost
- User sees generic error, no indication that quiz succeeded
- Must retry entire batch (including successful parts)

## Acceptance Criteria

### 1. Replace Promise.all with Promise.allSettled

**File:** `src/app/api/generate-questions/route.ts` (line ~270)

**Before:**
```typescript
// Execute all generation tasks in parallel
const generationResults = await Promise.all(generationTasks);
```

**After:**
```typescript
// Execute all generation tasks in parallel with partial success handling
const settledResults = await Promise.allSettled(generationTasks);
```

### 2. Process Settled Results

Add result processing logic after line 270:

```typescript
// Process settled results - separate successes from failures
const successfulResults: Array<{
  questions: any[];
  difficulty?: Difficulty;
  mode: 'quiz' | 'flashcard';
}> = [];

const failedResults: Array<{
  mode: 'quiz' | 'flashcard';
  difficulty?: Difficulty;
  error: string;
  errorType?: 'generation' | 'validation' | 'timeout';
}> = [];

settledResults.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    successfulResults.push(result.value);

    logger.info(
      {
        mode: result.value.mode,
        difficulty: result.value.difficulty,
        questionCount: result.value.questions.length,
      },
      'Question generation succeeded'
    );
  } else {
    // Extract mode and difficulty from original task
    // (Note: Need to track this metadata when building generationTasks)
    const error = result.reason instanceof Error ? result.reason : new Error(String(result.reason));
    const errorMessage = error.message;

    // Determine error type for better client handling
    let errorType: 'generation' | 'validation' | 'timeout' = 'generation';
    if (errorMessage.toLowerCase().includes('timeout')) {
      errorType = 'timeout';
    } else if (errorMessage.toLowerCase().includes('validation')) {
      errorType = 'validation';
    }

    // Extract mode/difficulty from task metadata (see step 3)
    const taskMetadata = generationTasksMetadata[index];

    failedResults.push({
      mode: taskMetadata.mode,
      difficulty: taskMetadata.difficulty,
      error: errorMessage,
      errorType,
    });

    logger.error(
      {
        mode: taskMetadata.mode,
        difficulty: taskMetadata.difficulty,
        error: errorMessage,
        errorType,
      },
      'Question generation failed'
    );
  }
});

logger.info(
  {
    successCount: successfulResults.length,
    failureCount: failedResults.length,
    totalRequested: settledResults.length,
  },
  'Question generation batch completed'
);
```

### 3. Track Task Metadata

When building `generationTasks` array, also build parallel metadata array:

**Before line 230:**
```typescript
// Prepare parallel generation tasks
const generationTasks: Promise<{
  questions: any[];
  difficulty?: Difficulty;
  mode: 'quiz' | 'flashcard';
}>[] = [];

// NEW: Track metadata for error reporting
const generationTasksMetadata: Array<{
  mode: 'quiz' | 'flashcard';
  difficulty?: Difficulty;
}> = [];
```

**When adding tasks:**
```typescript
// Add quiz generation tasks
if (generationMode === 'quiz' || generationMode === 'both') {
  for (const difficulty of difficulties) {
    generationTasks.push(
      generateQuestions({...})
        .then((questions) => ({ questions, difficulty, mode: 'quiz' as const }))
    );

    // Track metadata
    generationTasksMetadata.push({ mode: 'quiz', difficulty });
  }
}

// Add flashcard generation task
if (generationMode === 'flashcard' || generationMode === 'both') {
  generationTasks.push(
    generateQuestions({...})
      .then((questions) => ({ questions, mode: 'flashcard' as const }))
  );

  // Track metadata
  generationTasksMetadata.push({ mode: 'flashcard' });
}
```

### 4. Save Only Successful Results

Update database save loop to process only successful results:

**Replace line ~284-345:**
```typescript
// STEP 3: Create question sets in database (only for successful generations)
logger.info(
  {
    successfulSets: successfulResults.length,
    failedSets: failedResults.length,
  },
  'Step 3: Saving successful question sets to database'
);

const createdSets: any[] = [];
const dbFailures: Array<{
  mode: 'quiz' | 'flashcard';
  difficulty?: Difficulty;
  error: string;
}> = [];

for (const result of successfulResults) {
  const { questions, difficulty, mode } = result;

  if (questions.length === 0) {
    logger.warn({ mode, difficulty }, 'Skipping empty question set');
    dbFailures.push({
      mode,
      difficulty,
      error: 'No questions generated',
    });
    continue;
  }

  try {
    // Generate unique code with collision handling
    let code = generateCode();
    let attempts = 0;
    const maxAttempts = 50;
    let dbResult = null;

    // Determine set name based on mode and difficulty
    const setName = mode === 'flashcard'
      ? `${questionSetName} - Kortit`
      : `${questionSetName} - ${difficulty!.charAt(0).toUpperCase() + difficulty!.slice(1)}`;

    while (attempts < maxAttempts && !dbResult) {
      dbResult = await createQuestionSet(
        {
          code,
          name: setName,
          subject: subject as Subject,
          difficulty: difficulty || 'normaali',
          mode,
          grade,
          topic,
          subtopic,
          subject_type: subjectType,
          question_count: questions.length,
          exam_length: examLength,
          status: 'created',
        },
        questions
      );

      if (!dbResult) {
        attempts++;
        code = generateCode();

        if (attempts % 10 === 0) {
          logger.warn({ attempts, mode, difficulty }, 'Code collision detected');
        }
      }
    }

    if (!dbResult) {
      logger.error({ maxAttempts, mode, difficulty }, 'Failed to generate unique code');
      dbFailures.push({
        mode,
        difficulty,
        error: 'Failed to generate unique code after 50 attempts',
      });
      continue;
    }

    createdSets.push(dbResult);

    logger.info(
      {
        code: dbResult.code,
        mode,
        difficulty,
        questionCount: dbResult.questionSet.question_count,
      },
      'Question set saved successfully'
    );
  } catch (dbError) {
    const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);

    logger.error(
      {
        mode,
        difficulty,
        error: errorMessage,
      },
      'Failed to save question set to database'
    );

    dbFailures.push({
      mode,
      difficulty,
      error: `Database error: ${errorMessage}`,
    });
  }
}

// Merge generation failures and database failures
const allFailures = [
  ...failedResults,
  ...dbFailures.map(f => ({ ...f, errorType: 'database' as const })),
];
```

### 5. Return Partial Success Response

Replace response building logic (line ~347-368):

```typescript
// Determine overall success status
const hasSuccess = createdSets.length > 0;
const hasFailures = allFailures.length > 0;
const isPartialSuccess = hasSuccess && hasFailures;

// Build response
const response = {
  success: hasSuccess, // true if ANY sets were created
  partial: isPartialSuccess, // true if some succeeded and some failed
  message: hasSuccess
    ? isPartialSuccess
      ? `Created ${createdSets.length} of ${settledResults.length} question sets (${allFailures.length} failed)`
      : `Successfully created ${createdSets.length} question sets`
    : `Failed to create question sets (${allFailures.length} errors)`,
  questionSets: createdSets.map(set => ({
    code: set.code,
    name: set.questionSet.name,
    difficulty: set.questionSet.difficulty,
    mode: set.questionSet.mode,
    questionCount: set.questionSet.question_count,
  })),
  failures: hasFailures ? allFailures : undefined,
  totalQuestions: createdSets.reduce((sum, set) => sum + set.questionSet.question_count, 0),
  stats: {
    requested: settledResults.length,
    succeeded: createdSets.length,
    failed: allFailures.length,
  },
};

// Use 200 for partial success (user got something useful)
// Use 500 only for total failure (nothing created)
const httpStatus = hasSuccess ? 200 : 500;

logger.info(
  {
    questionSetsCreated: createdSets.length,
    failuresCount: allFailures.length,
    totalQuestions: response.totalQuestions,
    isPartialSuccess,
    httpStatus,
  },
  'Request completed'
);

return NextResponse.json(response, { status: httpStatus });
```

### 6. Update Response Type

Add TypeScript type for response:

```typescript
interface QuestionGenerationResponse {
  success: boolean;
  partial?: boolean; // true if some succeeded, some failed
  message: string;
  questionSets: Array<{
    code: string;
    name: string;
    difficulty: Difficulty;
    mode: 'quiz' | 'flashcard';
    questionCount: number;
  }>;
  failures?: Array<{
    mode: 'quiz' | 'flashcard';
    difficulty?: Difficulty;
    error: string;
    errorType?: 'generation' | 'validation' | 'timeout' | 'database';
  }>;
  totalQuestions: number;
  stats: {
    requested: number;
    succeeded: number;
    failed: number;
  };
}
```

## Testing Scenarios

### Manual Testing

1. **All Success** (Baseline):
   - Generate mode='both' with simple material
   - Verify 3 sets created
   - Verify response: `success: true, partial: false`

2. **Partial Success** (AI Generation Failure):
   - Mock flashcard generation to throw error
   - Generate mode='both'
   - Verify 2 quiz sets created
   - Verify flashcard not created
   - Verify response: `success: true, partial: true, failures: [...]`
   - Verify HTTP 200 status

3. **Partial Success** (Database Failure):
   - Mock database error for one set
   - Verify other sets saved
   - Verify response includes database failure

4. **Total Failure**:
   - Mock all generations to fail
   - Verify no sets created
   - Verify response: `success: false, partial: false`
   - Verify HTTP 500 status

5. **Empty Questions**:
   - Mock generation returns empty array
   - Verify set not saved
   - Verify logged as warning

## Files to Modify

- ✏️ `src/app/api/generate-questions/route.ts` - Core changes

## Logging Updates

Ensure logging includes:
- ✅ Success count and failure count
- ✅ Error type classification (generation, validation, timeout, database)
- ✅ Mode and difficulty for each failure
- ✅ Partial success flag in final log

## Success Criteria

- [ ] Promise.allSettled replaces Promise.all
- [ ] Successful sets saved even if others fail
- [ ] Response includes `partial` flag
- [ ] Response includes `failures` array with details
- [ ] Response includes `stats` object
- [ ] HTTP 200 for partial success, 500 for total failure
- [ ] Logging includes success/failure breakdown
- [ ] Error type classification works (generation, validation, timeout, database)
- [ ] Empty question sets handled gracefully
- [ ] Manual testing scenarios pass

## Related Tasks

- **Task 064.2**: Client-Side Partial Success UI (depends on this)
- **Task 064.3**: Tests for Partial Success (depends on this)
- **Task 064**: Parent task (Reliable Question Generation Architecture)

## Notes

- ✅ **Backward Compatible**: Response still has `success` and `questionSets` fields
- ✅ **Additive Changes**: New fields (`partial`, `failures`, `stats`) are optional
- ✅ **Safe Rollback**: Can revert to Promise.all without data loss
- ⚠️ **Database Transactions**: Not using transactions (each set saved independently) - this is intentional for partial success
