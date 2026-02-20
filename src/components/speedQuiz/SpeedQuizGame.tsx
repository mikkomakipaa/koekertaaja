'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  attachSpeedQuizBackNavigationGuard,
  shouldBlockSpeedQuizBackNavigation,
  type SpeedQuizGameState,
} from '@/lib/speed-quiz/back-navigation-guard';
import { Lightning } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QuestionRenderer } from '@/components/questions/QuestionRenderer';
import { SpeedQuizIntro } from '@/components/speedQuiz/SpeedQuizIntro';
import { SpeedQuizResults } from '@/components/speedQuiz/SpeedQuizResults';
import { SpeedQuizTimer } from '@/components/speedQuiz/SpeedQuizTimer';
import { useSpeedQuizTimer } from '@/hooks/useSpeedQuizTimer';
import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
import {
  advanceSessionOnAnswer,
  advanceSessionOnTimeout,
  createInitialSpeedQuizSession,
  createSpeedQuizResult,
  isAnswerEmpty,
  scoreCorrectAnswer,
  toDisplayAnswer,
  type SpeedQuizScoreState,
} from '@/lib/speed-quiz/session';
import type { QuestionSetWithQuestions, SpeedQuizResult, SpeedQuizSession } from '@/types';

const TIME_PER_QUESTION = 15;

interface SpeedQuizGameProps {
  questionSet: QuestionSetWithQuestions;
}

type GameState = SpeedQuizGameState;

export function SpeedQuizGame({ questionSet }: SpeedQuizGameProps) {
  const router = useRouter();
  const [state, setState] = useState<GameState>('intro');
  const [userAnswer, setUserAnswer] = useState<unknown>(null);
  const [session, setSession] = useState<SpeedQuizSession>(() =>
    createInitialSpeedQuizSession(questionSet.code, questionSet.questions)
  );
  const [scoreState, setScoreState] = useState<SpeedQuizScoreState>({
    totalPoints: 0,
    currentStreak: 0,
    bestStreak: 0,
  });
  const [result, setResult] = useState<SpeedQuizResult | null>(null);

  const currentQuestion = session.selectedQuestions[session.currentQuestionIndex];
  const canSubmit = !isAnswerEmpty(userAnswer);

  const finishQuiz = useCallback(
    (nextSession: SpeedQuizSession, nextScoreState: SpeedQuizScoreState) => {
      setResult(createSpeedQuizResult(nextSession, nextScoreState));
      setState('results');
    },
    []
  );

  const handleTimeout = useCallback(() => {
    if (state !== 'playing' || !currentQuestion) return;
    const transition = advanceSessionOnTimeout(session, currentQuestion.id);

    const nextScoreState: SpeedQuizScoreState = {
      ...scoreState,
      currentStreak: 0,
    };

    if (transition.shouldFinish) {
      setSession(transition.session);
      setScoreState(nextScoreState);
      finishQuiz(transition.session, nextScoreState);
      return;
    }

    setSession(transition.session);
    setScoreState(nextScoreState);
    setUserAnswer(null);
  }, [currentQuestion, finishQuiz, scoreState, session, state]);

  const { timeRemaining, colorState, start, stop, reset } = useSpeedQuizTimer(TIME_PER_QUESTION, handleTimeout);

  useEffect(() => {
    if (state !== 'playing') {
      stop();
      return;
    }

    reset();
    start();
  }, [reset, session.currentQuestionIndex, start, state, stop]);

  useEffect(() => {
    if (typeof window === 'undefined' || !shouldBlockSpeedQuizBackNavigation(state)) {
      return;
    }

    return attachSpeedQuizBackNavigationGuard(window);
  }, [state]);

  const handleStartQuiz = () => {
    const now = Date.now();
    setSession((prev) => ({
      ...prev,
      startTime: now,
      questionStartTime: now,
    }));
    setState('playing');
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !canSubmit || state !== 'playing') return;

    const { isCorrect } = evaluateQuestionAnswer(
      currentQuestion,
      userAnswer,
      questionSet.grade,
      questionSet.subject
    );
    const answerText = toDisplayAnswer(userAnswer);

    let nextScoreState = scoreState;
    if (isCorrect) {
      nextScoreState = scoreCorrectAnswer(scoreState);
    } else {
      nextScoreState = { ...scoreState, currentStreak: 0 };
    }

    const transition = advanceSessionOnAnswer(session, currentQuestion.id, answerText, isCorrect);

    setSession(transition.session);
    setScoreState(nextScoreState);

    if (transition.shouldFinish) {
      finishQuiz(transition.session, nextScoreState);
      return;
    }

    setUserAnswer(null);
  };

  const handleRetry = () => {
    setSession(createInitialSpeedQuizSession(questionSet.code, questionSet.questions));
    setScoreState({ totalPoints: 0, currentStreak: 0, bestStreak: 0 });
    setResult(null);
    setUserAnswer(null);
    setState('intro');
  };

  const progressText = useMemo(
    () => `Kysymys ${session.currentQuestionIndex + 1}/${session.totalQuestions}`,
    [session.currentQuestionIndex, session.totalQuestions]
  );

  if (state === 'intro') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
        <SpeedQuizIntro questionSetName={questionSet.name} onStart={handleStartQuiz} />
      </div>
    );
  }

  if (state === 'results' && result) {
    return (
      <SpeedQuizResults
        result={result}
        questionSetCode={questionSet.code}
        questionSetName={questionSet.name}
        onRetry={handleRetry}
        onChooseAnother={() => router.push('/play/speed-quiz')}
        onGoHome={() => router.push('/play')}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-white p-6 dark:bg-gray-900">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-gray-700 dark:text-gray-300">Kysymystä ei voitu ladata.</p>
          <Button className="mt-4" onClick={() => router.push('/play/speed-quiz')}>
            Takaisin valintaan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-8 dark:bg-gray-900">
      <SpeedQuizTimer timeRemaining={timeRemaining} timeLimit={TIME_PER_QUESTION} colorState={colorState} />

      <header className="sticky top-2 z-10 px-4 pt-5">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between rounded-xl border border-amber-200 bg-white/95 px-4 py-3 shadow-sm dark:border-amber-900/50 dark:bg-gray-900/95">
          <div className="flex items-center gap-2">
            <Lightning size={18} weight="fill" className="text-amber-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{questionSet.name}</p>
          </div>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{progressText}</p>
        </div>
      </header>

      <main className="mx-auto mt-8 w-full max-w-3xl px-4">
        <Card variant="elevated" padding="responsive">
          <CardContent>
            <h1 className="mb-5 text-xl font-bold text-gray-900 dark:text-gray-100">{currentQuestion.question_text}</h1>
            <QuestionRenderer
              question={currentQuestion}
              userAnswer={userAnswer}
              showExplanation={false}
              onAnswerChange={setUserAnswer}
            />

            <div className="mt-6 flex items-center justify-end">
              <Button
                onClick={handleSubmitAnswer}
                disabled={!canSubmit}
                className="bg-amber-500 text-amber-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Vastaa
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export type { SpeedQuizGameProps, SpeedQuizScoreState };
