import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { validateRuleBasedQuestion } from '@/lib/utils/subjectClassification';

describe('validateRuleBasedQuestion', () => {
  it('accepts language rule cards with non-starter phrasing', () => {
    const result = validateRuleBasedQuestion(
      {
        question: 'Milloin käytetään be-verbin muotoa "are"?',
        type: 'short_answer',
      },
      'english',
      'grammar'
    );

    assert.equal(result.valid, true);
  });

  it('still rejects explicit language practice drills', () => {
    const result = validateRuleBasedQuestion(
      {
        question: 'Muodosta lause käyttäen verbiä play',
        type: 'short_answer',
      },
      'english',
      'grammar'
    );

    assert.equal(result.valid, false);
    assert.match(result.reason ?? '', /practice instruction/i);
  });

  it('keeps starter requirement for non-language rule subjects', () => {
    const result = validateRuleBasedQuestion(
      {
        question: 'Kerro kolmion kaava',
        type: 'short_answer',
      },
      'matematiikka',
      'geometria'
    );

    assert.equal(result.valid, false);
    assert.match(result.reason ?? '', /rule-teaching format/i);
  });
});
