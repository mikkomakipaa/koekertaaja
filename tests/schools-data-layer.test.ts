import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { describe, test } from 'node:test';
import { createClient } from '@supabase/supabase-js';

import { getRecentQuestionSets } from '@/lib/supabase/queries';
import { getQuestionSetsBySchool, getSchools } from '@/lib/supabase/schools';

const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

describe('school selection data layer', () => {
  test(
    'getSchools only returns schools with published sets and question set queries respect school filters',
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
      const publishedSchoolName = `Codex Test School Published ${suffix}`;
      const draftOnlySchoolName = `Codex Test School Draft ${suffix}`;
      const emptySchoolName = `Codex Test School Empty ${suffix}`;

      const createdSchoolIds: string[] = [];
      const createdQuestionSetIds: string[] = [];

      try {
        const { data: publishedSchool, error: publishedSchoolError } = await supabaseAdmin
          .from('schools')
          .insert({
            name: publishedSchoolName,
            municipality: 'Helsinki',
          })
          .select()
          .single();

        assert.ifError(publishedSchoolError);
        assert.ok(publishedSchool?.id, 'Published school should be created');
        createdSchoolIds.push(publishedSchool.id);

        const { data: draftOnlySchool, error: draftOnlySchoolError } = await supabaseAdmin
          .from('schools')
          .insert({
            name: draftOnlySchoolName,
            municipality: 'Espoo',
          })
          .select()
          .single();

        assert.ifError(draftOnlySchoolError);
        assert.ok(draftOnlySchool?.id, 'Draft-only school should be created');
        createdSchoolIds.push(draftOnlySchool.id);

        const { data: emptySchool, error: emptySchoolError } = await supabaseAdmin
          .from('schools')
          .insert({
            name: emptySchoolName,
            municipality: 'Vantaa',
          })
          .select()
          .single();

        assert.ifError(emptySchoolError);
        assert.ok(emptySchool?.id, 'Empty school should be created');
        createdSchoolIds.push(emptySchool.id);

        const { data: publishedSet, error: publishedSetError } = await supabaseAdmin
          .from('question_sets')
          .insert({
            code: `PS${suffix}`.slice(0, 6).toUpperCase(),
            name: `Published school set ${suffix}`,
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
        assert.ok(publishedSet?.id, 'Published question set should be created');
        createdQuestionSetIds.push(publishedSet.id);

        const { data: draftSet, error: draftSetError } = await supabaseAdmin
          .from('question_sets')
          .insert({
            code: `DS${suffix}`.slice(0, 6).toUpperCase(),
            name: `Draft school set ${suffix}`,
            subject: 'History',
            difficulty: 'helppo',
            mode: 'quiz',
            grade: 6,
            question_count: 8,
            status: 'created',
            school_id: draftOnlySchool.id,
          })
          .select()
          .single();

        assert.ifError(draftSetError);
        assert.ok(draftSet?.id, 'Draft question set should be created');
        createdQuestionSetIds.push(draftSet.id);

        const schools = await getSchools();
        const returnedSchoolNames = schools.map((school) => school.name);

        assert.ok(
          returnedSchoolNames.includes(publishedSchoolName),
          'School with a published set should be returned'
        );
        assert.ok(
          !returnedSchoolNames.includes(draftOnlySchoolName),
          'School with only unpublished sets should be excluded'
        );
        assert.ok(
          !returnedSchoolNames.includes(emptySchoolName),
          'School with no sets should be excluded'
        );

        const schoolSets = await getQuestionSetsBySchool(publishedSchool.id);
        assert.equal(schoolSets.length, 1, 'Only published sets for the school should be returned');
        assert.equal(schoolSets[0]?.id, publishedSet.id);

        const recentBySchool = await getRecentQuestionSets({
          schoolId: publishedSchool.id,
          limit: 10,
        });
        assert.equal(recentBySchool.length, 1, 'Recent question sets should respect schoolId');
        assert.equal(recentBySchool[0]?.id, publishedSet.id);
      } finally {
        for (const questionSetId of createdQuestionSetIds) {
          await supabaseAdmin.from('question_sets').delete().eq('id', questionSetId);
        }

        for (const schoolId of createdSchoolIds) {
          await supabaseAdmin.from('schools').delete().eq('id', schoolId);
        }
      }
    }
  );
});
