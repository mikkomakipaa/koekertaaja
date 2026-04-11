'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Buildings, CaretDown, Check, CircleNotch } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { getSchools } from '@/lib/supabase/schools';
import { createLogger, serializeError } from '@/lib/logger';
import type { School } from '@/types';

const logger = createLogger({ module: 'SchoolSwitcher' });

interface SchoolSwitcherProps {
  currentSchoolId: string;
  currentSchoolName: string | null;
  onSelectSchool: (school: School) => void;
  disabled?: boolean;
}

export function SchoolSwitcher({
  currentSchoolId,
  currentSchoolName,
  onSelectSchool,
  disabled = false,
}: SchoolSwitcherProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    let isActive = true;

    const loadSchools = async () => {
      setIsLoading(true);

      try {
        const nextSchools = await getSchools();
        if (isActive) {
          setSchools(nextSchools);
        }
      } catch (error) {
        logger.error({ error: serializeError(error) }, 'Error loading schools for switcher');
        if (isActive) {
          setSchools([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadSchools();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const currentSchoolLabel = currentSchoolName || 'Valitse koulu';
  const sortedSchools = useMemo(
    () => schools.slice().sort((a, b) => a.name.localeCompare(b.name, 'fi')),
    [schools]
  );

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setIsOpen((previous) => !previous)}
        className="h-11 sm:h-12 max-w-full gap-2 rounded-xl border-slate-200 bg-white px-3 text-left text-slate-700 shadow-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus-visible:ring-sky-400"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Buildings size={16} weight="duotone" className="shrink-0 text-sky-600 dark:text-sky-300" />
        <span className="truncate text-sm font-medium">{currentSchoolLabel}</span>
        {isLoading ? (
          <CircleNotch size={14} weight="bold" className="ml-auto shrink-0 animate-spin" />
        ) : (
          <CaretDown size={14} weight="bold" className="ml-auto shrink-0" />
        )}
      </Button>

      {isOpen ? (
        <div className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_32px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_20px_40px_rgba(2,6,23,0.45)]">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Vaihda koulu</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Näytämme vain valitun koulun julkaistut harjoitukset.
            </p>
          </div>

          <div role="listbox" aria-label="Koulut" className="max-h-80 overflow-y-auto p-2">
            {sortedSchools.map((school) => {
              const isSelected = school.id === currentSchoolId;

              return (
                <button
                  key={school.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelectSchool(school);
                    setIsOpen(false);
                  }}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:hover:bg-sky-950/30 dark:focus-visible:ring-sky-400"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {school.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {school.municipality || 'Kunta puuttuu'}
                    </p>
                  </div>
                  {isSelected ? (
                    <Check size={16} weight="bold" className="shrink-0 text-sky-600 dark:text-sky-300" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
