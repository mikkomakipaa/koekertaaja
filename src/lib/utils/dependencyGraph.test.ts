import assert from 'node:assert/strict';
import test from 'node:test';
import { ConceptDependencyResolver, dependencyResolver } from './dependencyGraph';

test('resolveConceptId supports ids and labels', () => {
  assert.equal(dependencyResolver.resolveConceptId('math', 'fractions_intro'), 'fractions_intro');
  assert.equal(
    dependencyResolver.resolveConceptId('mathematics', 'Murtoluvut (peruskäsite)'),
    'fractions_intro'
  );
  assert.equal(
    dependencyResolver.resolveConceptId('finnish', 'Sanaluokat (substantiivi, verbi, adjektiivi)'),
    'word_types'
  );
  assert.equal(dependencyResolver.resolveConceptId('physics', 'unknown_concept'), null);
});

test('getAllPrerequisites returns direct and transitive dependencies', () => {
  const percentagesPrereqs = dependencyResolver.getAllPrerequisites('math', 'percentages');

  assert.ok(percentagesPrereqs.has('fraction_operations'));
  assert.ok(percentagesPrereqs.has('decimals'));
  assert.ok(percentagesPrereqs.has('fractions_intro'));
  assert.ok(percentagesPrereqs.has('basic_arithmetic'));
  assert.equal(percentagesPrereqs.has('pythagorean_theorem'), false);

  const pythagoreanPrereqs = dependencyResolver.getAllPrerequisites('math', 'pythagorean_theorem');
  assert.ok(pythagoreanPrereqs.has('right_triangles'));
  assert.ok(pythagoreanPrereqs.has('angles'));
  assert.ok(pythagoreanPrereqs.has('triangles'));
  assert.ok(pythagoreanPrereqs.has('square_root'));
});

test('canTeachBefore rejects invalid dependency direction', () => {
  assert.equal(
    dependencyResolver.canTeachBefore('math', 'fractions_intro', 'basic_arithmetic'),
    false
  );
  assert.equal(
    dependencyResolver.canTeachBefore('math', 'basic_arithmetic', 'fractions_intro'),
    true
  );
  assert.equal(
    dependencyResolver.canTeachBefore('society', 'eu_formation', 'eu_expansion'),
    true
  );
  assert.equal(
    dependencyResolver.canTeachBefore('society', 'eu_expansion', 'eu_formation'),
    false
  );
});

test('getTeachingOrder sorts unique concept ids topologically', () => {
  const input = ['percentages', 'basic_arithmetic', 'fractions_intro', 'decimals'];
  const ordered = dependencyResolver.getTeachingOrder('math', input);

  assert.ok(ordered.indexOf('basic_arithmetic') < ordered.indexOf('fractions_intro'));
  assert.ok(ordered.indexOf('fractions_intro') < ordered.indexOf('decimals'));
  assert.ok(ordered.indexOf('fractions_intro') < ordered.indexOf('percentages'));
});

test('getFoundationalConceptsForGrade assumes lower-grade knowledge', () => {
  const grade6Foundational = dependencyResolver.getFoundationalConceptsForGrade('math', 6);
  assert.ok(grade6Foundational.has('basic_arithmetic'));
  assert.ok(grade6Foundational.has('angles'));
  assert.ok(grade6Foundational.has('triangles'));
  assert.equal(grade6Foundational.has('pythagorean_theorem'), false);
});

test('getAvailableConcepts returns grade-constrained and prerequisite-ready concepts', () => {
  const available = dependencyResolver.getAvailableConcepts('math', 6, ['basic_arithmetic', 'fractions_intro']);
  const conceptIds = new Set(available.map((node) => node.id));

  assert.ok(conceptIds.has('fraction_operations'));
  assert.ok(conceptIds.has('decimals'));
  assert.ok(conceptIds.has('negative_numbers'));
  assert.equal(conceptIds.has('chemical_equations'), false);
});

test('validateQuestionSet flags missing prerequisites without grade context', () => {
  const invalid = dependencyResolver.validateQuestionSet('math', [
    { conceptId: 'percentages', order: 0 },
    { conceptId: 'basic_arithmetic', order: 1 },
  ]);

  assert.equal(invalid.valid, false);
  assert.ok(invalid.violations.length > 0);
  assert.ok(invalid.violations.some((v) => v.missingPrereq === 'fraction_operations'));
});

test('validateQuestionSet passes when grade-based foundational concepts are known', () => {
  const result = dependencyResolver.validateQuestionSet(
    'math',
    [{ conceptId: 'pythagorean_theorem', order: 0 }],
    { grade: 7 }
  );

  assert.equal(result.valid, true);
  assert.equal(result.violations.length, 0);
});

test('reorderQuestionsByDependencies reorders violating sequence and fixes order indexes', () => {
  const questions = [
    { id: 'q1', topic: 'Matematiikka', subtopic: 'fraction_operations', order_index: 0 },
    { id: 'q2', topic: 'Matematiikka', subtopic: 'fractions_intro', order_index: 1 },
    { id: 'q3', topic: 'Matematiikka', subtopic: 'basic_arithmetic', order_index: 2 },
  ];

  const result = dependencyResolver.reorderQuestionsByDependencies('math', questions, { grade: 4 });
  assert.equal(result.changed, true);
  assert.equal(result.validation.valid, true);

  const orderedIds = result.reorderedQuestions.map((question) => question.id);
  assert.deepEqual(orderedIds, ['q3', 'q2', 'q1']);
  assert.deepEqual(
    result.reorderedQuestions.map((question) => question.order_index),
    [0, 1, 2]
  );
});

test('reorderQuestionsByDependencies keeps stable order when no dependency data exists', () => {
  const questions = [
    { id: 'a', topic: 'Unknown', subtopic: 'foo', order_index: 7 },
    { id: 'b', topic: 'Unknown', subtopic: 'bar', order_index: 3 },
  ];

  const result = dependencyResolver.reorderQuestionsByDependencies('history', questions);
  assert.equal(result.changed, false);
  assert.deepEqual(result.reorderedQuestions.map((q) => q.id), ['a', 'b']);
  assert.deepEqual(result.reorderedQuestions.map((q) => q.order_index), [7, 3]);
});

test('extractConceptIdFromQuestion prioritizes explicit concept_id then subtopic', () => {
  const resolved = dependencyResolver.extractConceptIdFromQuestion('society', {
    concept_id: 'eu_formation',
    subtopic: 'community_basics',
    skill: 'rights_and_duties',
    topic: 'Society',
  });
  assert.equal(resolved, 'eu_formation');

  const fallback = dependencyResolver.extractConceptIdFromQuestion('society', {
    subtopic: 'EU:n laajentuminen',
    topic: 'Yhteiskuntaoppi',
  });
  assert.equal(fallback, 'eu_expansion');
});

test('getDependencyPromptSection returns usable guidance for dependency-enabled subject', () => {
  const section = dependencyResolver.getDependencyPromptSection('math', 6);
  assert.ok(section.includes('KONSEPTIEN RIIPPUVUUSOHJE'));
  assert.ok(section.includes('fractions_intro'));
  assert.ok(section.includes('subtopic'));

  const empty = dependencyResolver.getDependencyPromptSection('history', 6);
  assert.equal(empty, '');
});

test('dependency matrix sanity checks across subjects (30+ cases)', () => {
  const cases: Array<{ subject: string; concept: string; prereq: string; expected: boolean }> = [
    { subject: 'math', concept: 'fractions_intro', prereq: 'basic_arithmetic', expected: true },
    { subject: 'math', concept: 'fraction_operations', prereq: 'fractions_intro', expected: true },
    { subject: 'math', concept: 'decimals', prereq: 'fractions_intro', expected: true },
    { subject: 'math', concept: 'percentages', prereq: 'fraction_operations', expected: true },
    { subject: 'math', concept: 'percentages', prereq: 'decimals', expected: true },
    { subject: 'math', concept: 'area_perimeter', prereq: 'measurement', expected: true },
    { subject: 'math', concept: 'right_triangles', prereq: 'triangles', expected: true },
    { subject: 'math', concept: 'pythagorean_theorem', prereq: 'right_triangles', expected: true },
    { subject: 'math', concept: 'pythagorean_theorem', prereq: 'square_root', expected: true },
    { subject: 'finnish', concept: 'noun_cases', prereq: 'word_types', expected: true },
    { subject: 'finnish', concept: 'all_cases', prereq: 'noun_cases', expected: true },
    { subject: 'finnish', concept: 'passive_voice', prereq: 'verb_tenses', expected: true },
    { subject: 'finnish', concept: 'punctuation', prereq: 'compound_sentences', expected: true },
    { subject: 'finnish', concept: 'argumentative_writing', prereq: 'formal_writing', expected: true },
    { subject: 'chemistry', concept: 'elements', prereq: 'atoms', expected: true },
    { subject: 'chemistry', concept: 'element_symbols', prereq: 'elements', expected: true },
    { subject: 'chemistry', concept: 'chemical_formulas', prereq: 'compounds', expected: true },
    { subject: 'chemistry', concept: 'chemical_equations', prereq: 'valence', expected: true },
    { subject: 'chemistry', concept: 'balancing_equations', prereq: 'chemical_equations', expected: true },
    { subject: 'physics', concept: 'speed', prereq: 'motion_basics', expected: true },
    { subject: 'physics', concept: 'force', prereq: 'measurement_units', expected: true },
    { subject: 'physics', concept: 'newtons_laws', prereq: 'force', expected: true },
    { subject: 'physics', concept: 'newtons_laws', prereq: 'acceleration', expected: true },
    { subject: 'physics', concept: 'work_power', prereq: 'energy_basics', expected: true },
    { subject: 'physics', concept: 'ohms_law', prereq: 'voltage_resistance', expected: true },
    { subject: 'society', concept: 'citizenship_basics', prereq: 'rules_and_responsibilities', expected: true },
    { subject: 'society', concept: 'democracy_basics', prereq: 'citizenship_basics', expected: true },
    { subject: 'society', concept: 'elections', prereq: 'democracy_basics', expected: true },
    { subject: 'society', concept: 'parliament_government', prereq: 'elections', expected: true },
    { subject: 'society', concept: 'eu_membership', prereq: 'eu_formation', expected: true },
    { subject: 'society', concept: 'eu_expansion', prereq: 'eu_membership', expected: true },
    { subject: 'society', concept: 'tax_basics', prereq: 'household_budget', expected: true },
  ];

  cases.forEach(({ subject, concept, prereq, expected }) => {
    const prereqs = dependencyResolver.getAllPrerequisites(subject, concept);
    assert.equal(
      prereqs.has(prereq),
      expected,
      `${subject}:${concept} should ${expected ? '' : 'not '}depend on ${prereq}`
    );
  });
});

test('custom resolver supports dependency injection for edge scenarios', () => {
  const resolver = new ConceptDependencyResolver({
    mathematics: {
      grade_4: {
        a: { id: 'a', label: 'A', prerequisites: [], enables: ['b'] },
        b: { id: 'b', label: 'B', prerequisites: ['a'], enables: ['c'] },
        c: { id: 'c', label: 'C', prerequisites: ['b'], enables: [] },
      },
    },
  });

  const validation = resolver.validateQuestionSet('math', [
    { conceptId: 'c', order: 0 },
    { conceptId: 'a', order: 1 },
    { conceptId: 'b', order: 2 },
  ]);

  assert.equal(validation.valid, false);
  assert.ok(validation.violations.length >= 2);

  const reordered = resolver.reorderQuestionsByDependencies('math', [
    { id: '1', subtopic: 'c', order_index: 0 },
    { id: '2', subtopic: 'a', order_index: 1 },
    { id: '3', subtopic: 'b', order_index: 2 },
  ]);

  assert.equal(reordered.validation.valid, true);
  assert.deepEqual(reordered.reorderedQuestions.map((q) => q.id), ['2', '3', '1']);
});
