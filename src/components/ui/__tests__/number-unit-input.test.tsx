import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import {
  assembleNumberUnitValue,
  NumberUnitInput,
  parseNumberUnitValue,
} from '@/components/ui/number-unit-input';

describe('NumberUnitInput helpers', () => {
  it('parses numeric portion from value with unit suffix', () => {
    assert.strictEqual(parseNumberUnitValue('75 %', '%'), '75');
    assert.strictEqual(parseNumberUnitValue('12,50 €', '€'), '12,50');
    assert.strictEqual(parseNumberUnitValue('', '%'), '');
  });

  it('assembles numeric portion and unit into final answer string', () => {
    assert.strictEqual(assembleNumberUnitValue('75', '%'), '75 %');
    assert.strictEqual(assembleNumberUnitValue('12,50', '€'), '12,50 €');
    assert.strictEqual(assembleNumberUnitValue('', '%'), '');
  });

  it('trims surrounding whitespace during assembly and parsing', () => {
    assert.strictEqual(assembleNumberUnitValue('  7,5 ', '%'), '7,5 %');
    assert.strictEqual(parseNumberUnitValue(' 7,5 % ', '%'), '7,5');
  });
});

describe('NumberUnitInput rendering', () => {
  it('renders one decimal input and a fixed unit label', () => {
    const html = renderToString(
      createElement(NumberUnitInput, {
        unit: '%',
        value: '75 %',
        onChange: () => {},
        'data-testid': 'number-unit-input',
      })
    );

    const inputCount = (html.match(/<input/g) || []).length;
    const decimalModeCount = (html.match(/inputMode="decimal"|inputmode="decimal"/g) || []).length;

    assert.strictEqual(inputCount, 1);
    assert.strictEqual(decimalModeCount, 1);
    assert.ok(html.includes('aria-label="Luku"'));
    assert.ok(html.includes('value="75"'));
    assert.ok(html.includes('>%<'));
    assert.ok(html.includes('select-none'));
    assert.ok(html.includes('text-xl'));
  });

  it('renders disabled state on the input when disabled is true', () => {
    const html = renderToString(
      createElement(NumberUnitInput, {
        unit: '€',
        value: '',
        onChange: () => {},
        disabled: true,
      })
    );

    assert.ok(html.includes('disabled=""'));
    assert.ok(html.includes('€'));
  });
});
