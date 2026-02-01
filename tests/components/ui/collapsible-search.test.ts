import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { CollapsibleSearch } from '@/components/ui/collapsible-search';

describe('CollapsibleSearch', () => {
  it('renders collapsed state with open button', () => {
    const html = renderToString(
      createElement(CollapsibleSearch, {
        value: '',
        onChange: () => {},
        isOpen: false,
        onToggle: () => {},
      })
    );

    assert.ok(html.includes('Avaa haku'));
  });

  it('renders expanded state with placeholder', () => {
    const html = renderToString(
      createElement(CollapsibleSearch, {
        value: 'test',
        onChange: () => {},
        isOpen: true,
        onToggle: () => {},
        placeholder: 'Etsi aihealuetta',
      })
    );

    assert.ok(html.includes('Etsi aihealuetta'));
    assert.ok(html.includes('Tyhjennä haku'));
  });
});
