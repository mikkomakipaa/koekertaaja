# Task 064: Reliable Question Generation Architecture

**Status:** 🔴 Not Started
**Estimate:** 8 points
**Priority:** P0

## Overview

Redesign question generation to improve reliability and avoid timeouts. Current implementation generates 3 sets in parallel (quiz:helppo, quiz:normaali, flashcard) in a single batch request, which can timeout and provides no partial success handling.

## Current Architecture Issues

**Current Flow:**
```
Client → POST /api/generate-questions (mode='both')
  ├─ Step 1: Identify topics (1 AI call)
  └─ Step 2: Generate questions (Promise.all)
      ├─ Quiz - Helppo (AI call ~30-60s)
      ├─ Quiz - Normaali (AI call ~30-60s)
      └─ Flashcard (AI call ~30-60s)
  └─ Step 3: Save all to DB
  └─ Return all results
```

**Problems:**
1. ❌ **All-or-nothing**: If flashcard fails, quiz results are lost
2. ❌ **Timeout risk**: 3 parallel AI calls + topic analysis = 2-4 minutes (approaching 5min limit)
3. ❌ **No progress visibility**: User sees spinner for 3+ minutes with no feedback
4. ❌ **No retry granularity**: Can't retry just the failed piece
5. ❌ **No partial success**: User gets error even if 2 out of 3 succeeded

## Proposed Architecture

### **Option A: Server-Side Fan-Out with Partial Success** (Recommended - Phase 1)

Enhanced current endpoint to handle partial success and save incrementally.

**Benefits:**
- ✅ Single client call (backward compatible)
- ✅ Partial success handling
- ✅ Progressive database saves
- ✅ Minimal client changes
- ✅ No new infrastructure required

**Limitations:**
- ⚠️ Still has 5-minute timeout (but less likely to hit it)
- ⚠️ No real-time progress updates

### **Option B: Separate Endpoints** (Recommended - Phase 2)

Split into focused endpoints for better control.

**New Endpoints:**
```
POST /api/generate-questions/quiz
POST /api/generate-questions/flashcard
POST /api/generate-questions/batch (orchestration)
```

**Benefits:**
- ✅ Client can retry individual failures
- ✅ Better error isolation
- ✅ Clearer API surface
- ✅ Can run in sequence or parallel from client

### **Option C: Job Queue Architecture** (Future Enhancement)

For handling very large generations (200+ questions) without timeout.

**Flow:**
```
Client → POST /api/generate-questions/create-job
  ← Returns jobId immediately

Client → GET /api/generate-questions/job/:jobId (polling)
  ← Returns progress { completed: 1/3, sets: [...] }

Background workers process each set independently
```

**Benefits:**
- ✅ No timeout concerns
- ✅ Real-time progress
- ✅ Retry per set
- ✅ Can handle 1000+ question batches

**Deferred because:**
- Requires job queue infrastructure (Redis, DB polling, or serverless queue)
- Adds complexity for typical use cases (50-100 questions works fine)

## Implementation Plan

---

## Phase 1: Partial Success Handling (Task 064.1)

**Estimate:** 5 points

Enhance current `/api/generate-questions` to handle partial success.

### Changes to route.ts

#### 1. Wrap Each Generation in Try-Catch

```typescript
// Replace Promise.all() with allSettled()
const generationResults = await Promise.allSettled(generationTasks);

// Process results
const successfulResults: Array<{
  questions: any[];
  difficulty?: Difficulty;
  mode: 'quiz' | 'flashcard';
}> = [];

const failedResults: Array<{
  mode: 'quiz' | 'flashcard';
  difficulty?: Difficulty;
  error: string;
}> = [];

generationResults.forEach((result, index) => {
  const taskInfo = generationTasks[index]; // Get original task metadata

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
    const mode = /* extract from taskInfo */;
    const difficulty = /* extract from taskInfo */;

    failedResults.push({
      mode,
      difficulty,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    });

    logger.error(
      {
        mode,
        difficulty,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      },
      'Question generation failed'
    );
  }
});
```

#### 2. Save Successful Results Immediately

```typescript
// STEP 3: Create question sets for SUCCESSFUL generations only
logger.info(
  {
    successCount: successfulResults.length,
    failureCount: failedResults.length,
  },
  'Saving successful question sets'
);

const createdSets: any[] = [];

for (const result of successfulResults) {
  // Existing save logic...
  // (wrap in try-catch to handle DB errors independently)

  try {
    const dbResult = await createQuestionSet(...);
    createdSets.push(dbResult);
  } catch (dbError) {
    logger.error(
      {
        mode: result.mode,
        difficulty: result.difficulty,
        error: dbError instanceof Error ? dbError.message : String(dbError),
      },
      'Failed to save question set to database'
    );

    failedResults.push({
      mode: result.mode,
      difficulty: result.difficulty,
      error: 'Failed to save to database',
    });
  }
}
```

#### 3. Return Partial Success Response

```typescript
// Determine response status
const hasSuccess = createdSets.length > 0;
const hasFailures = failedResults.length > 0;

const response = {
  success: hasSuccess, // true if ANY sets created
  partial: hasSuccess && hasFailures, // true if some failed
  message: hasSuccess
    ? `Created ${createdSets.length} question sets${hasFailures ? ` (${failedResults.length} failed)` : ''}`
    : 'All question generation failed',
  questionSets: createdSets.map(set => ({
    code: set.code,
    name: set.questionSet.name,
    difficulty: set.questionSet.difficulty,
    mode: set.questionSet.mode,
    questionCount: set.questionSet.question_count,
  })),
  failures: hasFailures ? failedResults : undefined,
  totalQuestions: createdSets.reduce((sum, set) => sum + set.questionSet.question_count, 0),
};

const httpStatus = hasSuccess ? 200 : 500;

logger.info(
  {
    questionSetsCount: createdSets.length,
    failuresCount: failedResults.length,
    totalQuestions: response.totalQuestions,
    partial: response.partial,
  },
  'Request completed with partial success handling'
);

return NextResponse.json(response, { status: httpStatus });
```

### Client-Side Handling

Update `src/app/create/page.tsx` to handle partial success:

```typescript
const response = await fetch('/api/generate-questions', {
  method: 'POST',
  body: formData,
});

const data = await response.json();

if (data.success) {
  if (data.partial) {
    // Show partial success message
    toast.warning(
      `Created ${data.questionSets.length} sets. ${data.failures.length} failed.`,
      {
        description: data.failures.map(f => `${f.mode} (${f.difficulty || ''}): ${f.error}`).join('\n'),
      }
    );
  } else {
    // Full success
    toast.success(`Created ${data.questionSets.length} question sets!`);
  }

  // Navigate to first created set (even if partial)
  router.push(`/manage?highlight=${data.questionSets[0].code}`);
} else {
  // Total failure
  toast.error(data.message || 'Failed to generate questions');
}
```

---

## Phase 2: Separate Endpoints (Task 064.2)

**Estimate:** 8 points

Create focused endpoints for better reliability and retry control.

### New API Structure

```
src/app/api/generate-questions/
├── route.ts (legacy - redirects to /batch)
├── batch/
│   └── route.ts (orchestrates quiz + flashcard)
├── quiz/
│   └── route.ts (generates quiz sets only)
└── flashcard/
    └── route.ts (generates flashcard set only)
```

### Shared Logic Extraction

Create shared utilities:

```typescript
// src/lib/api/questionGeneration.ts

export interface GenerationRequest {
  subject: string;
  subjectType?: string;
  grade?: number;
  questionCount: number;
  examLength: number;
  questionSetName: string;
  topic?: string;
  subtopic?: string;
  materialText?: string;
  materialFiles?: Array<{ type: string; name: string; data: string }>;
  targetWords?: string[];
  identifiedTopics?: string[]; // Pre-computed topics (optional)
}

export interface QuizGenerationRequest extends GenerationRequest {
  difficulties: Difficulty[]; // ['helppo', 'normaali']
}

export interface FlashcardGenerationRequest extends GenerationRequest {
  // Flashcard-specific options (if any)
}

/**
 * Shared topic identification step
 */
export async function identifyTopicsFromMaterial(
  request: Pick<GenerationRequest, 'subject' | 'grade' | 'materialText' | 'materialFiles'>
): Promise<string[]> {
  const topicAnalysis = await identifyTopics({
    subject: request.subject,
    grade: request.grade,
    materialText: request.materialText,
    materialFiles: request.materialFiles,
  });

  return topicAnalysis.topics;
}

/**
 * Generate quiz question sets (multiple difficulties)
 */
export async function generateQuizSets(
  request: QuizGenerationRequest
): Promise<Array<{ questionSet: QuestionSet; questions: Question[] }>> {
  const results = [];

  for (const difficulty of request.difficulties) {
    const questions = await generateQuestions({
      subject: request.subject,
      subjectType: request.subjectType,
      difficulty,
      questionCount: request.questionCount,
      grade: request.grade,
      materialText: request.materialText,
      materialFiles: request.materialFiles,
      mode: 'quiz',
      identifiedTopics: request.identifiedTopics,
      targetWords: request.targetWords,
    });

    if (questions.length === 0) {
      throw new Error(`No questions generated for difficulty: ${difficulty}`);
    }

    const code = generateCode();
    const setName = `${request.questionSetName} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;

    const dbResult = await createQuestionSet(
      {
        code,
        name: setName,
        subject: request.subject as Subject,
        difficulty,
        mode: 'quiz',
        grade: request.grade,
        topic: request.topic,
        subtopic: request.subtopic,
        subject_type: request.subjectType,
        question_count: questions.length,
        exam_length: request.examLength,
        status: 'created',
      },
      questions
    );

    results.push(dbResult);
  }

  return results;
}

/**
 * Generate flashcard question set
 */
export async function generateFlashcardSet(
  request: FlashcardGenerationRequest
): Promise<{ questionSet: QuestionSet; questions: Question[] }> {
  const questions = await generateQuestions({
    subject: request.subject,
    subjectType: request.subjectType,
    difficulty: 'normaali',
    questionCount: request.questionCount,
    grade: request.grade,
    materialText: request.materialText,
    materialFiles: request.materialFiles,
    mode: 'flashcard',
    identifiedTopics: request.identifiedTopics,
    targetWords: request.targetWords,
  });

  if (questions.length === 0) {
    throw new Error('No flashcard questions generated');
  }

  const code = generateCode();
  const setName = `${request.questionSetName} - Kortit`;

  const dbResult = await createQuestionSet(
    {
      code,
      name: setName,
      subject: request.subject as Subject,
      difficulty: 'normaali',
      mode: 'flashcard',
      grade: request.grade,
      topic: request.topic,
      subtopic: request.subtopic,
      subject_type: request.subjectType,
      question_count: questions.length,
      exam_length: request.examLength,
      status: 'created',
    },
    questions
  );

  return dbResult;
}
```

### New Endpoint: /api/generate-questions/quiz

```typescript
// src/app/api/generate-questions/quiz/route.ts

export const maxDuration = 240; // 4 minutes (reduced from 5)

export async function POST(request: NextRequest) {
  const logger = createLogger({ route: '/api/generate-questions/quiz' });

  try {
    await requireAuth();

    const formData = await request.formData();
    // ... parse and validate request ...

    // Step 1: Identify topics (can be skipped if provided)
    let topics = parsedRequest.identifiedTopics;
    if (!topics) {
      topics = await identifyTopicsFromMaterial(parsedRequest);
    }

    // Step 2: Generate quiz sets
    const quizSets = await generateQuizSets({
      ...parsedRequest,
      difficulties: ['helppo', 'normaali'],
      identifiedTopics: topics,
    });

    return NextResponse.json({
      success: true,
      questionSets: quizSets.map(set => ({
        code: set.code,
        name: set.questionSet.name,
        difficulty: set.questionSet.difficulty,
        mode: set.questionSet.mode,
        questionCount: set.questionSet.question_count,
      })),
    });
  } catch (error) {
    logger.error({ error }, 'Quiz generation failed');
    return NextResponse.json(
      { error: 'Failed to generate quiz questions' },
      { status: 500 }
    );
  }
}
```

### New Endpoint: /api/generate-questions/flashcard

```typescript
// src/app/api/generate-questions/flashcard/route.ts

export const maxDuration = 240; // 4 minutes

export async function POST(request: NextRequest) {
  const logger = createLogger({ route: '/api/generate-questions/flashcard' });

  try {
    await requireAuth();

    const formData = await request.formData();
    // ... parse and validate request ...

    // Step 1: Identify topics (can be skipped if provided)
    let topics = parsedRequest.identifiedTopics;
    if (!topics) {
      topics = await identifyTopicsFromMaterial(parsedRequest);
    }

    // Step 2: Generate flashcard set
    const flashcardSet = await generateFlashcardSet({
      ...parsedRequest,
      identifiedTopics: topics,
    });

    return NextResponse.json({
      success: true,
      questionSet: {
        code: flashcardSet.code,
        name: flashcardSet.questionSet.name,
        mode: flashcardSet.questionSet.mode,
        questionCount: flashcardSet.questionSet.question_count,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Flashcard generation failed');
    return NextResponse.json(
      { error: 'Failed to generate flashcard questions' },
      { status: 500 }
    );
  }
}
```

### Client-Side Orchestration

Update `src/app/create/page.tsx` to call endpoints separately:

```typescript
async function handleSubmit() {
  setIsGenerating(true);
  const results = { quiz: null, flashcard: null, errors: [] };

  try {
    // Step 1: Identify topics once (shared)
    const topicsResponse = await fetch('/api/identify-topics', {
      method: 'POST',
      body: formData,
    });

    const { topics } = await topicsResponse.json();

    // Add topics to form data for subsequent requests
    formData.append('identifiedTopics', JSON.stringify(topics));

    // Step 2: Generate quiz (if requested)
    if (generationMode === 'quiz' || generationMode === 'both') {
      try {
        const quizResponse = await fetch('/api/generate-questions/quiz', {
          method: 'POST',
          body: formData,
        });

        const quizData = await quizResponse.json();

        if (quizData.success) {
          results.quiz = quizData.questionSets;
          toast.success(`Created ${quizData.questionSets.length} quiz sets`);
        } else {
          throw new Error(quizData.error || 'Quiz generation failed');
        }
      } catch (error) {
        results.errors.push({ type: 'quiz', error: error.message });
        toast.error('Quiz generation failed');
      }
    }

    // Step 3: Generate flashcard (if requested)
    if (generationMode === 'flashcard' || generationMode === 'both') {
      try {
        const flashcardResponse = await fetch('/api/generate-questions/flashcard', {
          method: 'POST',
          body: formData,
        });

        const flashcardData = await flashcardResponse.json();

        if (flashcardData.success) {
          results.flashcard = flashcardData.questionSet;
          toast.success('Created flashcard set');
        } else {
          throw new Error(flashcardData.error || 'Flashcard generation failed');
        }
      } catch (error) {
        results.errors.push({ type: 'flashcard', error: error.message });
        toast.error('Flashcard generation failed');
      }
    }

    // Navigate to manage page if ANY sets created
    if (results.quiz || results.flashcard) {
      const firstCode = results.quiz?.[0]?.code || results.flashcard?.code;
      router.push(`/manage?highlight=${firstCode}`);
    } else {
      toast.error('All question generation failed');
    }
  } finally {
    setIsGenerating(false);
  }
}
```

### Topic Identification Endpoint

Create dedicated endpoint for topic identification (reusable):

```typescript
// src/app/api/identify-topics/route.ts

export const maxDuration = 60; // 1 minute for topic analysis

export async function POST(request: NextRequest) {
  const logger = createLogger({ route: '/api/identify-topics' });

  try {
    await requireAuth();

    const formData = await request.formData();
    // ... parse material ...

    const topics = await identifyTopicsFromMaterial({
      subject,
      grade,
      materialText,
      materialFiles,
    });

    return NextResponse.json({
      success: true,
      topics,
      count: topics.length,
    });
  } catch (error) {
    logger.error({ error }, 'Topic identification failed');
    return NextResponse.json(
      { error: 'Failed to identify topics' },
      { status: 500 }
    );
  }
}
```

---

## Phase 3: Retry Logic (Task 064.3)

**Estimate:** 3 points

Add automatic retry for transient failures.

### Retry Wrapper Utility

```typescript
// src/lib/utils/retry.ts

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  shouldRetry: (error) => {
    // Retry on timeout, rate limit, or network errors
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('503') ||
      message.includes('econnreset')
    );
  },
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const shouldRetry = opts.shouldRetry ? opts.shouldRetry(lastError) : true;

      if (attempt < opts.maxAttempts && shouldRetry) {
        const delay = opts.delayMs * Math.pow(opts.backoffMultiplier, attempt - 1);

        console.warn(
          `Attempt ${attempt} failed, retrying in ${delay}ms...`,
          { error: lastError.message }
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw lastError;
      }
    }
  }

  throw lastError!;
}
```

### Apply Retry to AI Calls

```typescript
// In generateQuizSets()
const questions = await withRetry(
  () => generateQuestions({
    subject: request.subject,
    // ... other params
  }),
  {
    maxAttempts: 2, // Retry once on transient errors
    delayMs: 2000,
    shouldRetry: (error) => {
      const message = error.message.toLowerCase();
      // Retry on Claude API errors, but not validation errors
      return (
        message.includes('timeout') ||
        message.includes('overloaded') ||
        message.includes('rate')
      ) && !message.includes('validation');
    },
  }
);
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/api/generate-questions-partial-success.test.ts

describe('Partial Success Handling', () => {
  it('should save successful quiz sets even if flashcard fails', async () => {
    // Mock quiz success, flashcard failure
    // Verify quiz sets created in DB
    // Verify response includes partial: true
  });

  it('should return 200 status for partial success', async () => {
    // Verify HTTP 200 even with some failures
  });

  it('should return 500 status if all generations fail', async () => {
    // Mock all failures
    // Verify HTTP 500 and no DB records
  });
});
```

### Integration Tests

```typescript
// tests/integration/split-endpoints.test.ts

describe('Split Endpoints', () => {
  it('/quiz should create 2 quiz sets', async () => {
    const response = await POST('/api/generate-questions/quiz', formData);
    expect(response.questionSets).toHaveLength(2);
    expect(response.questionSets[0].difficulty).toBe('helppo');
    expect(response.questionSets[1].difficulty).toBe('normaali');
  });

  it('/flashcard should create 1 flashcard set', async () => {
    const response = await POST('/api/generate-questions/flashcard', formData);
    expect(response.questionSet.mode).toBe('flashcard');
  });

  it('should handle retry on transient errors', async () => {
    // Mock Claude API timeout on first attempt, success on second
    // Verify retry happened and request succeeded
  });
});
```

---

## Migration Strategy

### Phase 1: Backward Compatible

- Keep existing `/api/generate-questions` route
- Add partial success handling internally
- No client changes required
- Gradual rollout

### Phase 2: Opt-In Split

- Add new endpoints `/quiz` and `/flashcard`
- Keep legacy endpoint as default
- Add feature flag: `ENABLE_SPLIT_GENERATION`
- Test with small percentage of users

### Phase 3: Full Migration

- Update all clients to use split endpoints
- Deprecate legacy endpoint
- Monitor error rates

---

## Success Metrics

### Reliability Improvements

- **Target**: 95% success rate (up from ~85% currently)
- **Partial Success**: 10% of requests complete partially (better than 0% today)
- **Timeout Rate**: < 2% (down from ~5%)

### Performance

- **P50 Latency**: 90s (down from 120s)
- **P95 Latency**: 180s (down from 280s)
- **Retry Success Rate**: 80% of retried requests succeed

---

## Files to Create/Modify

### Phase 1 (Partial Success)
- ✏️ `src/app/api/generate-questions/route.ts` - Add Promise.allSettled
- ✏️ `src/app/create/page.tsx` - Handle partial success

### Phase 2 (Split Endpoints)
- 📄 `src/lib/api/questionGeneration.ts` - Shared utilities
- 📄 `src/app/api/generate-questions/quiz/route.ts` - Quiz endpoint
- 📄 `src/app/api/generate-questions/flashcard/route.ts` - Flashcard endpoint
- 📄 `src/app/api/identify-topics/route.ts` - Topic identification
- ✏️ `src/app/create/page.tsx` - Client orchestration

### Phase 3 (Retry Logic)
- 📄 `src/lib/utils/retry.ts` - Retry utility
- ✏️ `src/lib/api/questionGeneration.ts` - Apply retry wrapper

### Tests
- 📄 `tests/api/generate-questions-partial-success.test.ts`
- 📄 `tests/integration/split-endpoints.test.ts`
- 📄 `tests/utils/retry.test.ts`

---

## Rollback Plan

### Phase 1
- Remove Promise.allSettled, revert to Promise.all
- No database changes needed

### Phase 2
- Feature flag `ENABLE_SPLIT_GENERATION=false`
- Clients fall back to legacy endpoint

### Phase 3
- Remove retry wrapper from AI calls
- Existing code continues to work

---

## Future Enhancements (Not in Scope)

### Job Queue Architecture (Option C)

For very large batches (200+ questions), consider:
- Redis-backed job queue
- Background workers
- Real-time progress via WebSockets or Server-Sent Events
- Admin UI for job monitoring

### Streaming Responses

- Stream question-by-question as AI generates
- Update UI in real-time
- Requires SSE or WebSockets

### Caching Layer

- Cache topic identification results
- Reuse topics for multiple generation attempts
- TTL: 1 hour

---

## Acceptance Criteria

### Phase 1: Partial Success ✅
- [ ] Promise.allSettled replaces Promise.all
- [ ] Successful generations saved even if others fail
- [ ] Response includes `partial: true` flag
- [ ] Client UI shows partial success toast
- [ ] Error logging includes per-set failures
- [ ] Tests verify partial success scenarios

### Phase 2: Split Endpoints ✅
- [ ] `/api/generate-questions/quiz` creates 2 quiz sets
- [ ] `/api/generate-questions/flashcard` creates 1 flashcard set
- [ ] `/api/identify-topics` returns topic list
- [ ] Client orchestrates calls with error handling
- [ ] Shared utilities extracted to `questionGeneration.ts`
- [ ] Tests verify endpoint behavior

### Phase 3: Retry Logic ✅
- [ ] Retry utility handles transient errors
- [ ] AI calls wrapped with retry logic
- [ ] Retry logged and monitored
- [ ] Tests verify retry behavior

---

## Related Tasks

- **Task 060**: Flashcard Rule-Based Redesign (✅ Completed)
- **Task 061**: Rule-Based Flashcard Format Validation (🔴 Not Started)
- **Task 062**: Rule-Based Question Count Flexibility (🔴 Not Started)

---

## Notes

This redesign follows the principle of **incremental improvement**:
1. First, fix the worst case (total failure) → partial success
2. Then, optimize for reliability → split endpoints
3. Finally, add resilience → retry logic

Each phase is independently deployable and provides value on its own.
