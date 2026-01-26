# Task 064.3: Partial Success Tests

**Status:** 🔴 Not Started
**Estimate:** 2 points
**Priority:** P1
**Parent Task:** Task 064 - Reliable Question Generation Architecture (Phase 1)
**Depends On:** Task 064.1 (Server-Side), Task 064.2 (Client-Side)

## Overview

Create comprehensive tests for partial success handling in question generation. Verify that successful question sets are saved even when other generations fail, and that appropriate responses are returned.

## Acceptance Criteria

### 1. API Route Tests

**File:** `tests/api/generate-questions-partial-success.test.ts` (new file)

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/generate-questions/route';
import { generateQuestions } from '@/lib/ai/questionGenerator';
import { createQuestionSet } from '@/lib/supabase/write-queries';
import { identifyTopics } from '@/lib/ai/topicIdentifier';

// Mock dependencies
vi.mock('@/lib/ai/questionGenerator');
vi.mock('@/lib/ai/topicIdentifier');
vi.mock('@/lib/supabase/write-queries');
vi.mock('@/lib/supabase/server-auth');

describe('Partial Success Handling', () => {
  beforeEach(() => {
    // Mock auth to pass
    vi.mocked(requireAuth).mockResolvedValue({ user: { id: 'test-user' } });

    // Mock topic identification
    vi.mocked(identifyTopics).mockResolvedValue({
      topics: ['Topic 1', 'Topic 2'],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Full Success', () => {
    it('should create all sets when all generations succeed', async () => {
      // Mock successful generation for all sets
      vi.mocked(generateQuestions)
        .mockResolvedValueOnce([{ /* quiz:helppo question */ }]) // Quiz - Helppo
        .mockResolvedValueOnce([{ /* quiz:normaali question */ }]) // Quiz - Normaali
        .mockResolvedValueOnce([{ /* flashcard question */ }]); // Flashcard

      vi.mocked(createQuestionSet).mockResolvedValue({
        code: 'TEST123',
        questionSet: { name: 'Test Set', question_count: 1, /* ... */ },
        questions: [{ /* ... */ }],
      });

      const request = createMockRequest({
        generationMode: 'both',
        questionSetName: 'Test',
        subject: 'english',
        questionCount: 50,
        examLength: 10,
        materialText: 'Test material',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.partial).toBe(false);
      expect(data.questionSets).toHaveLength(3);
      expect(data.failures).toBeUndefined();
      expect(data.stats.succeeded).toBe(3);
      expect(data.stats.failed).toBe(0);
    });
  });

  describe('Partial Success - Generation Failure', () => {
    it('should save successful sets when flashcard generation fails', async () => {
      // Mock quiz success, flashcard failure
      vi.mocked(generateQuestions)
        .mockResolvedValueOnce([{ id: '1' }]) // Quiz - Helppo ✅
        .mockResolvedValueOnce([{ id: '2' }]) // Quiz - Normaali ✅
        .mockRejectedValueOnce(new Error('Flashcard generation timeout')); // Flashcard ❌

      vi.mocked(createQuestionSet)
        .mockResolvedValueOnce({
          code: 'QUIZ1',
          questionSet: { name: 'Test - Helppo', question_count: 1 },
        })
        .mockResolvedValueOnce({
          code: 'QUIZ2',
          questionSet: { name: 'Test - Normaali', question_count: 1 },
        });

      const request = createMockRequest({
        generationMode: 'both',
        questionSetName: 'Test',
        subject: 'english',
        questionCount: 50,
        examLength: 10,
        materialText: 'Test material',
      });

      const response = await POST(request);
      const data = await response.json();

      // Should return 200 (partial success)
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.partial).toBe(true);

      // Should have 2 successful quiz sets
      expect(data.questionSets).toHaveLength(2);
      expect(data.questionSets[0].mode).toBe('quiz');
      expect(data.questionSets[1].mode).toBe('quiz');

      // Should have 1 failure
      expect(data.failures).toHaveLength(1);
      expect(data.failures[0].mode).toBe('flashcard');
      expect(data.failures[0].error).toContain('timeout');

      // Stats should reflect partial success
      expect(data.stats.succeeded).toBe(2);
      expect(data.stats.failed).toBe(1);
      expect(data.stats.requested).toBe(3);
    });

    it('should save successful sets when one quiz difficulty fails', async () => {
      // Mock helppo failure, normaali success, flashcard success
      vi.mocked(generateQuestions)
        .mockRejectedValueOnce(new Error('Validation failed')) // Quiz - Helppo ❌
        .mockResolvedValueOnce([{ id: '2' }]) // Quiz - Normaali ✅
        .mockResolvedValueOnce([{ id: '3' }]); // Flashcard ✅

      vi.mocked(createQuestionSet)
        .mockResolvedValueOnce({
          code: 'QUIZ2',
          questionSet: { name: 'Test - Normaali', question_count: 1 },
        })
        .mockResolvedValueOnce({
          code: 'FLASH1',
          questionSet: { name: 'Test - Kortit', question_count: 1 },
        });

      const request = createMockRequest({
        generationMode: 'both',
        questionSetName: 'Test',
        subject: 'english',
        questionCount: 50,
        examLength: 10,
        materialText: 'Test material',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.partial).toBe(true);
      expect(data.questionSets).toHaveLength(2);
      expect(data.failures).toHaveLength(1);
      expect(data.failures[0].difficulty).toBe('helppo');
      expect(data.failures[0].errorType).toBe('validation');
    });
  });

  describe('Partial Success - Database Failure', () => {
    it('should handle database save failures gracefully', async () => {
      // All generations succeed
      vi.mocked(generateQuestions)
        .mockResolvedValueOnce([{ id: '1' }])
        .mockResolvedValueOnce([{ id: '2' }])
        .mockResolvedValueOnce([{ id: '3' }]);

      // First save succeeds, second fails, third succeeds
      vi.mocked(createQuestionSet)
        .mockResolvedValueOnce({
          code: 'QUIZ1',
          questionSet: { name: 'Test - Helppo', question_count: 1 },
        })
        .mockRejectedValueOnce(new Error('Database connection error'))
        .mockResolvedValueOnce({
          code: 'FLASH1',
          questionSet: { name: 'Test - Kortit', question_count: 1 },
        });

      const request = createMockRequest({
        generationMode: 'both',
        questionSetName: 'Test',
        subject: 'english',
        questionCount: 50,
        examLength: 10,
        materialText: 'Test material',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.partial).toBe(true);
      expect(data.questionSets).toHaveLength(2);
      expect(data.failures).toHaveLength(1);
      expect(data.failures[0].errorType).toBe('database');
    });
  });

  describe('Total Failure', () => {
    it('should return 500 when all generations fail', async () => {
      // Mock all failures
      vi.mocked(generateQuestions)
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'));

      const request = createMockRequest({
        generationMode: 'both',
        questionSetName: 'Test',
        subject: 'english',
        questionCount: 50,
        examLength: 10,
        materialText: 'Test material',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.partial).toBe(false);
      expect(data.questionSets).toHaveLength(0);
      expect(data.failures).toHaveLength(3);
      expect(data.stats.succeeded).toBe(0);
      expect(data.stats.failed).toBe(3);
    });

    it('should return 500 when all database saves fail', async () => {
      // Generations succeed
      vi.mocked(generateQuestions)
        .mockResolvedValueOnce([{ id: '1' }])
        .mockResolvedValueOnce([{ id: '2' }])
        .mockResolvedValueOnce([{ id: '3' }]);

      // All saves fail
      vi.mocked(createQuestionSet)
        .mockRejectedValueOnce(new Error('DB error'))
        .mockRejectedValueOnce(new Error('DB error'))
        .mockRejectedValueOnce(new Error('DB error'));

      const request = createMockRequest({
        generationMode: 'both',
        questionSetName: 'Test',
        subject: 'english',
        questionCount: 50,
        examLength: 10,
        materialText: 'Test material',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.questionSets).toHaveLength(0);
      expect(data.failures).toHaveLength(3);
    });
  });

  describe('Error Classification', () => {
    it('should classify timeout errors correctly', async () => {
      vi.mocked(generateQuestions)
        .mockResolvedValueOnce([{ id: '1' }])
        .mockResolvedValueOnce([{ id: '2' }])
        .mockRejectedValueOnce(new Error('Request timeout after 60s'));

      vi.mocked(createQuestionSet).mockResolvedValue({
        code: 'TEST',
        questionSet: { name: 'Test', question_count: 1 },
      });

      const request = createMockRequest({ generationMode: 'both' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.failures[0].errorType).toBe('timeout');
    });

    it('should classify validation errors correctly', async () => {
      vi.mocked(generateQuestions)
        .mockResolvedValueOnce([{ id: '1' }])
        .mockResolvedValueOnce([{ id: '2' }])
        .mockRejectedValueOnce(new Error('Validation failed: invalid schema'));

      vi.mocked(createQuestionSet).mockResolvedValue({
        code: 'TEST',
        questionSet: { name: 'Test', question_count: 1 },
      });

      const request = createMockRequest({ generationMode: 'both' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.failures[0].errorType).toBe('validation');
    });
  });

  describe('Empty Results Handling', () => {
    it('should treat empty question array as failure', async () => {
      // One set returns empty array
      vi.mocked(generateQuestions)
        .mockResolvedValueOnce([{ id: '1' }])
        .mockResolvedValueOnce([]) // Empty!
        .mockResolvedValueOnce([{ id: '3' }]);

      vi.mocked(createQuestionSet).mockResolvedValue({
        code: 'TEST',
        questionSet: { name: 'Test', question_count: 1 },
      });

      const request = createMockRequest({ generationMode: 'both' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.partial).toBe(true);
      expect(data.questionSets).toHaveLength(2);
      expect(data.failures).toHaveLength(1);
      expect(data.failures[0].error).toContain('No questions generated');
    });
  });
});

// Helper: Create mock Next.js request
function createMockRequest(formData: Record<string, any>): NextRequest {
  const form = new FormData();
  Object.entries(formData).forEach(([key, value]) => {
    form.append(key, String(value));
  });

  return new NextRequest('http://localhost:3000/api/generate-questions', {
    method: 'POST',
    body: form,
  });
}
```

### 2. Client-Side Tests

**File:** `tests/components/create-page-partial-success.test.tsx` (new file)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreatePage from '@/app/create/page';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Create Page - Partial Success UI', () => {
  it('should show success toast for full success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        partial: false,
        questionSets: [
          { code: 'Q1', name: 'Test - Helppo', mode: 'quiz', difficulty: 'helppo', questionCount: 50 },
          { code: 'Q2', name: 'Test - Normaali', mode: 'quiz', difficulty: 'normaali', questionCount: 50 },
          { code: 'F1', name: 'Test - Kortit', mode: 'flashcard', questionCount: 50 },
        ],
        totalQuestions: 150,
        stats: { requested: 3, succeeded: 3, failed: 0 },
      }),
    });

    render(<CreatePage />);

    // Fill form and submit
    // ...

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Successfully created 3'),
        expect.any(Object)
      );
    });
  });

  it('should show warning toast for partial success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        partial: true,
        questionSets: [
          { code: 'Q1', name: 'Test - Helppo', mode: 'quiz', difficulty: 'helppo', questionCount: 50 },
          { code: 'Q2', name: 'Test - Normaali', mode: 'quiz', difficulty: 'normaali', questionCount: 50 },
        ],
        failures: [
          { mode: 'flashcard', error: 'Generation timeout', errorType: 'timeout' },
        ],
        totalQuestions: 100,
        stats: { requested: 3, succeeded: 2, failed: 1 },
      }),
    });

    render(<CreatePage />);

    // Fill form and submit
    // ...

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(
        expect.stringContaining('Created 2 of 3'),
        expect.objectContaining({
          description: expect.stringContaining('Flashcard: Generation timed out'),
        })
      );
    });
  });

  it('should show error toast for total failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        partial: false,
        message: 'Failed to create question sets (3 errors)',
        questionSets: [],
        failures: [
          { mode: 'quiz', difficulty: 'helppo', error: 'Timeout', errorType: 'timeout' },
          { mode: 'quiz', difficulty: 'normaali', error: 'Timeout', errorType: 'timeout' },
          { mode: 'flashcard', error: 'Timeout', errorType: 'timeout' },
        ],
        totalQuestions: 0,
        stats: { requested: 3, succeeded: 0, failed: 3 },
      }),
    });

    render(<CreatePage />);

    // Fill form and submit
    // ...

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to generate'),
        expect.any(Object)
      );
    });
  });
});
```

### 3. Integration Tests

**File:** `tests/integration/partial-success-flow.test.ts` (new file)

```typescript
import { describe, it, expect } from 'vitest';
import { createClient } from '@/lib/supabase/server';

describe('Partial Success Integration', () => {
  it('should save quiz sets to database even when flashcard fails', async () => {
    // This test requires running against actual Supabase (or mock)
    // Verify database contains quiz sets after partial success

    const supabase = await createClient();

    // ... API call that results in partial success ...

    // Verify quiz sets exist in DB
    const { data: quizSets } = await supabase
      .from('question_sets')
      .select('*')
      .eq('mode', 'quiz')
      .eq('name', 'Test - Helppo');

    expect(quizSets).toHaveLength(1);

    // Verify flashcard set does NOT exist
    const { data: flashcardSets } = await supabase
      .from('question_sets')
      .select('*')
      .eq('mode', 'flashcard')
      .eq('name', 'Test - Kortit');

    expect(flashcardSets).toHaveLength(0);
  });
});
```

## Test Coverage Requirements

- [ ] Full success scenario
- [ ] Partial success - flashcard fails
- [ ] Partial success - one quiz difficulty fails
- [ ] Partial success - database save fails
- [ ] Total failure - all generations fail
- [ ] Total failure - all database saves fail
- [ ] Error classification (timeout, validation, generation, database)
- [ ] Empty question array handling
- [ ] Client UI shows correct toasts
- [ ] Navigation works for partial success

## Running Tests

```bash
# Run all partial success tests
npm test -- partial-success

# Run API tests only
npm test tests/api/generate-questions-partial-success.test.ts

# Run client tests only
npm test tests/components/create-page-partial-success.test.tsx

# Run with coverage
npm test -- --coverage
```

## Files to Create

- 📄 `tests/api/generate-questions-partial-success.test.ts` - API route tests
- 📄 `tests/components/create-page-partial-success.test.tsx` - Client UI tests
- 📄 `tests/integration/partial-success-flow.test.ts` - Integration tests

## Success Criteria

- [ ] All test files created
- [ ] Full success scenario tested
- [ ] Partial success scenarios tested (generation + database failures)
- [ ] Total failure scenarios tested
- [ ] Error classification tested
- [ ] Client UI tests pass
- [ ] Test coverage > 90% for modified code
- [ ] Tests run in CI/CD pipeline

## Related Tasks

- **Task 064.1**: Server-Side Partial Success (tests this)
- **Task 064.2**: Client-Side Partial Success UI (tests this)
- **Task 064**: Parent task (Reliable Question Generation Architecture)

## Notes

- Tests use mocking to avoid real AI/database calls
- Integration tests may require test database or sophisticated mocking
- Consider adding E2E tests with Playwright for full flow validation
