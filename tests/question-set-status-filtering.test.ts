import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test, describe } from 'node:test';
import { createClient } from '@supabase/supabase-js';

const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

describe('Question Set Status Filtering', () => {
  test('status defaults to "created" when not specified', { skip: !hasSupabaseEnv }, async () => {
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
        name: 'Test Set - Default Status',
        subject: 'English',
        difficulty: 'normaali',
        mode: 'quiz',
        grade: 4,
        question_count: 10,
        // Note: status not specified, should default to 'created'
      })
      .select()
      .single();

    assert.ifError(setError);
    const questionSetId = createdSet?.id;
    assert.ok(questionSetId, 'Question set ID missing after creation');

    try {
      // Verify default status is 'created'
      assert.equal(createdSet?.status, 'created', 'Default status should be "created"');
    } finally {
      await supabaseAdmin.from('question_sets').delete().eq('id', questionSetId);
    }
  });

  test('status can be explicitly set to "published"', { skip: !hasSupabaseEnv }, async () => {
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
        name: 'Test Set - Published',
        subject: 'English',
        difficulty: 'normaali',
        mode: 'quiz',
        grade: 4,
        question_count: 10,
        status: 'published',
      })
      .select()
      .single();

    assert.ifError(setError);
    const questionSetId = createdSet?.id;
    assert.ok(questionSetId, 'Question set ID missing after creation');

    try {
      assert.equal(createdSet?.status, 'published', 'Status should be "published"');
    } finally {
      await supabaseAdmin.from('question_sets').delete().eq('id', questionSetId);
    }
  });

  test('status can be updated from "created" to "published"', { skip: !hasSupabaseEnv }, async () => {
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

    // Create with default status 'created'
    const { data: createdSet, error: createError } = await supabaseAdmin
      .from('question_sets')
      .insert({
        code,
        name: 'Test Set - Status Update',
        subject: 'Math',
        difficulty: 'normaali',
        mode: 'quiz',
        grade: 5,
        question_count: 10,
      })
      .select()
      .single();

    assert.ifError(createError);
    const questionSetId = createdSet?.id;
    assert.ok(questionSetId, 'Question set ID missing after creation');

    try {
      assert.equal(createdSet?.status, 'created', 'Initial status should be "created"');

      // Update to 'published'
      const { data: updatedSet, error: updateError } = await supabaseAdmin
        .from('question_sets')
        .update({ status: 'published' })
        .eq('id', questionSetId)
        .select()
        .single();

      assert.ifError(updateError);
      assert.equal(updatedSet?.status, 'published', 'Status should be updated to "published"');
    } finally {
      await supabaseAdmin.from('question_sets').delete().eq('id', questionSetId);
    }
  });

  test('status can be updated from "published" back to "created"', { skip: !hasSupabaseEnv }, async () => {
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

    // Create with status 'published'
    const { data: createdSet, error: createError } = await supabaseAdmin
      .from('question_sets')
      .insert({
        code,
        name: 'Test Set - Unpublish',
        subject: 'History',
        difficulty: 'helppo',
        mode: 'quiz',
        grade: 6,
        question_count: 15,
        status: 'published',
      })
      .select()
      .single();

    assert.ifError(createError);
    const questionSetId = createdSet?.id;
    assert.ok(questionSetId, 'Question set ID missing after creation');

    try {
      assert.equal(createdSet?.status, 'published', 'Initial status should be "published"');

      // Update back to 'created' (unpublish)
      const { data: updatedSet, error: updateError } = await supabaseAdmin
        .from('question_sets')
        .update({ status: 'created' })
        .eq('id', questionSetId)
        .select()
        .single();

      assert.ifError(updateError);
      assert.equal(updatedSet?.status, 'created', 'Status should be updated to "created"');
    } finally {
      await supabaseAdmin.from('question_sets').delete().eq('id', questionSetId);
    }
  });

  test('filtering by status returns only matching question sets', { skip: !hasSupabaseEnv }, async () => {
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

    const code1 = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code2 = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code3 = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Create 2 published and 1 created sets
    const { data: publishedSet1, error: error1 } = await supabaseAdmin
      .from('question_sets')
      .insert({
        code: code1,
        name: 'Published Set 1',
        subject: 'English',
        difficulty: 'normaali',
        mode: 'quiz',
        grade: 4,
        question_count: 10,
        status: 'published',
      })
      .select()
      .single();

    assert.ifError(error1);

    const { data: publishedSet2, error: error2 } = await supabaseAdmin
      .from('question_sets')
      .insert({
        code: code2,
        name: 'Published Set 2',
        subject: 'Math',
        difficulty: 'normaali',
        mode: 'quiz',
        grade: 5,
        question_count: 10,
        status: 'published',
      })
      .select()
      .single();

    assert.ifError(error2);

    const { data: createdSet, error: error3 } = await supabaseAdmin
      .from('question_sets')
      .insert({
        code: code3,
        name: 'Created Set',
        subject: 'History',
        difficulty: 'normaali',
        mode: 'quiz',
        grade: 6,
        question_count: 10,
        status: 'created',
      })
      .select()
      .single();

    assert.ifError(error3);

    try {
      // Query for published sets only
      const { data: publishedSets, error: queryError1 } = await supabaseAdmin
        .from('question_sets')
        .select('id, code, name, status')
        .eq('status', 'published')
        .in('code', [code1, code2, code3]);

      assert.ifError(queryError1);
      assert.equal(publishedSets?.length, 2, 'Should return 2 published sets');
      assert.ok(
        publishedSets?.every((set) => set.status === 'published'),
        'All returned sets should have status "published"'
      );

      // Query for created sets only
      const { data: createdSets, error: queryError2 } = await supabaseAdmin
        .from('question_sets')
        .select('id, code, name, status')
        .eq('status', 'created')
        .in('code', [code1, code2, code3]);

      assert.ifError(queryError2);
      assert.equal(createdSets?.length, 1, 'Should return 1 created set');
      assert.equal(createdSets?.[0]?.status, 'created', 'Returned set should have status "created"');
      assert.equal(createdSets?.[0]?.code, code3, 'Should return the created set');
    } finally {
      // Cleanup
      await supabaseAdmin.from('question_sets').delete().eq('id', publishedSet1?.id);
      await supabaseAdmin.from('question_sets').delete().eq('id', publishedSet2?.id);
      await supabaseAdmin.from('question_sets').delete().eq('id', createdSet?.id);
    }
  });

  test('RLS policy allows admin to see both created and published sets', { skip: !hasSupabaseEnv }, async () => {
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

    const code1 = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code2 = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Create one of each status
    const { data: createdSet, error: error1 } = await supabaseAdmin
      .from('question_sets')
      .insert({
        code: code1,
        name: 'Admin Visible - Created',
        subject: 'English',
        difficulty: 'normaali',
        mode: 'quiz',
        grade: 4,
        question_count: 10,
        status: 'created',
      })
      .select()
      .single();

    assert.ifError(error1);

    const { data: publishedSet, error: error2 } = await supabaseAdmin
      .from('question_sets')
      .insert({
        code: code2,
        name: 'Admin Visible - Published',
        subject: 'Math',
        difficulty: 'normaali',
        mode: 'quiz',
        grade: 5,
        question_count: 10,
        status: 'published',
      })
      .select()
      .single();

    assert.ifError(error2);

    try {
      // Admin client (service role) should see both
      const { data: allSets, error: queryError } = await supabaseAdmin
        .from('question_sets')
        .select('id, code, name, status')
        .in('code', [code1, code2])
        .order('code');

      assert.ifError(queryError);
      assert.equal(allSets?.length, 2, 'Admin should see both created and published sets');

      const statuses = allSets?.map((set) => set.status).sort();
      assert.deepEqual(statuses, ['created', 'published'], 'Should include both status types');
    } finally {
      // Cleanup
      await supabaseAdmin.from('question_sets').delete().eq('id', createdSet?.id);
      await supabaseAdmin.from('question_sets').delete().eq('id', publishedSet?.id);
    }
  });
});
