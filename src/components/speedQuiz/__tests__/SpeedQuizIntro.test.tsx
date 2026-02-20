import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import {
  SpeedQuizIntro,
  SPEED_QUIZ_COUNTDOWN_STEPS,
  createSpeedQuizIntroCountdown,
} from '@/components/speedQuiz/SpeedQuizIntro';

describe('SpeedQuizIntro', () => {
  it('renders in ready state with instructions and Valmis button', () => {
    const html = renderToString(
      createElement(SpeedQuizIntro, {
        questionSetName: 'Murtoluvut',
        onStart: () => {},
      })
    );

    assert.ok(html.includes('Aikahaaste: '));
    assert.ok(html.includes('Murtoluvut'));
    assert.ok(html.includes('10 kysymystä'));
    assert.ok(html.includes('15 sekuntia per kysymys'));
    assert.ok(html.includes('Ei taukoja - ole valmis!'));
    assert.ok(html.includes('Valmis?'));
  });

  it('starts countdown and advances 3 -> 2 -> 1 -> Aloita! every second', (context) => {
    context.mock.timers.enable({ apis: ['setTimeout'] });

    const seenSteps: string[] = [];
    const countdown = createSpeedQuizIntroCountdown(
      (step) => {
        seenSteps.push(step);
      },
      () => {}
    );

    countdown.start();
    assert.deepStrictEqual(seenSteps, ['3']);

    context.mock.timers.tick(1000);
    assert.deepStrictEqual(seenSteps, ['3', '2']);

    context.mock.timers.tick(1000);
    assert.deepStrictEqual(seenSteps, ['3', '2', '1']);

    context.mock.timers.tick(1000);
    assert.deepStrictEqual(seenSteps, [...SPEED_QUIZ_COUNTDOWN_STEPS]);
  });

  it('fires onStart callback after countdown completes', (context) => {
    context.mock.timers.enable({ apis: ['setTimeout'] });

    let onStartCallCount = 0;
    const countdown = createSpeedQuizIntroCountdown(
      () => {},
      () => {
        onStartCallCount += 1;
      }
    );

    countdown.start();
    context.mock.timers.tick(1000);
    context.mock.timers.tick(1000);
    context.mock.timers.tick(1000);
    assert.strictEqual(onStartCallCount, 0);

    context.mock.timers.tick(1000);
    assert.strictEqual(onStartCallCount, 1);

    context.mock.timers.tick(5000);
    assert.strictEqual(onStartCallCount, 1);
  });
});
