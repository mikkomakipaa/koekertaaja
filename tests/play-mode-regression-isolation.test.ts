import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const browsePageSource = readFileSync('src/app/play/page.tsx', 'utf-8');
const playByCodeSource = readFileSync('src/app/play/[code]/page.tsx', 'utf-8');
const modeClassBarSource = readFileSync('src/components/play/ModeClassBar.tsx', 'utf-8');

describe('Play mode regression and route isolation', () => {
  it('keeps browse mode switching contract with supported modes', () => {
    assert.ok(browsePageSource.includes("const [studyMode, setStudyMode] = useState<StudyMode>(() => parseStudyModeParam(searchParams.get('mode')))"));
    assert.ok(browsePageSource.includes("const nextMode = parseStudyModeParam(searchParams.get('mode'));"));
    assert.ok(browsePageSource.includes("const nextQuery = buildModeGradeQuery(searchParams, studyMode, selectedGrade);"));
    assert.ok(browsePageSource.includes("if (studyMode === 'opettele' && !hasFlashcards(group.sets)) return false;"));
    assert.ok(browsePageSource.includes("if (studyMode === 'pelaa' && getAvailableDifficulties(group.sets).length === 0) return false;"));
    assert.equal(browsePageSource.includes("studyMode === 'aihekartta'"), false);
  });

  it('preserves existing quiz and flashcard launch paths', () => {
    assert.ok(browsePageSource.includes('buildDifficultyHref(set.code, studyMode, difficulty)'));
    assert.ok(browsePageSource.includes('buildDifficultyHref(primarySet.code, studyMode, primaryDifficulty)'));
    assert.ok(browsePageSource.includes('router.push(`/play/${flashcardSet.code}?mode=opettele`)'));
    assert.ok(playByCodeSource.includes("const studyMode: StudyMode = modeParam === 'opettele' ? 'opettele' : 'pelaa';"));
    assert.ok(playByCodeSource.includes('<FlashcardSession'));
    assert.ok(playByCodeSource.includes('mode={isFlashcardMode ? \'flashcard\' : \'quiz\'}'));
    assert.ok(playByCodeSource.includes('if (studyMode === \'opettele\') {'));
    assert.ok(playByCodeSource.includes('<QuestionRenderer'));
    assert.ok(playByCodeSource.includes('{!isFlashcardMode && ('));
  });

  it('does not expose deprecated aihekartta route or browse tab wiring', () => {
    assert.equal(existsSync('src/app/play/aihekartta/page.tsx'), false);
    assert.equal(modeClassBarSource.includes('aihekartta'), false);
    assert.equal(modeClassBarSource.includes('Aihekartta'), false);
    assert.equal(modeClassBarSource.includes("value: 'aihekartta'"), false);
    assert.equal(browsePageSource.includes('mode=aihekartta'), false);
    assert.equal(browsePageSource.includes('/aihekartta'), false);
  });
});
