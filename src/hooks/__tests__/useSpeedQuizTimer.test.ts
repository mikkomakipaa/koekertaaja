import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  createSpeedQuizTimerController,
  getTimerColorState,
} from '@/hooks/useSpeedQuizTimer';

describe('useSpeedQuizTimer core logic', () => {
  it('counts down correctly', (context) => {
    context.mock.timers.enable({ apis: ['setInterval', 'Date'], now: 0 });
    const controller = createSpeedQuizTimerController(10, () => {});

    controller.start();
    context.mock.timers.tick(1500);

    const { timeRemaining, isRunning } = controller.getState();
    assert.ok(timeRemaining <= 8.6 && timeRemaining >= 8.4);
    assert.strictEqual(isRunning, true);
  });

  it('fires onExpire exactly once at 0', (context) => {
    context.mock.timers.enable({ apis: ['setInterval', 'Date'], now: 0 });
    let expiredCount = 0;
    const controller = createSpeedQuizTimerController(1, () => {
      expiredCount += 1;
    });

    controller.start();
    context.mock.timers.tick(1100);
    context.mock.timers.tick(2000);

    const { timeRemaining, isRunning } = controller.getState();
    assert.strictEqual(timeRemaining, 0);
    assert.strictEqual(isRunning, false);
    assert.strictEqual(expiredCount, 1);
  });

  it('transitions color states at 4s and 2s thresholds', () => {
    assert.strictEqual(getTimerColorState(4), 'safe');
    assert.strictEqual(getTimerColorState(3.99), 'warning');
    assert.strictEqual(getTimerColorState(2), 'warning');
    assert.strictEqual(getTimerColorState(1.99), 'critical');
  });

  it('supports start and stop controls', (context) => {
    context.mock.timers.enable({ apis: ['setInterval', 'Date'], now: 0 });
    const controller = createSpeedQuizTimerController(10, () => {});

    controller.start();
    context.mock.timers.tick(1000);
    controller.stop();
    const stoppedTime = controller.getState().timeRemaining;

    context.mock.timers.tick(2000);
    assert.strictEqual(controller.getState().timeRemaining, stoppedTime);
    assert.strictEqual(controller.getState().isRunning, false);

    controller.start();
    context.mock.timers.tick(500);
    assert.ok(controller.getState().timeRemaining < stoppedTime);
  });

  it('reset returns timer to initial value', (context) => {
    context.mock.timers.enable({ apis: ['setInterval', 'Date'], now: 0 });
    const controller = createSpeedQuizTimerController(10, () => {});

    controller.start();
    context.mock.timers.tick(2300);
    controller.reset();

    const state = controller.getState();
    assert.strictEqual(state.timeRemaining, 10);
    assert.strictEqual(state.isRunning, false);
    assert.strictEqual(state.colorState, 'safe');
  });

  it('cleanup clears interval and prevents further countdown updates', (context) => {
    context.mock.timers.enable({ apis: ['setInterval', 'Date'], now: 0 });
    const controller = createSpeedQuizTimerController(10, () => {});

    controller.start();
    context.mock.timers.tick(900);
    const beforeDispose = controller.getState().timeRemaining;

    controller.dispose();
    context.mock.timers.tick(2000);

    assert.strictEqual(controller.getState().timeRemaining, beforeDispose);
    assert.strictEqual(controller.getState().isRunning, false);
  });
});

