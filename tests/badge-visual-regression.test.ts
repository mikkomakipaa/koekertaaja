import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { BadgeCollectionCard } from '@/components/badges/BadgeCollectionCard';
import {
  BADGE_VISUAL_REGRESSION_BADGES,
  BADGE_VISUAL_REGRESSION_HIGHLIGHTED_IDS,
} from '@/lib/fixtures/badgeVisualRegression';

describe('badge visual regression fixtures', () => {
  it('render locked, unlocked, and highlighted badge tokens without localStorage state', () => {
    const html = renderToString(
      createElement(BadgeCollectionCard, {
        badges: BADGE_VISUAL_REGRESSION_BADGES,
        highlightedBadgeIds: BADGE_VISUAL_REGRESSION_HIGHLIGHTED_IDS,
        description: 'Fixture for regression screenshots.',
        testId: 'badge-visual-fixture',
      })
    );

    assert.ok(html.includes('Kaikki merkit'));
    assert.ok(html.includes('/<!-- -->12'));
    assert.ok(html.includes('Certified Goated - avattu'));
    assert.ok(html.includes('Slay Tarkka - lukittu'));
    assert.ok(html.includes('rounded-full'));
    assert.ok(html.includes('absolute bottom-[2px] right-[2px]'));
  });
});
