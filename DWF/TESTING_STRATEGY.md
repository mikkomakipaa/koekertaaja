# Testing Strategy

**Version**: 1.0
**Last Updated**: 2026-01-18
**Purpose**: Define testing approach, coverage targets, and test patterns for Koekertaaja

---

## Overview

Koekertaaja's testing strategy focuses on **critical path coverage** (40% statement coverage minimum) rather than comprehensive coverage (80%+). This pragmatic approach balances quality assurance with development velocity for an MVP product.

**Testing Pyramid**:
```
        ╱╲
       ╱  ╲      E2E Tests (Future)
      ╱────╲     - Critical flows only
     ╱      ╲    - Playwright
    ╱────────╲
   ╱          ╲  Integration Tests
  ╱────────────╲ - API routes
 ╱──────────────╲ - AI generation
╱────────────────╲ - Database queries
──────────────────
   Unit Tests      - Pure functions
                   - Utilities
                   - Hooks logic
```

---

## Current Testing Status

**Implemented**:
- ✅ Vitest configured
- ✅ Basic test structure in place

**Not Yet Implemented**:
- ⏳ Comprehensive unit tests
- ⏳ Integration tests for API routes
- ⏳ Component tests
- ⏳ E2E tests (Playwright)
- ⏳ Accessibility smoke tests

---

## Testing Tools

### Unit & Integration Testing: Vitest
**Why Vitest**:
- Fast (native ESM, Vite-powered)
- Jest-compatible API (easy migration)
- Built-in TypeScript support
- Watch mode for development
- Coverage reporting via c8

**Configuration**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // For component tests
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'json'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/types/**',
        'src/components/ui/**' // shadcn components
      ]
    }
  }
});
```

---

### Component Testing: React Testing Library
**Why React Testing Library**:
- User-centric testing (tests behavior, not implementation)
- Encourages accessible markup
- Works with Vitest

**Example**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MultipleChoice } from '@/components/questions/MultipleChoice';

describe('MultipleChoice', () => {
  it('shows correct feedback when answered correctly', () => {
    render(
      <MultipleChoice
        question="What is 2+2?"
        options={['3', '4', '5', '6']}
        correctAnswer="4"
        onAnswer={jest.fn()}
      />
    );

    const correctButton = screen.getByText('4');
    fireEvent.click(correctButton);

    expect(screen.getByText(/oikein/i)).toBeInTheDocument();
  });
});
```

---

### E2E Testing: Playwright (Future)
**Why Playwright**:
- Cross-browser support (Chromium, Firefox, WebKit)
- Mobile viewport testing (iPad simulation)
- Network interception (mock API calls)
- Video recording for debugging

**Configuration** (future):
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'iPad Air',
      use: { ...devices['iPad Air'] },
    },
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

---

## Testing Priorities

### P0: Critical Path Coverage

**1. Answer Matching Logic** (`src/lib/utils/answerMatching.ts`)
- **Why**: Core learning functionality, complex algorithm
- **Coverage Target**: >80%
- **Tests**:
  - Exact match (normalized): lowercase, trim, punctuation
  - Contains match: substring detection
  - Fuzzy match: Levenshtein distance for each grade (4, 5, 6)
  - Edge cases: empty strings, very long strings, special characters

**Example Test**:
```typescript
import { checkAnswer } from '@/lib/utils/answerMatching';

describe('checkAnswer', () => {
  describe('Grade 4 (75% threshold)', () => {
    it('accepts minor spelling mistakes', () => {
      expect(checkAnswer('fotosynteesi', 'fotosynteesin', 4)).toBe(true);
      // 92% similar > 75% threshold ✓
    });

    it('rejects very different answers', () => {
      expect(checkAnswer('ves', 'vesi', 4)).toBe(false);
      // 75% similar = 75% threshold, but too short ✗
    });
  });

  describe('Grade 6 (85% threshold)', () => {
    it('requires higher accuracy', () => {
      expect(checkAnswer('fotosynteesi', 'fotosynteesin', 6)).toBe(true);
      // 92% similar > 85% threshold ✓
    });

    it('rejects moderate mistakes', () => {
      expect(checkAnswer('fotosyntesi', 'fotosynteesin', 6)).toBe(false);
      // 80% similar < 85% threshold ✗
    });
  });
});
```

---

**2. Stratified Sampling** (`src/hooks/useGameSession.ts`)
- **Why**: Ensures fair topic distribution, complex grouping logic
- **Coverage Target**: >80%
- **Tests**:
  - Even topic distribution (e.g., 15 questions = 5 per topic for 3 topics)
  - Handles uneven topic sizes (e.g., 30 grammar + 5 vocabulary)
  - Fallback to random if <70% questions tagged
  - Edge cases: 0 topics, 1 topic, all questions same topic

**Example Test**:
```typescript
import { stratifiedSample } from '@/hooks/useGameSession';

describe('stratifiedSample', () => {
  it('distributes questions evenly across topics', () => {
    const questions = [
      { id: 1, topic: 'Grammar' },
      { id: 2, topic: 'Grammar' },
      { id: 3, topic: 'Vocabulary' },
      { id: 4, topic: 'Vocabulary' },
      { id: 5, topic: 'Pronunciation' },
      { id: 6, topic: 'Pronunciation' },
    ];

    const sampled = stratifiedSample(questions, 6);

    const topicCounts = sampled.reduce((acc, q) => {
      acc[q.topic] = (acc[q.topic] || 0) + 1;
      return acc;
    }, {});

    // Each topic should have 2 questions
    expect(topicCounts.Grammar).toBe(2);
    expect(topicCounts.Vocabulary).toBe(2);
    expect(topicCounts.Pronunciation).toBe(2);
  });

  it('falls back to random when <70% tagged', () => {
    const questions = [
      { id: 1, topic: 'Grammar' },
      { id: 2, topic: null },
      { id: 3, topic: null },
    ];

    const sampled = stratifiedSample(questions, 3);

    // Should use random sampling, not stratified
    expect(sampled.length).toBe(3);
  });
});
```

---

**3. Question Shuffling** (`src/lib/utils/shuffleArray.ts`)
- **Why**: Prevents memorization of question order
- **Coverage Target**: >80%
- **Tests**:
  - Fisher-Yates algorithm correctness
  - Maintains array length
  - Each element appears once
  - Randomness (statistical test)

**Example Test**:
```typescript
import { shuffleArray } from '@/lib/utils/shuffleArray';

describe('shuffleArray', () => {
  it('maintains array length', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.length).toBe(arr.length);
  });

  it('contains all original elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it('produces different order (statistical)', () => {
    const arr = [1, 2, 3, 4, 5];
    const results = Array.from({ length: 100 }, () => shuffleArray(arr));
    const allSame = results.every(r => JSON.stringify(r) === JSON.stringify(arr));
    expect(allSame).toBe(false); // At least one shuffle should differ
  });
});
```

---

**4. Code Generation** (`src/lib/utils/codeGenerator.ts`)
- **Why**: Secure, unique codes for question sets
- **Coverage Target**: >80%
- **Tests**:
  - Generates 6-character codes
  - Uses only [A-Z0-9]
  - Uses crypto.randomBytes (not Math.random)
  - No duplicate codes (check in integration test)

**Example Test**:
```typescript
import { generateCode } from '@/lib/utils/codeGenerator';

describe('generateCode', () => {
  it('generates 6-character codes', () => {
    const code = generateCode();
    expect(code).toHaveLength(6);
  });

  it('uses only uppercase letters and numbers', () => {
    const code = generateCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('generates unique codes', () => {
    const codes = new Set();
    for (let i = 0; i < 1000; i++) {
      codes.add(generateCode());
    }
    expect(codes.size).toBe(1000); // All unique
  });
});
```

---

### P1: API Route Testing

**1. Question Generation API** (`/api/generate-questions`)
- **Why**: Most expensive operation (AI costs), complex validation
- **Coverage Target**: >60%
- **Tests**:
  - Input validation (Zod schema)
  - AI call success
  - AI call failure (handle gracefully)
  - Response validation (70%+ valid questions)
  - Database insertion
  - Error handling (rate limit, timeout)

**Example Test**:
```typescript
import { POST } from '@/app/api/generate-questions/route';

describe('/api/generate-questions', () => {
  it('validates input schema', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ subject: 'Math' }), // Missing required fields
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('validation');
  });

  it('generates questions successfully', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        subject: 'Math',
        grade: 5,
        material: 'Sample textbook content...',
        materialType: 'text',
        poolSize: 40,
        examLength: 10,
        flashcards: false,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.codes).toHaveLength(2); // Helppo + Normaali
    expect(data.codes[0].code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('handles AI failure gracefully', async () => {
    // Mock AI client to throw error
    jest.spyOn(anthropic, 'messages').mockRejectedValueOnce(
      new Error('Rate limit exceeded')
    );

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ /* valid payload */ }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toContain('Kysymysten luonti epäonnistui');
  });
});
```

---

**2. Delete Question Set API** (`/api/delete-question-set`)
- **Why**: Ensures proper cascading delete, authorization
- **Coverage Target**: >60%
- **Tests**:
  - Successful deletion (cascade to questions)
  - Invalid code (404)
  - Database error handling

**Example Test**:
```typescript
import { DELETE } from '@/app/api/delete-question-set/route';

describe('/api/delete-question-set', () => {
  it('deletes question set and questions', async () => {
    // Setup: Create test question set
    const { code } = await createTestQuestionSet();

    const request = new Request(`http://localhost?code=${code}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    expect(response.status).toBe(200);

    // Verify cascade delete
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('question_set_code', code);
    expect(data).toHaveLength(0);
  });

  it('returns 404 for invalid code', async () => {
    const request = new Request(`http://localhost?code=INVALID`, {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    expect(response.status).toBe(404);
  });
});
```

---

### P2: Component Testing

**1. Question Components** (MultipleChoice, FillBlank, etc.)
- **Why**: Core UI functionality
- **Coverage Target**: >40%
- **Tests**:
  - Renders correctly
  - Handles user input
  - Shows correct/incorrect feedback
  - Displays explanation after answer
  - Keyboard navigation

**Example Test**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { FillBlank } from '@/components/questions/FillBlank';

describe('FillBlank', () => {
  it('accepts lenient answers based on grade', () => {
    const onAnswer = jest.fn();

    render(
      <FillBlank
        question="Täydennä: Kasvit tarvitsevat _____ valosta energiaa."
        correctAnswer="fotosynteesin"
        grade={4}
        onAnswer={onAnswer}
        showExplanation={false}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'fotosynteesi' } });

    const submitButton = screen.getByText(/Tarkista/i);
    fireEvent.click(submitButton);

    expect(onAnswer).toHaveBeenCalledWith('fotosynteesi', true);
    // Accepted due to lenient matching (Grade 4, 92% similar)
  });
});
```

---

**2. Badge Display**
- **Why**: Gamification core feature
- **Coverage Target**: >40%
- **Tests**:
  - Shows unlocked badges correctly
  - Shows locked badges with opacity
  - Correct icon/color per category

---

### P3: E2E Testing (Future)

**Critical Flows Only**:

**1. Teacher Creates Question Set**
- Upload PDF → Wait for generation → See shareable codes
- Expected duration: ~30 seconds
- Verify: 2-3 codes displayed, copy buttons work

**2. Student Practices Questions**
- Enter code → Answer 15 questions → See results
- Expected duration: ~5 minutes
- Verify: Points accumulate, streak counts, badges unlock

**3. Flashcard Practice**
- Enter flashcard code → Select topic → Answer 10 cards
- Expected duration: ~3 minutes
- Verify: Topic selection works, answers validated leniently

---

## Testing Best Practices

### Test Structure (AAA Pattern)

```typescript
describe('Component/Function Name', () => {
  it('should do something when condition', () => {
    // Arrange: Set up test data
    const input = { ... };

    // Act: Execute the code under test
    const result = functionUnderTest(input);

    // Assert: Verify the expected outcome
    expect(result).toBe(expectedValue);
  });
});
```

---

### Mocking Guidelines

**DO Mock**:
- External API calls (Anthropic Claude API)
- Database calls in unit tests (not integration tests)
- Browser APIs (localStorage, crypto.randomBytes in tests)

**DON'T Mock**:
- Pure functions (answer matching, shuffling, etc.)
- React components (use real components, not shallow rendering)
- Internal modules (test real integration, not mocks)

**Example**:
```typescript
// Mock Anthropic API
jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{ "questions": [...] }' }]
      })
    }
  }))
}));

// Don't mock pure functions - test them directly
import { checkAnswer } from '@/lib/utils/answerMatching';
// Test actual implementation, not mock
```

---

### Test Data Factories

Create reusable factories for common test data:

```typescript
// __tests__/helpers/factories.ts
export function createTestQuestion(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    question_text: 'What is 2+2?',
    question_type: 'multiple_choice',
    options: ['3', '4', '5', '6'],
    correct_answer: '4',
    explanation: 'Two plus two equals four.',
    topic: 'Arithmetic',
    ...overrides
  };
}

export function createTestQuestionSet(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    code: generateCode(),
    name: 'Test Math Set',
    subject: 'Math',
    grade: 5,
    difficulty: 'normaali',
    mode: 'quiz',
    question_count: 15,
    ...overrides
  };
}

// Usage
const question = createTestQuestion({ topic: 'Algebra' });
```

---

## Coverage Targets

### Overall Target: 40% Statement Coverage

**Why 40%?**:
- MVP product: Balance speed vs quality
- Critical paths well-tested (80%+)
- Non-critical paths lightly tested (20%+)
- Acceptable risk for educational app (not life-critical)

### Per-Module Targets:

| Module | Target | Rationale |
|--------|--------|-----------|
| `lib/utils/answerMatching.ts` | 80% | Critical logic |
| `hooks/useGameSession.ts` | 80% | Core game logic |
| `lib/utils/shuffleArray.ts` | 80% | Algorithm correctness |
| `lib/utils/codeGenerator.ts` | 80% | Security-critical |
| `lib/ai/questionGenerator.ts` | 60% | Complex, external dependency |
| `app/api/*/route.ts` | 60% | API validation & error handling |
| `components/questions/*.tsx` | 40% | UI behavior |
| `components/ui/*.tsx` | 0% | shadcn (pre-tested) |
| `lib/supabase/*.ts` | 40% | Database helpers |

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- answerMatching.test.ts

# Run tests matching pattern
npm test -- --grep "Grade 4"
```

### CI/CD Integration (Future)

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3 # Upload coverage
```

---

## Accessibility Testing

### Automated: axe-core (Future)

```typescript
// __tests__/a11y/landing-page.test.ts
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import LandingPage from '@/app/page';

expect.extend(toHaveNoViolations);

describe('Landing Page Accessibility', () => {
  it('has no WCAG violations', async () => {
    const { container } = render(<LandingPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Manual Testing Checklist

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces all content (VoiceOver, NVDA)
- [ ] Color contrast meets WCAG AAA (7:1)
- [ ] Touch targets ≥48px
- [ ] Focus indicators visible
- [ ] No keyboard traps

---

## Performance Testing

### Lighthouse CI (Future)

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:3000
            http://localhost:3000/create
            http://localhost:3000/play
          budgetPath: ./lighthouse-budget.json
```

### Lighthouse Budget

```json
// lighthouse-budget.json
{
  "performance": 90,
  "accessibility": 95,
  "best-practices": 90,
  "seo": 90
}
```

---

## Load Testing (Future)

### k6 Script Example

```javascript
// loadtest/question-generation.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10, // 10 virtual users
  duration: '30s',
};

export default function () {
  const payload = JSON.stringify({
    subject: 'Math',
    grade: 5,
    material: 'Sample content...',
    materialType: 'text',
    poolSize: 100,
    examLength: 15,
    flashcards: false,
  });

  const res = http.post('http://localhost:3000/api/generate-questions', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 30s': (r) => r.timings.duration < 30000,
  });

  sleep(1);
}
```

---

## Testing Roadmap

### Phase 1: MVP (Current)
- ✅ Vitest configured
- ⏳ Unit tests for critical paths (answer matching, stratified sampling)
- ⏳ API route tests (question generation, deletion)

### Phase 2: Beta
- ⏳ Component tests (question types, badges)
- ⏳ E2E tests for critical flows (Playwright)
- ⏳ Accessibility smoke tests (axe-core)

### Phase 3: Production
- ⏳ Full coverage (40% minimum)
- ⏳ CI/CD integration (GitHub Actions)
- ⏳ Performance testing (Lighthouse CI)
- ⏳ Load testing (k6)

---

## References

- Vitest: https://vitest.dev/
- React Testing Library: https://testing-library.com/react
- Playwright: https://playwright.dev/
- axe-core: https://github.com/dequelabs/axe-core
- k6: https://k6.io/
- Jest: https://jestjs.io/ (API compatible with Vitest)
