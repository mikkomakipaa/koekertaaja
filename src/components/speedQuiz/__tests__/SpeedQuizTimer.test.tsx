import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
// Import component directly to keep this unit test isolated from the barrel's app-router dependencies.
import { SpeedQuizTimer } from '@/components/speedQuiz/SpeedQuizTimer';

describe('SpeedQuizTimer', () => {
  it('renders with timer accessibility attributes', () => {
    const html = renderToString(
      createElement(SpeedQuizTimer, {
        timeRemaining: 7,
        timeLimit: 10,
        colorState: 'safe',
      })
    );

    assert.ok(html.includes('role="timer"'));
    assert.ok(html.includes('aria-live="polite"'));
    assert.ok(html.includes('aria-label="Aikaa jäljellä: 7 sekuntia"'));
  });

  it('calculates width from time remaining and limit', () => {
    const html = renderToString(
      createElement(SpeedQuizTimer, {
        timeRemaining: 5,
        timeLimit: 10,
        colorState: 'safe',
      })
    );

    assert.ok(html.includes('width:50%'));
  });

  it('applies safe, warning and critical color classes', () => {
    const safeHtml = renderToString(
      createElement(SpeedQuizTimer, {
        timeRemaining: 8,
        timeLimit: 10,
        colorState: 'safe',
      })
    );
    const warningHtml = renderToString(
      createElement(SpeedQuizTimer, {
        timeRemaining: 3,
        timeLimit: 10,
        colorState: 'warning',
      })
    );
    const criticalHtml = renderToString(
      createElement(SpeedQuizTimer, {
        timeRemaining: 1,
        timeLimit: 10,
        colorState: 'critical',
      })
    );

    assert.ok(safeHtml.includes('bg-emerald-500'));
    assert.ok(warningHtml.includes('bg-amber-500'));
    assert.ok(warningHtml.includes('animate-pulse-subtle'));
    assert.ok(criticalHtml.includes('bg-red-500'));
    assert.ok(criticalHtml.includes('animate-pulse-fast'));
  });

  it('shows remaining seconds text', () => {
    const html = renderToString(
      createElement(SpeedQuizTimer, {
        timeRemaining: 9,
        timeLimit: 10,
        colorState: 'safe',
      })
    );

    assert.match(html, />9(?:<!-- -->)?s</);
  });
});
