'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppShellHeader } from '@/components/layout/AppShellHeader';
import type { AppShellHeaderTone } from '@/components/layout/AppShellHeader';
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

  const HeaderIcon = isTotalFailure ? XCircle : isPartial ? WarningCircle : CheckCircle;
  const headerTone: AppShellHeaderTone = isTotalFailure ? 'danger' : isPartial ? 'warning' : 'success';

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
      <div className="min-h-screen bg-white transition-colors dark:bg-gray-900">
        <div className="mx-auto max-w-4xl space-y-3 px-4 py-6 md:space-y-4 md:px-8">
          <AppShellHeader
            icon={<HeaderIcon size={24} weight="duotone" />}
            title={headerTitle}
            description={headerDescription}
            tone={headerTone}
            leadingAction={
              <button
                type="button"
                onClick={() => router.push('/create')}
                aria-label="Takaisin luontiin"
                className="inline-grid h-11 w-11 place-items-center rounded-xl bg-transparent text-black/55 transition-colors hover:bg-white/70 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100 dark:focus-visible:ring-indigo-300 dark:focus-visible:ring-offset-gray-900"
              >
                <ArrowLeft size={20} weight="regular" aria-hidden="true" />
              </button>
            }
          />

          {hasSuccess && (
            <Card className="w-full rounded-xl border-gray-200 shadow-none dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="space-y-1 border-b border-gray-200 p-5 dark:border-gray-800">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">
                  Luodut sarjat
                </p>
                <CardTitle className="text-xl">Valmiit kysymyssarjat</CardTitle>
                <CardDescription>
                  Jaa koodi oppilaille tai avaa sarja heti testattavaksi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                {createdSets.map((set, index) => {
                  const eyebrow = set.mode === 'flashcard'
                    ? modeLabels[set.mode]
                    : `Koe${set.difficulty ? ` • ${difficultyLabels[set.difficulty] ?? set.difficulty}` : ''}`;

                  return (
                    <Card
                      key={`${set.code}-${index}`}
                      variant="standard"
                      padding="none"
                      className="rounded-xl border-gray-200 shadow-none dark:border-gray-800"
                    >
                      <CardHeader className="space-y-1 p-4 pb-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                          {eyebrow}
                        </p>
                        <CardTitle className="text-base">{set.name}</CardTitle>
                        <CardDescription>
                          {set.questionCount} {set.mode === 'flashcard' ? 'korttia' : 'kysymystä'}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="items-center justify-between border-t border-gray-200 p-4 pt-3 dark:border-gray-800">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Koodi</span>
                        <code className="rounded-lg bg-gray-100 px-3 py-1 font-mono text-lg font-bold text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                          {set.code}
                        </code>
                      </CardFooter>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {hasErrors && (
            <Card className="w-full rounded-xl border-gray-200 shadow-none dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="space-y-1 border-b border-gray-200 p-5 dark:border-gray-800">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-red-600 dark:text-red-300">
                  Virheet
                </p>
                <CardTitle className="text-xl">{isTotalFailure ? 'Luonti epäonnistui' : 'Epäonnistuneet osat'}</CardTitle>
                <CardDescription>
                  Tarkista alla olevat virheilmoitukset ja yritä uudelleen tarvittaessa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                {errors.map((err, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50/65 p-4 dark:border-red-900/50 dark:bg-red-950/12"
                  >
                    <XCircle
                      weight="duotone"
                      className="mt-0.5 h-5 w-5 shrink-0 text-red-500 dark:text-red-400"
                    />
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-red-700 dark:text-red-300">
                        {err.mode === 'flashcard' ? 'Muistikortit' : 'Tietovisa'}
                      </p>
                      <p className="font-semibold text-red-900 dark:text-red-100">
                        {err.mode === 'flashcard' ? 'Korttisarjan luonti epäonnistui' : 'Koesarjan luonti epäonnistui'}
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-200">{err.error}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="w-full rounded-xl border-gray-200 shadow-none dark:border-gray-800 dark:bg-gray-900">
            <CardContent className="flex gap-3 p-5">
              <Button
                onClick={() => router.push('/create')}
                mode="quiz"
                variant="primary"
                className="flex-1 justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Takaisin luontiin
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
