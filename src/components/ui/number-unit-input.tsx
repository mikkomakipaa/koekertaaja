'use client';

import { useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils';

interface NumberUnitInputProps {
  unit: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

const NUMBER_PATTERN = /^-?\d+(?:[.,]\d+)?$/;

const baseInputClassName =
  'w-32 min-h-12 text-center text-xl font-medium rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50';

export function parseNumberUnitValue(value: string, unit: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  const unitPattern = new RegExp(`\\s*${escapeRegExp(unit)}\\s*$`);
  return trimmed.replace(unitPattern, '').trim();
}

export function assembleNumberUnitValue(number: string, unit: string): string {
  const trimmedNumber = number.trim();

  if (!trimmedNumber) {
    return '';
  }

  return `${trimmedNumber} ${unit}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isValidNumber(value: string): boolean {
  return value.length === 0 || NUMBER_PATTERN.test(value);
}

export function NumberUnitInput({
  unit,
  value,
  onChange,
  disabled = false,
  className,
  'data-testid': dataTestId,
}: NumberUnitInputProps) {
  const reactId = useId();
  const [numberValue, setNumberValue] = useState(() => parseNumberUnitValue(value, unit));
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setNumberValue(parseNumberUnitValue(value, unit));
  }, [unit, value]);

  const showError = touched && !isValidNumber(numberValue);

  const handleChange = (nextValue: string) => {
    setNumberValue(nextValue);
    onChange(assembleNumberUnitValue(nextValue, unit));
  };

  return (
    <div className="space-y-2" data-testid={dataTestId} aria-describedby={showError ? `${reactId}-error` : undefined}>
      <div className="inline-flex items-center gap-3">
        <input
          data-testid={dataTestId ? `${dataTestId}-number` : undefined}
          type="text"
          inputMode="decimal"
          value={numberValue}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          aria-label="Luku"
          className={cn(baseInputClassName, className, showError && 'border-red-500')}
        />
        <div
          aria-hidden="true"
          className="min-h-12 min-w-12 rounded-lg border border-gray-200 bg-gray-50 px-4 text-xl font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-400 select-none inline-flex items-center justify-center"
        >
          {unit}
        </div>
      </div>
      {showError && (
        <p id={`${reactId}-error`} className="text-xs text-red-600 dark:text-red-400">
          Tarkista luku
        </p>
      )}
    </div>
  );
}
