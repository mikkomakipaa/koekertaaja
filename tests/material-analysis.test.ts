import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { analyzeMaterialCapacity, validateQuestionCount } from '@/lib/utils/materialAnalysis';

describe('materialAnalysis', () => {
  it('warns for very sparse material when requesting too many questions', () => {
    const text = 'Helsinki on Suomen pääkaupunki. Suomi sijaitsee Pohjois-Euroopassa.';
    const capacity = analyzeMaterialCapacity(text);
    const validation = validateQuestionCount(20, capacity);

    assert.equal(capacity.richness === 'very_sparse' || capacity.richness === 'sparse', true);
    assert.equal(capacity.wordCount > 0, true);
    assert.equal(capacity.estimatedConcepts >= 2, true);
    assert.equal(validation.status, 'excessive');
    assert.equal(validation.recommendedCount, capacity.optimalQuestionCount);
  });

  it('supports moderate material around 15-25 questions', () => {
    const sentence =
      'Kasvit tarvitsevat vettä, valoa ja ravinteita kasvaakseen ja tuottaakseen happea ympäristöön.';
    const text = Array.from({ length: 60 }).map(() => sentence).join(' ');

    const capacity = analyzeMaterialCapacity(text);
    const validation = validateQuestionCount(20, capacity);

    assert.equal(capacity.wordCount >= 500, true);
    assert.equal(capacity.richness === 'moderate' || capacity.richness === 'rich' || capacity.richness === 'very_rich', true);
    assert.equal(capacity.optimalQuestionCount >= 15, true);
    assert.equal(capacity.acceptableQuestionCount >= 20, true);
    assert.equal(validation.status === 'optimal' || validation.status === 'acceptable', true);
  });

  it('supports 50+ questions for rich long material', () => {
    const sentence =
      'Energian tuotanto, kulutus, varastointi ja siirto muodostavat laajan kokonaisuuden, jossa jokainen osa vaikuttaa toiseen.';
    const text = Array.from({ length: 250 }).map(() => sentence).join(' ');

    const capacity = analyzeMaterialCapacity(text);
    const validation = validateQuestionCount(55, capacity);

    assert.equal(capacity.wordCount >= 2000, true);
    assert.equal(capacity.optimalQuestionCount >= 50, true);
    assert.equal(capacity.maxQuestionCount >= 55, true);
    assert.equal(validation.status !== 'excessive', true);
  });

  it('counts structural elements for concept estimation', () => {
    const text = [
      '# Biologia',
      '- Solu',
      '- DNA',
      '- Mitokondrio',
      'Ihmisellä on 206 luuta.',
      'Helsinki ja Turku ovat Suomen kaupunkeja.',
    ].join('\n');

    const capacity = analyzeMaterialCapacity(text);

    assert.equal(capacity.estimatedConcepts >= 6, true);
    assert.equal(capacity.sentenceCount >= 2, true);
  });

  it('returns recommendations when capacity is low', () => {
    const text = 'Kuu kiertää maata. Aurinko on tähti.';
    const capacity = analyzeMaterialCapacity(text);

    assert.equal(capacity.recommendations.length > 0, true);
    assert.equal(
      capacity.recommendations.some((rec) => rec.includes('Suosittelemme vähintään 200 sanaa.')),
      true
    );
  });
});
