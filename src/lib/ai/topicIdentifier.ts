import { generateWithClaude, MessageContent } from './anthropic';
import { Subject } from '@/types';
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

export interface TopicAnalysisResult {
  topics: string[];
  primarySubject: string;
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

  // Construct focused topic identification prompt
  const prompt = `Analysoi seuraava ${subject}-aiheen oppimateriaali ${grade ? `(luokka ${grade})` : ''} ja tunnista 3-5 korkeantason aihealuetta.

${materialText ? `MATERIAALI:\n${materialText}\n\n` : ''}

TEHTÄVÄ:
Tunnista materiaalist 3-5 KORKEANTASON aihealuetta, jotka kattavat materiaalin pääsisällön.

VAATIMUKSET:
1. Aihealueiden tulee olla KORKEANTASON käsitteitä (ei yksityiskohtia)
2. Jokaisen aihealueen tulee kattaa merkittävä osa materiaalista
3. Aihealueiden tulee olla riittävän erilaisia toisistaan
4. Käytä lyhyitä, selkeitä nimiä (1-3 sanaa per aihealue)
5. Vastaa VAIN JSON-muodossa, ei muuta tekstiä

ESIMERKKEJÄ HYVISTÄ AIHEALUEISTA:
- Matematiikka: "Laskutoimitukset", "Geometria", "Luvut"
- Englanti: "Grammar", "Vocabulary", "Reading"
- Historia: "Antiikin Rooma", "Keskiaikainen Eurooppa", "Renessanssi"
- Ympäristöoppi: "Luonnonilmiöt", "Ekosysteemit", "Ilmastonmuutos"

HUONOJA ESIMERKKEJÄ (liian yksityiskohtaisia):
- "Yhteenlasku ja vähennyslasku" (käytä: "Laskutoimitukset")
- "Present Simple and Present Continuous" (käytä: "Grammar")
- "Rooman armeijan organisaatio" (käytä: "Antiikin Rooma")

JSON VASTAUSMUOTO:
{
  "topics": [
    "Aihealue 1",
    "Aihealue 2",
    "Aihealue 3"
  ]
}

TÄRKEÄÄ:
- Vastaa PELKÄLLÄ JSON-objektilla
- Älä lisää selityksiä tai muuta tekstiä
- Tunnista 3-5 aihealuetta (ei vähemmän, ei enemmän)
- Aihealueiden tulee olla korkealla tasolla`;

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

  // Call AI with smaller token limit (topic identification is simpler)
  const response = await generateWithClaude(messageContent, { maxTokens: 1000 });

  // Parse JSON response
  const cleanContent = response.content.replace(/```json|```/g, '').trim();

  let result: { topics?: string[] };
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

  // Validate response
  if (!result.topics || !Array.isArray(result.topics)) {
    throw new Error('AI response missing topics array');
  }

  if (result.topics.length < 3 || result.topics.length > 5) {
    logger.warn(
      {
        topicCount: result.topics.length,
        topics: result.topics,
      },
      'Topic count outside expected range (3-5), adjusting...'
    );

    // Adjust to fit range
    if (result.topics.length < 3) {
      // Add generic topic if too few
      while (result.topics.length < 3) {
        result.topics.push(subject);
      }
    } else if (result.topics.length > 5) {
      // Take first 5 if too many
      result.topics = result.topics.slice(0, 5);
    }
  }

  logger.info(
    {
      topics: result.topics,
      topicCount: result.topics.length,
    },
    'Successfully identified topics'
  );

  return {
    topics: result.topics,
    primarySubject: subject,
  };
}
