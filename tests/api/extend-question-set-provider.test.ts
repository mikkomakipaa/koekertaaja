import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handleExtendQuestionSetRequest } from '../../src/lib/api/extendQuestionSet';

function buildRequest(provider?: string): Request {
  const formData = new FormData();
  formData.append('questionSetId', 'set-123');
  formData.append('questionsToAdd', '2');
  formData.append('materialText', 'Murtoluvut ja desimaalit');
  if (provider) {
    formData.append('provider', provider);
  }

  return new Request('http://localhost/api/extend-question-set', {
    method: 'POST',
    body: formData,
  });
}

function buildSupabaseAdminMock() {
  return {
    from(table: string) {
      if (table === 'questions') {
        return {
          select() {
            return {
              eq() {
                return {
                  order() {
                    return {
                      async limit() {
                        return { data: [{ order_index: 3 }], error: null };
                      },
                    };
                  },
                };
              },
            };
          },
          async insert() {
            return { error: null };
          },
        };
      }

      if (table === 'question_sets') {
        return {
          update() {
            return {
              async eq() {
                return { error: null };
              },
            };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

test('extend route returns 400 for OpenAI provider when key is missing', async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const response = await handleExtendQuestionSetRequest(buildRequest('openai'), {
      requireAuthFn: async () => ({ id: 'user-1' }) as any,
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.error, 'OpenAI API key puuttuu palvelimen ympäristömuuttujista.');
  } finally {
    if (typeof previousKey === 'string') {
      process.env.OPENAI_API_KEY = previousKey;
    } else {
      delete process.env.OPENAI_API_KEY;
    }
  }
});

test('extend route forwards selected provider to topic identification and question generation', async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-openai-key';

  let identifyProvider: string | undefined;
  let generateProvider: string | undefined;
  const infoPayloads: Array<Record<string, unknown>> = [];

  try {
    const response = await handleExtendQuestionSetRequest(buildRequest('openai'), {
      requireAuthFn: async () => ({ id: 'user-1' }) as any,
      getQuestionSetByIdFn: async () =>
        ({
          id: 'set-123',
          code: 'ABC123',
          name: 'Murtoluvut',
          subject: 'math',
          difficulty: 'helppo',
          question_count: 10,
          mode: 'quiz',
          grade: 5,
        }) as any,
      identifyTopicsFn: async (params: any) => {
        identifyProvider = params.targetProvider;
        return {
          topics: [
            {
              name: 'Murtoluvut',
              coverage: 1,
              difficulty: 'helppo',
              keywords: ['murtoluku'],
              subtopics: ['yhteenlasku'],
              importance: 'high',
            },
          ],
          primarySubject: 'math',
          metadata: {
            totalConcepts: 1,
            estimatedDifficulty: 'helppo',
            completeness: 1,
            materialType: 'notes',
            recommendedQuestionPoolSize: 20,
          },
        };
      },
      generateQuestionsFn: async (params: any) => {
        generateProvider = params.targetProvider;
        return [
          {
            question_text: 'Mikä on 1/2 + 1/2?',
            question_type: 'short_answer',
            explanation: '1/2 + 1/2 = 1.',
            correct_answer: '1',
            options: null,
          },
        ] as any;
      },
      getSupabaseAdminFn: () => buildSupabaseAdminMock() as any,
      createLoggerFn: () =>
        ({
          info(...args: any[]) {
            const payload = args[0];
            if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
              infoPayloads.push(payload as Record<string, unknown>);
            }
          },
          warn() {},
          error() {},
        }) as any,
    });

    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.success, true);
    assert.equal(identifyProvider, 'openai');
    assert.equal(generateProvider, 'openai');
    assert.equal(infoPayloads.some((payload) => payload.provider === 'openai'), true);
  } finally {
    if (typeof previousKey === 'string') {
      process.env.OPENAI_API_KEY = previousKey;
    } else {
      delete process.env.OPENAI_API_KEY;
    }
  }
});

test('extend route keeps default provider behavior when provider is omitted', async () => {
  let identifyProvider: string | undefined;
  let generateProvider: string | undefined;

  const response = await handleExtendQuestionSetRequest(buildRequest(), {
    requireAuthFn: async () => ({ id: 'user-1' }) as any,
    getQuestionSetByIdFn: async () =>
      ({
        id: 'set-123',
        code: 'ABC123',
        name: 'Murtoluvut',
        subject: 'math',
        difficulty: 'helppo',
        question_count: 10,
        mode: 'quiz',
        grade: 5,
      }) as any,
    identifyTopicsFn: async (params: any) => {
      identifyProvider = params.targetProvider;
      return {
        topics: [
          {
            name: 'Murtoluvut',
            coverage: 1,
            difficulty: 'helppo',
            keywords: ['murtoluku'],
            subtopics: ['yhteenlasku'],
            importance: 'high',
          },
        ],
        primarySubject: 'math',
        metadata: {
          totalConcepts: 1,
          estimatedDifficulty: 'helppo',
          completeness: 1,
          materialType: 'notes',
          recommendedQuestionPoolSize: 20,
        },
      };
    },
    generateQuestionsFn: async (params: any) => {
      generateProvider = params.targetProvider;
      return [
        {
          question_text: 'Mikä on 1/2 + 1/2?',
          question_type: 'short_answer',
          explanation: '1/2 + 1/2 = 1.',
          correct_answer: '1',
          options: null,
        },
      ] as any;
    },
    getSupabaseAdminFn: () => buildSupabaseAdminMock() as any,
    createLoggerFn: () =>
      ({
        info() {},
        warn() {},
        error() {},
      }) as any,
  });

  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.success, true);
  assert.equal(identifyProvider, undefined);
  assert.equal(generateProvider, undefined);
});

test('extend route forwards anthropic provider to topic identification and question generation', async () => {
  let identifyProvider: string | undefined;
  let generateProvider: string | undefined;

  const response = await handleExtendQuestionSetRequest(buildRequest('anthropic'), {
    requireAuthFn: async () => ({ id: 'user-1' }) as any,
    getQuestionSetByIdFn: async () =>
      ({
        id: 'set-123',
        code: 'ABC123',
        name: 'Murtoluvut',
        subject: 'math',
        difficulty: 'helppo',
        question_count: 10,
        mode: 'quiz',
        grade: 5,
      }) as any,
    identifyTopicsFn: async (params: any) => {
      identifyProvider = params.targetProvider;
      return {
        topics: [
          {
            name: 'Murtoluvut',
            coverage: 1,
            difficulty: 'helppo',
            keywords: ['murtoluku'],
            subtopics: ['yhteenlasku'],
            importance: 'high',
          },
        ],
        primarySubject: 'math',
        metadata: {
          totalConcepts: 1,
          estimatedDifficulty: 'helppo',
          completeness: 1,
          materialType: 'notes',
          recommendedQuestionPoolSize: 20,
        },
      };
    },
    generateQuestionsFn: async (params: any) => {
      generateProvider = params.targetProvider;
      return [
        {
          question_text: 'Mikä on 1/2 + 1/2?',
          question_type: 'short_answer',
          explanation: '1/2 + 1/2 = 1.',
          correct_answer: '1',
          options: null,
        },
      ] as any;
    },
    getSupabaseAdminFn: () => buildSupabaseAdminMock() as any,
    createLoggerFn: () =>
      ({
        info() {},
        warn() {},
        error() {},
      }) as any,
  });

  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.success, true);
  assert.equal(identifyProvider, 'anthropic');
  assert.equal(generateProvider, 'anthropic');
});

test('extend route treats invalid provider value as omitted', async () => {
  let identifyProvider: string | undefined;
  let generateProvider: string | undefined;

  const response = await handleExtendQuestionSetRequest(buildRequest('invalid-provider'), {
    requireAuthFn: async () => ({ id: 'user-1' }) as any,
    getQuestionSetByIdFn: async () =>
      ({
        id: 'set-123',
        code: 'ABC123',
        name: 'Murtoluvut',
        subject: 'math',
        difficulty: 'helppo',
        question_count: 10,
        mode: 'quiz',
        grade: 5,
      }) as any,
    identifyTopicsFn: async (params: any) => {
      identifyProvider = params.targetProvider;
      return {
        topics: [
          {
            name: 'Murtoluvut',
            coverage: 1,
            difficulty: 'helppo',
            keywords: ['murtoluku'],
            subtopics: ['yhteenlasku'],
            importance: 'high',
          },
        ],
        primarySubject: 'math',
        metadata: {
          totalConcepts: 1,
          estimatedDifficulty: 'helppo',
          completeness: 1,
          materialType: 'notes',
          recommendedQuestionPoolSize: 20,
        },
      };
    },
    generateQuestionsFn: async (params: any) => {
      generateProvider = params.targetProvider;
      return [
        {
          question_text: 'Mikä on 1/2 + 1/2?',
          question_type: 'short_answer',
          explanation: '1/2 + 1/2 = 1.',
          correct_answer: '1',
          options: null,
        },
      ] as any;
    },
    getSupabaseAdminFn: () => buildSupabaseAdminMock() as any,
    createLoggerFn: () =>
      ({
        info() {},
        warn() {},
        error() {},
      }) as any,
  });

  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.success, true);
  assert.equal(identifyProvider, undefined);
  assert.equal(generateProvider, undefined);
});
