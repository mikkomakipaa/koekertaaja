import { useEffect, useRef } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface CollapsibleSearchProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onToggle: (nextOpen: boolean) => void;
  onClose?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
}

export function CollapsibleSearch({
  placeholder = 'Hae...',
  value,
  onChange,
  isOpen,
  onToggle,
  onClose,
  onFocus,
  onBlur,
  className,
}: CollapsibleSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleClose = () => {
    onChange('');
    onToggle(false);
    onClose?.();
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => onToggle(true)}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800',
          className
        )}
        aria-label="Avaa haku"
      >
        <MagnifyingGlass size={20} weight="duotone" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        // Padding matches desktop search input (py-3).
        'collapsible-search-fade flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-3 text-gray-900 shadow-sm transition-opacity duration-150 ease-[cubic-bezier(0.25,1,0.5,1)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100',
        className
      )}
    >
      <MagnifyingGlass size={18} weight="duotone" className="text-gray-400 dark:text-gray-500" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            handleClose();
          }
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="min-h-10 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
      />
      <button
        type="button"
        onClick={handleClose}
        className="flex h-10 w-10 items-center justify-center rounded-md text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        aria-label="Tyhjennä haku"
      >
        <X size={18} weight="bold" />
      </button>
    </div>
  );
}
