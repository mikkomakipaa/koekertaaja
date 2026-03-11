import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import {
  assembleFractionInputValue,
  FractionInput,
  getFractionInputErrors,
  parseFractionInputValue,
} from '@/components/ui/fraction-input';

describe('FractionInput helpers', () => {
  it('assembles a simple fraction value', () => {
    assert.strictEqual(
      assembleFractionInputValue(
        {
          whole: '',
          numerator: '3',
          denominator: '4',
        },
        'fraction'
      ),
      '3/4'
    );
  });

  it('assembles a mixed number value', () => {
    assert.strictEqual(
      assembleFractionInputValue(
        {
          whole: '1',
          numerator: '3',
          denominator: '4',
        },
        'mixed_number'
      ),
      '1 3/4'
    );
  });

  it('returns empty string when fraction is incomplete or empty', () => {
    assert.strictEqual(
      assembleFractionInputValue(
        {
          whole: '',
          numerator: '',
          denominator: '',
        },
        'fraction'
      ),
      ''
    );

    assert.strictEqual(
      assembleFractionInputValue(
        {
          whole: '1',
          numerator: '3',
          denominator: '',
        },
        'mixed_number'
      ),
      ''
    );
  });

  it('parses initial fraction and mixed number values into fields', () => {
    assert.deepStrictEqual(parseFractionInputValue('3/4', 'fraction'), {
      whole: '',
      numerator: '3',
      denominator: '4',
    });

    assert.deepStrictEqual(parseFractionInputValue('1 3/4', 'mixed_number'), {
      whole: '1',
      numerator: '3',
      denominator: '4',
    });
  });

  it('flags denominator zero after blur', () => {
    const errors = getFractionInputErrors(
      {
        whole: '',
        numerator: '3',
        denominator: '0',
      },
      {
        whole: false,
        numerator: false,
        denominator: true,
      },
      'fraction'
    );

    assert.deepStrictEqual(errors, {
      whole: false,
      numerator: false,
      denominator: true,
    });
  });

  it('flags non-numeric input after blur', () => {
    const errors = getFractionInputErrors(
      {
        whole: '1a',
        numerator: '3',
        denominator: '4b',
      },
      {
        whole: true,
        numerator: false,
        denominator: true,
      },
      'mixed_number'
    );

    assert.deepStrictEqual(errors, {
      whole: true,
      numerator: false,
      denominator: true,
    });
  });
});

describe('FractionInput rendering', () => {
  it('renders stacked fraction inputs with numeric keyboard hints and initial values', () => {
    const html = renderToString(
      createElement(FractionInput, {
        type: 'fraction',
        value: '3/4',
        onChange: () => {},
        'data-testid': 'fraction-input',
      })
    );

    const inputCount = (html.match(/<input/g) || []).length;
    const numericModeCount = (html.match(/inputMode="numeric"|inputmode="numeric"/g) || []).length;

    assert.strictEqual(inputCount, 2);
    assert.strictEqual(numericModeCount, 2);
    assert.ok(html.includes('aria-label="Osoittaja"'));
    assert.ok(html.includes('aria-label="Nimittäjä"'));
    assert.ok(html.includes('value="3"'));
    assert.ok(html.includes('value="4"'));
    assert.ok(html.includes('border-t-2'));
  });

  it('renders whole number plus stacked fraction for mixed numbers', () => {
    const html = renderToString(
      createElement(FractionInput, {
        type: 'mixed_number',
        value: '1 3/4',
        onChange: () => {},
      })
    );

    const inputCount = (html.match(/<input/g) || []).length;

    assert.strictEqual(inputCount, 3);
    assert.ok(html.includes('aria-label="Kokonaisluku"'));
    assert.ok(html.includes('value="1"'));
    assert.ok(html.includes('value="3"'));
    assert.ok(html.includes('value="4"'));
    assert.ok(html.includes('inline-flex'));
    assert.ok(html.includes('min-h-[5.5rem]'));
  });

  it('renders disabled fields when disabled is true', () => {
    const html = renderToString(
      createElement(FractionInput, {
        type: 'fraction',
        value: '',
        onChange: () => {},
        disabled: true,
      })
    );

    const disabledCount = (html.match(/disabled=""/g) || []).length;
    assert.strictEqual(disabledCount, 2);
  });
});
