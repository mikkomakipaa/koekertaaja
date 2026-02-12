import { aiQuestionSchema } from '../../src/lib/validation/schemas';
import type {
  PromptRegressionFlow,
  PromptRegressionSample,
  PromptRegressionScenario,
  PromptQualityRubric,
} from './prompt-regression-evaluation';

export interface OutputContractMetrics {
  jsonValid: boolean;
  schemaValidCount: number;
  totalItemCount: number;
  validQuestionRatio: number;
  minimumValidQuestionRatio: number;
  meetsMinimumValidQuestionRatio: boolean;
  topicContractValid: boolean;
}

export interface ProviderScenarioMetrics {
  baselineContract: OutputContractMetrics;
  refactoredContract: OutputContractMetrics;
  baselineQualityScore: number;
  refactoredQualityScore: number;
  qualityDelta: number;
}

export const MIN_VALID_QUESTION_RATIO_BY_FLOW: Record<PromptRegressionFlow, number> = {
  topic_identification: 1,
  quiz_helppo: 0.7,
  quiz_normaali: 0.7,
  flashcard_vocabulary: 0.4,
  flashcard_grammar: 0.4,
};

export const PROMPT_ROLLBACK_THRESHOLDS = {
  maxJsonFailureRate: 0.02,
  minValidQuestionRatio: 0.7,
  maxQualityDrop: 0.2,
  maxProviderParityGap: 0.3,
} as const;

function parseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseQuestionArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (isObject(parsed) && Array.isArray(parsed.questions)) {
    return parsed.questions;
  }
  return [];
}

function evaluateTopicContract(parsed: unknown): { topicContractValid: boolean; totalItemCount: number } {
  if (!isObject(parsed)) {
    return { topicContractValid: false, totalItemCount: 0 };
  }

  const topics = Array.isArray(parsed.topics) ? parsed.topics : [];
  if (topics.length < 3 || topics.length > 5) {
    return { topicContractValid: false, totalItemCount: topics.length };
  }

  const hasValidTopicShape = topics.every((topic) => {
    if (!isObject(topic)) return false;

    const keywords = Array.isArray(topic.keywords) ? topic.keywords : [];
    const subtopics = Array.isArray(topic.subtopics) ? topic.subtopics : [];

    return (
      typeof topic.name === 'string' &&
      typeof topic.coverage === 'number' &&
      typeof topic.difficulty === 'string' &&
      typeof topic.importance === 'string' &&
      keywords.length >= 2 &&
      subtopics.length >= 2
    );
  });

  const coverageSum = topics.reduce((sum, topic) => {
    if (isObject(topic) && typeof topic.coverage === 'number') {
      return sum + topic.coverage;
    }
    return sum;
  }, 0);

  const hasMetadata = isObject(parsed.metadata);
  const coverageCloseToOne = Math.abs(coverageSum - 1) <= 0.06;

  return {
    topicContractValid: hasValidTopicShape && hasMetadata && coverageCloseToOne,
    totalItemCount: topics.length,
  };
}

export function evaluateOutputContract(flow: PromptRegressionFlow, output: string): OutputContractMetrics {
  const parsed = parseJson(output);
  if (!parsed) {
    return {
      jsonValid: false,
      schemaValidCount: 0,
      totalItemCount: 0,
      validQuestionRatio: 0,
      minimumValidQuestionRatio: MIN_VALID_QUESTION_RATIO_BY_FLOW[flow],
      meetsMinimumValidQuestionRatio: false,
      topicContractValid: false,
    };
  }

  if (flow === 'topic_identification') {
    const topicContract = evaluateTopicContract(parsed);
    return {
      jsonValid: true,
      schemaValidCount: topicContract.topicContractValid ? topicContract.totalItemCount : 0,
      totalItemCount: topicContract.totalItemCount,
      validQuestionRatio: topicContract.topicContractValid ? 1 : 0,
      minimumValidQuestionRatio: 1,
      meetsMinimumValidQuestionRatio: topicContract.topicContractValid,
      topicContractValid: topicContract.topicContractValid,
    };
  }

  const items = parseQuestionArray(parsed);
  const validCount = items.reduce<number>((count, item) => {
    const result = aiQuestionSchema.safeParse(item);
    return result.success ? count + 1 : count;
  }, 0);

  const total = items.length;
  const ratio = total > 0 ? Number((validCount / total).toFixed(3)) : 0;
  const minimumRatio = MIN_VALID_QUESTION_RATIO_BY_FLOW[flow];

  return {
    jsonValid: true,
    schemaValidCount: validCount,
    totalItemCount: total,
    validQuestionRatio: ratio,
    minimumValidQuestionRatio: minimumRatio,
    meetsMinimumValidQuestionRatio: ratio >= minimumRatio,
    topicContractValid: true,
  };
}

export function qualityScoreFromRubric(rubric: PromptQualityRubric, jsonValid: boolean): number {
  const jsonValidityScore = jsonValid ? 5 : 1;
  const total =
    jsonValidityScore +
    rubric.schemaAdherence +
    rubric.topicQuality +
    rubric.pedagogicalQuality +
    rubric.languageQuality;

  return Number((total / 5).toFixed(2));
}

export function evaluateProviderScenario(
  scenario: PromptRegressionScenario,
  provider: 'anthropic' | 'openai'
): ProviderScenarioMetrics {
  const pair = scenario.providers[provider];

  const baselineContract = evaluateOutputContract(scenario.flow, pair.baseline.output);
  const refactoredContract = evaluateOutputContract(scenario.flow, pair.refactored.output);

  const baselineQualityScore = qualityScoreFromRubric(pair.baseline.rubric, baselineContract.jsonValid);
  const refactoredQualityScore = qualityScoreFromRubric(pair.refactored.rubric, refactoredContract.jsonValid);

  return {
    baselineContract,
    refactoredContract,
    baselineQualityScore,
    refactoredQualityScore,
    qualityDelta: Number((refactoredQualityScore - baselineQualityScore).toFixed(2)),
  };
}

export function summarizeScenario(scenario: PromptRegressionScenario): {
  anthropic: ProviderScenarioMetrics;
  openai: ProviderScenarioMetrics;
  providerParityGap: number;
} {
  const anthropic = evaluateProviderScenario(scenario, 'anthropic');
  const openai = evaluateProviderScenario(scenario, 'openai');

  const providerParityGap = Number(
    Math.abs(anthropic.refactoredQualityScore - openai.refactoredQualityScore).toFixed(2)
  );

  return {
    anthropic,
    openai,
    providerParityGap,
  };
}

export function getJsonFailureRate(samples: PromptRegressionSample[]): number {
  const failures = samples.filter((sample) => parseJson(sample.output) === null).length;
  return Number((failures / Math.max(samples.length, 1)).toFixed(4));
}
