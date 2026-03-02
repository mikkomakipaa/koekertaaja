import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { GenerateWithAIOptions } from '../../src/lib/ai/providerRouter';
import type { AIMessageContent } from '../../src/lib/ai/providerTypes';
import {
  generateQuestions,
  sanitizeJsonString,
  validateQuestionSemantics,
} from '../../src/lib/ai/questionGenerator';
import { identifyTopics } from '../../src/lib/ai/topicIdentifier';
import type { PromptMetadata } from '../../src/lib/prompts/promptVersion';

test('sanitizeJsonString re-escapes LaTeX commands inside JSON strings', () => {
  const invalidJson = `[
    {
      "type": "flashcard",
      "question": "Miten määritellään murtoluku?",
      "answer": "Murtoluku on muotoa \\frac{a}{b} ja 25\\%.",
      "explanation": "Esimerkki: \\text{kolme neljäsosaa} ja \\cdot merkki."
    }
  ]`;

  const sanitized = sanitizeJsonString(invalidJson);
  const parsed = JSON.parse(sanitized) as Array<{
    answer: string;
    explanation: string;
  }>;

  assert.equal(parsed[0].answer, 'Murtoluku on muotoa \\frac{a}{b} ja 25\\%.');
  assert.equal(
    parsed[0].explanation,
    'Esimerkki: \\text{kolme neljäsosaa} ja \\cdot merkki.'
  );
});

test('validateQuestionSemantics rejects contradictory fraction comparison answers', () => {
  const result = validateQuestionSemantics({
    type: 'multiple_choice',
    question: 'Kumpi on suurempi: $$\\frac{5}{6}$$ vai $$\\frac{4}{5}$$?',
    options: ['$$\\frac{5}{6}$$', '$$\\frac{4}{5}$$'],
    correct_answer: '$$\\frac{4}{5}$$',
  });

  assert.equal(result.valid, false);
  assert.match(result.reason ?? '', /contradicts/i);
});

test('validateQuestionSemantics rejects multiple choice answers missing from options', () => {
  const result = validateQuestionSemantics({
    type: 'multiple_choice',
    question: 'Mikä on oikein?',
    options: ['A', 'B', 'C'],
    correct_answer: 'D',
  });

  assert.equal(result.valid, false);
  assert.match(result.reason ?? '', /not present in options/i);
});

test('validateQuestionSemantics rejects duplicate multiple choice options', () => {
  const result = validateQuestionSemantics({
    type: 'multiple_choice',
    question: 'Mikä on saman nimittäjän murtolukujen summa?',
    options: ['7/6', '1 1/6', '1 1/6', '3/6'],
    correct_answer: '1 1/6',
  });

  assert.equal(result.valid, false);
  assert.match(result.reason ?? '', /duplicate/i);
});

test('validateQuestionSemantics rejects contradictory fraction arithmetic answers', () => {
  const result = validateQuestionSemantics({
    type: 'short_answer',
    question: 'Laske: $$\\frac{1}{5}+\\frac{2}{10}$$.',
    correct_answer: '$$\\frac{3}{5}$$',
  });

  assert.equal(result.valid, false);
  assert.match(result.reason ?? '', /arithmetic/i);
});

test('validateQuestionSemantics rejects contradictory decimal-to-fraction answers', () => {
  const result = validateQuestionSemantics({
    type: 'fill_blank',
    question: 'Muunna murtoluvuksi: 0,4.',
    correct_answer: '$$\\frac{1}{5}$$',
  });

  assert.equal(result.valid, false);
  assert.match(result.reason ?? '', /conversion/i);
});

test('generateQuestions excludes flashcard items when running in quiz mode', async () => {
  const questions = await generateQuestions(
    {
      subject: 'matematiikka',
      subjectType: 'math',
      difficulty: 'helppo',
      questionCount: 1,
      materialText: 'Murtoluvut, laventaminen ja supistaminen.',
      mode: 'quiz',
    },
    {
      generateWithAI: async () => ({
        content: JSON.stringify([
          {
            question: 'Flashcard: mikä on laventamisen tarkoitus murtoluvuissa?',
            type: 'flashcard',
            topic: 'Murtoluvut',
            correct_answer: 'Laventaminen säilyttää arvon mutta muuttaa nimittäjän.',
            explanation: 'Laventamisessa kerrotaan osoittaja ja nimittäjä samalla luvulla.',
          },
          {
            question: 'Mikä on supistettu muoto luvusta $$\\frac{14}{21}$$?',
            type: 'fill_blank',
            topic: 'Murtoluvut',
            correct_answer: '$$\\frac{2}{3}$$',
            explanation: 'Jaa osoittaja ja nimittäjä 7:llä.',
          },
        ]),
      }),
    }
  );

  assert.equal(questions.length, 1);
  assert.equal(questions[0].question_type, 'fill_blank');
  assert.doesNotMatch(questions[0].question_text, /Flashcard:/i);
});

test('generateQuestions strips question type prefixes from saved question text', async () => {
  const questions = await generateQuestions(
    {
      subject: 'matematiikka',
      subjectType: 'math',
      difficulty: 'helppo',
      questionCount: 2,
      materialText: 'Murtoluvut, laventaminen ja supistaminen.',
      mode: 'quiz',
    },
    {
      generateWithAI: async () => ({
        content: JSON.stringify([
          {
            question: 'Multiple choice: Mikä on supistettu muoto luvusta $$\\frac{14}{21}$$?',
            type: 'multiple_choice',
            topic: 'Murtoluvut',
            options: ['$$\\frac{2}{3}$$', '$$\\frac{3}{4}$$'],
            correct_answer: '$$\\frac{2}{3}$$',
            explanation: 'Jaa osoittaja ja nimittäjä 7:llä.',
          },
          {
            question: 'Fill in: Muunna $$\\frac{3}{20}$$ desimaaliksi.',
            type: 'fill_blank',
            topic: 'Murtoluvut',
            correct_answer: '0,15',
            explanation: '3/20 = 0,15.',
          },
        ]),
      }),
    }
  );

  assert.equal(questions.length, 2);
  assert.equal(questions[0].question_text, 'Mikä on supistettu muoto luvusta $$\\frac{14}{21}$$?');
  assert.equal(questions[1].question_text, 'Muunna $$\\frac{3}{20}$$ desimaaliksi.');
});

test('generateQuestions uses generateWithAI and preserves response parsing/validation', async () => {
  let capturedOptions: { provider?: string; model?: string; maxTokens?: number } | undefined;
  let capturedMessageCount = 0;
  let capturedPromptText = '';
  let capturedPromptMetadata: PromptMetadata | undefined;

  const questions = await generateQuestions(
    {
      subject: 'matematiikka',
      subjectType: 'math',
      difficulty: 'helppo',
      questionCount: 1,
      materialText: 'Peruslaskut 2 + 2.',
      mode: 'quiz',
      onPromptMetadata: (metadata) => {
        capturedPromptMetadata = metadata;
      },
    },
    {
      generateWithAI: async (messages: AIMessageContent[], options?: GenerateWithAIOptions) => {
        capturedOptions = options;
        capturedMessageCount = messages.length;
        const textMessage = messages.find((message) => message.type === 'text');
        capturedPromptText = textMessage && 'text' in textMessage ? (textMessage.text ?? '') : '';

        return {
          content: JSON.stringify([
            {
              question: 'Mika on 2 + 2?',
              type: 'multiple_choice',
              topic: 'Nouns and Articles',
              subtopic: 'Object Pronouns',
              options: ['3', '4'],
              correct_answer: '4',
              explanation: '2 + 2 on 4, koska lasketaan kaksi ja kaksi yhteen.',
            },
          ]),
          usage: {
            input_tokens: 10,
            output_tokens: 20,
          },
        };
      },
    }
  );

  assert.equal(capturedOptions?.provider, 'anthropic');
  assert.equal(capturedOptions?.model, 'claude-sonnet-4-6-20250514');
  assert.equal(capturedMessageCount, 1);
  assert.match(capturedPromptText, /JSON-VASTAUSMUOTO/i);
  assert.match(capturedPromptText, /Palauta vain JSON-taulukko/i);
  assert.doesNotMatch(capturedPromptText, /(anthropic|claude|openai|gpt)/i);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].question_type, 'multiple_choice');
  assert.equal(questions[0].topic, 'Substantiivit ja artikkelit');
  assert.equal(questions[0].subtopic, 'Objektipronominit');
  assert.ok(capturedPromptMetadata);
  assert.ok(capturedPromptMetadata?.assembledAt);
  assert.equal(capturedPromptMetadata?.versions['core/format.txt'], '2.0.0');
  assert.equal(capturedPromptMetadata?.versions['types/math.txt'], '1.0.0');
});

test('identifyTopics uses generateWithAI and preserves JSON parsing flow', async () => {
  let capturedOptions: { provider?: string; model?: string; maxTokens?: number } | undefined;
  let capturedMessageCount = 0;
  let capturedPromptText = '';

  const result = await identifyTopics(
    {
      subject: 'matematiikka',
      grade: 5,
      materialText: 'Geometriaa: pinta-ala, piiri ja tilavuus.',
    },
    {
      generateWithAI: async (messages: AIMessageContent[], options?: GenerateWithAIOptions) => {
        capturedOptions = options;
        capturedMessageCount = messages.length;
        const textMessage = messages.find((message) => message.type === 'text');
        capturedPromptText = textMessage && 'text' in textMessage ? (textMessage.text ?? '') : '';

        return {
          content: JSON.stringify({
            topics: [
              {
                name: 'Pinta-alat',
                coverage: 0.4,
                difficulty: 'normaali',
                keywords: ['suorakulmio', 'kolmio', 'pinta-ala'],
                subtopics: ['Suorakulmion pinta-ala', 'Kolmion pinta-ala'],
                importance: 'high',
              },
              {
                name: 'Piiri',
                coverage: 0.35,
                difficulty: 'helppo',
                keywords: ['piiri', 'keha', 'sivut'],
                subtopics: ['Monikulmion piiri', 'Ympyran keha'],
                importance: 'medium',
              },
              {
                name: 'Tilavuus',
                coverage: 0.25,
                difficulty: 'normaali',
                keywords: ['tilavuus', 'kuutio', 'sarmio'],
                subtopics: ['Kuution tilavuus', 'Sarmion tilavuus'],
                importance: 'low',
              },
            ],
            metadata: {
              totalConcepts: 9,
              estimatedDifficulty: 'normaali',
              completeness: 0.9,
              materialType: 'textbook',
            },
          }),
          usage: {
            input_tokens: 15,
            output_tokens: 30,
          },
        };
      },
    }
  );

  assert.equal(capturedOptions?.provider, 'anthropic');
  assert.equal(capturedOptions?.model, 'claude-haiku-4-5-20251001');
  assert.equal(capturedOptions?.maxTokens, 3000);
  assert.equal(capturedMessageCount, 1);
  assert.match(capturedPromptText, /PALAUTA VAIN YKSI JSON-OBJEKTI/i);
  assert.match(capturedPromptText, /OUTPUT-GUARD/i);
  assert.doesNotMatch(capturedPromptText, /(anthropic|claude|openai|gpt)/i);
  assert.equal(result.topics.length, 3);
  assert.equal(result.metadata.totalConcepts, 9);
});
