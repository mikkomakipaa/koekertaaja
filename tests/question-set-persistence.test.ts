import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';

const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);
const hasSupabaseAnonEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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

test('public can only read questions from published sets', { skip: !(hasSupabaseEnv && hasSupabaseAnonEnv) }, async () => {
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

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
      name: 'Draft Set - RLS',
      subject: 'Test',
      difficulty: 'normaali',
      mode: 'quiz',
      grade: 4,
      question_count: 1,
      status: 'created',
    })
    .select()
    .single();

  assert.ifError(setError);
  const questionSetId = createdSet?.id;
  assert.ok(questionSetId, 'Question set ID missing after creation');

  try {
    const { error: questionInsertError } = await supabaseAdmin.from('questions').insert({
      question_set_id: questionSetId,
      question_text: 'Mikä on 2 + 2?',
      question_type: 'multiple_choice',
      correct_answer: '4',
      options: ['3', '4'],
      explanation: '2 + 2 = 4.',
      order_index: 0,
      topic: 'Laskut',
    });

    assert.ifError(questionInsertError);

    const { data: draftQuestions, error: anonDraftError } = await supabaseAnon
      .from('questions')
      .select('id')
      .eq('question_set_id', questionSetId);

    assert.ifError(anonDraftError);
    assert.equal(draftQuestions?.length ?? 0, 0);

    const { data: adminDraftQuestions, error: adminDraftError } = await supabaseAdmin
      .from('questions')
      .select('id')
      .eq('question_set_id', questionSetId);

    assert.ifError(adminDraftError);
    assert.equal(adminDraftQuestions?.length ?? 0, 1);

    const { error: publishError } = await supabaseAdmin
      .from('question_sets')
      .update({ status: 'published' })
      .eq('id', questionSetId);

    assert.ifError(publishError);

    const { data: publishedQuestions, error: anonPublishedError } = await supabaseAnon
      .from('questions')
      .select('id')
      .eq('question_set_id', questionSetId);

    assert.ifError(anonPublishedError);
    assert.equal(publishedQuestions?.length ?? 0, 1);
  } finally {
    await supabaseAdmin.from('question_sets').delete().eq('id', questionSetId);
  }
});
