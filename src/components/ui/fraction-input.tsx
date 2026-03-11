'use client';

import { useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils';

type FractionInputType = 'fraction' | 'mixed_number';

interface FractionInputProps {
  type: FractionInputType;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

export interface FractionInputFields {
  whole: string;
  numerator: string;
  denominator: string;
}

export interface FractionInputTouched {
  whole: boolean;
  numerator: boolean;
  denominator: boolean;
}

const EMPTY_FIELDS: FractionInputFields = {
  whole: '',
  numerator: '',
  denominator: '',
};

const EMPTY_TOUCHED: FractionInputTouched = {
  whole: false,
  numerator: false,
  denominator: false,
};

const DIGITS_ONLY_PATTERN = /^\d+$/;

const baseInputClassName =
  'w-16 min-h-12 text-center text-xl font-medium rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50';

export function parseFractionInputValue(value: string, type: FractionInputType): FractionInputFields {
  const trimmed = value.trim();

  if (!trimmed) {
    return { ...EMPTY_FIELDS };
  }

  if (type === 'fraction') {
    const fractionMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (!fractionMatch) {
      return { ...EMPTY_FIELDS };
    }

    return {
      whole: '',
      numerator: fractionMatch[1],
      denominator: fractionMatch[2],
    };
  }

  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    return {
      whole: mixedMatch[1],
      numerator: mixedMatch[2],
      denominator: mixedMatch[3],
    };
  }

  const fractionOnlyMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fractionOnlyMatch) {
    return {
      whole: '',
      numerator: fractionOnlyMatch[1],
      denominator: fractionOnlyMatch[2],
    };
  }

  return { ...EMPTY_FIELDS };
}

export function assembleFractionInputValue(fields: FractionInputFields, type: FractionInputType): string {
  const whole = fields.whole.trim();
  const numerator = fields.numerator.trim();
  const denominator = fields.denominator.trim();

  if (!numerator && !denominator && !whole) {
    return '';
  }

  if (!numerator || !denominator) {
    return '';
  }

  if (type === 'fraction') {
    return `${numerator}/${denominator}`;
  }

  return whole ? `${whole} ${numerator}/${denominator}` : `${numerator}/${denominator}`;
}

function hasNumericError(value: string): boolean {
  return value.length > 0 && !DIGITS_ONLY_PATTERN.test(value);
}

export function getFractionInputErrors(
  fields: FractionInputFields,
  touched: FractionInputTouched,
  type: FractionInputType
): FractionInputTouched {
  const whole = type === 'mixed_number' && touched.whole && hasNumericError(fields.whole);
  const numerator = touched.numerator && (hasNumericError(fields.numerator) || fields.numerator.length === 0);
  const denominator =
    touched.denominator &&
    (hasNumericError(fields.denominator) || fields.denominator.length === 0 || fields.denominator === '0');

  return {
    whole,
    numerator,
    denominator,
  };
}

function hasAnyError(errors: FractionInputTouched): boolean {
  return errors.whole || errors.numerator || errors.denominator;
}

export function FractionInput({
  value,
  onChange,
  disabled = false,
  className,
  type,
  'data-testid': dataTestId,
}: FractionInputProps) {
  const reactId = useId();
  const [fields, setFields] = useState<FractionInputFields>(() => parseFractionInputValue(value, type));
  const [touched, setTouched] = useState<FractionInputTouched>(EMPTY_TOUCHED);

  useEffect(() => {
    setFields(parseFractionInputValue(value, type));
  }, [type, value]);

  const errors = getFractionInputErrors(fields, touched, type);
  const showError = hasAnyError(errors);

  const updateFields = (nextFields: FractionInputFields) => {
    setFields(nextFields);
    onChange(assembleFractionInputValue(nextFields, type));
  };

  const handleFieldChange = (field: keyof FractionInputFields, nextValue: string) => {
    updateFields({
      ...fields,
      [field]: nextValue,
    });
  };

  const handleBlur = (field: keyof FractionInputTouched) => {
    setTouched((currentTouched) => ({
      ...currentTouched,
      [field]: true,
    }));
  };

  const getFieldClassName = (isInvalid: boolean, extraClassName?: string) =>
    cn(baseInputClassName, className, extraClassName, isInvalid && 'border-red-500');

  const renderFractionFields = () => (
    <div className="inline-flex flex-col items-center">
      <input
        data-testid={dataTestId ? `${dataTestId}-numerator` : undefined}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={fields.numerator}
        onChange={(event) => handleFieldChange('numerator', event.target.value)}
        onBlur={() => handleBlur('numerator')}
        disabled={disabled}
        aria-label="Osoittaja"
        className={getFieldClassName(errors.numerator)}
      />
      <div className="my-1 w-full border-t-2 border-gray-400 dark:border-gray-500" aria-hidden="true" />
      <input
        data-testid={dataTestId ? `${dataTestId}-denominator` : undefined}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={fields.denominator}
        onChange={(event) => handleFieldChange('denominator', event.target.value)}
        onBlur={() => handleBlur('denominator')}
        disabled={disabled}
        aria-label="Nimittäjä"
        className={getFieldClassName(errors.denominator)}
      />
    </div>
  );

  return (
    <div className="space-y-2" data-testid={dataTestId} aria-describedby={showError ? `${reactId}-error` : undefined}>
      {type === 'mixed_number' ? (
        <div className="inline-flex items-center gap-3">
          <input
            data-testid={dataTestId ? `${dataTestId}-whole` : undefined}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={fields.whole}
            onChange={(event) => handleFieldChange('whole', event.target.value)}
            onBlur={() => handleBlur('whole')}
            disabled={disabled}
            aria-label="Kokonaisluku"
            className={getFieldClassName(errors.whole, 'min-h-[5.5rem]')}
          />
          {renderFractionFields()}
        </div>
      ) : (
        renderFractionFields()
      )}
      {showError && (
        <p id={`${reactId}-error`} className="text-xs text-red-600 dark:text-red-400">
          Tarkista luvut
        </p>
      )}
    </div>
  );
}
