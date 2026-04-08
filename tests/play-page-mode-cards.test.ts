import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const playPageRouteSource = readFileSync('src/app/play/page.tsx', 'utf-8');
const playBrowsePageClientSource = readFileSync('src/components/play/PlayBrowsePageClient.tsx', 'utf-8');
const modeClassBarSource = readFileSync('src/components/play/ModeClassBar.tsx', 'utf-8');
const playByCodeSource = readFileSync('src/app/play/[code]/page.tsx', 'utf-8');

describe('/play mode cards', () => {
  it('keeps browse page wired to two study modes with quiz and flashcard filtering', () => {
    assert.ok(playBrowsePageClientSource.includes("const [studyMode, setStudyMode] = useState<StudyMode>(() => parseStudyModeParam(initialModeParam ?? null));"));
    assert.ok(playBrowsePageClientSource.includes("if (studyMode === 'opettele' && !hasFlashcards(group.sets)) return false;"));
    assert.ok(playBrowsePageClientSource.includes("if (studyMode === 'pelaa' && getAvailableDifficulties(group.sets).length === 0) return false;"));
  });

  it('keeps quiz and flashcard navigation launch paths on browse cards', () => {
    assert.ok(playBrowsePageClientSource.includes("buildDifficultyHref(helppoSet.code, studyMode, 'helppo')"));
    assert.ok(playBrowsePageClientSource.includes('buildDifficultyHref(primarySet.code, studyMode, primaryDifficulty)'));
    assert.ok(playBrowsePageClientSource.includes("router.push(`/play/${flashcardSet.code}?mode=opettele`)"));
    assert.ok(playPageRouteSource.includes('<PlayBrowsePageClient'));
  });

  it('does not render deprecated kartta mode card or CTA on browse cards section', () => {
    assert.equal(playBrowsePageClientSource.includes('mode=aihekartta'), false);
    assert.equal(playBrowsePageClientSource.includes('Aihekartta'), false);
    assert.equal(modeClassBarSource.includes("value: 'aihekartta'"), false);
    assert.equal(modeClassBarSource.includes('Aihekartta'), false);
  });

  it('keeps achievements entry point while kartta route stays deprecated', () => {
    assert.ok(modeClassBarSource.includes('href="/play/achievements"'));
    assert.ok(modeClassBarSource.includes('aria-label="Saavutukset"'));
    assert.equal(modeClassBarSource.includes('/play/aihekartta'), false);
  });

  it('keeps normaali as the primary quiz CTA and renders direct Helppo, Aihe, and Aikahaaste actions', () => {
    assert.ok(playBrowsePageClientSource.includes("const primaryDifficulty =\n    normaaliSet\n      ? 'normaali'"));
    assert.ok(playBrowsePageClientSource.includes("router.push(buildDifficultyHref(helppoSet.code, studyMode, 'helppo'))"));
    assert.ok(playBrowsePageClientSource.includes('router.push(buildQuizTopicSelectorHref(topicTargetSet.code))'));
    assert.ok(playBrowsePageClientSource.includes('aria-label="Aihe"'));
    assert.ok(playBrowsePageClientSource.includes("router.push(buildDifficultyHref(normaaliSet.code, studyMode, 'aikahaaste'))"));
    assert.equal(playBrowsePageClientSource.includes('aria-label="Muut pelitavat"'), false);
  });

  it('keeps topic scoping out of review mode and Aikahaaste session pools in v1', () => {
    assert.ok(playByCodeSource.includes('!isFlashcardMode && !isReviewMode && !isAikahaaste'));
    assert.ok(playByCodeSource.includes('const showQuizTopicSelector = shouldShowQuizTopicSelector({'));
    assert.ok(playByCodeSource.includes('isAikahaaste,'));
    assert.ok(playByCodeSource.includes('isReviewMode,'));
    assert.ok(playByCodeSource.includes("const quizTopicSelectorRequested = searchParams.get(QUIZ_TOPIC_SELECTOR_QUERY_PARAM) === '1';"));
  });
});
