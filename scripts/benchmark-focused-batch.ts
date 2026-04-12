import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

import { generateQuestions } from '@/lib/ai/questionGenerator';
import { PromptBuilder, type BuildVariablesParams } from '@/lib/prompts/PromptBuilder';
import { PromptLoader } from '@/lib/prompts/PromptLoader';
import type { Question } from '@/types/questions';

type BenchmarkMode = 'quiz' | 'flashcard';
type BenchmarkPath = 'before' | 'after';

type Fixture = {
  id: 'biology' | 'grammar';
  subject: 'biology' | 'finnish';
  subjectType: 'concepts' | 'language';
  difficulty: 'normaali';
  grade: 5;
  mode: BenchmarkMode;
  questionCount: number;
  focusTopic: string;
  identifiedTopics: string[];
  topic: string;
  subtopic?: string;
  contentType?: 'grammar';
  materialText: string;
};

type PromptSnapshot = {
  label: string;
  mode: BenchmarkMode;
  path: BenchmarkPath;
  fixtureId: Fixture['id'];
  focusTopic: string;
  prompt: string;
  promptVersions: Record<string, string>;
  usedFocusedTemplates: boolean;
  distributionSectionPresent: boolean;
};

type ExecutionRecord = PromptSnapshot & {
  executionStatus: 'blocked_missing_api_key' | 'generated' | 'generation_failed';
  blocker?: string;
  generationError?: string;
  rawOutput?: Question[];
  autoCounts?: {
    topicDriftViolations: number;
    subtopicSpread: number;
    skillSpread: number;
  };
};

const RESULTS_DIR = path.join(process.cwd(), 'results');
const RAW_DIR = path.join(RESULTS_DIR, 'raw');

const biologyFixture: Fixture = {
  id: 'biology',
  subject: 'biology',
  subjectType: 'concepts',
  difficulty: 'normaali',
  grade: 5,
  mode: 'quiz',
  questionCount: 10,
  focusTopic: 'Fotosynteesi',
  identifiedTopics: ['Fotosynteesi'],
  topic: 'Fotosynteesi',
  materialText: [
    'Kasvit valmistavat itse ravintonsa fotosynteesissä. Fotosynteesi tapahtuu lehtivihreää sisältävissä kasvin osissa, yleensä lehdissä.',
    'Siinä kasvi käyttää auringonvaloa, vettä ja hiilidioksidia tuottaakseen sokeria ja happea.',
    'Kasvin soluissa tapahtuu myös soluhengitystä. Soluhengityksessä sokeri reagoi hapen kanssa ja vapauttaa energiaa, jota solu tarvitsee toimintaansa.',
    'Fotosynteesi varastoi energiaa sokeriin, kun taas soluhengitys vapauttaa sitä käyttöön.',
    'Päivällä kasvi voi tehdä sekä fotosynteesiä että soluhengitystä, mutta pimeässä fotosynteesi ei toimi ilman valoa.',
  ].join('\n'),
};

const grammarMaterial = [
  'Aihe: preesensin verbitaivutus',
  '',
  'Myönteinen muoto:',
  '| persoona | puhua | syödä | mennä |',
  '| minä | puhun | syön | menen |',
  '| sinä | puhut | syöt | menet |',
  '| hän | puhuu | syö | menee |',
  '| me | puhumme | syömme | menemme |',
  '| te | puhutte | syötte | menette |',
  '| he | puhuvat | syövät | menevät |',
  '',
  'Kielteinen muoto:',
  '| persoona | puhua | syödä | mennä |',
  '| minä | en puhu | en syö | en mene |',
  '| sinä | et puhu | et syö | et mene |',
  '| hän | ei puhu | ei syö | ei mene |',
  '| me | emme puhu | emme syö | emme mene |',
  '| te | ette puhu | ette syö | ette mene |',
  '| he | eivät puhu | eivät syö | eivät mene |',
  '',
  'Kysymysmuoto muodostetaan verbillä "olla" tai sanajärjestyksen muutoksella tilanteesta riippuen, esimerkiksi: Puhutko? Meneekö hän?',
].join('\n');

const grammarQuizFixture: Fixture = {
  id: 'grammar',
  subject: 'finnish',
  subjectType: 'language',
  difficulty: 'normaali',
  grade: 5,
  mode: 'quiz',
  questionCount: 10,
  focusTopic: 'Preesensin kielioppi',
  identifiedTopics: ['Preesensin kielioppi'],
  topic: 'Preesensin kielioppi',
  subtopic: 'Verbitaivutus',
  contentType: 'grammar',
  materialText: grammarMaterial,
};

const grammarFlashcardFixture: Fixture = {
  ...grammarQuizFixture,
  mode: 'flashcard',
};

function makeParams(fixture: Fixture, benchmarkPath: BenchmarkPath): BuildVariablesParams {
  const baseParams: BuildVariablesParams = {
    subject: fixture.subject,
    subjectType: fixture.subjectType,
    difficulty: fixture.difficulty,
    questionCount: fixture.questionCount,
    grade: fixture.grade,
    materialText: fixture.materialText,
    mode: fixture.mode,
    identifiedTopics: fixture.identifiedTopics,
    topic: fixture.topic,
    subtopic: fixture.subtopic,
    contentType: fixture.contentType,
  };

  if (benchmarkPath === 'after') {
    return {
      ...baseParams,
      focusTopic: fixture.focusTopic,
    };
  }

  return baseParams;
}

async function assembleSnapshot(
  label: string,
  fixture: Fixture,
  benchmarkPath: BenchmarkPath
): Promise<PromptSnapshot> {
  const loader = new PromptLoader();
  const builder = new PromptBuilder(loader);
  const prompt = await builder.assemblePrompt(makeParams(fixture, benchmarkPath));
  const promptVersions = builder.getPromptMetadata().versions;

  return {
    label,
    mode: fixture.mode,
    path: benchmarkPath,
    fixtureId: fixture.id,
    focusTopic: fixture.focusTopic,
    prompt,
    promptVersions,
    usedFocusedTemplates:
      'core/focused-batch-tagging.txt' in promptVersions ||
      'core/focused-batch-flashcard.txt' in promptVersions,
    distributionSectionPresent: prompt.includes('JAKAUTUMINEN:'),
  };
}

function asExecutionRecord(snapshot: PromptSnapshot): ExecutionRecord {
  return {
    ...snapshot,
    executionStatus: 'blocked_missing_api_key',
    blocker: 'ANTHROPIC_API_KEY is not set in this execution environment, so raw model output could not be generated.',
  };
}

function countAutomaticMetrics(questions: Question[], focusTopic: string): ExecutionRecord['autoCounts'] {
  return {
    topicDriftViolations: questions.filter(question => question.topic !== focusTopic).length,
    subtopicSpread: new Set(
      questions
        .map(question => ('subtopic' in question ? question.subtopic : undefined))
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    ).size,
    skillSpread: new Set(
      questions
        .map(question => ('skill' in question ? question.skill : undefined))
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    ).size,
  };
}

async function executeGeneration(
  fixture: Fixture,
  benchmarkPath: BenchmarkPath
): Promise<ExecutionRecord> {
  const snapshot = await assembleSnapshot(
    `${fixture.id}-${fixture.mode}`,
    fixture,
    benchmarkPath
  );
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    return asExecutionRecord(snapshot);
  }

  try {
    const questions = await generateQuestions({
      ...makeParams(fixture, benchmarkPath),
      apiKey,
    });

    return {
      ...snapshot,
      executionStatus: 'generated',
      rawOutput: questions,
      autoCounts: countAutomaticMetrics(questions, fixture.focusTopic),
    };
  } catch (error) {
    return {
      ...snapshot,
      executionStatus: 'generation_failed',
      generationError: error instanceof Error ? error.message : String(error),
    };
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function main(): Promise<void> {
  await mkdir(RAW_DIR, { recursive: true });
  const apiKeyAvailable = Boolean(process.env.ANTHROPIC_API_KEY?.trim());

  const beforeOutputs = await Promise.all([
    executeGeneration(biologyFixture, 'before'),
    executeGeneration(grammarQuizFixture, 'before'),
    executeGeneration(grammarFlashcardFixture, 'before'),
  ]);

  const afterOutputs = await Promise.all([
    executeGeneration(biologyFixture, 'after'),
    executeGeneration(grammarQuizFixture, 'after'),
    executeGeneration(grammarFlashcardFixture, 'after'),
  ]);

  const wholeSetBefore = await assembleSnapshot('whole-set-compatibility', {
    ...biologyFixture,
    identifiedTopics: ['Fotosynteesi', 'Soluhengitys'],
    questionCount: 20,
  }, 'before');
  const wholeSetAfter = await assembleSnapshot('whole-set-compatibility', {
    ...biologyFixture,
    identifiedTopics: ['Fotosynteesi', 'Soluhengitys'],
    questionCount: 20,
  }, 'before');

  const wholeSetMatches = wholeSetBefore.prompt === wholeSetAfter.prompt;

  const benchmarkContext = {
    generatedAt: new Date().toISOString(),
    apiExecutionAttempted: apiKeyAvailable,
    apiExecutionBlockedReason: apiKeyAvailable ? null : 'ANTHROPIC_API_KEY missing',
    fixtures: {
      biology: {
        focusTopic: biologyFixture.focusTopic,
        identifiedTopics: ['Fotosynteesi', 'Soluhengitys'],
        materialText: biologyFixture.materialText,
      },
      grammar: {
        focusTopic: grammarQuizFixture.focusTopic,
        materialText: grammarQuizFixture.materialText,
      },
    },
    wholeSetCompatibility: {
      exactPromptMatch: wholeSetMatches,
      beforePromptVersions: wholeSetBefore.promptVersions,
      afterPromptVersions: wholeSetAfter.promptVersions,
    },
  };

  await writeJson(path.join(RAW_DIR, 'benchmark-focused-batch-before.json'), {
    ...benchmarkContext,
    benchmarkPath: 'before',
    outputs: beforeOutputs,
  });

  await writeJson(path.join(RAW_DIR, 'benchmark-focused-batch-after.json'), {
    ...benchmarkContext,
    benchmarkPath: 'after',
    outputs: afterOutputs,
  });
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
