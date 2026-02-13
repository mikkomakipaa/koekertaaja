import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PromptLoader } from '@/lib/prompts/PromptLoader';

describe('PromptLoader version headers', () => {
  it('parses valid version headers', () => {
    const loader = new PromptLoader();
    const parsed = loader.parseVersionHeader([
      '# Version: 2.1.0',
      '# Last Updated: 2026-02-12',
      '# Author: System',
      '# Changes: Added metadata',
      '# Breaking: false',
      '',
      'CONTENT',
    ].join('\n'));

    assert.ok(parsed);
    assert.equal(parsed.version, '2.1.0');
    assert.equal(parsed.lastUpdated, '2026-02-12');
    assert.equal(parsed.author, 'System');
    assert.equal(parsed.breaking, false);
  });

  it('returns null for missing header', () => {
    const loader = new PromptLoader();
    const parsed = loader.parseVersionHeader('JSON-VASTAUSMUOTO (PAKOLLINEN)');
    assert.equal(parsed, null);
  });

  it('returns parsed header for invalid semver format (validation happens at load time)', () => {
    const loader = new PromptLoader();
    const parsed = loader.parseVersionHeader('# Version: v2\nBody');
    assert.ok(parsed);
    assert.equal(parsed.version, 'v2');
  });

  it('returns null for malformed header', () => {
    const loader = new PromptLoader();
    const parsed = loader.parseVersionHeader('# Version 2.0.0\nBody');
    assert.equal(parsed, null);
  });

  it('defaults unversioned template to 1.0.0 in metadata', async () => {
    const loader = new PromptLoader();
    const content = await loader.loadModule('test/unversioned.txt');
    const metadata = loader.getVersionMetadata();

    assert.match(content, /versioimaton testitemplaatti/i);
    assert.equal(metadata['test/unversioned.txt'], '1.0.0');
  });

  it('defaults invalid semver templates to 1.0.0 and strips header lines', async () => {
    const loader = new PromptLoader();
    const content = await loader.loadModule('test/invalid-semver.txt');
    const metadata = loader.getVersionMetadata();

    assert.equal(metadata['test/invalid-semver.txt'], '1.0.0');
    assert.equal(content.trim(), 'Testisisalto.');
  });
});
