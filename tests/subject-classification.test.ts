import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getDefaultFlashcardContentType,
  isLanguageSubject,
  validateRuleBasedQuestion,
} from '@/lib/utils/subjectClassification';

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

describe('isLanguageSubject', () => {
  it('detects language via explicit subjectType', () => {
    assert.equal(isLanguageSubject('math', 'language'), true);
  });

  it('detects known language subjects', () => {
    assert.equal(isLanguageSubject('english'), true);
    assert.equal(isLanguageSubject('ranska'), true);
  });

  it('returns false for non-language subjects', () => {
    assert.equal(isLanguageSubject('history'), false);
  });
});

describe('getDefaultFlashcardContentType', () => {
  it('defaults language subjects to grammar', () => {
    assert.equal(getDefaultFlashcardContentType('english'), 'grammar');
    assert.equal(getDefaultFlashcardContentType('math', 'language'), 'grammar');
  });

  it('defaults non-language subjects to vocabulary', () => {
    assert.equal(getDefaultFlashcardContentType('history'), 'vocabulary');
  });
});
