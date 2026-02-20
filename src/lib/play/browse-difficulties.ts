import type { Difficulty, QuestionSet, StudyMode } from '@/types';

export type BrowseDifficulty = Difficulty | 'aikahaaste';

const BASE_QUIZ_DIFFICULTIES: Difficulty[] = ['helppo', 'normaali'];

export const getAvailableDifficulties = (sets: QuestionSet[]): BrowseDifficulty[] => {
  const difficulties: BrowseDifficulty[] = BASE_QUIZ_DIFFICULTIES.filter((difficulty) =>
    sets.some((set) => set.difficulty === difficulty && set.mode === 'quiz')
  );

  const normaaliSet = sets.find((set) => set.difficulty === 'normaali' && set.mode === 'quiz');
  if (normaaliSet && normaaliSet.question_count >= 10) {
    difficulties.push('aikahaaste');
  }

  return difficulties;
};

export const getDifficultyTargetSet = (
  sets: QuestionSet[],
  difficulty: BrowseDifficulty
): QuestionSet | undefined => {
  if (difficulty === 'aikahaaste') {
    return sets.find((set) => set.difficulty === 'normaali' && set.mode === 'quiz');
  }

  return sets.find((set) => set.difficulty === difficulty && set.mode === 'quiz');
};

export const buildDifficultyHref = (
  setCode: string,
  studyMode: StudyMode,
  difficulty: BrowseDifficulty
): string => {
  if (difficulty === 'aikahaaste') {
    return `/play/${setCode}?difficulty=aikahaaste`;
  }

  return `/play/${setCode}?mode=${studyMode}`;
};
