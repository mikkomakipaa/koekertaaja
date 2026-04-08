import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getReviewMistakesActionLabel,
  shouldShowReviewMistakesAction,
} from '@/lib/play/results-screen';

describe('results screen actions', () => {
  it('shows a count-based review action when reviewable mistakes exist', () => {
    assert.equal(shouldShowReviewMistakesAction(2, () => {}), true);
    assert.equal(getReviewMistakesActionLabel(2), 'Kertaa virheet (2)');
  });

  it('hides the review action when there are no reviewable mistakes or no callback', () => {
    assert.equal(shouldShowReviewMistakesAction(0, () => {}), false);
    assert.equal(shouldShowReviewMistakesAction(2, undefined), false);
    assert.equal(shouldShowReviewMistakesAction(2, null), false);
  });
});
