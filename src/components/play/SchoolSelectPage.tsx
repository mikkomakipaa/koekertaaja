'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlass, ArrowRight, Buildings, CircleNotch } from '@phosphor-icons/react';

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getSchools } from '@/lib/supabase/schools';
import { useSelectedSchool } from '@/hooks/useSelectedSchool';
import { createLogger, serializeError } from '@/lib/logger';
import { type School } from '@/types';

const logger = createLogger({ module: 'SchoolSelectPage' });

type FetchState = 'loading' | 'ready' | 'error';

function SchoolCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <Skeleton className="mb-3 h-5 w-40 rounded-lg" />
      <Skeleton className="h-4 w-28 rounded-lg" />
    </div>
  );
}

interface EmptyStateProps {
  hasQuery: boolean;
  fetchState: FetchState;
}

function EmptyState({ hasQuery, fetchState }: EmptyStateProps) {
  const title =
    fetchState === 'error'
      ? 'Koulujen lataaminen ei onnistunut'
      : hasQuery
        ? 'Hakusi ei tuottanut tuloksia'
        : 'Kouluja ei löytynyt';
  const description =
    fetchState === 'error'
      ? 'Yritä hetken päästä uudelleen. Jos ongelma jatkuu, tarkista että julkaistuja harjoituksia on olemassa.'
      : hasQuery
        ? 'Kokeile toista koulun nimeä tai kuntaa.'
        : 'Tähän näkymään tulee vain kouluja, joilla on julkaistuja harjoituksia.';

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/70">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Buildings size={26} weight="duotone" />
      </div>
      <div className="mt-4 space-y-1.5">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      </div>
    </div>
  );
}

export function SchoolSelectPage() {
  const router = useRouter();
  const { setSchool } = useSelectedSchool();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>('loading');

  useEffect(() => {
    let isCancelled = false;

    const loadSchools = async () => {
      setFetchState('loading');

      try {
        const nextSchools = await getSchools();

        if (isCancelled) {
          return;
        }

        setSchools(nextSchools);
        setFetchState('ready');
      } catch (error) {
        logger.error({ error: serializeError(error) }, 'Unexpected error while loading schools');

        if (isCancelled) {
          return;
        }

        setSchools([]);
        setFetchState('error');
      }
    };

    void loadSchools();

    return () => {
      isCancelled = true;
    };
  }, []);

  const normalizedQuery = query.trim().toLocaleLowerCase('fi-FI');

  const filteredSchools = useMemo(() => {
    if (!normalizedQuery) {
      return schools;
    }

    return schools.filter((school) => {
      const name = school.name.toLocaleLowerCase('fi-FI');
      const municipality = school.municipality?.toLocaleLowerCase('fi-FI') ?? '';

      return name.includes(normalizedQuery) || municipality.includes(normalizedQuery);
    });
  }, [normalizedQuery, schools]);

  const handleSelect = (school: School) => {
    startTransition(() => {
      setSchool(school.id, school.name);
      router.push('/play?mode=pelaa');
    });
  };

  const showEmptyState = fetchState !== 'loading' && filteredSchools.length === 0;
  const resultLabel = normalizedQuery
    ? `${filteredSchools.length} ${filteredSchools.length === 1 ? 'hakutulos' : 'hakutulosta'}`
    : `${filteredSchools.length} ${filteredSchools.length === 1 ? 'koulu' : 'koulua'}`;

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 pb-8 pt-6 md:px-8 md:pb-10 md:pt-8">
        <section className="rounded-2xl border border-slate-200 bg-white/95 px-5 py-5 shadow-none dark:border-slate-800 dark:bg-slate-900/95 md:px-6 md:py-6">
          <div className="space-y-2">
            <span className="inline-flex h-8 items-center rounded-full border border-sky-200 bg-sky-50 px-3 text-xs font-semibold tracking-[0.01em] text-sky-700 dark:border-sky-800/70 dark:bg-sky-950/35 dark:text-sky-200">
              Pelaaminen alkaa koulun valinnasta
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">
              Valitse oma koulu
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-base">
              Näytämme sinulle vain oman koulusi julkaistut harjoitukset. Voit etsiä koulua nimellä tai kunnalla.
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <label htmlFor="school-search" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Etsi koulu
            </label>
            <div className="relative">
              <MagnifyingGlass
                size={18}
                weight="duotone"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />
              <Input
                id="school-search"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Esim. Kaurialan koulu tai Hämeenlinna"
                autoComplete="off"
                className="min-h-12 rounded-xl border-slate-200 bg-white pl-10 text-base text-slate-900 placeholder:text-slate-500 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-sky-400"
              />
            </div>
          </div>
        </section>

        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {fetchState === 'loading' ? 'Ladataan kouluja...' : resultLabel}
            </p>
            {isPending ? (
              <span className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <CircleNotch size={16} weight="bold" className="animate-spin" />
                Avataan harjoitukset...
              </span>
            ) : null}
          </div>

          {fetchState === 'loading' ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <SchoolCardSkeleton key={item} />
              ))}
            </div>
          ) : showEmptyState ? (
            <EmptyState hasQuery={Boolean(normalizedQuery)} fetchState={fetchState} />
          ) : (
            <div
              role="list"
              aria-label="Koulujen valinta"
              className="max-h-[min(70vh,40rem)] space-y-3 overflow-y-auto pr-1"
            >
              {filteredSchools.map((school) => (
                <button
                  key={school.id}
                  type="button"
                  onClick={() => handleSelect(school)}
                  disabled={isPending}
                  aria-label={`Valitse koulu ${school.name}${school.municipality ? `, ${school.municipality}` : ''}`}
                  className="flex min-h-12 w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 text-left shadow-none transition-[transform,border-color,background-color] duration-150 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700 dark:hover:bg-sky-950/30 dark:focus-visible:ring-sky-400"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                      {school.name}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">
                      {school.municipality || 'Kunta puuttuu'}
                    </p>
                  </div>
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <ArrowRight size={18} weight="bold" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
