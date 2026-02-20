import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const playPageSource = readFileSync('src/app/play/page.tsx', 'utf-8');

describe('/play mode cards', () => {
  it('renders Tietovisat, Kortit and Aikahaaste cards', () => {
    assert.ok(playPageSource.includes('Tietovisat'));
    assert.ok(playPageSource.includes('Kortit'));
    assert.ok(playPageSource.includes('Aikahaaste'));
    assert.ok(playPageSource.includes('10 kysymystä, 10 sekuntia per kysymys. Testaa nopeutesi ja tietosi!'));
  });

  it('includes correct navigation targets for all mode cards', () => {
    assert.ok(playPageSource.includes('href="/play?mode=quiz"'));
    assert.ok(playPageSource.includes('href="/play?mode=flashcard"'));
    assert.ok(playPageSource.includes('href="/play/speed-quiz"'));
  });

  it('uses responsive three-column layout on desktop', () => {
    assert.ok(playPageSource.includes('grid-cols-1'));
    assert.ok(playPageSource.includes('md:grid-cols-2'));
    assert.ok(playPageSource.includes('lg:grid-cols-3'));
  });
});
