import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import {
  CelebrationModal,
  focusFirstElement,
  getNextFocusIndex,
  handleCelebrationKeyDown,
  type FocusableElementLike,
} from '@/components/celebrations/CelebrationModal';
import type { Badge } from '@/types';

function createKeyboardEvent(key: string, shiftKey = false) {
  let prevented = false;

  return {
    event: {
      key,
      shiftKey,
      preventDefault: () => {
        prevented = true;
      },
    },
    wasPrevented: () => prevented,
  };
}

describe('CelebrationModal', () => {
  it('renders perfect-score celebration content', () => {
    const html = renderToString(
      createElement(CelebrationModal, {
        type: 'perfect-score',
        onClose: () => {},
        questionSetName: 'Murtoluvut',
      })
    );

    assert.ok(html.includes('TÄYDELLINEN SUORITUS'));
    assert.ok(html.includes('Sait kaikki kysymykset oikein'));
    assert.ok(html.includes('Murtoluvut'));
    assert.ok(html.includes('Jatka harjoittelua'));
    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes('aria-describedby="celebration-description-perfect-score"'));
    assert.ok(html.includes('role="status"'));
  });

  it('renders all-badges celebration content with emojis', () => {
    const badges: Badge[] = [
      {
        id: 'perfect_score',
        name: 'Täydellinen',
        description: 'Täydet pisteet',
        emoji: '💯',
        unlockConditions: ['100% oikein'],
        unlocked: true,
      },
      {
        id: 'streak_3',
        name: 'Putki',
        description: '3 putkeen',
        emoji: '🔥',
        unlockConditions: ['3 oikein putkeen'],
        unlocked: true,
      },
    ];

    const html = renderToString(
      createElement(CelebrationModal, {
        type: 'all-badges',
        onClose: () => {},
        badges,
      })
    );

    assert.ok(html.includes('MESTARI SUORITTAJA'));
    assert.ok(html.includes('Olet avannut kaikki'));
    assert.ok(html.includes('>2<'));
    assert.ok(html.includes('merkkiä'));
    assert.ok(html.includes('💯'));
    assert.ok(html.includes('🔥'));
    assert.ok(html.includes('Upeaa työtä'));
    assert.ok(html.includes('aria-describedby="celebration-description-all-badges"'));
  });

  it('does not render question set name paragraph when questionSetName is missing', () => {
    const html = renderToString(
      createElement(CelebrationModal, {
        type: 'perfect-score',
        onClose: () => {},
      })
    );

    assert.equal(html.includes('undefined'), false);
  });

  it('fires onClose for Escape key handling', () => {
    let closeCalls = 0;

    const { event, wasPrevented } = createKeyboardEvent('Escape');

    handleCelebrationKeyDown(event, {
      onClose: () => {
        closeCalls += 1;
      },
      focusableElements: [],
      activeElement: null,
    });

    assert.equal(closeCalls, 1);
    assert.equal(wasPrevented(), true);
  });

  it('traps focus with tab and shift+tab', () => {
    let focusedId = '';

    const focusables: FocusableElementLike[] = [
      { focus: () => { focusedId = 'first'; } },
      { focus: () => { focusedId = 'second'; } },
    ];

    const tabEvent = createKeyboardEvent('Tab');
    handleCelebrationKeyDown(tabEvent.event, {
      onClose: () => {},
      focusableElements: focusables,
      activeElement: focusables[1] ?? null,
    });

    assert.equal(tabEvent.wasPrevented(), true);
    assert.equal(focusedId, 'first');

    const shiftTabEvent = createKeyboardEvent('Tab', true);
    handleCelebrationKeyDown(shiftTabEvent.event, {
      onClose: () => {},
      focusableElements: focusables,
      activeElement: focusables[0] ?? null,
    });

    assert.equal(shiftTabEvent.wasPrevented(), true);
    assert.equal(focusedId, 'second');
  });

  it('focuses first focusable element on open helper', () => {
    let callCount = 0;
    const moved = focusFirstElement([
      {
        focus: () => {
          callCount += 1;
        },
      },
    ]);

    assert.equal(moved, true);
    assert.equal(callCount, 1);
    assert.equal(focusFirstElement([]), false);
  });

  it('computes wrapped focus index', () => {
    assert.equal(getNextFocusIndex(0, 3, true), 2);
    assert.equal(getNextFocusIndex(2, 3, false), 0);
    assert.equal(getNextFocusIndex(-1, 3, false), 0);
    assert.equal(getNextFocusIndex(-1, 3, true), 2);
    assert.equal(getNextFocusIndex(0, 0, false), -1);
  });
});
