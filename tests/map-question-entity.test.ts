import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMapQuestion, deleteMapQuestion, getMapQuestionByIdAdmin } from '@/lib/supabase/write-queries';

const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

test('creates and fetches a map question via helpers', { skip: !hasSupabaseEnv }, async () => {
  const created = await createMapQuestion({
    question_set_id: null,
    subject: 'Maantieto',
    grade: 5,
    difficulty: 'normaali',
    question: 'Valitse kartasta maakunta, jossa Helsinki sijaitsee.',
    explanation: 'Helsinki sijaitsee Uudenmaan maakunnassa.',
    topic: 'Suomen maakunnat',
    subtopic: 'Uusimaa',
    skill: 'regions',
    map_asset: '/maps/finland/finland_counties_v1.png',
    input_mode: 'single_region',
    regions: [
      { id: 'uusimaa', label: 'Uusimaa', aliases: ['Uudenmaan maakunta'] },
      { id: 'hame', label: 'Hame' },
    ],
    correct_answer: 'uusimaa',
    acceptable_answers: ['Uusimaa'],
    metadata: { source: 'test' },
  });

  assert.ok(created?.id, 'Map question was not created');

  try {
    const fetched = await getMapQuestionByIdAdmin(created.id);
    assert.ok(fetched, 'Map question was not fetched');
    assert.equal(fetched?.map_asset, '/maps/finland/finland_counties_v1.png');
    assert.equal(fetched?.input_mode, 'single_region');
    assert.equal(fetched?.regions[0]?.id, 'uusimaa');
    assert.equal(fetched?.correct_answer, 'uusimaa');
  } finally {
    if (created?.id) {
      await deleteMapQuestion(created.id);
    }
  }
});
