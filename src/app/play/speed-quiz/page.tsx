import type { Metadata } from 'next';
import { Lightning, ArrowLeft, GlobeHemisphereWest, MathOperations, Scroll, Bank, Leaf, MapTrifold, BookOpenText, Timer } from '@phosphor-icons/react/dist/ssr';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchPublishedQuestionSets } from '@/lib/supabase/queries';
import type { QuestionSet } from '@/types';

export const metadata: Metadata = {
  title: 'Aikahaaste | Koekertaaja',
  description: 'Nopea aikahaaste – vastaa 10 kysymykseen 15 sekunnissa. Testaa tietosi ja paranna tulostasi!',
  alternates: {
    canonical: '/play/speed-quiz',
  },
};

const MIN_SPEED_QUIZ_QUESTIONS = 10;

type SpeedQuizDataFetcher = () => Promise<QuestionSet[]>;

interface SpeedQuizModeData {
  eligibleSets: QuestionSet[];
  ineligibleSets: QuestionSet[];
}

const subjectLabelMap: Record<string, string> = {
  english: 'Englanti',
  math: 'Matematiikka',
  history: 'Historia',
  society: 'Yhteiskuntaoppi',
  biology: 'Biologia',
  geography: 'Maantiede',
  finnish: 'Äidinkieli',
};

function getQuestionCount(set: QuestionSet): number {
  const candidate = set as QuestionSet & { questions?: unknown[] };
  if (Array.isArray(candidate.questions)) {
    return candidate.questions.length;
  }

  return typeof set.question_count === 'number' ? set.question_count : 0;
}

export function isSpeedQuizEligible(set: QuestionSet): boolean {
  return set.mode === 'quiz' && getQuestionCount(set) >= MIN_SPEED_QUIZ_QUESTIONS;
}

export async function getSpeedQuizModeData(
  fetcher: SpeedQuizDataFetcher = fetchPublishedQuestionSets
): Promise<SpeedQuizModeData> {
  const allSets = await fetcher();
  const quizSets = allSets.filter((set) => set.mode === 'quiz');

  return {
    eligibleSets: quizSets.filter((set) => getQuestionCount(set) >= MIN_SPEED_QUIZ_QUESTIONS),
    ineligibleSets: quizSets.filter((set) => getQuestionCount(set) < MIN_SPEED_QUIZ_QUESTIONS),
  };
}

function getSubjectLabel(subject: string): string {
  return subjectLabelMap[subject] ?? subject;
}

function SubjectIcon({ subject }: { subject: string }) {
  const className = 'h-5 w-5 text-amber-600 dark:text-amber-400';

  switch (subject) {
    case 'english':
      return <GlobeHemisphereWest className={className} weight="duotone" aria-hidden="true" />;
    case 'math':
      return <MathOperations className={className} weight="duotone" aria-hidden="true" />;
    case 'history':
      return <Scroll className={className} weight="duotone" aria-hidden="true" />;
    case 'society':
      return <Bank className={className} weight="duotone" aria-hidden="true" />;
    case 'biology':
      return <Leaf className={className} weight="duotone" aria-hidden="true" />;
    case 'geography':
      return <MapTrifold className={className} weight="duotone" aria-hidden="true" />;
    default:
      return <BookOpenText className={className} weight="duotone" aria-hidden="true" />;
  }
}

export function SpeedQuizModePageContent({ eligibleSets, ineligibleSets }: SpeedQuizModeData) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50/70 via-white to-orange-50/60 px-4 py-6 dark:from-amber-950/40 dark:via-gray-900 dark:to-orange-950/30 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <a
            href="/play"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-50 dark:border-amber-800/60 dark:bg-gray-900 dark:text-amber-300 dark:hover:bg-amber-950/30"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Takaisin
          </a>
        </div>

        <header className="rounded-2xl border border-indigo-200 bg-white/90 p-5 shadow-sm dark:border-indigo-900/60 dark:bg-gray-900/90">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
              <Timer size={22} weight="duotone" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Aikahaaste</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Valitse kysymyssarja - 10 kysymystä, 15 sekuntia
              </p>
            </div>
          </div>
        </header>

        {eligibleSets.length === 0 ? (
          <Card className="border-amber-200 bg-white/95 p-6 text-center dark:border-amber-900/60 dark:bg-gray-900/95">
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Ei vielä pika-kokeeseen sopivia kysymyssarjoja
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Luo ensin tietovisa, jossa on vähintään 10 kysymystä.
            </p>
            <div className="mt-4">
              <a
                href="/create"
                className="inline-flex items-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
              >
                Siirry luomaan
              </a>
            </div>
          </Card>
        ) : (
          <section>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
              <Lightning size={16} weight="fill" aria-hidden="true" />
              Sopivat kysymyssarjat
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {eligibleSets.map((set) => {
                const questionCount = getQuestionCount(set);

                return (
                  <a key={set.id} href={`/play/speed-quiz/${set.code}`} className="block">
                    <Card className="h-full border-amber-200 bg-white/95 p-4 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-amber-900/60 dark:bg-gray-900/95 dark:hover:border-amber-700">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h2 className="line-clamp-2 text-base font-semibold text-gray-900 dark:text-gray-100">{set.name}</h2>
                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <SubjectIcon subject={set.subject} />
                            <span>{getSubjectLabel(set.subject)}</span>
                          </div>
                        </div>
                        <Lightning size={18} weight="fill" className="text-amber-500 dark:text-amber-400" aria-hidden="true" />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="default" semantic="warning" size="sm">
                          {questionCount} kysymystä
                        </Badge>
                        {typeof set.grade === 'number' ? (
                          <Badge variant="outline" size="sm">
                            {set.grade}. lk
                          </Badge>
                        ) : null}
                      </div>
                    </Card>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {ineligibleSets.length > 0 ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Muut tietovisat</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ineligibleSets.map((set) => (
                <Card
                  key={set.id}
                  className="border-gray-200 bg-gray-50/70 p-4 opacity-75 dark:border-gray-800 dark:bg-gray-900/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{set.name}</h3>
                      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        Liian vähän kysymyksiä (tarvitaan vähintään 10)
                      </p>
                    </div>
                    <Badge variant="outline" size="xs">
                      {getQuestionCount(set)}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default async function SpeedQuizModePage() {
  const data = await getSpeedQuizModeData();

  return <SpeedQuizModePageContent eligibleSets={data.eligibleSets} ineligibleSets={data.ineligibleSets} />;
}
