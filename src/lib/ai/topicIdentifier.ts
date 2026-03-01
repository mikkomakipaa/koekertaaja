import * as providerRouter from './providerRouter';
import type { AIMessageContent, AIProvider } from './providerTypes';
import { Subject, Difficulty } from '@/types';
import { createLogger } from '@/lib/logger';
import { selectModelForTask } from './modelSelector';
import { normalizeSubtopicLabel, normalizeTopicLabel } from '@/lib/topics/normalization';

const logger = createLogger({ module: 'topicIdentifier' });
const TOPIC_IDENTIFIER_PROMPT_VERSION = '1.0.0';

export interface IdentifyTopicsParams {
  subject: Subject;
  grade?: number;
  materialText?: string;
  materialFiles?: Array<{
    type: string;
    name: string;
    data: string; // base64
  }>;
  targetProvider?: AIProvider;
}

interface IdentifyTopicsDeps {
  generateWithAI?: typeof providerRouter.generateWithAI;
}

/**
 * Enhanced topic with rich metadata for intelligent question distribution
 */
export interface EnhancedTopic {
  name: string;                   // "Geometria"
  coverage: number;                // 0.45 (45% of material)
  difficulty: Difficulty;          // Estimated difficulty level
  keywords: string[];              // ["pinta-ala", "piiri", "suorakulmio"]
  subtopics: string[];             // ["Pinta-alat", "Geometriset muodot"]
  importance: 'high' | 'medium' | 'low';
}

/**
 * Metadata about the overall material analysis
 */
export interface TopicAnalysisMetadata {
  totalConcepts: number;           // Distinct concepts identified
  estimatedDifficulty: Difficulty; // Overall material difficulty
  completeness: number;            // 0.85 (85% coverage)
  materialType?: 'textbook' | 'worksheet' | 'notes' | 'mixed';
  recommendedQuestionPoolSize?: number;
  promptVersion?: string;
}

/**
 * Complete topic analysis result with enhanced metadata
 */
export interface TopicAnalysisResult {
  topics: EnhancedTopic[];
  primarySubject: string;
  metadata: TopicAnalysisMetadata;
}

/**
 * Get simple topic names for legacy code
 * @deprecated Use enhanced topics directly when possible
 */
export function getSimpleTopics(result: TopicAnalysisResult): string[] {
  return result.topics.map(t => t.name);
}

/**
 * Step 1: Analyze material and identify 3-5 high-level topics
 *
 * This focused AI call only identifies topics without generating questions.
 * The identified topics are then used for balanced question generation.
 */
export async function identifyTopics(
  params: IdentifyTopicsParams,
  deps: IdentifyTopicsDeps = {}
): Promise<TopicAnalysisResult> {
  const { subject, grade, materialText, materialFiles, targetProvider } = params;

  // Build message content
  const messageContent: AIMessageContent[] = [];

  // Add uploaded files
  if (materialFiles && materialFiles.length > 0) {
    for (const file of materialFiles) {
      if (file.type === 'application/pdf') {
        messageContent.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: file.data,
          },
        });
      } else if (file.type.startsWith('image/')) {
        messageContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.type,
            data: file.data,
          },
        });
      }
    }
  }

  // Provider-neutral compact prompt.
  // Intent-critical constraints: 3-5 topics, Finnish naming, coverage sum 1.0, strict JSON-only output.
  const promptSections = [
    `Analysoi ${subject}-oppimateriaali ${grade ? `(luokka ${grade})` : ''}.`,
    materialText ? `MATERIAALI:\n${materialText}` : '',
    'PALAUTA VAIN YKSI JSON-OBJEKTI. Ei markdownia, ei selitystä JSON:n ulkopuolella.',
    `{
  "topics": [
    {
      "name": "Aihealue nimi suomeksi",
      "coverage": 0.34,
      "difficulty": "helppo",
      "keywords": ["k1", "k2", "k3"],
      "subtopics": ["ala-aihe 1", "ala-aihe 2"],
      "importance": "high"
    }
  ],
  "metadata": {
    "totalConcepts": 10,
    "estimatedDifficulty": "normaali",
    "completeness": 0.85,
    "materialType": "textbook",
    "recommendedQuestionPoolSize": 60
  }
}`,
    [
      'SÄÄNNÖT:',
      '- Luo 3-5 korkeantason aihealuetta.',
      `- Aihealueet on PAKKO olla suoraan kyseisen oppiaineen (${subject}) sisältöalueet. Älä luo aiheita muista oppiaineista.`,
      '- coverage on 0..1 ja topicien summa = 1.0 (sallittu pyöristysvirhe).',
      '- Suurin coverage >= 0.25, pienin >= 0.15.',
      '- difficulty vain: "helppo" | "normaali".',
      '- keywords: 3-5 konkreettista käsitettä per topic.',
      '- subtopics: 2-4 aliaihetta per topic.',
      '- importance vain: "high" | "medium" | "low".',
      '- metadata.materialType vain: "textbook" | "worksheet" | "notes" | "mixed".',
      '- metadata.recommendedQuestionPoolSize on kokonaisluku väliltä 20-200.',
      '- recommendedQuestionPoolSize on ensisijainen suositus kysymyspoolin koolle tämän materiaalin laajuuden perusteella.',
      '- name- ja subtopics-arvot suomeksi.',
    ].join('\n'),
    [
      'OUTPUT-GUARD:',
      '- Älä palauta tyhjää topics-listaa.',
      '- Älä lisää tekstiä JSON:n ulkopuolelle.',
      '- Jos olet epävarma, palauta silti validi JSON annetulla skeemalla.',
      '- Älä käytä trailing comma -merkintää.',
    ].join('\n'),
  ];
  const prompt = promptSections.filter(Boolean).join('\n\n');

  messageContent.push({
    type: 'text',
    text: prompt,
  });

  logger.info(
    {
      subject,
      grade,
      hasFiles: !!materialFiles && materialFiles.length > 0,
      hasMaterialText: !!materialText,
      promptVersion: TOPIC_IDENTIFIER_PROMPT_VERSION,
    },
    'Identifying topics from material'
  );

  // Call AI with larger token limit for enhanced response
  const selection = selectModelForTask('topic_identification', { targetProvider });
  const aiCallStartedAt = Date.now();
  logger.info(
    {
      provider: selection.provider,
      model: selection.model,
      maxTokens: 3000,
      messageCount: messageContent.length,
    },
    'Calling AI for topic identification'
  );
  const generateWithAI = deps.generateWithAI ?? providerRouter.generateWithAI;
  const response = await generateWithAI(messageContent, {
    provider: selection.provider,
    model: selection.model,
    maxTokens: 3000,
  });
  logger.info(
    {
      provider: selection.provider,
      model: selection.model,
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
      latencyMs: Date.now() - aiCallStartedAt,
    },
    'AI response received for topic identification'
  );

  // Parse JSON response
  const cleanContent = response.content.replace(/```json|```/g, '').trim();

  let result: {
    topics?: Array<{
      name: string;
      coverage: number;
      difficulty: string;
      keywords: string[];
      subtopics: string[];
      importance: string;
    }>;
    metadata?: {
      totalConcepts: number;
      estimatedDifficulty: string;
      completeness: number;
      materialType?: string;
      recommendedQuestionPoolSize?: number | string;
    };
  };

  try {
    result = JSON.parse(cleanContent);
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        contentPreview: cleanContent.substring(0, 500),
      },
      'Failed to parse topic identification response'
    );
    throw new Error('AI returned invalid JSON for topic identification');
  }

  // Validate response structure
  if (!result.topics || !Array.isArray(result.topics)) {
    throw new Error('AI response missing topics array');
  }

  if (!result.metadata) {
    logger.warn('AI response missing metadata, using defaults');
    result.metadata = {
      totalConcepts: result.topics.length * 3,
      estimatedDifficulty: 'normaali',
      completeness: 0.8,
      recommendedQuestionPoolSize: 40,
    };
  }

  // Validate topic count
  if (result.topics.length < 3 || result.topics.length > 5) {
    logger.warn(
      {
        topicCount: result.topics.length,
        topics: result.topics.map(t => t.name),
      },
      'Topic count outside expected range (3-5), adjusting...'
    );

    if (result.topics.length < 3) {
      throw new Error('AI returned too few topics (< 3)');
    } else if (result.topics.length > 5) {
      result.topics = result.topics.slice(0, 5);
    }
  }

  // Validate and normalize coverage
  const coverageSum = result.topics.reduce((sum, t) => sum + (t.coverage || 0), 0);
  if (Math.abs(coverageSum - 1.0) > 0.05) {
    logger.warn(
      {
        coverageSum,
        expectedSum: 1.0,
        deviation: coverageSum - 1.0,
      },
      'Coverage sum deviates from 1.0, normalizing...'
    );

    // Normalize to sum to 1.0
    result.topics.forEach(t => {
      t.coverage = t.coverage / coverageSum;
    });
  }

  // Validate and adjust keywords
  result.topics.forEach((topic, index) => {
    if (!topic.keywords || topic.keywords.length < 3) {
      logger.warn(
        {
          topic: topic.name,
          keywordCount: topic.keywords?.length || 0,
        },
        'Topic has too few keywords, padding...'
      );
      topic.keywords = topic.keywords || [];
      while (topic.keywords.length < 3) {
        topic.keywords.push(topic.name.toLowerCase());
      }
    }

    if (topic.keywords.length > 5) {
      logger.warn(
        {
          topic: topic.name,
          keywordCount: topic.keywords.length,
        },
        'Topic has too many keywords, trimming to 5'
      );
      topic.keywords = topic.keywords.slice(0, 5);
    }
  });

  // Validate and adjust subtopics
  result.topics.forEach((topic, index) => {
    if (!topic.subtopics || topic.subtopics.length < 2) {
      logger.warn(
        {
          topic: topic.name,
          subtopicCount: topic.subtopics?.length || 0,
        },
        'Topic has too few subtopics, padding...'
      );
      topic.subtopics = topic.subtopics || [];
      while (topic.subtopics.length < 2) {
        topic.subtopics.push(topic.name);
      }
    }

    if (topic.subtopics.length > 4) {
      logger.warn(
        {
          topic: topic.name,
          subtopicCount: topic.subtopics.length,
        },
        'Topic has too many subtopics, trimming to 4'
      );
      topic.subtopics = topic.subtopics.slice(0, 4);
    }
  });

  // Validate difficulty values (only 'helppo' and 'normaali' supported)
  const validDifficulties = ['helppo', 'normaali'];
  result.topics.forEach(topic => {
    if (!validDifficulties.includes(topic.difficulty)) {
      logger.warn(
        {
          topic: topic.name,
          difficulty: topic.difficulty,
        },
        'Invalid difficulty (only helppo/normaali supported), defaulting to "normaali"'
      );
      topic.difficulty = 'normaali';
    }
  });

  if (!validDifficulties.includes(result.metadata.estimatedDifficulty)) {
    result.metadata.estimatedDifficulty = 'normaali';
  }

  // Validate importance values
  const validImportance = ['high', 'medium', 'low'];
  result.topics.forEach(topic => {
    if (!validImportance.includes(topic.importance)) {
      logger.warn(
        {
          topic: topic.name,
          importance: topic.importance,
        },
        'Invalid importance, defaulting to "medium"'
      );
      topic.importance = 'medium';
    }
  });

  // Build enhanced result
  const enhancedTopics: EnhancedTopic[] = result.topics.map(t => ({
    name: normalizeTopicLabel(t.name),
    coverage: t.coverage,
    difficulty: t.difficulty as Difficulty,
    keywords: t.keywords,
    subtopics: t.subtopics.map((subtopic) => normalizeSubtopicLabel(subtopic)),
    importance: t.importance as 'high' | 'medium' | 'low',
  }));

  const metadata: TopicAnalysisMetadata = {
    totalConcepts: result.metadata.totalConcepts,
    estimatedDifficulty: result.metadata.estimatedDifficulty as Difficulty,
    completeness: result.metadata.completeness,
    materialType: result.metadata.materialType as any,
    recommendedQuestionPoolSize: normalizeRecommendedQuestionPoolSize(
      result.metadata.recommendedQuestionPoolSize
    ),
    promptVersion: TOPIC_IDENTIFIER_PROMPT_VERSION,
  };

  logger.info(
    {
      topics: enhancedTopics.map(t => ({
        name: t.name,
        coverage: t.coverage,
        keywords: t.keywords.length,
        subtopics: t.subtopics.length,
      })),
      metadata,
    },
    'Successfully identified enhanced topics'
  );

  return {
    topics: enhancedTopics,
    primarySubject: subject,
    metadata,
  };
}

function normalizeRecommendedQuestionPoolSize(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number.parseInt(value, 10)
      : NaN;

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const rounded = Math.round(parsed);
  return Math.max(20, Math.min(200, rounded));
}
