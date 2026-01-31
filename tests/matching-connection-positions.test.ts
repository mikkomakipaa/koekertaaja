import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import {
  calculateConnectionPositions,
  createDebouncedCallback,
} from '../src/components/questions/Matching';

test('calculateConnectionPositions returns line endpoints with scroll offsets', () => {
  const leftElements = {
    L1: {
      getBoundingClientRect: () => ({ left: 10, right: 110, top: 20, height: 40 }),
    },
  };
  const rightElements = {
    R1: {
      getBoundingClientRect: () => ({ left: 210, right: 310, top: 60, height: 20 }),
    },
  };

  const positions = calculateConnectionPositions(
    { L1: 'R1' },
    leftElements,
    rightElements,
    { scrollX: 5, scrollY: 100 }
  );

  assert.equal(positions.length, 1);
  assert.deepEqual(positions[0], {
    leftId: 'L1',
    rightId: 'R1',
    x1: 115,
    y1: 140,
    x2: 215,
    y2: 170,
  });
});

test('calculateConnectionPositions skips pairs without elements', () => {
  const positions = calculateConnectionPositions(
    { L1: 'R1', L2: 'R2' },
    {
      L1: { getBoundingClientRect: () => ({ left: 0, right: 10, top: 0, height: 10 }) },
    },
    {
      R1: { getBoundingClientRect: () => ({ left: 20, right: 30, top: 0, height: 10 }) },
    }
  );

  assert.equal(positions.length, 1);
  assert.equal(positions[0].leftId, 'L1');
  assert.equal(positions[0].rightId, 'R1');
});

test('createDebouncedCallback batches rapid calls', async () => {
  let calls = 0;
  const debounced = createDebouncedCallback(() => {
    calls += 1;
  }, 30);

  debounced();
  debounced();
  debounced();

  await delay(40);
  assert.equal(calls, 1);
  debounced.cancel();
});
