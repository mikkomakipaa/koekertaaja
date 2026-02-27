import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { GenerateWithAIOptions } from '../../../src/lib/ai/providerRouter';
import type { AIMessageContent } from '../../../src/lib/ai/providerTypes';
import { generateQuestions } from '../../../src/lib/ai/questionGenerator';
import { normalizeSubmissionTopics } from '../../../src/lib/topics/submitNormalization';
import { mapQuestionsToInsertRows } from '../../../src/lib/supabase/write-queries';
import { normalizeTopicMasteryStats } from '../../../src/lib/mindMap/storage';
import { normalizeUniqueQuestionTopics } from '../../../src/lib/supabase/queries';

describe('topic normalization regression matrix', () => {
  it('generation normalization canonicalizes mixed-language topic output', async () => {
    const questions = await generateQuestions(
      {
        subject: 'englanti',
        subjectType: 'language',
        difficulty: 'helppo',
        questionCount: 2,
        materialText: 'Nouns and vocabulary practice.',
        mode: 'quiz',
      },
      {
        generateWithAI: async (_messages: AIMessageContent[], _options?: GenerateWithAIOptions) => ({
          content: JSON.stringify([
            {
              question: 'Valitse oikea vaihtoehto.',
              type: 'multiple_choice',
              topic: 'Nouns and Articles',
              subtopic: 'object pronouns',
              options: ['A', 'B'],
              correct_answer: 'A',
              explanation: 'Selitys on riittavan pitka testiin.',
            },
            {
              question: 'Vastaa lyhyesti.',
              type: 'short_answer',
              topic: 'Preesensin kielioppi',
              subtopic: 'clothing vocabulary',
              correct_answer: 'A',
              explanation: 'Toinen selitys on riittavan pitka testiin.',
            },
          ]),
          usage: {
            input_tokens: 10,
            output_tokens: 20,
          },
        }),
      }
    );

    assert.deepEqual(
      questions.map((question) => ({ topic: question.topic, subtopic: question.subtopic })),
      [
        { topic: 'Substantiivit ja artikkelit', subtopic: 'Objektipronominit' },
        { topic: 'Preesensin kielioppi', subtopic: 'Vaatesanasto' },
      ]
    );
  });

  it('submit and write normalization keep one canonical Finnish topic key', () => {
    const logger = { warn: () => undefined };
    const normalizedSubmission = normalizeSubmissionTopics(
      [
        {
          question: 'Kysymys 1',
          type: 'multiple_choice',
          topic: 'Nouns and Articles',
          subtopic: 'Object Pronouns',
          options: ['A', 'B'],
          correct_answer: 'A',
          explanation: 'Selitys on riittavan pitka testiin.',
        },
        {
          question: 'Kysymys 2',
          type: 'short_answer',
          topic: 'Substantiivit ja artikkelit',
          subtopic: 'Objektipronominit',
          correct_answer: 'A',
          explanation: 'Toinen selitys on riittavan pitka testiin.',
        },
      ],
      logger
    );

    const rows = mapQuestionsToInsertRows(
      normalizedSubmission.map((question, index) => ({
        question_text: question.question,
        question_type: question.type,
        explanation: question.explanation,
        topic: question.topic,
        subtopic: question.subtopic,
        correct_answer: question.correct_answer,
        options: question.options,
        order_index: index,
      })) as any,
      'set-matrix-1'
    );

    assert.deepEqual(new Set(rows.map((row) => row.topic)), new Set(['Substantiivit ja artikkelit']));
    assert.deepEqual(new Set(rows.map((row) => row.subtopic)), new Set(['Objektipronominit']));
  });

  it('localStorage merge normalization collapses English/Finnish aliases into canonical Finnish key', () => {
    const normalized = normalizeTopicMasteryStats({
      'Nouns and Articles': { correct: 1, total: 2 },
      'Substantiivit ja artikkelit': { correct: 3, total: 4 },
    });

    assert.deepEqual(normalized, {
      'Substantiivit ja artikkelit': { correct: 4, total: 6 },
    });
  });

  it('topic distribution reads return canonical, deduplicated Finnish topics', () => {
    const topics = normalizeUniqueQuestionTopics([
      { topic: 'Nouns and Articles' },
      { topic: 'Substantiivit ja artikkelit' },
      { topic: 'Preesensin kielioppi' },
      { topic: '' },
      { topic: null },
    ]);

    assert.deepEqual(topics, ['Substantiivit ja artikkelit', 'Preesensin kielioppi']);
  });
});
