# Task 064.2: Client-Side Partial Success UI

**Status:** 🔴 Not Started
**Estimate:** 2 points
**Priority:** P0
**Parent Task:** Task 064 - Reliable Question Generation Architecture (Phase 1)
**Depends On:** Task 064.1 (Server-Side Partial Success)

## Overview

Update client-side code in `/create` page to handle partial success responses from the question generation API. Show user-friendly notifications for full success, partial success, and total failure scenarios.

## Current Problem

Client assumes all-or-nothing:
- Success → Show generic success toast
- Failure → Show generic error toast
- No handling of partial success (some sets created, some failed)
- No details about which sets succeeded/failed

## Acceptance Criteria

### 1. Update Response Type

**File:** `src/app/create/page.tsx` (or create types file)

Add TypeScript type matching server response:

```typescript
interface QuestionGenerationResponse {
  success: boolean;
  partial?: boolean;
  message: string;
  questionSets: Array<{
    code: string;
    name: string;
    difficulty: string;
    mode: 'quiz' | 'flashcard';
    questionCount: number;
  }>;
  failures?: Array<{
    mode: 'quiz' | 'flashcard';
    difficulty?: string;
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

### 2. Handle Partial Success in Submit Handler

**File:** `src/app/create/page.tsx`

Find the form submit handler (likely around line 200-300) and update response handling:

**Before:**
```typescript
const response = await fetch('/api/generate-questions', {
  method: 'POST',
  body: formData,
});

if (!response.ok) {
  throw new Error('Failed to generate questions');
}

const data = await response.json();

// Generic success handling
toast.success('Questions generated successfully!');
router.push(`/manage?highlight=${data.questionSets[0].code}`);
```

**After:**
```typescript
const response = await fetch('/api/generate-questions', {
  method: 'POST',
  body: formData,
});

const data: QuestionGenerationResponse = await response.json();

// Handle different success scenarios
if (data.success) {
  if (data.partial) {
    // Partial success - some sets created, some failed
    handlePartialSuccess(data);
  } else {
    // Full success - all sets created
    handleFullSuccess(data);
  }

  // Navigate to manage page (even for partial success)
  if (data.questionSets.length > 0) {
    const firstCode = data.questionSets[0].code;
    router.push(`/manage?highlight=${firstCode}`);
  }
} else {
  // Total failure - no sets created
  handleTotalFailure(data);
}
```

### 3. Implement Success Handlers

Add handler functions in `src/app/create/page.tsx`:

```typescript
/**
 * Handle full success - all question sets created
 */
function handleFullSuccess(data: QuestionGenerationResponse) {
  const { questionSets, totalQuestions } = data;

  toast.success(
    `Successfully created ${questionSets.length} question sets!`,
    {
      description: `${totalQuestions} total questions generated`,
    }
  );

  // Log for analytics
  console.log('Question generation: full success', {
    setsCreated: questionSets.length,
    totalQuestions,
  });
}

/**
 * Handle partial success - some sets created, some failed
 */
function handlePartialSuccess(data: QuestionGenerationResponse) {
  const { questionSets, failures, stats } = data;

  // Build user-friendly failure summary
  const failureSummary = failures?.map(f => {
    const label = f.mode === 'flashcard'
      ? 'Flashcard'
      : `Quiz (${f.difficulty})`;

    // Simplify error message for user
    const errorType = f.errorType || 'generation';
    const userMessage = {
      timeout: 'Generation timed out',
      validation: 'Validation failed',
      database: 'Failed to save',
      generation: 'Generation failed',
    }[errorType];

    return `${label}: ${userMessage}`;
  }).join('\n') || 'Some sets failed';

  // Show warning toast with details
  toast.warning(
    `Created ${stats.succeeded} of ${stats.requested} question sets`,
    {
      description: `${failureSummary}\n\nYou can retry the failed sets from the manage page.`,
      duration: 8000, // Longer duration for partial success
    }
  );

  // Log for analytics
  console.warn('Question generation: partial success', {
    succeeded: stats.succeeded,
    failed: stats.failed,
    failures: failures?.map(f => ({ mode: f.mode, difficulty: f.difficulty, errorType: f.errorType })),
  });
}

/**
 * Handle total failure - no sets created
 */
function handleTotalFailure(data: QuestionGenerationResponse) {
  const { failures, message } = data;

  // Build detailed error message
  const errorDetails = failures?.map(f => {
    const label = f.mode === 'flashcard'
      ? 'Flashcard'
      : `Quiz (${f.difficulty})`;

    return `${label}: ${f.error}`;
  }).join('\n') || message;

  toast.error(
    'Failed to generate question sets',
    {
      description: errorDetails,
      duration: 10000, // Longer duration for errors
    }
  );

  // Log for debugging
  console.error('Question generation: total failure', {
    message,
    failures,
  });
}
```

### 4. Update Loading State Messages

Add more informative loading messages during generation:

```typescript
const [generationStatus, setGenerationStatus] = useState<{
  isGenerating: boolean;
  message: string;
}>({
  isGenerating: false,
  message: '',
});

// In submit handler
setGenerationStatus({
  isGenerating: true,
  message: generationMode === 'both'
    ? 'Generating quiz sets and flashcards...'
    : generationMode === 'quiz'
    ? 'Generating quiz sets...'
    : 'Generating flashcards...',
});

// After completion
setGenerationStatus({ isGenerating: false, message: '' });
```

### 5. Add Retry Guidance for Partial Failures

When navigating to manage page after partial success, add URL parameter to show retry option:

```typescript
if (data.partial) {
  // Include failure info in URL for manage page to show retry button
  const failedModes = data.failures?.map(f => f.mode).join(',');
  router.push(
    `/manage?highlight=${firstCode}&retryModes=${failedModes}&retrySubject=${subject}&retryMaterial=true`
  );
} else {
  router.push(`/manage?highlight=${firstCode}`);
}
```

### 6. Error Boundary for API Errors

Wrap API call in try-catch for network/parsing errors:

```typescript
try {
  const response = await fetch('/api/generate-questions', {
    method: 'POST',
    body: formData,
  });

  // Handle non-JSON errors (network issues, 502, etc.)
  if (!response.ok && response.status >= 500 && response.status < 600) {
    throw new Error('Server error - please try again later');
  }

  const data: QuestionGenerationResponse = await response.json();

  // Handle success/partial/failure as above
  // ...

} catch (error) {
  // Network error or parsing error
  toast.error(
    'Failed to connect to server',
    {
      description: error instanceof Error
        ? error.message
        : 'Please check your connection and try again',
    }
  );

  console.error('Question generation: network error', error);
} finally {
  setGenerationStatus({ isGenerating: false, message: '' });
}
```

## UI Messages Matrix

| Scenario | Toast Type | Title | Description | Duration | Navigation |
|----------|-----------|-------|-------------|----------|------------|
| **Full Success** | success ✅ | "Successfully created X sets!" | "Y total questions" | 5s | `/manage?highlight=CODE` |
| **Partial Success** | warning ⚠️ | "Created X of Y sets" | "Failed: [details]" | 8s | `/manage?highlight=CODE&retryModes=...` |
| **Total Failure** | error ❌ | "Failed to generate sets" | "[Error details]" | 10s | Stay on /create |
| **Network Error** | error ❌ | "Failed to connect" | "Check connection" | 10s | Stay on /create |

## Testing Scenarios

### Manual Testing Checklist

1. **Full Success**:
   - [ ] Generate mode='both'
   - [ ] All 3 sets created
   - [ ] See success toast: "Successfully created 3 question sets!"
   - [ ] Navigate to /manage with highlight

2. **Partial Success** (Mock flashcard failure):
   - [ ] Generate mode='both'
   - [ ] 2 quiz sets created, flashcard failed
   - [ ] See warning toast: "Created 2 of 3 question sets"
   - [ ] Toast shows "Flashcard: Generation failed"
   - [ ] Navigate to /manage with highlight + retryModes

3. **Total Failure**:
   - [ ] Mock all generations to fail
   - [ ] See error toast: "Failed to generate question sets"
   - [ ] Stay on /create page
   - [ ] Can retry manually

4. **Network Error**:
   - [ ] Disconnect network during generation
   - [ ] See error toast: "Failed to connect to server"
   - [ ] Stay on /create page

5. **Partial Success with Database Error**:
   - [ ] Mock database failure for one set
   - [ ] See warning toast mentioning database error
   - [ ] Navigate to /manage with partial results

## Files to Modify

- ✏️ `src/app/create/page.tsx` - Main changes
- 📄 `src/types/api.ts` - Response types (optional, can inline types)

## Accessibility Considerations

- [ ] Toast notifications are screen-reader friendly
- [ ] Error messages are clear and actionable
- [ ] Loading state is announced to screen readers
- [ ] Keyboard navigation works during error states

## Success Criteria

- [ ] Full success shows success toast
- [ ] Partial success shows warning toast with details
- [ ] Total failure shows error toast
- [ ] Network errors handled gracefully
- [ ] Loading state shows appropriate message
- [ ] Navigation works for full and partial success
- [ ] Manual testing scenarios pass
- [ ] Toast durations appropriate for message complexity
- [ ] Accessibility requirements met

## Related Tasks

- **Task 064.1**: Server-Side Partial Success (prerequisite)
- **Task 064.3**: Tests for Partial Success (follows this)
- **Task 064**: Parent task (Reliable Question Generation Architecture)

## Future Enhancements (Not in Scope)

- Retry button directly in toast notification
- Progress bar during generation
- Real-time status updates (requires SSE/WebSockets)
- Detailed error log download for debugging
