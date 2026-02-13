import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createLogger } from '@/lib/logger';
import { requireAuth } from '@/lib/supabase/server-auth';
import { createQuestionSetSchema } from '@/lib/validation/schemas';
import {
  identifyTopicsFromMaterial,
  processUploadedFiles,
  generateFlashcardSet,
  type FlashcardDiagnostics,
  FlashcardGenerationRequest,
} from '@/lib/api/questionGeneration';
import { getSimpleTopics } from '@/lib/ai/topicIdentifier';
import { analyzeMaterialCapacity, validateQuestionCount } from '@/lib/utils/materialAnalysis';
import { parseRequestedProvider, validateRequestedProvider } from '@/lib/api/modelSelection';

// Configure route segment for Vercel deployment
export const maxDuration = 240; // 4 minutes for flashcard generation

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/generate-questions/flashcard' });

  logger.info({ method: 'POST' }, 'Flashcard generation request received');

  try {
    // Verify authentication
    let userId = '';
    try {
      const user = await requireAuth();
      userId = user.id;
      logger.info('Authentication successful');
    } catch (authError) {
      logger.warn('Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to generate flashcard questions.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const contentType = (formData.get('contentType') as string | null) || 'vocabulary';
    const bypassCapacityCheckRaw = (formData.get('bypassCapacityCheck') as string | null)?.toLowerCase();
    const bypassCapacityCheck = bypassCapacityCheckRaw === 'true' || bypassCapacityCheckRaw === '1';
    const capacityCheckOnlyRaw = (formData.get('capacityCheckOnly') as string | null)?.toLowerCase();
    const capacityCheckOnly = capacityCheckOnlyRaw === 'true' || capacityCheckOnlyRaw === '1';

    // Extract form data
    const targetWordsRaw = formData.get('targetWords') as string | null;
    const targetWords = targetWordsRaw
      ? targetWordsRaw.split(',').map(w => w.trim()).filter(Boolean)
      : undefined;

    const identifiedTopicsRaw = formData.get('identifiedTopics') as string | null;
    const identifiedTopics = identifiedTopicsRaw
      ? JSON.parse(identifiedTopicsRaw)
      : undefined;
    const targetProvider = parseRequestedProvider(formData.get('provider'));
    if (targetProvider) {
      const modelValidationError = validateRequestedProvider(targetProvider);
      if (modelValidationError) {
        return NextResponse.json({ error: modelValidationError }, { status: 400 });
      }
    }

    const rawData = {
      subject: formData.get('subject') as string,
      questionCount: parseInt(formData.get('questionCount') as string),
      examLength: parseInt(formData.get('examLength') as string),
      questionSetName: formData.get('questionSetName') as string,
      grade: formData.get('grade') ? parseInt(formData.get('grade') as string) : undefined,
      topic: (formData.get('topic') as string | null) || undefined,
      subtopic: (formData.get('subtopic') as string | null) || undefined,
      materialText: (formData.get('materialText') as string | null) || undefined,
      subjectType: (formData.get('subjectType') as string | null) || undefined,
      targetWords,
      contentType,
    };

    // Validate input with Zod schema
    const validationResult = createQuestionSetSchema.safeParse(rawData);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const {
      subject,
      subjectType,
      questionCount,
      examLength,
      questionSetName,
      grade,
      topic,
      subtopic,
      materialText,
      targetWords: validatedTargetWords,
      contentType: validatedContentType,
    } = validationResult.data;

    // Process uploaded files
    const { files, error: fileError } = await processUploadedFiles(formData);
    if (fileError) {
      return NextResponse.json({ error: fileError }, { status: 400 });
    }

    // Validate that we have some material
    if (!materialText && files.length === 0) {
      return NextResponse.json(
        { error: 'Please provide material (text or files) for flashcard generation' },
        { status: 400 }
      );
    }

    if (materialText && materialText.length < 200 && files.length === 0) {
      logger.warn(
        { materialLength: materialText.length },
        'Material text is very short for flashcard generation'
      );

      return NextResponse.json(
        {
          error: 'Materiaali on liian lyhyt muistikorttien luomiseen',
          details: `Materiaali sisältää vain ${materialText.length} merkkiä. Suosittelemme vähintään 200 merkkiä tai PDF/kuva-tiedoston lisäämistä.`,
          suggestions: [
            'Lisää enemmän materiaalitekstiä',
            'Lataa PDF tai kuva-tiedosto',
            'Varmista että materiaali sisältää opetettavia sääntöjä tai konsepteja',
          ],
        },
        { status: 400 }
      );
    }

    // Grammar flashcards need explicit rule explanations in material.
    if (validatedContentType === 'grammar') {
      if (materialText && materialText.length < 300 && files.length === 0) {
        return NextResponse.json(
          {
            error: 'Kielioppimuistikortit vaativat vähintään 300 merkkiä materiaalia',
            details: `Materiaali sisältää vain ${materialText.length} merkkiä. Lisää sääntöjen selityksiä tai lataa PDF/kuva-tiedosto.`,
            suggestions: [
              'Lisää kielioppisääntöjen selityksiä materiaaliin',
              'Varmista että materiaali sisältää "Miten muodostetaan..." tai "Mikä on..." -muotoisia selityksiä',
              'Lataa PDF tai kuva-tiedosto jossa on sääntöjen selityksiä',
              'Jos materiaali sisältää vain sanoja, valitse "Sanasto" sisällön tyyppinä',
            ],
          },
          { status: 400 }
        );
      }

      if (materialText) {
        const hasRuleIndicators =
          /\b(miten\s+muodostetaan|mikä\s+on|miten\s+käytetään|milloin\s+käytetään|kuinka|how\s+to|how\s+do\s+you|when\s+do\s+you\s+use|what\s+is|rule|sääntö|kaava|formula|kielioppi|grammar|verbi|verb|aikamuoto|tense|preesens|imperfekti|perfekti|partisiippi|taivutus|conjugation)\b/i.test(
            materialText
          );

        // Do not hard-block generation based on heuristic keyword checks.
        // Some valid grammar materials describe rules without the exact trigger phrases.
        if (!hasRuleIndicators && files.length === 0) {
          logger.warn(
            { materialLength: materialText.length, contentType: validatedContentType },
            'Grammar flashcard material lacks explicit rule indicators - continuing generation'
          );
        }
      }
    }

    // Material sufficiency analysis before generation.
    if (materialText && !bypassCapacityCheck) {
      const capacity = analyzeMaterialCapacity(materialText);
      const questionCountValidation = validateQuestionCount(questionCount, capacity);

      if (questionCountValidation.status === 'risky' || questionCountValidation.status === 'excessive') {
        return NextResponse.json({
          warningRequired: true,
          capacity,
          validation: questionCountValidation,
          message: `Materiaali tukee optimaalisesti ${capacity.optimalQuestionCount} kysymystä, mutta pyysit ${questionCount}.`,
        });
      }

      if (capacityCheckOnly) {
        return NextResponse.json({
          warningRequired: false,
          capacity,
          validation: questionCountValidation,
        });
      }
    } else if (capacityCheckOnly) {
      return NextResponse.json({ warningRequired: false });
    }

    logger.info(
      {
        subject,
        questionCount,
        hasTopics: !!identifiedTopics,
        hasText: !!materialText,
        fileCount: files.length,
        contentType: validatedContentType,
        bypassCapacityCheck,
        capacityCheckOnly,
        provider: targetProvider ?? 'anthropic',
      },
      'Starting flashcard generation'
    );

    // Step 1: Identify topics (if not provided)
    let topicAnalysis;
    let topics = identifiedTopics;

    if (!topics) {
      logger.info('Topics not provided, identifying topics from material');
      topicAnalysis = await identifyTopicsFromMaterial({
        subject,
        grade,
        materialText,
        materialFiles: files.length > 0 ? files : undefined,
        targetProvider,
      });
      topics = getSimpleTopics(topicAnalysis);
    } else {
      logger.info(
        { topicCount: topics.length },
        'Using pre-identified topics'
      );
    }

    // Step 2: Generate flashcard set
    const flashcardRequest: FlashcardGenerationRequest = {
      userId,
      subject,
      subjectType,
      questionCount,
      examLength,
      questionSetName,
      grade,
      topic,
      subtopic,
      materialText,
      materialFiles: files.length > 0 ? files : undefined,
      targetWords: validatedTargetWords,
      identifiedTopics: topics,
      contentType: validatedContentType,
      targetProvider,
    };

    // Pass enhanced topics if available (Phase 2)
    const flashcardSet = await generateFlashcardSet(
      flashcardRequest,
      topicAnalysis?.topics // Enhanced topics with coverage/keywords
    );

    logger.info(
      {
        code: flashcardSet.code,
        questionCount: flashcardSet.questionSet.question_count,
      },
      'Flashcard generation completed successfully'
    );

    return NextResponse.json({
      success: true,
      questionSet: {
        code: flashcardSet.code,
        name: flashcardSet.questionSet.name,
        mode: flashcardSet.questionSet.mode,
        questionCount: flashcardSet.questionSet.question_count,
      },
    });
  } catch (err) {
    logger.error({ error: err }, 'Error generating flashcards');

    const errorMessage = err instanceof Error ? err.message : 'Muistikorttien luonti epäonnistui';
    const diagnostics =
      err && typeof err === 'object' && 'diagnostics' in err
        ? (err as { diagnostics?: FlashcardDiagnostics }).diagnostics
        : undefined;

    const errorResponse: {
      success: boolean;
      error: string;
      diagnostics?: {
        materialLength: number;
        hasGrammarKeywords: boolean;
        isGrammarSubject: boolean;
        topicProvided: boolean;
        suggestedTopic?: string;
      };
      suggestions?: string[];
    } = {
      success: false,
      error: errorMessage,
    };

    if (diagnostics) {
      errorResponse.diagnostics = {
        materialLength: diagnostics.materialLength,
        hasGrammarKeywords: diagnostics.hasGrammarKeywords,
        isGrammarSubject: diagnostics.isGrammarSubject,
        topicProvided: diagnostics.topicProvided,
        suggestedTopic: diagnostics.suggestedTopic,
      };
      errorResponse.suggestions = diagnostics.suggestions;
    }

    const statusCode = errorMessage.includes('Materiaali on liian lyhyt') ? 400 : 500;

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
