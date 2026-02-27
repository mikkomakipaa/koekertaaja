import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { GenerateWithAIOptions } from '../../src/lib/ai/providerRouter';
import type { AIMessageContent } from '../../src/lib/ai/providerTypes';
import { generateQuestions } from '../../src/lib/ai/questionGenerator';
import { identifyTopics } from '../../src/lib/ai/topicIdentifier';
import type { PromptMetadata } from '../../src/lib/prompts/promptVersion';

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
