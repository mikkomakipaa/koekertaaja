import type { QuestionSet } from '@/types';
import type { BrowseDifficulty } from '@/lib/play/browse-difficulties';
import { buildDifficultyHref } from '@/lib/play/browse-difficulties';
import type { LastScore } from '@/hooks/useLastScore';
import type { SessionProgress } from '@/hooks/useSessionProgress';
import { getSchoolGrade } from '@/lib/play/results-screen';

export const difficultyLabels: Record<BrowseDifficulty, string> = {
  helppo: 'Helppo',
  normaali: 'Normaali',
  aikahaaste: 'Aikahaaste',
};

const difficultyPartitiveLabels: Record<BrowseDifficulty, string> = {
  helppo: 'Helppoa',
  normaali: 'Normaalia',
  aikahaaste: 'Aikahaastetta',
};

export function getQuizPrimaryActionLabel({
  difficulty,
  hasInProgress,
  hasScore,
}: {
  difficulty: BrowseDifficulty;
  hasInProgress: boolean;
  hasScore: boolean;
}): string {
  if (hasInProgress) {
    return 'Jatka';
  }

  if (hasScore) {
    return `Jatka ${difficultyPartitiveLabels[difficulty] ?? difficultyLabels[difficulty]}`;
  }

  return `Aloita ${difficultyLabels[difficulty]}`;
}

export function getQuizGradeMeta(score: Pick<LastScore, 'score' | 'total'>): string {
  return `Arvosana ${getSchoolGrade(score.score, score.total).label}`;
}

export function getQuizLatestResultSummary({
  score,
  difficulty,
}: {
  score: Pick<LastScore, 'score' | 'total'>;
  difficulty: BrowseDifficulty;
}): string {
  return `Viimeisin: ${getQuizGradeMeta(score)} (${difficultyLabels[difficulty]})`;
}

export interface DashboardPrimaryAction {
  href: string;
  label: string;
  description: string;
  mode: 'quiz' | 'study';
}

interface DashboardPrimaryActionInput {
  questionSets: QuestionSet[];
  getLastScore: (questionSetCode: string) => LastScore | null;
  getSessionProgress: (questionSetCode: string) => SessionProgress | null;
}

const getTimestamp = (value?: string | null): number => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export function resolveDashboardPrimaryAction({
  questionSets,
  getLastScore,
  getSessionProgress,
}: DashboardPrimaryActionInput): DashboardPrimaryAction {
  const quizSets = questionSets.filter((set) => set.mode === 'quiz');
  const flashcardSets = questionSets.filter((set) => set.mode === 'flashcard');

  const inProgressQuiz = [...quizSets]
    .filter((set) => {
      const progress = getSessionProgress(set.code);
      return Boolean(progress && progress.answered > 0 && progress.answered < progress.total);
    })
    .sort((a, b) => getTimestamp(b.exam_date ?? b.created_at) - getTimestamp(a.exam_date ?? a.created_at))[0];

  if (inProgressQuiz) {
    return {
      href: buildDifficultyHref(inProgressQuiz.code, 'pelaa', inProgressQuiz.difficulty),
      label: getQuizPrimaryActionLabel({
        difficulty: inProgressQuiz.difficulty,
        hasInProgress: true,
        hasScore: Boolean(getLastScore(inProgressQuiz.code)),
      }),
      description: 'Jatka viimeisintä harjoitusta',
      mode: 'quiz',
    };
  }

  const latestScoredQuiz = quizSets
    .map((set) => ({
      set,
      score: getLastScore(set.code),
    }))
    .filter((entry): entry is { set: QuestionSet; score: LastScore } => Boolean(entry.score))
    .sort((a, b) => b.score.timestamp - a.score.timestamp)[0];

  if (latestScoredQuiz) {
    return {
      href: buildDifficultyHref(latestScoredQuiz.set.code, 'pelaa', latestScoredQuiz.set.difficulty),
      label: getQuizPrimaryActionLabel({
        difficulty: latestScoredQuiz.set.difficulty,
        hasInProgress: false,
        hasScore: true,
      }),
      description: 'Avaa viimeksi pelattu tietovisa',
      mode: 'quiz',
    };
  }

  const latestFlashcardSet = [...flashcardSets].sort(
    (a, b) => getTimestamp(b.exam_date ?? b.created_at) - getTimestamp(a.exam_date ?? a.created_at)
  )[0];

  if (latestFlashcardSet) {
    return {
      href: `/play/${latestFlashcardSet.code}?mode=opettele`,
      label: 'Opettele',
      description: 'Avaa viimeisin korttiharjoittelu',
      mode: 'study',
    };
  }

  const latestQuizSet = [...quizSets].sort(
    (a, b) => getTimestamp(b.exam_date ?? b.created_at) - getTimestamp(a.exam_date ?? a.created_at)
  )[0];

  if (latestQuizSet) {
    return {
      href: buildDifficultyHref(latestQuizSet.code, 'pelaa', latestQuizSet.difficulty),
      label: getQuizPrimaryActionLabel({
        difficulty: latestQuizSet.difficulty,
        hasInProgress: false,
        hasScore: false,
      }),
      description: 'Avaa uusin tietovisa',
      mode: 'quiz',
    };
  }

  return {
    href: '/play?mode=pelaa',
    label: 'Aloita harjoittelu',
    description: '',
    mode: 'quiz',
  };
}
