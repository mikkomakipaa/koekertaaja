import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';

const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

test('persists subject_type, skill, and subtopic on question sets', { skip: !hasSupabaseEnv }, async () => {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  const code = crypto.randomBytes(3).toString('hex').toUpperCase();

  const questionSetInput = {
    code,
    name: 'Test Set - Subject Type',
    subject: 'Matematiikka',
    subject_type: 'math' as const,
    difficulty: 'normaali' as const,
    mode: 'quiz' as const,
    grade: 4,
    topic: 'Laskut',
    subtopic: 'Peruslaskut',
    question_count: 1,
  };

  const { data: createdSet, error: setError } = await supabaseAdmin
    .from('question_sets')
    .insert(questionSetInput)
    .select()
    .single();

  assert.ifError(setError);
  const questionSetId = createdSet?.id;
  assert.ok(questionSetId, 'Question set ID missing after creation');

  try {
    const { error: questionInsertError } = await supabaseAdmin.from('questions').insert({
      question_set_id: questionSetId,
      question_text: 'Mika on 2 + 2?',
      question_type: 'multiple_choice',
      correct_answer: '4',
      options: ['3', '4'],
      explanation: '2 + 2 = 4.',
      order_index: 0,
      topic: 'Laskut',
      subtopic: 'Peruslaskut',
      skill: 'addition',
    });

    assert.ifError(questionInsertError);

    const { data: setRow, error: readSetError } = await supabaseAdmin
      .from('question_sets')
      .select('subject_type')
      .eq('id', questionSetId)
      .single();

    assert.ifError(readSetError);
    assert.equal(setRow?.subject_type, 'math');

    const { data: questionRows, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('skill, subtopic')
      .eq('question_set_id', questionSetId);

    assert.ifError(questionsError);
    assert.equal(questionRows?.length, 1);
    assert.equal(questionRows?.[0]?.skill, 'addition');
    assert.equal(questionRows?.[0]?.subtopic, 'Peruslaskut');
  } finally {
    await supabaseAdmin.from('question_sets').delete().eq('id', questionSetId);
  }
});

test('persists map question options and answers', { skip: !hasSupabaseEnv }, async () => {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const code = crypto.randomBytes(3).toString('hex').toUpperCase();

  const { data: createdSet, error: setError } = await supabaseAdmin
    .from('question_sets')
    .insert({
      code,
      name: 'Test Set - Map Question',
      subject: 'Maantieto',
      difficulty: 'normaali',
      mode: 'quiz',
      grade: 5,
      question_count: 1,
    })
    .select()
    .single();

  assert.ifError(setError);
  const questionSetId = createdSet?.id;
  assert.ok(questionSetId, 'Question set ID missing after creation');

  try {
    const { error: questionInsertError } = await supabaseAdmin.from('questions').insert({
      question_set_id: questionSetId,
      question_text: 'Valitse kartasta Suomen maakunta, jossa Helsinki sijaitsee.',
      question_type: 'map',
      correct_answer: 'uusimaa',
      options: {
        mapAsset: '/maps/finland/finland_counties_v1.png',
        inputMode: 'single_region',
        regions: [
          { id: 'uusimaa', label: 'Uusimaa', aliases: ['Uudenmaan maakunta'] },
        ],
      },
      explanation: 'Helsinki sijaitsee Uudenmaan maakunnassa.',
      order_index: 0,
    });

    assert.ifError(questionInsertError);

    const { data: questionRows, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('question_type, correct_answer, options')
      .eq('question_set_id', questionSetId);

    assert.ifError(questionsError);
    assert.equal(questionRows?.length, 1);
    assert.equal(questionRows?.[0]?.question_type, 'map');
    assert.equal(questionRows?.[0]?.correct_answer, 'uusimaa');

    const mapOptions = questionRows?.[0]?.options as any;
    assert.equal(mapOptions?.inputMode, 'single_region');
    assert.equal(mapOptions?.mapAsset, '/maps/finland/finland_counties_v1.png');
    assert.equal(mapOptions?.regions?.[0]?.id, 'uusimaa');
  } finally {
    await supabaseAdmin.from('question_sets').delete().eq('id', questionSetId);
  }
});
