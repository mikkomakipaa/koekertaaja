'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MathText } from '@/components/ui/math-text';
import { QuestionRenderer } from '@/components/questions/QuestionRenderer';
import { ProgressBar } from '@/components/play/ProgressBar';
import { ResultsScreen } from '@/components/play/ResultsScreen';
import { useGameSession } from '@/hooks/useGameSession';
import { getQuestionSetByCode } from '@/lib/supabase/queries';
import { QuestionSetWithQuestions } from '@/types';
import { Loader2, List } from 'lucide-react';

type PlayState = 'loading' | 'error' | 'playing' | 'results';

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [state, setState] = useState<PlayState>('loading');
  const [questionSet, setQuestionSet] = useState<QuestionSetWithQuestions | null>(null);
  const [error, setError] = useState('');

  const {
    currentQuestion,
    currentQuestionIndex,
    selectedQuestions,
    userAnswer,
    showExplanation,
    score,
    answers,
    isLastQuestion,
    totalPoints,
    currentStreak,
    bestStreak,
    setUserAnswer,
    submitAnswer,
    nextQuestion,
    startNewSession,
  } = useGameSession(questionSet?.questions || []);

  // Load question set
  useEffect(() => {
    const loadQuestionSet = async () => {
      try {
        setState('loading');
        const data = await getQuestionSetByCode(code);

        if (!data) {
          setError(`Kysymyssarjaa ei löytynyt koodilla: ${code}`);
          setState('error');
          return;
        }

        setQuestionSet(data);
        setState('playing');
      } catch (err) {
        console.error('Error loading question set:', err);
        setError('Kysymyssarjan lataaminen epäonnistui');
        setState('error');
      }
    };

    if (code) {
      loadQuestionSet();
    }
  }, [code]);

  // Start new session when question set loads
  useEffect(() => {
    if (questionSet && state === 'playing' && selectedQuestions.length === 0) {
      startNewSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionSet, state]);

  const handleSubmitAnswer = () => {
    submitAnswer();
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      setState('results');
    } else {
      nextQuestion();
      // Scroll to top for next question (especially important on mobile)
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Scroll to top when a new question loads
  useEffect(() => {
    if (currentQuestion && !showExplanation) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentQuestionIndex, showExplanation]);

  const handlePlayAgain = () => {
    startNewSession();
    setState('playing');
  };

  const handleBrowseQuestionSets = () => {
    router.push('/play');
  };

  const handleBackToMenu = () => {
    router.push('/');
  };

  // Loading screen
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-600" />
          <p className="text-lg text-gray-600">Ladataan kysymyssarjaa...</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="max-w-md text-center">
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleBackToMenu} variant="outline">
            Takaisin valikkoon
          </Button>
        </div>
      </div>
    );
  }

  // Results screen
  if (state === 'results') {
    return (
      <ResultsScreen
        score={score}
        total={selectedQuestions.length}
        answers={answers}
        totalPoints={totalPoints}
        bestStreak={bestStreak}
        onPlayAgain={handlePlayAgain}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  // Playing screen - show loading while session initializes
  if (!currentQuestion || selectedQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-600" />
          <p className="text-lg text-gray-600">Valmistellaan kysymyksiä...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 pb-safe">
      <div className="max-w-2xl mx-auto pt-2">
        {/* Streak Banner */}
        {currentStreak >= 3 && !showExplanation && (
          <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4 text-center">
            <span className="text-lg font-semibold text-orange-900">🔥 {currentStreak} oikein peräkkäin!</span>
          </div>
        )}

        {/* Stats Bar */}
        <div className="mb-6 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">💎 {totalPoints} pistettä</span>
            {currentStreak > 0 && (
              <span className="text-gray-600">🔥 {currentStreak} putki</span>
            )}
          </div>
          <span className="text-gray-500">
            {currentQuestionIndex + 1} / {selectedQuestions.length}
          </span>
        </div>

        {/* Question Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-8 mb-6">
          <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
            <MathText>{currentQuestion.question_text}</MathText>
          </h2>

          <QuestionRenderer
            question={currentQuestion}
            userAnswer={userAnswer}
            showExplanation={showExplanation}
            onAnswerChange={setUserAnswer}
          />
        </div>

        {/* Feedback */}
        {showExplanation && (
          <div className="space-y-3 mb-6">
            {answers[answers.length - 1]?.isCorrect ? (
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                <p className="text-green-900 font-semibold mb-1">
                  ✓ Oikein! +{answers[answers.length - 1]?.pointsEarned || 10} pistettä
                </p>
                {(answers[answers.length - 1]?.streakAtAnswer ?? 0) >= 3 && (
                  <p className="text-sm text-green-700">🔥 Putki bonus +5 pistettä!</p>
                )}
              </div>
            ) : (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                <p className="text-red-900 font-semibold">✗ Ei aivan oikein</p>
              </div>
            )}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-1">Selitys:</p>
              <p className="text-blue-800">
                <MathText>{currentQuestion.explanation}</MathText>
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {!showExplanation ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={
                userAnswer === null ||
                userAnswer === '' ||
                (typeof userAnswer === 'object' && Object.keys(userAnswer).length === 0)
              }
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-xl font-medium"
            >
              Tarkista vastaus
            </Button>
          ) : (
            <Button
              onClick={handleNextQuestion}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-xl font-medium"
            >
              {isLastQuestion ? 'Näytä tulokset →' : 'Seuraava kysymys →'}
            </Button>
          )}
          <Button
            onClick={handleBrowseQuestionSets}
            variant="ghost"
            className="w-full text-gray-600 hover:text-gray-900"
          >
            <List className="w-4 h-4 mr-2" />
            Valitse eri aihealue
          </Button>
        </div>
      </div>
    </div>
  );
}
