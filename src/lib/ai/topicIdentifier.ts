import { generateWithClaude, MessageContent } from './anthropic';
import { Subject, Difficulty } from '@/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ module: 'topicIdentifier' });

export interface IdentifyTopicsParams {
  subject: Subject;
  grade?: number;
  materialText?: string;
  materialFiles?: Array<{
    type: string;
    name: string;
    data: string; // base64
  }>;
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
  params: IdentifyTopicsParams
): Promise<TopicAnalysisResult> {
  const { subject, grade, materialText, materialFiles } = params;

  // Build message content
  const messageContent: MessageContent[] = [];

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

  // Construct enhanced topic identification prompt
  const prompt = `Analysoi seuraava ${subject}-aiheen oppimateriaali ${grade ? `(luokka ${grade})` : ''} ja tunnista 3-5 korkeantason aihealuetta TÄYDELLISINE metatietoineen.

${materialText ? `MATERIAALI:\n${materialText}\n\n` : ''}

TEHTÄVÄ:
Tunnista materiaalist 3-5 KORKEANTASON aihealuetta ja anna jokaiselle:
1. Coverage: Kuinka suuren osan materiaalista aihealue kattaa (desimaaliluku 0-1)
2. Difficulty: helppo, normaali tai vaikea
3. Keywords: 3-5 keskeistä käsitettä tälle aihealueelle
4. Subtopics: 2-4 aliaihealuetta
5. Importance: high, medium tai low (oppimistavoitteiden kannalta)

JSON VASTAUSMUOTO:
{
  "topics": [
    {
      "name": "Aihealue nimi (1-3 sanaa)",
      "coverage": 0.4,
      "difficulty": "helppo",
      "keywords": ["avainsana1", "avainsana2", "avainsana3"],
      "subtopics": ["Aliaihealue 1", "Aliaihealue 2"],
      "importance": "high"
    }
  ],
  "metadata": {
    "totalConcepts": 10,
    "estimatedDifficulty": "normaali",
    "completeness": 0.85,
    "materialType": "textbook"
  }
}

COVERAGE OHJEET:
- TÄRKEÄÄ: Kaikkien aihealueiden coverage-arvojen SUMMA pitää olla 1.0 (eli 100%)
- Jos Geometria kattaa 45% materiaalista → coverage: 0.45
- Jos Laskutoimitukset 35% → coverage: 0.35
- Jos Luvut 20% → coverage: 0.20
- Summa: 0.45 + 0.35 + 0.20 = 1.0 ✓
- Isoimman aihealueen coverage oltava vähintään 0.25
- Pienimmän aihealueen coverage oltava vähintään 0.15

DIFFICULTY OHJEET:
- helppo: Perusasiat, tunnistaminen, yksinkertaiset käsitteet
- normaali: Soveltaminen, ymmärtäminen, keskivaikeat ongelmat
- vaikea: Analyysi, synteesi, monimutkaiset ongelmat

KEYWORDS OHJEET:
- 3-5 konkreettista käsitettä per aihealue
- Käytä SPESIFISIÄ termejä, ei yleiskäsitteitä
- HYVÄ: "pinta-ala", "suorakulmio", "piiri", "kolmio"
- HUONO: "geometria", "matemaattiset käsitteet"
- Englanninkielisissä aineissa käytä englantia keywords-kentässä

SUBTOPICS OHJEET:
- 2-4 aliaihealuetta per pääaihealue
- Tarkempi jaottelu kuin pääaihealue
- HYVÄ: Geometria → ["Pinta-alat", "Piiri ja kehä", "Kolmiot"]
- HUONO: Geometria → ["Matematiikka", "Laskut"]

IMPORTANCE OHJEET:
- high: Keskeinen oppimistavoite, paljon materiaalia, kriittinen ymmärrys
- medium: Tärkeä mutta ei pääfokus, tukee muita aihealueita
- low: Sivujuonne, lisätieto, vähän materiaalia

METADATA OHJEET:
- totalConcepts: Montako erillistä käsitettä materiaalissa (arvio 5-20)
- estimatedDifficulty: Yleinen vaikeustaso koko materiaalille
- completeness: 0.0-1.0, kuinka kattavasti materiaali käsittelee aihetta
- materialType: "textbook" (oppikirja), "worksheet" (tehtäviä), "notes" (muistiinpanot), "mixed"

ESIMERKKEJÄ:

Matematiikka (Geometria):
{
  "topics": [
    {
      "name": "Pinta-alat",
      "coverage": 0.45,
      "difficulty": "normaali",
      "keywords": ["suorakulmio", "kolmio", "ympyrä", "pinta-ala"],
      "subtopics": ["Suorakulmion pinta-ala", "Kolmion pinta-ala", "Ympyrän pinta-ala"],
      "importance": "high"
    },
    {
      "name": "Piiri ja kehä",
      "coverage": 0.35,
      "difficulty": "helppo",
      "keywords": ["piiri", "kehä", "sivujen summa"],
      "subtopics": ["Monikulmion piiri", "Ympyrän kehä"],
      "importance": "high"
    },
    {
      "name": "Tilavuudet",
      "coverage": 0.20,
      "difficulty": "vaikea",
      "keywords": ["kuutio", "tilavuus", "särmä"],
      "subtopics": ["Kuution tilavuus", "Suorakulmaisen särmiön tilavuus"],
      "importance": "medium"
    }
  ],
  "metadata": {
    "totalConcepts": 12,
    "estimatedDifficulty": "normaali",
    "completeness": 0.90,
    "materialType": "textbook"
  }
}

TÄRKEÄÄ:
- Vastaa PELKÄLLÄ JSON-objektilla
- Älä lisää selityksiä tai muuta tekstiä
- Varmista että coverage-arvot summautuvat 1.0:ksi
- Anna 3-5 aihealuetta (ei vähemmän, ei enemmän)`;

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
    },
    'Identifying topics from material'
  );

  // Call AI with larger token limit for enhanced response
  const response = await generateWithClaude(messageContent, 2000);

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

  // Validate difficulty values
  const validDifficulties = ['helppo', 'normaali', 'vaikea'];
  result.topics.forEach(topic => {
    if (!validDifficulties.includes(topic.difficulty)) {
      logger.warn(
        {
          topic: topic.name,
          difficulty: topic.difficulty,
        },
        'Invalid difficulty, defaulting to "normaali"'
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
    name: t.name,
    coverage: t.coverage,
    difficulty: t.difficulty as Difficulty,
    keywords: t.keywords,
    subtopics: t.subtopics,
    importance: t.importance as 'high' | 'medium' | 'low',
  }));

  const metadata: TopicAnalysisMetadata = {
    totalConcepts: result.metadata.totalConcepts,
    estimatedDifficulty: result.metadata.estimatedDifficulty as Difficulty,
    completeness: result.metadata.completeness,
    materialType: result.metadata.materialType as any,
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
