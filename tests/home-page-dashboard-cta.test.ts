import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const homePageSource = readFileSync('src/app/page.tsx', 'utf-8');

describe('front page dashboard CTA', () => {
  it('uses shared dashboard CTA logic and play-page mode params', () => {
    assert.ok(homePageSource.includes('resolveDashboardPrimaryAction({'));
    assert.ok(homePageSource.includes('href="/play?mode=pelaa"'));
    assert.ok(homePageSource.includes('href="/play?mode=opettele"'));
    assert.equal(homePageSource.includes('mode=quiz'), false);
    assert.equal(homePageSource.includes('mode=flashcard'), false);
  });

  it('renders the front-page mode section as direct quiz and flashcard action cards', () => {
    assert.ok(homePageSource.includes('Kaksi tapaa harjoitella'));
    assert.ok(homePageSource.includes('Pelaa tietovisoja'));
    assert.ok(homePageSource.includes('Kertaa muistikorteilla'));
    assert.ok(homePageSource.includes('Siirry visoihin'));
    assert.ok(homePageSource.includes('Siirry kortteihin'));
  });

  it('keeps the dashboard entry structure in the intended order', () => {
    const dashboardIndex = homePageSource.indexOf('dashboard-heading');
    const modesIndex = homePageSource.indexOf('modes-heading');
    const audienceIndex = homePageSource.indexOf('<AudienceTabs');

    assert.notEqual(dashboardIndex, -1);
    assert.notEqual(modesIndex, -1);
    assert.notEqual(audienceIndex, -1);
    assert.ok(dashboardIndex < modesIndex);
    assert.ok(modesIndex < audienceIndex);
  });

  it('includes skip navigation and visible keyboard focus styling for public-page links', () => {
    assert.ok(homePageSource.includes('href="#main-content"'));
    assert.ok(homePageSource.includes('focus:not-sr-only'));
    assert.ok(homePageSource.includes('focus-visible:ring-indigo-500'));
    assert.ok(homePageSource.includes('focus-visible:ring-teal-500'));
  });
});
