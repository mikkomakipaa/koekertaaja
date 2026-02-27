import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const playPageSource = readFileSync('src/app/play/page.tsx', 'utf-8');
const modeClassBarSource = readFileSync('src/components/play/ModeClassBar.tsx', 'utf-8');

describe('/play mode cards', () => {
  it('keeps browse page wired to two study modes with quiz and flashcard filtering', () => {
    assert.ok(playPageSource.includes("const [studyMode, setStudyMode] = useState<StudyMode>(() => parseStudyModeParam(searchParams.get('mode')))"));
    assert.ok(playPageSource.includes("if (studyMode === 'opettele' && !hasFlashcards(group.sets)) return false;"));
    assert.ok(playPageSource.includes("if (studyMode === 'pelaa' && getAvailableDifficulties(group.sets).length === 0) return false;"));
  });

  it('keeps quiz and flashcard navigation launch paths on browse cards', () => {
    assert.ok(playPageSource.includes('buildDifficultyHref(set.code, studyMode, difficulty)'));
    assert.ok(playPageSource.includes('buildDifficultyHref(primarySet.code, studyMode, primaryDifficulty)'));
    assert.ok(playPageSource.includes('router.push(`/play/${flashcardSet.code}?mode=opettele`)'));
  });

  it('does not render deprecated kartta mode card or CTA on browse cards section', () => {
    assert.equal(playPageSource.includes('mode=aihekartta'), false);
    assert.equal(playPageSource.includes('Aihekartta'), false);
    assert.equal(modeClassBarSource.includes("value: 'aihekartta'"), false);
    assert.equal(modeClassBarSource.includes('Aihekartta'), false);
  });

  it('keeps achievements entry point while kartta route stays deprecated', () => {
    assert.ok(modeClassBarSource.includes('href="/play/achievements"'));
    assert.ok(modeClassBarSource.includes('aria-label="Saavutukset"'));
    assert.equal(modeClassBarSource.includes('/play/aihekartta'), false);
  });
});
