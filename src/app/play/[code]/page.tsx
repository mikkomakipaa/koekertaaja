'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MathText } from '@/components/ui/math-text';
import { QuestionRenderer } from '@/components/questions/QuestionRenderer';
import { ProgressBar } from '@/components/play/ProgressBar';
import { ResultsScreen } from '@/components/play/ResultsScreen';
import { FlashcardSession } from '@/components/play/FlashcardSession';
import { useGameSession } from '@/hooks/useGameSession';
import { getQuestionSetByCode } from '@/lib/supabase/queries';
import { convertQuestionsToFlashcards } from '@/lib/utils/flashcardConverter';
import { shuffleArray } from '@/lib/utils';
import { QuestionSetWithQuestions, StudyMode, Flashcard } from '@/types';
import { CircleNotch, ListBullets, DiamondsFour, Fire, Book } from '@phosphor-icons/react';

type PlayState = 'loading' | 'error' | 'playing' | 'results';

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = params.code as string;
  const studyMode = (searchParams.get('mode') as StudyMode) || 'pelaa';
  const allCodes = searchParams.get('all'); // Comma-separated codes for study mode
  const topRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<PlayState>('loading');
  const [questionSet, setQuestionSet] = useState<QuestionSetWithQuestions | null>(null);
  const [error, setError] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

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

  // Load question set(s)
  useEffect(() => {
    const loadQuestionSet = async () => {
      try {
        setState('loading');

        // If allCodes parameter exists, load all question sets for study mode
        if (allCodes && studyMode === 'opettele') {
          const codes = allCodes.split(',');
          const allSets = await Promise.all(
            codes.map(c => getQuestionSetByCode(c.trim()))
          );

          // Filter out any null results and combine questions
          const validSets = allSets.filter(s => s !== null) as QuestionSetWithQuestions[];

          if (validSets.length === 0) {
            setError('Kysymyssarjoja ei löytynyt');
            setState('error');
            return;
          }

          // Use first set as the base, but combine all questions
          const combinedSet = {
            ...validSets[0],
            questions: validSets.flatMap(s => s.questions),
            question_count: validSets.reduce((sum, s) => sum + s.question_count, 0)
          };

          setQuestionSet(combinedSet);
          // Convert all questions to flashcards (excludes sequential questions)
          const cards = convertQuestionsToFlashcards(combinedSet.questions);
          setFlashcards(cards);
          // Extract unique topics from questions
          const topics = [...new Set(
            combinedSet.questions
              .map(q => q.topic)
              .filter((t): t is string => t !== null && t !== undefined && t.trim().length > 0)
          )];
          setAvailableTopics(topics);
          // Auto-select if only one topic or no topics
          if (topics.length <= 1) {
            setSelectedTopic('ALL');
          }
          setState('playing');
        } else {
          // Normal single question set loading
          const data = await getQuestionSetByCode(code);

          if (!data) {
            setError(`Kysymyssarjaa ei löytynyt koodilla: ${code}`);
            setState('error');
            return;
          }

          setQuestionSet(data);
          // Convert questions to flashcards (excludes sequential questions)
          const cards = convertQuestionsToFlashcards(data.questions);
          setFlashcards(cards);
          // Extract unique topics from questions
          const topics = [...new Set(
            data.questions
              .map(q => q.topic)
              .filter((t): t is string => t !== null && t !== undefined && t.trim().length > 0)
          )];
          setAvailableTopics(topics);
          // Auto-select if only one topic or no topics
          if (topics.length <= 1) {
            setSelectedTopic('ALL');
          }
          setState('playing');
        }
      } catch (err) {
        console.error('Error loading question set:', err);
        setError('Kysymyssarjan lataaminen epäonnistui');
        setState('error');
      }
    };

    if (code) {
      loadQuestionSet();
    }
  }, [code, allCodes, studyMode]);

  // Start new session when question set loads
  useEffect(() => {
    if (questionSet && state === 'playing' && selectedQuestions.length === 0) {
      startNewSession();
      setSessionStartTime(Date.now());
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
      // Scroll to top for next question (instant scroll for Safari compatibility)
      setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
        // Fallback for older browsers
        window.scrollTo(0, 0);
      }, 0);
    }
  };

  // Scroll to top when a new question loads
  useEffect(() => {
    if (currentQuestion && !showExplanation) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
        // Fallback for older browsers
        window.scrollTo(0, 0);
      }, 0);
    }
  }, [currentQuestionIndex]);

  const handlePlayAgain = () => {
    startNewSession();
    setSessionStartTime(Date.now());
    setState('playing');
  };

  const handleBrowseQuestionSets = () => {
    router.push('/play');
  };

  const handleBackToMenu = () => {
    router.push('/play');
  };

  // Loading screen
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <CircleNotch weight="bold" className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-600" />
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
    const durationSeconds = sessionStartTime
      ? Math.round((Date.now() - sessionStartTime) / 1000)
      : undefined;

    return (
      <ResultsScreen
        score={score}
        total={selectedQuestions.length}
        answers={answers}
        totalPoints={totalPoints}
        bestStreak={bestStreak}
        questionSetCode={code}
        difficulty={questionSet?.difficulty}
        durationSeconds={durationSeconds}
        onPlayAgain={handlePlayAgain}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  // Flashcard mode
  if (studyMode === 'opettele') {
    if (flashcards.length === 0) {
      return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center transition-colors">
          <div className="text-center max-w-md p-6">
            <Book size={64} weight="duotone" className="text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Ei kortteja opeteltavaksi
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tämä kysymyssarja ei sisällä kysymyksiä, joita voi opetella korttitilassa.
            </p>
            <Button
              onClick={() => router.push('/play')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Takaisin valintaan
            </Button>
          </div>
        </div>
      );
    }

    // Show topic selection if topics are available and none is selected
    if (availableTopics.length > 1 && !selectedTopic) {
      return (
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
          <div className="max-w-2xl mx-auto p-6 md:p-12">
            <div className="mb-8">
              <Book size={32} weight="duotone" className="text-purple-600 dark:text-purple-400 mb-3" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Valitse harjoiteltava aihe
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Tämä korttisarja sisältää {availableTopics.length} aihetta. Valitse mitä haluat harjoitella.
              </p>
            </div>

            <div className="grid gap-3">
              {/* All Topics Option */}
              <button
                onClick={() => setSelectedTopic('ALL')}
                className="bg-white dark:bg-gray-800 border-2 border-purple-500 dark:border-purple-400 rounded-xl p-6 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                      Kaikki aiheet
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Harjoittele kaikkia aiheita ({flashcards.length} korttia)
                    </p>
                  </div>
                  <div className="text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
                    →
                  </div>
                </div>
              </button>

              {/* Individual Topic Options */}
              {availableTopics.map((topic) => {
                const topicCardCount = flashcards.filter(f =>
                  questionSet?.questions.find(q => q.id === f.questionId)?.topic === topic
                ).length;

                return (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 text-left hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {topic}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {topicCardCount} korttia
                        </p>
                      </div>
                      <div className="text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all">
                        →
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <Button
                onClick={() => router.push('/play')}
                variant="ghost"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                ← Takaisin
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Strip difficulty suffix from name for flashcard mode
    const stripDifficultySuffix = (name: string): string => {
      const suffixes = [' - Helppo', ' - Normaali', ' - Vaikea'];
      for (const suffix of suffixes) {
        if (name.endsWith(suffix)) {
          return name.slice(0, -suffix.length);
        }
      }
      return name;
    };

    const displayName = questionSet?.name ? stripDifficultySuffix(questionSet.name) : 'Kysymyssarja';

    // Filter flashcards by selected topic
    const filteredFlashcards = selectedTopic && selectedTopic !== 'ALL'
      ? flashcards.filter(f => {
          const question = questionSet?.questions.find(q => q.id === f.questionId);
          return question?.topic === selectedTopic;
        })
      : flashcards;

    return (
      <FlashcardSession
        flashcards={filteredFlashcards}
        questionSetName={selectedTopic && selectedTopic !== 'ALL' ? `${displayName} - ${selectedTopic}` : displayName}
        onExit={handleBackToMenu}
      />
    );
  }

  // Playing screen - show loading while session initializes
  if (!currentQuestion || selectedQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <CircleNotch weight="bold" className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-600" />
          <p className="text-lg text-gray-600">Valmistellaan kysymyksiä...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-8 pb-safe transition-colors">
      <div ref={topRef} className="max-w-2xl mx-auto pt-2">
        {/* Stats Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Kysymys {currentQuestionIndex + 1} / {selectedQuestions.length}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <span className="flex items-center gap-1.5">
              <DiamondsFour size={20} weight="duotone" className="text-amber-500" />
              {totalPoints}
            </span>
            {currentStreak > 0 && (
              <span className="flex items-center gap-1.5">
                <Fire size={20} weight="duotone" className="text-orange-500" />
                {currentStreak}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar
          current={currentQuestionIndex + 1}
          total={selectedQuestions.length}
          score={score}
        />

        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-8 mb-6 transition-colors">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 md:mb-6">
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
            <ListBullets weight="duotone" className="w-4 h-4 mr-2" />
            Valitse eri aihealue
          </Button>
        </div>
      </div>
    </div>
  );
}
