import { createLogger } from '@/lib/logger';

const logger = createLogger({ module: 'materialAnalysis' });

export interface MaterialCapacity {
  wordCount: number;
  sentenceCount: number;
  estimatedConcepts: number;
  optimalQuestionCount: number;
  acceptableQuestionCount: number;
  maxQuestionCount: number;
  richness: 'very_rich' | 'rich' | 'moderate' | 'sparse' | 'very_sparse';
  recommendations: string[];
}

export interface QuestionCountValidation {
  status: 'optimal' | 'acceptable' | 'risky' | 'excessive';
  message: string;
  recommendedCount?: number;
}

interface PoolSizeRecommendationInput {
  materialText?: string;
  totalConcepts?: number;
  completeness?: number;
}

/**
 * Analyze material to estimate question generation capacity.
 */
export function analyzeMaterialCapacity(materialText: string): MaterialCapacity {
  const wordCount = countWords(materialText);
  const sentenceCount = countSentences(materialText);
  const estimatedConcepts = estimateConceptCount(materialText);
  const richness = calculateRichness(wordCount, estimatedConcepts);
  const capacity = calculateCapacity(wordCount, estimatedConcepts, richness);
  const recommendations = generateRecommendations(
    wordCount,
    estimatedConcepts,
    capacity,
    richness
  );

  logger.info(
    {
      wordCount,
      sentenceCount,
      estimatedConcepts,
      richness,
      optimalQuestionCount: capacity.optimal,
      acceptableQuestionCount: capacity.acceptable,
      maxQuestionCount: capacity.max,
    },
    'Material capacity analyzed'
  );

  return {
    wordCount,
    sentenceCount,
    estimatedConcepts,
    optimalQuestionCount: capacity.optimal,
    acceptableQuestionCount: capacity.acceptable,
    maxQuestionCount: capacity.max,
    richness,
    recommendations,
  };
}

/**
 * Check whether requested question count is reasonable for material.
 */
export function validateQuestionCount(
  requestedCount: number,
  capacity: MaterialCapacity
): QuestionCountValidation {
  if (requestedCount <= capacity.optimalQuestionCount) {
    return {
      status: 'optimal',
      message: 'Kysymysmäärä sopii materiaalin määrään hyvin.',
    };
  }

  if (requestedCount <= capacity.acceptableQuestionCount) {
    return {
      status: 'acceptable',
      message: 'Kysymysmäärä on hyväksyttävissä, mutta saattaa esiintyä jonkin verran toistoa.',
      recommendedCount: capacity.optimalQuestionCount,
    };
  }

  if (requestedCount <= capacity.maxQuestionCount) {
    return {
      status: 'risky',
      message: 'Kysymysmäärä on korkea materiaalin määrään nähden. Laatu saattaa kärsiä.',
      recommendedCount: capacity.optimalQuestionCount,
    };
  }

  return {
    status: 'excessive',
    message: 'Kysymysmäärä on liian korkea. Kysymykset tulevat olemaan toisteisia ja heikkolaatuisia.',
    recommendedCount: capacity.optimalQuestionCount,
  };
}

/**
 * Recommend question pool size based on available content.
 * Uses text capacity analysis when text exists, otherwise falls back to
 * topic-analysis metadata (concept count + completeness).
 */
export function recommendQuestionPoolSize(
  input: PoolSizeRecommendationInput
): number {
  if (input.materialText && input.materialText.trim().length > 0) {
    const capacity = analyzeMaterialCapacity(input.materialText);
    return Math.max(20, Math.min(200, capacity.optimalQuestionCount));
  }

  const totalConcepts = Math.max(2, Math.min(50, input.totalConcepts ?? 8));
  const completeness = Math.max(0, Math.min(1, input.completeness ?? 0.75));
  const heuristic = Math.round(totalConcepts * (2.5 + completeness * 2));
  return Math.max(20, Math.min(200, heuristic));
}

function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

function countSentences(text: string): number {
  if (!text.trim()) return 0;
  return text.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0).length;
}

function estimateConceptCount(text: string): number {
  const capitalWords = text.match(/\b[A-ZÄÖÅ][a-zäöå]+/g) || [];
  const uniqueCapitalWords = new Set(capitalWords.map((word) => word.toLowerCase()));

  const numbers = text.match(/\b\d+([,\.]\d+)?\b/g) || [];
  const listItems = text.match(/^[\s]*[-*•]\s+/gm) || [];
  const headings = text.match(/^#{1,6}\s+/gm) || [];

  const baseEstimate = Math.max(
    Math.floor(text.length / 200),
    uniqueCapitalWords.size,
    2
  );

  const structureBoost = listItems.length + headings.length * 2;
  const estimate = baseEstimate + Math.floor(structureBoost / 2) + numbers.length;

  logger.debug(
    {
      textLength: text.length,
      uniqueCapitalWords: uniqueCapitalWords.size,
      numbers: numbers.length,
      listItems: listItems.length,
      headings: headings.length,
      estimate,
    },
    'Concept estimation breakdown'
  );

  return Math.max(2, Math.min(estimate, 50));
}

function calculateRichness(
  wordCount: number,
  conceptCount: number
): MaterialCapacity['richness'] {
  if (wordCount >= 1600) return 'very_rich';
  if (wordCount >= 800) return 'rich';
  if (wordCount >= 300) return 'moderate';
  if (wordCount >= 120 || conceptCount >= 4) return 'sparse';
  return 'very_sparse';
}

function calculateCapacity(
  wordCount: number,
  conceptCount: number,
  richness: MaterialCapacity['richness']
): { optimal: number; acceptable: number; max: number } {
  let questionsPerConcept: number;
  let wordsPerQuestion: number;

  switch (richness) {
    case 'very_rich':
      questionsPerConcept = 4;
      wordsPerQuestion = 35;
      break;
    case 'rich':
      questionsPerConcept = 3;
      wordsPerQuestion = 45;
      break;
    case 'moderate':
      questionsPerConcept = 2;
      wordsPerQuestion = 40;
      break;
    case 'sparse':
      questionsPerConcept = 1.25;
      wordsPerQuestion = 90;
      break;
    case 'very_sparse':
      questionsPerConcept = 1.1;
      wordsPerQuestion = 140;
      break;
  }

  const byWords = Math.floor(wordCount / wordsPerQuestion);
  const byConcepts = Math.floor(conceptCount * questionsPerConcept);
  const optimal = Math.min(byWords, byConcepts);
  const acceptable = Math.floor(optimal * 1.3);
  const max = Math.floor(optimal * 1.6);

  return {
    optimal: Math.max(2, optimal),
    acceptable: Math.max(3, acceptable),
    max: Math.max(5, max),
  };
}

function generateRecommendations(
  wordCount: number,
  conceptCount: number,
  capacity: { optimal: number; acceptable: number; max: number },
  richness: MaterialCapacity['richness']
): string[] {
  const recommendations: string[] = [];

  if (richness === 'very_sparse' || richness === 'sparse') {
    recommendations.push('Materiaali on melko niukka. Harkitse lisämateriaalin lisäämistä.');
  }

  if (wordCount < 100) {
    recommendations.push(`Materiaali on lyhyt (${wordCount} sanaa). Suosittelemme vähintään 200 sanaa.`);
  }

  if (conceptCount < 5) {
    recommendations.push(`Tunnistettu vain ${conceptCount} käsitettä. Monipuolisempi materiaali tuottaa parempia kysymyksiä.`);
  }

  if (capacity.optimal < 10) {
    recommendations.push('Optimaalinen kysymysmäärä on alle 10. Harkitse materiaalin laajentamista useampiin kysymyksiin.');
  }

  return recommendations;
}
