import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  appendProviderPreference,
  CREATE_PROVIDER_OPTIONS,
  DEFAULT_CREATE_PROVIDER,
  DEFAULT_CREATE_PROVIDER_LABEL,
} from '../src/lib/create/providerPreference';

const createPageSource = readFileSync('src/app/create/page.tsx', 'utf-8');

describe('create page default provider', () => {
  it('keeps OpenAI as the explicit shared default provider', () => {
    assert.equal(DEFAULT_CREATE_PROVIDER, 'openai');
    assert.equal(DEFAULT_CREATE_PROVIDER_LABEL, 'OpenAI');
    assert.equal(
      CREATE_PROVIDER_OPTIONS.some((option) => option.value === 'anthropic'),
      true
    );
    assert.equal(
      CREATE_PROVIDER_OPTIONS.some((option) => option.value === 'openai'),
      true
    );
  });

  it('uses the shared default provider in the create page state', () => {
    assert.ok(createPageSource.includes('useState<ProviderPreference>(DEFAULT_CREATE_PROVIDER)'));
    assert.ok(createPageSource.includes('const providerOptions = CREATE_PROVIDER_OPTIONS;'));
  });

  it('includes the selected provider in untouched generation request payloads', () => {
    const formData = appendProviderPreference(new FormData());

    assert.equal(formData.get('provider'), 'openai');
    assert.ok(createPageSource.includes('appendProviderPreference(formData, providerPreference);'));
  });
});
