# Task 064 Phase 2: Split Endpoints

**Status:** 🟡 In Progress
**Estimate:** 8 points
**Priority:** P0
**Started:** 2026-01-27

## Overview

Create focused API endpoints for quiz and flashcard generation, with shared topic identification. This improves reliability by allowing independent retry of failed pieces and reduces timeout risk.

## Architecture Changes

### Before (Current - Single Batch Endpoint):
```
POST /api/generate-questions (mode='both')
  ├─ Identify topics
  ├─ Generate quiz (helppo + normaali) + flashcard in parallel
  └─ Save all to DB
  └─ Return results
```

### After (Split Endpoints):
```
POST /api/identify-topics
  └─ Returns topics only

POST /api/generate-questions/quiz
  ├─ Accept pre-identified topics (optional)
  ├─ Generate quiz sets (helppo + normaali)
  └─ Return quiz sets

POST /api/generate-questions/flashcard
  ├─ Accept pre-identified topics (optional)
  ├─ Generate flashcard set
  └─ Return flashcard set

Client orchestrates calls:
  1. Call /identify-topics once
  2. Call /quiz with topics (if needed)
  3. Call /flashcard with topics (if needed)
  4. Handle individual failures gracefully
```

## Implementation Steps

### Step 1: Extract Shared Logic (2 points)

Create `src/lib/api/questionGeneration.ts` with shared utilities:

- [x] `identifyTopicsFromMaterial()` - Topic identification
- [x] `generateQuizSets()` - Generate multiple quiz difficulties
- [x] `generateFlashcardSet()` - Generate flashcard set
- [x] Type definitions for requests/responses

### Step 2: Create Topic Identification Endpoint (1 point)

Create `src/app/api/identify-topics/route.ts`:

- [x] POST handler accepting material (text + files)
- [x] Call identifyTopicsFromMaterial()
- [x] Return topics array
- [x] maxDuration: 60s
- [x] Auth check
- [x] Logging

### Step 3: Create Quiz Endpoint (2 points)

Create `src/app/api/generate-questions/quiz/route.ts`:

- [x] POST handler accepting generation params
- [x] Accept optional pre-identified topics
- [x] Generate quiz sets (helppo + normaali)
- [x] Save to database
- [x] Return created sets
- [x] maxDuration: 240s
- [x] Auth check
- [x] Logging with per-difficulty tracking

### Step 4: Create Flashcard Endpoint (2 points)

Create `src/app/api/generate-questions/flashcard/route.ts`:

- [x] POST handler accepting generation params
- [x] Accept optional pre-identified topics
- [x] Generate flashcard set
- [x] Save to database
- [x] Return created set
- [x] maxDuration: 240s
- [x] Auth check
- [x] Logging

### Step 5: Update Client Orchestration (1 point)

Update `src/app/create/page.tsx`:

- [ ] Call /identify-topics first
- [ ] Call /quiz and/or /flashcard based on mode
- [ ] Handle individual failures gracefully
- [ ] Show progress for each step
- [ ] Toast notifications for each success/failure
- [ ] Navigate to first created set if ANY succeed

## Acceptance Criteria

### Endpoints
- [x] `/api/identify-topics` returns topic list
- [x] `/api/generate-questions/quiz` creates 2 quiz sets (helppo + normaali)
- [x] `/api/generate-questions/flashcard` creates 1 flashcard set
- [ ] All endpoints handle auth, validation, and errors consistently
- [ ] Timeouts set appropriately (60s topics, 240s generation)

### Shared Logic
- [x] `identifyTopicsFromMaterial()` reusable across endpoints
- [x] `generateQuizSets()` handles both difficulties
- [x] `generateFlashcardSet()` handles flashcard generation
- [ ] Code duplication minimized
- [ ] Error handling consistent

### Client Integration
- [ ] Client can call endpoints individually
- [ ] Client reuses topics across requests
- [ ] Client handles partial failures gracefully
- [ ] User sees progress for each step
- [ ] Navigation works with partial success

### Backward Compatibility
- [x] Legacy `/api/generate-questions` still works (kept for now)
- [ ] No breaking changes to existing client code initially
- [ ] Gradual migration path

## Benefits

✅ **Independent Retry**: Client can retry just quiz or flashcard if one fails
✅ **Better Error Isolation**: Failures don't cascade
✅ **Clearer API Surface**: Each endpoint has single responsibility
✅ **Reduced Timeout Risk**: Smaller operations finish faster
✅ **Reusable Topics**: Identify once, use for multiple generations

## Testing

### Manual Testing
- [ ] Call /identify-topics with material → returns topics
- [ ] Call /quiz with topics → creates 2 quiz sets
- [ ] Call /flashcard with topics → creates 1 flashcard set
- [ ] Call /quiz without topics → identifies topics and creates sets
- [ ] Simulate quiz failure → flashcard can still succeed independently

### Unit Tests (Deferred)
- [ ] Test identifyTopicsFromMaterial() with various inputs
- [ ] Test generateQuizSets() success and error cases
- [ ] Test generateFlashcardSet() success and error cases

### Integration Tests (Deferred)
- [ ] Test full client orchestration flow
- [ ] Test partial failure scenarios
- [ ] Test retry logic

## Files

### Created
- [x] `src/lib/api/questionGeneration.ts` - Shared utilities
- [x] `src/app/api/identify-topics/route.ts` - Topic identification
- [x] `src/app/api/generate-questions/quiz/route.ts` - Quiz generation
- [x] `src/app/api/generate-questions/flashcard/route.ts` - Flashcard generation

### Modified
- [ ] `src/app/create/page.tsx` - Client orchestration

### Kept (No Changes)
- `src/app/api/generate-questions/route.ts` - Legacy endpoint (backward compat)

## Migration Strategy

**Phase 2A** (Current): Create new endpoints, keep legacy
**Phase 2B** (Next): Update client to use new endpoints
**Phase 2C** (Later): Deprecate legacy endpoint

## Rollback Plan

If issues arise:
1. Feature flag `ENABLE_SPLIT_GENERATION=false` (add later)
2. Client falls back to legacy `/api/generate-questions`
3. No data loss - all endpoints write to same DB tables

## Success Metrics

- Timeout rate < 2% (down from ~5%)
- Independent retry success rate > 80%
- Partial success rate > 10% (vs 0% with monolithic endpoint)

## Related Tasks

- Task 064.1: Server-Side Partial Success ✅ Completed
- Task 064.2: Client-Side Partial Success UI ✅ Completed
- Task 064.3: Partial Success Tests 🔴 Not Started
- Task 064 Phase 3: Retry Logic 🔴 Not Started
