'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CheckCircle, WarningCircle, XCircle, ArrowLeft } from '@phosphor-icons/react';

interface CreatedSet {
  code: string;
  name: string;
  difficulty?: string;
  mode: 'quiz' | 'flashcard';
  questionCount: number;
}

interface CreationError {
  mode: 'quiz' | 'flashcard';
  error: string;
}

interface CreationResults {
  createdSets: CreatedSet[];
  errors: CreationError[];
  totalQuestions: number;
}

const SESSION_KEY = 'creation_results';

export default function CreateResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<CreationResults | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      router.replace('/create');
      return;
    }
    try {
      const parsed = JSON.parse(raw) as CreationResults;
      setResults(parsed);
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      router.replace('/create');
    }
  }, [router]);

  if (!results) return null;

  const { createdSets, errors, totalQuestions } = results;
  const hasSuccess = createdSets.length > 0;
  const hasErrors = errors.length > 0;
  const isPartial = hasSuccess && hasErrors;
  const isTotalFailure = !hasSuccess && hasErrors;

  const difficultyLabels: Record<string, string> = {
    helppo: 'Helppo',
    normaali: 'Normaali',
  };

  const modeLabels: Record<string, string> = {
    quiz: 'Koe',
    flashcard: 'Kortit',
  };

  const headerColor = isTotalFailure
    ? 'bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700'
    : isPartial
      ? 'bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700'
      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700';

  const HeaderIcon = isTotalFailure ? XCircle : isPartial ? WarningCircle : CheckCircle;

  const headerTitle = isTotalFailure
    ? 'Luonti epäonnistui'
    : isPartial
      ? 'Osittainen onnistuminen'
      : 'Kysymyssarjat luotu!';

  const headerDescription = isTotalFailure
    ? `${errors.length} epäonnistui`
    : `Luotiin ${createdSets.length} kysymyssarjaa (${totalQuestions} kysymystä yhteensä)`;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 flex items-center justify-center transition-colors">
        <Card className="w-full max-w-3xl rounded-xl shadow-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className={`${headerColor} text-white rounded-t-xl`}>
            <CardTitle className="text-3xl flex items-center gap-2">
              <HeaderIcon weight="duotone" className="w-8 h-8" />
              {headerTitle}
            </CardTitle>
            <CardDescription className="text-white text-base md:text-lg font-medium">
              {headerDescription}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {hasSuccess && (
              <div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">
                  Luodut kysymyssarjat:
                </h3>
                <div className="space-y-2">
                  {createdSets.map((set, index) => (
                    <Card
                      key={index}
                      variant="standard"
                      padding="compact"
                      className="transition-shadow duration-150 hover:shadow-md"
                    >
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {set.mode === 'flashcard'
                                ? `${set.name} — ${modeLabels[set.mode]}`
                                : difficultyLabels[set.difficulty ?? ''] || set.difficulty}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {set.questionCount} {set.mode === 'flashcard' ? 'korttia' : 'kysymystä'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Koodi:</p>
                            <code className="px-3 py-1 bg-slate-100 dark:bg-slate-600 rounded font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
                              {set.code}
                            </code>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {hasErrors && (
              <div>
                <h3 className="text-xl font-semibold mb-3 text-red-700 dark:text-red-400">
                  {isTotalFailure ? 'Virheet:' : 'Epäonnistuneet:'}
                </h3>
                <div className="space-y-2">
                  {errors.map((err, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    >
                      <XCircle
                        weight="duotone"
                        className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 shrink-0"
                      />
                      <div>
                        <p className="font-semibold text-red-800 dark:text-red-300">
                          {err.mode === 'flashcard' ? 'Muistikortit' : 'Visa'}
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-400">{err.error}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => router.push('/create')}
                mode="quiz"
                variant="primary"
                className="flex-1 flex items-center gap-2 justify-center"
              >
                <ArrowLeft className="w-4 h-4" />
                Takaisin luontiin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
