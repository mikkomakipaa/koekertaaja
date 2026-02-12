import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeValidationCoverage,
  getAlternativeRepresentations,
  smartValidateAnswer,
} from './smartAnswerValidation';

test('smartValidateAnswer: normalized string matches', () => {
  const pairs: Array<[string, string]> = [
    ['  Suomi  ', 'suomi'],
    ['Helsinki!', 'helsinki'],
    ['CO2', 'co2'],
    ['Maito,', 'maito'],
    ['Sähkö? ', ' sähkö'],
    ['testi   vastaus', 'testi vastaus'],
  ];

  for (const [user, correct] of pairs) {
    const result = smartValidateAnswer(user, correct);
    assert.equal(result.isCorrect, true);
    assert.equal(result.matchType, 'exact');
  }
});

test('smartValidateAnswer: numerical equivalence', () => {
  const pairs: Array<[string, string]> = [
    ['0.5', '1/2'],
    ['1/2', '0,5'],
    ['25%', '0.25'],
    ['0.25', '25%'],
    ['3,14', '3.14'],
    ['-1/2', '-0.5'],
    ['50%', '1/2'],
    ['2', '2.0'],
    ['0,125', '1/8'],
    ['200%', '2'],
    ['0.001', '1/1000'],
    ['12,5%', '0.125'],
  ];

  for (const [user, correct] of pairs) {
    const result = smartValidateAnswer(user, correct);
    assert.equal(result.isCorrect, true, `${user} should match ${correct}`);
    assert.ok(
      result.matchType === 'numerical' || result.matchType === 'exact',
      `Expected numerical or exact match type, got ${result.matchType}`
    );
  }

  const negativePairs: Array<[string, string]> = [
    ['1/3', '0.5'],
    ['24%', '0.25'],
    ['abc', '1'],
    ['3/0', '1'],
    ['-', '2'],
  ];

  for (const [user, correct] of negativePairs) {
    const result = smartValidateAnswer(user, correct);
    assert.equal(result.isCorrect, false, `${user} should not match ${correct}`);
  }
});

test('smartValidateAnswer: unit conversion equivalence', () => {
  const pairs: Array<[string, string]> = [
    ['5 cm', '50 mm'],
    ['1 m', '100 cm'],
    ['2 km', '2000 m'],
    ['1 kg', '1000 g'],
    ['2500 mg', '2.5 g'],
    ['2 min', '120 s'],
    ['1 h', '60 min'],
    ['1 d', '24 h'],
    ['273.15 K', '0 C'],
    ['32 F', '0 C'],
    ['212 F', '100 C'],
    ['0 °C', '273.15 K'],
    ['50 sec', '50 s'],
    ['1 t', '1000 kg'],
    ['0,5 m', '50 cm'],
  ];

  for (const [user, correct] of pairs) {
    const result = smartValidateAnswer(user, correct);
    assert.equal(result.isCorrect, true, `${user} should match ${correct}`);
    assert.equal(result.matchType, 'unit_conversion');
  }

  const negativePairs: Array<[string, string]> = [
    ['5 cm', '5 g'],
    ['1 h', '1 kg'],
    ['10 C', '10 K'],
    ['2 min', '119 s'],
    ['1 km', '999 m'],
  ];

  for (const [user, correct] of negativePairs) {
    assert.equal(smartValidateAnswer(user, correct).isCorrect, false);
  }
});

test('smartValidateAnswer: expression equivalence and chemistry formatting', () => {
  const pairs: Array<[string, string]> = [
    ['CO2', 'CO₂'],
    ['H2O', 'H₂O'],
    ['x+3', '3+x'],
    ['2x + 3', '3 + 2x'],
    ['2*x+3', '3+2*x'],
    ['x*y+3', '3+y*x'],
    ['A+B+C', 'C+A+B'],
    ['m*n+2+p', 'p+2+n*m'],
    ['Na2SO4', 'Na₂SO₄'],
    ['x + y + z', 'z + x + y'],
  ];

  for (const [user, correct] of pairs) {
    const result = smartValidateAnswer(user, correct);
    assert.equal(result.isCorrect, true, `${user} should match ${correct}`);
    if (result.matchType !== 'exact') {
      assert.equal(result.matchType, 'expression');
    }
  }

  const negativePairs: Array<[string, string]> = [
    ['x+3', 'x+4'],
    ['H2O', 'H2O2'],
    ['a+b', 'a-b'],
    ['2*x', '2/x'],
    ['x+y', 'x+y+z'],
  ];

  for (const [user, correct] of negativePairs) {
    assert.equal(smartValidateAnswer(user, correct).isCorrect, false);
  }
});

test('smartValidateAnswer: semantic alternatives for selected subjects', () => {
  const pairs: Array<[string, string, string]> = [
    ['Suomi', 'Suomen tasavalta', 'society'],
    ['helsingfors', 'Helsinki', 'swedish'],
    ['european union', 'EU', 'society'],
    ['riksdag', 'eduskunta', 'history'],
    ['tasavallan presidentti', 'presidentti', 'finnish'],
  ];

  for (const [user, correct, subject] of pairs) {
    const result = smartValidateAnswer(user, correct, { subject });
    assert.equal(result.isCorrect, true, `${user} should match ${correct} in ${subject}`);
    assert.equal(result.matchType, 'semantic');
  }

  const unsupportedSubject = smartValidateAnswer('Suomi', 'Suomen tasavalta', { subject: 'math' });
  assert.equal(unsupportedSubject.isCorrect, false);
  assert.equal(unsupportedSubject.matchType, 'none');
});

test('getAlternativeRepresentations returns useful alternatives', () => {
  const halfAlternatives = getAlternativeRepresentations('1/2');
  assert.ok(halfAlternatives.includes('0.5'));
  assert.ok(halfAlternatives.includes('50%'));

  const percentAlternatives = getAlternativeRepresentations('25%');
  assert.ok(percentAlternatives.includes('0.25'));
  assert.ok(percentAlternatives.includes('1/4'));

  const unitAlternatives = getAlternativeRepresentations('5 cm');
  assert.ok(unitAlternatives.includes('0.05 m'));
  assert.ok(unitAlternatives.includes('50 mm'));

  const semanticAlternatives = getAlternativeRepresentations('Suomi');
  assert.ok(semanticAlternatives.includes('suomen tasavalta'));
  assert.ok(semanticAlternatives.includes('finland'));
});

test('analyzeValidationCoverage reports expected match layers', () => {
  const numberCoverage = analyzeValidationCoverage({
    questionType: 'short_answer',
    subject: 'math',
    correctAnswer: '1/2',
  });
  assert.ok(numberCoverage.supports.includes('exact'));
  assert.ok(numberCoverage.supports.includes('numerical'));

  const unitCoverage = analyzeValidationCoverage({
    questionType: 'short_answer',
    subject: 'physics',
    correctAnswer: '120 s',
  });
  assert.ok(unitCoverage.supports.includes('unit_conversion'));

  const expressionCoverage = analyzeValidationCoverage({
    questionType: 'short_answer',
    subject: 'math',
    correctAnswer: '2x + 3',
  });
  assert.ok(expressionCoverage.supports.includes('expression'));

  const semanticCoverage = analyzeValidationCoverage({
    questionType: 'short_answer',
    subject: 'society',
    correctAnswer: 'Suomen tasavalta',
  });
  assert.ok(semanticCoverage.supports.includes('semantic'));

  const exactOnly = analyzeValidationCoverage({
    questionType: 'true_false',
    subject: 'math',
    correctAnswer: 'true',
  });
  assert.deepEqual(exactOnly.supports, ['exact']);
});

test('smartValidateAnswer benchmark handles 1000+ samples quickly', () => {
  const samples: Array<[string, string]> = [];
  for (let i = 1; i <= 1200; i += 1) {
    samples.push([`${i}/2`, `${i * 50}%`]);
  }

  const startedAt = Date.now();
  let accepted = 0;
  for (const [user, correct] of samples) {
    if (smartValidateAnswer(user, correct).isCorrect) {
      accepted += 1;
    }
  }
  const durationMs = Date.now() - startedAt;

  assert.equal(accepted, samples.length);
  assert.ok(durationMs < 500, `expected under 500ms, got ${durationMs}ms`);
});
