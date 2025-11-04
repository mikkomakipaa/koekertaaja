import { useState, useCallback } from 'react';
import { Question, Answer } from '@/types';
import { shuffleArray } from '@/lib/utils';

const DEFAULT_QUESTIONS_PER_SESSION = 15;

export function useGameSession(allQuestions: Question[], questionsPerSession = DEFAULT_QUESTIONS_PER_SESSION) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const startNewSession = useCallback(() => {
    const shuffled = shuffleArray(allQuestions).slice(0, Math.min(questionsPerSession, allQuestions.length));
    setSelectedQuestions(shuffled);
    setCurrentQuestionIndex(0);
    setUserAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnswers([]);
  }, [allQuestions, questionsPerSession]);

  const submitAnswer = useCallback(() => {
    if (userAnswer === null || userAnswer === '' || (typeof userAnswer === 'object' && Object.keys(userAnswer).length === 0)) {
      return;
    }

    const currentQuestion = selectedQuestions[currentQuestionIndex];
    let isCorrect = false;
    let correctAnswer: any;

    // Check correctness based on question type
    switch (currentQuestion.question_type) {
      case 'multiple_choice':
        isCorrect = userAnswer === currentQuestion.correct_answer;
        correctAnswer = currentQuestion.correct_answer;
        break;
      case 'fill_blank':
        isCorrect =
          userAnswer.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim() ||
          (currentQuestion.acceptable_answers?.some(
            (ans) => ans.toLowerCase().trim() === userAnswer.toLowerCase().trim()
          ) ?? false);
        correctAnswer = currentQuestion.correct_answer;
        break;
      case 'true_false':
        isCorrect = userAnswer === currentQuestion.correct_answer;
        correctAnswer = currentQuestion.correct_answer;
        break;
      case 'matching':
        // Check if all matches are correct
        const userMatches = userAnswer as Record<string, string>;
        isCorrect = currentQuestion.pairs.every(
          (pair) => userMatches[pair.left] === pair.right
        );
        correctAnswer = currentQuestion.pairs;
        break;
      case 'short_answer':
        isCorrect = userAnswer.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim();
        correctAnswer = currentQuestion.correct_answer;
        break;
      default:
        isCorrect = false;
        correctAnswer = null;
    }

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        questionText: currentQuestion.question_text,
        userAnswer,
        correctAnswer,
        isCorrect,
        explanation: currentQuestion.explanation,
      },
    ]);

    setShowExplanation(true);
  }, [userAnswer, selectedQuestions, currentQuestionIndex]);

  const nextQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => prev + 1);
    setUserAnswer(null);
    setShowExplanation(false);
  }, []);

  const isLastQuestion = currentQuestionIndex >= selectedQuestions.length - 1;
  const currentQuestion = selectedQuestions[currentQuestionIndex];

  return {
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
  };
}
