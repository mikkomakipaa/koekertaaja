import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test } from 'node:test';

import { createClient } from '@supabase/supabase-js';

import {
  fetchPublishedQuestionSets,
  getAllQuestionSets,
  getRecentQuestionSets,
} from '../../../src/lib/supabase/queries';
import { getQuestionSetsBySchool, getSchools } from '../../../src/lib/supabase/schools';

type QueryResult<T> = {
  data: T;
  error: unknown;
};

class MockQueryBuilder<T> implements PromiseLike<QueryResult<T>> {
  public readonly calls: Array<{ method: string; args: unknown[] }> = [];

  constructor(private readonly result: QueryResult<T>) {}

  select(...args: unknown[]) {
    this.calls.push({ method: 'select', args });
    return this;
  }

  eq(...args: unknown[]) {
    this.calls.push({ method: 'eq', args });
    return this;
  }

  in(...args: unknown[]) {
    this.calls.push({ method: 'in', args });
    return this;
  }

  order(...args: unknown[]) {
    this.calls.push({ method: 'order', args });
    return this;
  }

  limit(...args: unknown[]) {
    this.calls.push({ method: 'limit', args });
    return this;
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

function createClientFor<T>(builder: MockQueryBuilder<T>) {
  return {
    from(table: string) {
      builder.calls.push({ method: 'from', args: [table] });
      return builder;
    },
  };
}

test('getSchools returns school rows with only the expected fields', async () => {
  const builder = new MockQueryBuilder({
    data: [
      {
        id: 'school-1',
        name: 'Aalto koulu',
        municipality: 'Espoo',
        created_at: '2026-04-10T00:00:00.000Z',
      },
    ],
    error: null,
  });
  const schools = await getSchools(createClientFor(builder) as any);

  assert.deepEqual(schools, [
    {
      id: 'school-1',
      name: 'Aalto koulu',
      municipality: 'Espoo',
      created_at: '2026-04-10T00:00:00.000Z',
    },
  ]);
  assert.deepEqual(builder.calls, [
    { method: 'from', args: ['schools'] },
    { method: 'select', args: ['id, name, municipality, created_at'] },
    { method: 'order', args: ['name', { ascending: true }] },
  ]);
});

test('getSchools returns an empty array on Supabase errors', async () => {
  const builder = new MockQueryBuilder({
    data: null,
    error: { message: 'boom' },
  });

  const schools = await getSchools(createClientFor(builder) as any);

  assert.deepEqual(schools, []);
});

test('getSchools returns an empty array when the client throws before the query resolves', async () => {
  const schools = await getSchools({
    from() {
      throw new Error('client init failed');
    },
  } as any);

  assert.deepEqual(schools, []);
});

test('getQuestionSetsBySchool filters by status and school id', async () => {
  const builder = new MockQueryBuilder({
    data: [{ id: 'set-1', school_id: 'school-1' }],
    error: null,
  });

  const sets = await getQuestionSetsBySchool('school-1', 5, createClientFor(builder) as any);

  assert.equal(sets.length, 1);
  assert.deepEqual(builder.calls, [
    { method: 'from', args: ['question_sets'] },
    { method: 'select', args: ['*'] },
    { method: 'eq', args: ['status', 'published'] },
    { method: 'eq', args: ['school_id', 'school-1'] },
    { method: 'order', args: ['exam_date', { ascending: false, nullsFirst: false }] },
    { method: 'order', args: ['created_at', { ascending: false }] },
    { method: 'limit', args: [5] },
  ]);
});

test('getRecentQuestionSets applies the optional school filter when provided', async () => {
  const builder = new MockQueryBuilder({
    data: [{ id: 'set-1', school_id: 'school-1' }],
    error: null,
  });

  await getRecentQuestionSets({ limit: 12, schoolId: 'school-1' }, undefined, createClientFor(builder) as any);

  assert.deepEqual(builder.calls, [
    { method: 'from', args: ['question_sets'] },
    { method: 'select', args: ['*'] },
    { method: 'eq', args: ['status', 'published'] },
    { method: 'eq', args: ['school_id', 'school-1'] },
    { method: 'order', args: ['exam_date', { ascending: false, nullsFirst: false }] },
    { method: 'order', args: ['created_at', { ascending: false }] },
    { method: 'limit', args: [12] },
  ]);
});

test('getAllQuestionSets and fetchPublishedQuestionSets reuse the optional school filter', async () => {
  const getAllBuilder = new MockQueryBuilder({
    data: [],
    error: null,
  });

  await getAllQuestionSets({ schoolId: 'school-1' }, createClientFor(getAllBuilder) as any);

  assert.deepEqual(getAllBuilder.calls, [
    { method: 'from', args: ['question_sets'] },
    { method: 'select', args: ['*'] },
    { method: 'eq', args: ['status', 'published'] },
    { method: 'eq', args: ['school_id', 'school-1'] },
    { method: 'order', args: ['created_at', { ascending: false }] },
  ]);

  const fetchBuilder = new MockQueryBuilder({
    data: [],
    error: null,
  });

  await fetchPublishedQuestionSets(
    { schoolId: 'school-2' },
    createClientFor(fetchBuilder) as any
  );

  assert.deepEqual(fetchBuilder.calls, [
    { method: 'from', args: ['question_sets'] },
    { method: 'select', args: ['*'] },
    { method: 'eq', args: ['status', 'published'] },
    { method: 'eq', args: ['school_id', 'school-2'] },
    { method: 'order', args: ['created_at', { ascending: false }] },
  ]);
});

const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

test(
  'integration: getSchools excludes schools whose sets are all unpublished',
  { skip: !hasSupabaseEnv },
  async () => {
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

    const suffix = crypto.randomBytes(4).toString('hex');
    const publishedSchoolName = `Testikoulu Published ${suffix}`;
    const createdOnlySchoolName = `Testikoulu Draft ${suffix}`;
    const createdOnlyCode = `D${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const publishedCode = `P${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const { data: publishedSchool, error: publishedSchoolError } = await supabaseAdmin
      .from('schools')
      .insert({
        name: publishedSchoolName,
        municipality: 'Helsinki',
      })
      .select()
      .single();

    assert.ifError(publishedSchoolError);
    assert.ok(publishedSchool?.id, 'Published school ID missing after creation');

    const { data: createdOnlySchool, error: createdOnlySchoolError } = await supabaseAdmin
      .from('schools')
      .insert({
        name: createdOnlySchoolName,
        municipality: 'Espoo',
      })
      .select()
      .single();

    assert.ifError(createdOnlySchoolError);
    assert.ok(createdOnlySchool?.id, 'Draft-only school ID missing after creation');

    let publishedSetId: string | undefined;
    let createdOnlySetId: string | undefined;

    try {
      const { data: publishedSet, error: publishedSetError } = await supabaseAdmin
        .from('question_sets')
        .insert({
          code: publishedCode,
          name: 'Published School Set',
          subject: 'Math',
          difficulty: 'normaali',
          mode: 'quiz',
          grade: 5,
          question_count: 10,
          status: 'published',
          school_id: publishedSchool.id,
        })
        .select()
        .single();

      assert.ifError(publishedSetError);
      publishedSetId = publishedSet?.id;
      assert.ok(publishedSetId, 'Published set ID missing after creation');

      const { data: createdOnlySet, error: createdOnlySetError } = await supabaseAdmin
        .from('question_sets')
        .insert({
          code: createdOnlyCode,
          name: 'Created School Set',
          subject: 'History',
          difficulty: 'helppo',
          mode: 'quiz',
          grade: 6,
          question_count: 8,
          status: 'created',
          school_id: createdOnlySchool.id,
        })
        .select()
        .single();

      assert.ifError(createdOnlySetError);
      createdOnlySetId = createdOnlySet?.id;
      assert.ok(createdOnlySetId, 'Created set ID missing after creation');

      const schools = await getSchools();
      const schoolNames = schools.map((school) => school.name);

      assert.ok(
        schoolNames.includes(publishedSchoolName),
        'School with a published set should be returned'
      );
      assert.ok(
        !schoolNames.includes(createdOnlySchoolName),
        'School with only unpublished sets should be excluded'
      );

      const publishedSchoolRows = schools.filter((school) => school.id === publishedSchool.id);
      assert.equal(publishedSchoolRows.length, 1, 'Published school should not be duplicated');

      const questionSets = await getQuestionSetsBySchool(publishedSchool.id);

      assert.equal(questionSets.length, 1, 'Only the published school set should be returned');
      assert.equal(questionSets[0]?.id, publishedSetId);
      assert.equal(questionSets[0]?.status, 'published');
      assert.equal(questionSets[0]?.school_id, publishedSchool.id);

      const recentQuestionSets = await getRecentQuestionSets({ schoolId: publishedSchool.id });
      assert.ok(
        recentQuestionSets.every((questionSet) => questionSet.school_id === publishedSchool.id),
        'Recent question sets should be filtered to the selected school'
      );

      const allQuestionSets = await getAllQuestionSets({ schoolId: publishedSchool.id });
      assert.ok(
        allQuestionSets.every((questionSet) => questionSet.school_id === publishedSchool.id),
        'All published question sets should be filtered to the selected school'
      );

      const fetchQuestionSets = await fetchPublishedQuestionSets({ schoolId: publishedSchool.id });
      assert.ok(
        fetchQuestionSets.every((questionSet) => questionSet.school_id === publishedSchool.id),
        'Published fetch helper should be filtered to the selected school'
      );

      const draftSchoolQuestionSets = await getQuestionSetsBySchool(createdOnlySchool.id);
      assert.equal(
        draftSchoolQuestionSets.length,
        0,
        'Draft-only school should not return unpublished sets'
      );
    } finally {
      if (publishedSetId) {
        await supabaseAdmin.from('question_sets').delete().eq('id', publishedSetId);
      }

      if (createdOnlySetId) {
        await supabaseAdmin.from('question_sets').delete().eq('id', createdOnlySetId);
      }

      await supabaseAdmin.from('schools').delete().eq('id', publishedSchool.id);
      await supabaseAdmin.from('schools').delete().eq('id', createdOnlySchool.id);
    }
  }
);
