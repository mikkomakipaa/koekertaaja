import { selectRandomQuestions } from '@/lib/utils/speedQuiz';
import type { Question, SpeedQuizResult, SpeedQuizSession } from '@/types';

const TOTAL_QUESTIONS = 10;
const TIME_PER_QUESTION = 15;
const POINTS_PER_CORRECT = 10;
const STREAK_BONUS = 5;

export interface SpeedQuizScoreState {
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
}

export interface SessionTransitionResult {
  session: SpeedQuizSession;
  shouldFinish: boolean;
}

function stringifyAnswer(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => stringifyAnswer(item)).join(' -> ');
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([left, right]) => `${left}: ${stringifyAnswer(right)}`)
      .join(', ');
  }

  return String(value);
}

function getCorrectAnswerText(question: Question): string {
  if (question.question_type === 'matching') {
    return question.pairs.map((pair) => `${pair.left}: ${pair.right}`).join(', ');
  }

  if (question.question_type === 'sequential') {
    return question.correct_order.join(' -> ');
  }

  return stringifyAnswer(question.correct_answer);
}

export function isAnswerEmpty(answer: unknown): boolean {
  if (answer === null || answer === undefined) return true;
  if (typeof answer === 'string') return answer.trim().length === 0;
  if (Array.isArray(answer)) return answer.length === 0;
  if (typeof answer === 'object') return Object.keys(answer as Record<string, unknown>).length === 0;
  return false;
}

export function createInitialSpeedQuizSession(questionSetCode: string, questions: Question[]): SpeedQuizSession {
  return {
    mode: 'speed-quiz',
    questionSetCode,
    selectedQuestions: selectRandomQuestions(questions, TOTAL_QUESTIONS),
    currentQuestionIndex: 0,
    timePerQuestion: TIME_PER_QUESTION,
    totalQuestions: TOTAL_QUESTIONS,
    startTime: Date.now(),
    questionStartTime: Date.now(),
    skippedQuestions: [],
    answers: {},
    correctAnswers: [],
    wrongAnswers: [],
  };
}

export function scoreCorrectAnswer(scoreState: SpeedQuizScoreState): SpeedQuizScoreState {
  const currentStreak = scoreState.currentStreak + 1;
  const pointsEarned = POINTS_PER_CORRECT + (currentStreak >= 3 ? STREAK_BONUS : 0);

  return {
    totalPoints: scoreState.totalPoints + pointsEarned,
    currentStreak,
    bestStreak: Math.max(scoreState.bestStreak, currentStreak),
  };
}

export function advanceSessionOnTimeout(
  session: SpeedQuizSession,
  questionId: string,
  now: number = Date.now()
): SessionTransitionResult {
  const isLastQuestion = session.currentQuestionIndex >= session.totalQuestions - 1;

  return {
    shouldFinish: isLastQuestion,
    session: {
      ...session,
      skippedQuestions: session.skippedQuestions.includes(questionId)
        ? session.skippedQuestions
        : [...session.skippedQuestions, questionId],
      currentQuestionIndex: isLastQuestion ? session.currentQuestionIndex : session.currentQuestionIndex + 1,
      questionStartTime: now,
    },
  };
}

export function advanceSessionOnAnswer(
  session: SpeedQuizSession,
  questionId: string,
  answerText: string,
  isCorrect: boolean,
  now: number = Date.now()
): SessionTransitionResult {
  const isLastQuestion = session.currentQuestionIndex >= session.totalQuestions - 1;

  return {
    shouldFinish: isLastQuestion,
    session: {
      ...session,
      answers: {
        ...session.answers,
        [questionId]: answerText,
      },
      correctAnswers: isCorrect ? [...session.correctAnswers, questionId] : session.correctAnswers,
      wrongAnswers: isCorrect ? session.wrongAnswers : [...session.wrongAnswers, questionId],
      currentQuestionIndex: isLastQuestion ? session.currentQuestionIndex : session.currentQuestionIndex + 1,
      questionStartTime: now,
    },
  };
}

export function createSpeedQuizResult(session: SpeedQuizSession, scoreState: SpeedQuizScoreState): SpeedQuizResult {
  const questionStatuses = session.selectedQuestions.map((question) => {
    const isSkipped = session.skippedQuestions.includes(question.id);
    const isCorrect = session.correctAnswers.includes(question.id);
    const status = isSkipped ? 'skipped' : isCorrect ? 'correct' : 'wrong';

    return {
      id: question.id,
      question: question.question_text,
      status,
      userAnswer: session.answers[question.id],
      correctAnswer: getCorrectAnswerText(question),
    } as const;
  });

  const totalTime = Math.round((Date.now() - session.startTime) / 1000);

  return {
    totalTime,
    correctCount: session.correctAnswers.length,
    wrongCount: session.wrongAnswers.length,
    skippedCount: session.skippedQuestions.length,
    score: scoreState.totalPoints,
    bestStreak: scoreState.bestStreak,
    questions: questionStatuses,
  };
}

export function toDisplayAnswer(value: unknown): string {
  return stringifyAnswer(value);
}
