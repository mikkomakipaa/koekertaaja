import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const designGuidelinesSource = readFileSync('docs/DESIGN_GUIDELINES.md', 'utf-8');
const homePageSource = readFileSync('src/app/page.tsx', 'utf-8');
const playPageSource = readFileSync('src/app/play/page.tsx', 'utf-8');
const createPageSource = readFileSync('src/app/create/page.tsx', 'utf-8');
const createResultsPageSource = readFileSync('src/app/create/results/page.tsx', 'utf-8');
const achievementsPageSource = readFileSync('src/app/play/achievements/page.tsx', 'utf-8');
const resultsScreenSource = readFileSync('src/components/play/ResultsScreen.tsx', 'utf-8');
const appShellHeaderSource = readFileSync('src/components/layout/AppShellHeader.tsx', 'utf-8');
const primaryActionButtonSource = readFileSync('src/components/play/PrimaryActionButton.tsx', 'utf-8');
const footerSource = readFileSync('src/components/shared/Footer.tsx', 'utf-8');

describe('shared shell contract', () => {
  it('keeps docs/DESIGN_GUIDELINES.md as the design source of truth for unified shell surfaces', () => {
    assert.ok(designGuidelinesSource.includes('design source of truth for shared shell surfaces'));
    assert.ok(designGuidelinesSource.includes('## Shell Validation Snapshot'));
    assert.ok(designGuidelinesSource.includes('Create (`/create`): `AppShellHeader`'));
    assert.ok(designGuidelinesSource.includes('Achievements (`/play/achievements`): `AppShellHeader`'));
  });

  it('uses shared shell primitives across the validated pages', () => {
    assert.ok(homePageSource.includes('PrimaryActionButton'));
    assert.ok(homePageSource.includes('<Footer />'));
    assert.ok(playPageSource.includes('PrimaryActionButton'));
    assert.ok(createPageSource.includes('AppShellHeader'));
    assert.ok(createResultsPageSource.includes('AppShellHeader'));
    assert.ok(achievementsPageSource.includes('AppShellHeader'));
    assert.ok(achievementsPageSource.includes('PrimaryActionButton'));
    assert.ok(resultsScreenSource.includes('AppShellHeader'));
  });

  it('locks the shared shell sizing and border-first styling primitives', () => {
    assert.ok(primaryActionButtonSource.includes('h-[52px]'));
    assert.ok(primaryActionButtonSource.includes("surface === 'hero' ? 'rounded-2xl px-4 text-base' : 'rounded-[14px]'"));
    assert.ok(appShellHeaderSource.includes('rounded-2xl border shadow-[0_1px_2px_rgba(15,23,42,0.05)]'));
    assert.ok(footerSource.includes('max-w-4xl'));
  });

  it('keeps results and achievements surfaces on restrained shell cards instead of bespoke hero blocks', () => {
    assert.ok(resultsScreenSource.includes('rounded-xl border-slate-200 shadow-none'));
    assert.ok(resultsScreenSource.includes('TabsList className="grid w-full grid-cols-3 rounded-xl border border-slate-200 bg-white p-1 shadow-none'));
    assert.ok(achievementsPageSource.includes('rounded-xl border-slate-200 shadow-none'));
    assert.ok(resultsScreenSource.includes('className="mb-4"'));
    assert.ok(achievementsPageSource.includes('<AchievementsMapSection'));
  });

  it('keeps results and achievements badges on the shared round-token collection layout', () => {
    assert.ok(designGuidelinesSource.includes('Achievement badges on Results and Achievements pages use a shared round token pattern'));
    assert.ok(designGuidelinesSource.includes('Token grids should favor denser collection layouts'));
    assert.ok(resultsScreenSource.includes('grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 sm:gap-x-3 sm:gap-y-5 lg:grid-cols-5'));
    assert.ok(achievementsPageSource.includes('grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 sm:gap-x-3 sm:gap-y-5 md:grid-cols-5 lg:grid-cols-6'));
    assert.ok(resultsScreenSource.includes('className="mx-auto"'));
    assert.ok(achievementsPageSource.includes('className="mx-auto"'));
  });
});
