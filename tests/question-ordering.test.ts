import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Question, QuestionType } from '@/types';
import {
  analyzeQuestionSetQuality,
  orchestrateQuestionSet,
} from '@/lib/utils/questionOrdering';

function makeQuestion(params: {
  id: string;
  topic: string;
  text: string;
  difficulty: 'helppo' | 'normaali' | 'vaikea';
  type?: QuestionType;
}): Question {
  const question: Question & { difficulty?: string } = {
    id: params.id,
    question_set_id: '',
    question_text: params.text,
    question_type: params.type ?? 'short_answer',
    explanation: 'Perustelu.',
    order_index: 0,
    topic: params.topic,
    correct_answer: 'vastaus',
    difficulty: params.difficulty,
  } as Question & { difficulty?: string };

  return question;
}

function getDifficulty(question: Question): string | undefined {
  return (question as Question & { difficulty?: string }).difficulty;
}

function maxHardStreak(questions: Question[]): number {
  let max = 0;
  let current = 0;
  for (const question of questions) {
    if (getDifficulty(question) === 'vaikea') {
      current += 1;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  return max;
}

test('orchestrateQuestionSet creates warm-up and avoids long hard streaks', () => {
  const input: Question[] = [
    makeQuestion({ id: 'q1', topic: 'Geometria', text: 'Monimutkainen analyysi 1', difficulty: 'vaikea' }),
    makeQuestion({ id: 'q2', topic: 'Aritmetiikka', text: 'Mikä on 2 + 2?', difficulty: 'helppo' }),
    makeQuestion({ id: 'q3', topic: 'Geometria', text: 'Monimutkainen analyysi 2', difficulty: 'vaikea' }),
    makeQuestion({ id: 'q4', topic: 'Aritmetiikka', text: 'Laske 7 x 6', difficulty: 'normaali' }),
    makeQuestion({ id: 'q5', topic: 'Aritmetiikka', text: 'Mikä on 5 + 3?', difficulty: 'helppo' }),
    makeQuestion({ id: 'q6', topic: 'Geometria', text: 'Monimutkainen analyysi 3', difficulty: 'vaikea' }),
    makeQuestion({ id: 'q7', topic: 'Murtoluvut', text: 'Vertaa 3/4 ja 5/6', difficulty: 'normaali' }),
    makeQuestion({ id: 'q8', topic: 'Aritmetiikka', text: 'Mikä on 10 - 4?', difficulty: 'helppo' }),
  ];

  const output = orchestrateQuestionSet(input);

  assert.equal(output.length, input.length);
  assert.deepEqual(
    new Set(output.map((question) => question.id)),
    new Set(input.map((question) => question.id))
  );
  assert.notEqual(getDifficulty(output[0]), 'vaikea');
  assert.ok(maxHardStreak(output) <= 3);

  const warmup = output.slice(0, 3);
  const easyInWarmup = warmup.filter((question) => getDifficulty(question) === 'helppo').length;
  assert.ok(easyInWarmup >= 2);
});

test('orchestrateQuestionSet can split long hard streak using recovery question', () => {
  const input: Question[] = [
    makeQuestion({ id: 'h1', topic: 'Geometria', text: 'Haastava tehtävä 1', difficulty: 'vaikea' }),
    makeQuestion({ id: 'h2', topic: 'Geometria', text: 'Haastava tehtävä 2', difficulty: 'vaikea' }),
    makeQuestion({ id: 'h3', topic: 'Geometria', text: 'Haastava tehtävä 3', difficulty: 'vaikea' }),
    makeQuestion({ id: 'e1', topic: 'Aritmetiikka', text: 'Mikä on 1 + 1?', difficulty: 'helppo' }),
    makeQuestion({ id: 'h4', topic: 'Geometria', text: 'Haastava tehtävä 4', difficulty: 'vaikea' }),
  ];

  const output = orchestrateQuestionSet(input);
  assert.ok(maxHardStreak(output) <= 3);
});

test('analyzeQuestionSetQuality scores coherent order better than chaotic order', () => {
  const coherent: Question[] = [
    makeQuestion({ id: 'c1', topic: 'Aritmetiikka', text: 'Mikä on 2 + 2?', difficulty: 'helppo' }),
    makeQuestion({ id: 'c2', topic: 'Aritmetiikka', text: 'Laske 7 x 6', difficulty: 'normaali' }),
    makeQuestion({ id: 'c3', topic: 'Geometria', text: 'Vertaile kolmioiden pinta-alaa', difficulty: 'vaikea' }),
    makeQuestion({ id: 'c4', topic: 'Geometria', text: 'Perustele ratkaisusi', difficulty: 'vaikea' }),
  ];

  const chaotic: Question[] = [
    makeQuestion({ id: 'x1', topic: 'Geometria', text: 'Perustele monivaiheinen ratkaisu', difficulty: 'vaikea' }),
    makeQuestion({ id: 'x2', topic: 'Aritmetiikka', text: 'Mikä on 3 + 1?', difficulty: 'helppo' }),
    makeQuestion({ id: 'x3', topic: 'Murtoluvut', text: 'Vertaa 2/3 ja 3/5', difficulty: 'normaali' }),
    makeQuestion({ id: 'x4', topic: 'Aritmetiikka', text: 'Mikä on 5 + 1?', difficulty: 'helppo' }),
  ];

  const coherentScore = analyzeQuestionSetQuality(coherent);
  const chaoticScore = analyzeQuestionSetQuality(chaotic);

  assert.ok(coherentScore.overallScore >= chaoticScore.overallScore);
  assert.ok(coherentScore.overallScore >= 0 && coherentScore.overallScore <= 1);
  assert.ok(chaoticScore.overallScore >= 0 && chaoticScore.overallScore <= 1);
});
