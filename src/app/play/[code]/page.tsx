'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QuestionRenderer } from '@/components/questions/QuestionRenderer';
import { ProgressBar } from '@/components/play/ProgressBar';
import { ResultsScreen } from '@/components/play/ResultsScreen';
import { useGameSession } from '@/hooks/useGameSession';
import { getQuestionSetByCode } from '@/lib/supabase/queries';
import { QuestionSetWithQuestions } from '@/types';
import { Loader2 } from 'lucide-react';

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
  }, [questionSet, state, startNewSession, selectedQuestions.length]);

  const handleSubmitAnswer = () => {
    submitAnswer();
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      setState('results');
    } else {
      nextQuestion();
    }
  };

  const handlePlayAgain = () => {
    startNewSession();
    setState('playing');
  };

  const handleBackToMenu = () => {
    router.push('/');
  };

  // Loading screen
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96 shadow-lg">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-500" />
            <p className="text-xl font-bold text-indigo-700">Ladataan kysymyssarjaa...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error screen
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button onClick={handleBackToMenu} className="mt-4">
                Palaa valikkoon
              </Button>
            </CardContent>
          </Card>
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
        onPlayAgain={handlePlayAgain}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  // Playing screen
  if (!currentQuestion) {
    return null; // Still initializing
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        <ProgressBar
          current={currentQuestionIndex + 1}
          total={selectedQuestions.length}
          score={score}
        />

        <Card className="shadow-lg">
          <CardHeader className="bg-white">
            <CardTitle className="text-2xl text-indigo-700 font-bold">
              {currentQuestion.question_text}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <QuestionRenderer
              question={currentQuestion}
              userAnswer={userAnswer}
              showExplanation={showExplanation}
              onAnswerChange={setUserAnswer}
            />

            {showExplanation && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-base">
                  <strong className="block mb-2">
                    {answers[answers.length - 1]?.isCorrect ? '🎉 Oikein!' : '📚 Oppimiskohta:'}
                  </strong>
                  {currentQuestion.explanation}
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-4">
              {!showExplanation ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={
                    userAnswer === null ||
                    userAnswer === '' ||
                    (typeof userAnswer === 'object' && Object.keys(userAnswer).length === 0)
                  }
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-lg py-6"
                >
                  Tarkista vastaus
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg py-6"
                >
                  {isLastQuestion ? 'Katso tulokset' : 'Seuraava kysymys'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
