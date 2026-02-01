import { MouseEvent } from 'react';
import { cn } from '@/lib/utils';

interface SearchSuggestionsProps {
  isOpen: boolean;
  query: string;
  popular: string[];
  recent: string[];
  suggestions: string[];
  onSelect: (value: string) => void;
  onClearRecent: () => void;
  className?: string;
}

const handleMouseDown = (event: MouseEvent) => {
  event.preventDefault();
};

export function SearchSuggestions({
  isOpen,
  query,
  popular,
  recent,
  suggestions,
  onSelect,
  onClearRecent,
  className,
}: SearchSuggestionsProps) {
  if (!isOpen) return null;

  const trimmedQuery = query.trim();
  const showLive = trimmedQuery.length > 0;
  const showRecent = !showLive && recent.length > 0;
  const showPopular = !showLive && popular.length > 0;

  return (
    <div
      className={cn(
        'absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900',
        className
      )}
      onMouseDown={handleMouseDown}
    >
      {showRecent && (
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <span>Viimeisimmät</span>
            <button
              type="button"
              onClick={onClearRecent}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Tyhjennä
            </button>
          </div>
          <div className="space-y-1">
            {recent.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {showPopular && (
        <div className="mb-1">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Suositut haut
          </div>
          <div className="space-y-1">
            {popular.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {showLive && (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Ehdotukset
          </div>
          {suggestions.length > 0 ? (
            <div className="space-y-1">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  {item}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              Ei tuloksia
            </div>
          )}
        </div>
      )}
    </div>
  );
}
