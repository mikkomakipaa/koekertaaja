import { useState, useCallback } from 'react';
import { Question, Answer } from '@/types';
import { shuffleArray } from '@/lib/utils';
import { isAnswerAcceptable } from '@/lib/utils/answerMatching';

const DEFAULT_QUESTIONS_PER_SESSION = 15;
const POINTS_PER_CORRECT = 10;
const STREAK_BONUS = 5;

export function useGameSession(
  allQuestions: Question[],
  questionsPerSession = DEFAULT_QUESTIONS_PER_SESSION,
  grade?: number
) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const startNewSession = useCallback(() => {
    // STRATIFIED SAMPLING: Ensure balanced topic coverage
    // Group questions by topic
    const byTopic: Record<string, Question[]> = {};
    const questionsWithTopics: Question[] = [];
    const questionsWithoutTopics: Question[] = [];

    allQuestions.forEach(q => {
      if (q.topic) {
        if (!byTopic[q.topic]) {
          byTopic[q.topic] = [];
        }
        byTopic[q.topic].push(q);
        questionsWithTopics.push(q);
      } else {
        questionsWithoutTopics.push(q);
      }
    });

    const topics = Object.keys(byTopic);
    let selectedQuestions: Question[] = [];

    if (topics.length > 0 && questionsWithTopics.length >= Math.min(questionsPerSession, allQuestions.length) * 0.7) {
      // Use stratified sampling if we have topics and most questions are tagged
      const questionsPerTopic = Math.ceil(Math.min(questionsPerSession, allQuestions.length) / topics.length);

      // Sample evenly from each topic
      topics.forEach(topic => {
        const topicQuestions = shuffleArray(byTopic[topic]);
        const sampled = topicQuestions.slice(0, Math.min(questionsPerTopic, topicQuestions.length));
        selectedQuestions = selectedQuestions.concat(sampled);
      });

      // If we don't have enough questions, fill with remaining questions
      if (selectedQuestions.length < Math.min(questionsPerSession, allQuestions.length)) {
        const remaining = allQuestions.filter(q => !selectedQuestions.includes(q));
        const shuffledRemaining = shuffleArray(remaining);
        const needed = Math.min(questionsPerSession, allQuestions.length) - selectedQuestions.length;
        selectedQuestions = selectedQuestions.concat(shuffledRemaining.slice(0, needed));
      }

      // Trim to exact count and shuffle final selection
      selectedQuestions = shuffleArray(selectedQuestions).slice(0, Math.min(questionsPerSession, allQuestions.length));
    } else {
      // Fallback to random sampling if no topics or too few tagged questions
      selectedQuestions = shuffleArray(allQuestions).slice(0, Math.min(questionsPerSession, allQuestions.length));
    }

    setSelectedQuestions(selectedQuestions);
    setCurrentQuestionIndex(0);
    setUserAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnswers([]);
    setTotalPoints(0);
    setCurrentStreak(0);
    setBestStreak(0);
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
        // Use lenient matching for age-appropriate answer checking
        isCorrect = isAnswerAcceptable(
          userAnswer,
          currentQuestion.correct_answer,
          currentQuestion.acceptable_answers,
          grade
        );
        correctAnswer = currentQuestion.correct_answer;
        break;
      case 'true_false':
        // Ensure boolean comparison (strict equality)
        // Both userAnswer and correct_answer should already be boolean type
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
        // Use lenient matching for age-appropriate answer checking
        isCorrect = isAnswerAcceptable(
          userAnswer,
          currentQuestion.correct_answer,
          currentQuestion.acceptable_answers,
          grade
        );
        correctAnswer = currentQuestion.correct_answer;
        break;
      case 'sequential':
        // Check if the order matches exactly
        isCorrect = JSON.stringify(userAnswer) === JSON.stringify(currentQuestion.correct_order);
        correctAnswer = currentQuestion.correct_order;
        break;
      default:
        isCorrect = false;
        correctAnswer = null;
    }

    let pointsEarned = 0;
    let newStreak = currentStreak;

    if (isCorrect) {
      setScore((prev) => prev + 1);
      newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);

      // Calculate points: 10 base + 5 streak bonus if streak >= 3
      pointsEarned = POINTS_PER_CORRECT;
      if (newStreak >= 3) {
        pointsEarned += STREAK_BONUS;
      }

      setTotalPoints((prev) => prev + pointsEarned);

      // Update best streak
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }
    } else {
      // Reset streak on wrong answer
      setCurrentStreak(0);
      newStreak = 0;
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
        pointsEarned,
        streakAtAnswer: newStreak,
      },
    ]);

    setShowExplanation(true);
  }, [userAnswer, selectedQuestions, currentQuestionIndex, currentStreak, bestStreak]);

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
    totalPoints,
    currentStreak,
    bestStreak,
    setUserAnswer,
    submitAnswer,
    nextQuestion,
    startNewSession,
  };
}
