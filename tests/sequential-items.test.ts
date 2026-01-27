import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aiQuestionSchema } from '../src/lib/validation/schemas';
import { getSequentialDisplayMode, normalizeSequentialItems } from '../src/lib/questions/sequential-utils';
import { parseDatabaseQuestion, type DatabaseQuestion } from '../src/types/database';
import { aiQuestionFixtures, dbQuestionFixtures } from './fixtures/question-types';

const baseSequentialQuestion = aiQuestionFixtures.sequential;

test('aiQuestionSchema accepts sequential items as string array', () => {
  const result = aiQuestionSchema.safeParse({
    ...baseSequentialQuestion,
    items: ['Tapahtuma 1', 'Tapahtuma 2', 'Tapahtuma 3'],
    correct_order: [0, 1, 2],
  });

  assert.ok(result.success);
});

test('aiQuestionSchema accepts sequential items with optional years', () => {
  const result = aiQuestionSchema.safeParse({
    ...baseSequentialQuestion,
    items: [
      { text: 'Tapahtuma 1', year: 1917 },
      { text: 'Tapahtuma 2', year: 1939 },
      { text: 'Tapahtuma 3' },
    ],
    correct_order: [0, 1, 2],
  });

  assert.ok(result.success);
});

test('aiQuestionSchema accepts phase numbers as years', () => {
  const result = aiQuestionSchema.safeParse({
    ...baseSequentialQuestion,
    items: [
      { text: 'Muna', year: 1 },
      { text: 'Toukka', year: 2 },
      { text: 'Kotelo', year: 3 },
      { text: 'Aikuinen', year: 4 },
    ],
    correct_order: [0, 1, 2, 3],
  });

  assert.ok(result.success);
});

test('aiQuestionSchema rejects out-of-range years', () => {
  const result = aiQuestionSchema.safeParse({
    ...baseSequentialQuestion,
    items: [
      { text: 'Tapahtuma 1', year: -3001 },
      { text: 'Tapahtuma 2', year: 1939 },
      { text: 'Tapahtuma 3' },
    ],
    correct_order: [0, 1, 2],
  });

  assert.equal(result.success, false);
  if (!result.success) {
    const yearErrors = result.error.errors.filter((error) => error.path.includes('year'));
    assert.ok(yearErrors.some((error) => error.message === 'Year must be between -3000 and 3000'));
  }
});

test('parseDatabaseQuestion normalizes sequential string items', () => {
  const dbQuestion: DatabaseQuestion = {
    ...dbQuestionFixtures.sequential,
    id: '1',
    order_index: 0,
    correct_answer: {
      items: ['A', 'B', 'C'],
      correct_order: [0, 1, 2],
    },
    created_at: new Date().toISOString(),
  };

  const parsed = parseDatabaseQuestion(dbQuestion);
  assert.equal(parsed.question_type, 'sequential');
  assert.deepEqual(parsed.items, [{ text: 'A' }, { text: 'B' }, { text: 'C' }]);
});

test('parseDatabaseQuestion keeps sequential items with years', () => {
  const dbQuestion: DatabaseQuestion = {
    ...dbQuestionFixtures.sequential,
    id: '2',
    order_index: 1,
    correct_answer: {
      items: [
        { text: 'A', year: 1917 },
        { text: 'B', year: 1939 },
        { text: 'C' },
      ],
      correct_order: [0, 1, 2],
    },
    created_at: new Date().toISOString(),
  };

  const parsed = parseDatabaseQuestion(dbQuestion);
  assert.equal(parsed.question_type, 'sequential');
  assert.deepEqual(parsed.items, [
    { text: 'A', year: 1917 },
    { text: 'B', year: 1939 },
    { text: 'C' },
  ]);
});

test('normalizeSequentialItems converts string array to SequentialItem[]', () => {
  const normalized = normalizeSequentialItems(['Yksi', 'Kaksi', 'Kolme']);
  assert.deepEqual(normalized, [{ text: 'Yksi' }, { text: 'Kaksi' }, { text: 'Kolme' }]);
});

test('normalizeSequentialItems keeps SequentialItem[] intact', () => {
  const items = [
    { text: 'Yksi', year: 1917 },
    { text: 'Kaksi' },
  ];
  const normalized = normalizeSequentialItems(items);
  assert.deepEqual(normalized, items);
});

test('getSequentialDisplayMode returns timeline when years exist', () => {
  const items = [
    { text: 'A', year: 1917 },
    { text: 'B' },
  ];
  assert.equal(getSequentialDisplayMode(items), 'timeline');
});

test('getSequentialDisplayMode returns list when no years exist', () => {
  const items = [
    { text: 'A' },
    { text: 'B' },
  ];
  assert.equal(getSequentialDisplayMode(items), 'list');
});
