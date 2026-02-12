import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  SUBJECTS,
  SUBJECT_GROUPS,
  getSubjectById,
  getSubjectTypeFromId,
  isValidSubjectId,
  subjectRequiresGrade,
} from '@/config/subjects';
import { getSubjectType } from '@/lib/prompts/subjectTypeMapping';

describe('subject definitions', () => {
  it('contains 17 predefined subjects', () => {
    assert.equal(SUBJECTS.length, 17);
  });

  it('groups every subject into dropdown categories without duplicates', () => {
    assert.equal(SUBJECT_GROUPS.length, 6);

    const groupedIds = SUBJECT_GROUPS.flatMap((group) => group.subjects.map((subject) => subject.id));
    const uniqueGroupedIds = new Set(groupedIds);

    assert.equal(groupedIds.length, 17);
    assert.equal(uniqueGroupedIds.size, 17);
  });

  it('resolves subject definitions and grade requirements', () => {
    assert.equal(getSubjectById('physics')?.type, 'math');
    assert.equal(getSubjectTypeFromId('art'), 'skills');
    assert.equal(subjectRequiresGrade('art'), false);
    assert.equal(subjectRequiresGrade('english'), true);
    assert.equal(isValidSubjectId('crafts'), true);
  });
});

describe('subject type mapping compatibility', () => {
  it('supports new subject ids', () => {
    assert.equal(getSubjectType('swedish'), 'language');
    assert.equal(getSubjectType('physics'), 'math');
    assert.equal(getSubjectType('environmental-studies'), 'written');
  });

  it('supports legacy free-text subject names', () => {
    assert.equal(getSubjectType('Matematiikka'), 'math');
    assert.equal(getSubjectType('Elämänkatsomustieto'), 'concepts');
    assert.equal(getSubjectType('Maantieto'), 'geography');
  });
});
