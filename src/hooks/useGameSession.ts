import { useState, useCallback } from 'react';
import { Question, Answer } from '@/types';
import { shuffleArray } from '@/lib/utils';
import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
import { useReviewMistakes } from '@/hooks/useReviewMistakes';
import { useTopicMastery } from '@/hooks/useTopicMastery';
import { createLogger } from '@/lib/logger';

const DEFAULT_QUESTIONS_PER_SESSION = 15;
const POINTS_PER_CORRECT = 10;
const STREAK_BONUS = 5;
const logger = createLogger({ module: 'useGameSession' });

export function useGameSession(
  allQuestions: Question[],
  questionsPerSession = DEFAULT_QUESTIONS_PER_SESSION,
  grade?: number,
  subject?: string,
  reviewMode = false,
  mistakeQuestions?: Question[],
  questionSetCode?: string
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
  const { addMistake, removeMistake, error: mistakesError } = useReviewMistakes(questionSetCode);
  const { updateMastery } = useTopicMastery(questionSetCode);

  const startNewSession = useCallback(() => {
    if (reviewMode) {
      const reviewQuestions = mistakeQuestions ? shuffleArray(mistakeQuestions) : [];
      setSelectedQuestions(reviewQuestions);
      setCurrentQuestionIndex(0);
      setUserAnswer(null);
      setShowExplanation(false);
      setScore(0);
      setAnswers([]);
      setTotalPoints(0);
      setCurrentStreak(0);
      setBestStreak(0);
      return;
    }

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
    const sessionSize = Math.min(questionsPerSession, allQuestions.length);
    const questionsWithSkills = allQuestions.filter(q => q.skill && q.skill.trim().length > 0).length;
    const skillCoverage = allQuestions.length > 0
      ? questionsWithSkills / allQuestions.length
      : 0;

    if (topics.length > 0 && questionsWithTopics.length >= sessionSize * 0.7) {
      const questionsPerTopic = Math.ceil(sessionSize / topics.length);

      if (skillCoverage >= 0.7) {
        topics.forEach(topic => {
          const topicQuestions = byTopic[topic];
          const bySkill: Record<string, Question[]> = {};

          topicQuestions.forEach(question => {
            const skillKey = question.skill?.trim() || 'unassigned';
            if (!bySkill[skillKey]) {
              bySkill[skillKey] = [];
            }
            bySkill[skillKey].push(question);
          });

          const skills = Object.keys(bySkill);
          const questionsPerSkill = Math.ceil(questionsPerTopic / skills.length);

          skills.forEach(skill => {
            const skillQuestions = shuffleArray(bySkill[skill]);
            const sampled = skillQuestions.slice(0, Math.min(questionsPerSkill, skillQuestions.length));
            selectedQuestions = selectedQuestions.concat(sampled);
          });
        });
      } else {
        // Use topic-only stratified sampling if too few skills are tagged
        topics.forEach(topic => {
          const topicQuestions = shuffleArray(byTopic[topic]);
          const sampled = topicQuestions.slice(0, Math.min(questionsPerTopic, topicQuestions.length));
          selectedQuestions = selectedQuestions.concat(sampled);
        });
      }

      if (selectedQuestions.length < sessionSize) {
        const remaining = allQuestions.filter(q => !selectedQuestions.includes(q));
        const shuffledRemaining = shuffleArray(remaining);
        const needed = sessionSize - selectedQuestions.length;
        selectedQuestions = selectedQuestions.concat(shuffledRemaining.slice(0, needed));
      }

      selectedQuestions = shuffleArray(selectedQuestions).slice(0, sessionSize);
    } else {
      // Fallback to random sampling if no topics or too few tagged questions
      selectedQuestions = shuffleArray(allQuestions).slice(0, sessionSize);
    }

    if (process.env.NODE_ENV !== 'production') {
      const skillDistribution = selectedQuestions.reduce<Record<string, number>>((acc, question) => {
        const key = question.skill?.trim() || 'unassigned';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});
      logger.debug(
        {
          skillCoverage: Number((skillCoverage * 100).toFixed(1)),
          skillDistribution,
        },
        'Session skill distribution'
      );
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
  }, [allQuestions, questionsPerSession, reviewMode, mistakeQuestions]);

  const submitAnswer = useCallback(() => {
    if (userAnswer === null || userAnswer === '' || (typeof userAnswer === 'object' && Object.keys(userAnswer).length === 0)) {
      return;
    }

    const currentQuestion = selectedQuestions[currentQuestionIndex];
    const { isCorrect, correctAnswer, matchType } = evaluateQuestionAnswer(
      currentQuestion,
      userAnswer,
      grade,
      subject
    );

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

    if (!isCorrect && !reviewMode) {
      addMistake({
        questionId: currentQuestion.id,
        questionText: currentQuestion.question_text,
        correctAnswer,
        userAnswer,
      });
    }

    if (isCorrect && reviewMode) {
      removeMistake(currentQuestion.id);
    }

    updateMastery(currentQuestion.topic, isCorrect);

    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        questionText: currentQuestion.question_text,
        userAnswer,
        correctAnswer,
        questionType: currentQuestion.question_type,
        questionOptions: 'options' in currentQuestion && Array.isArray(currentQuestion.options)
          ? currentQuestion.options
          : undefined,
        isCorrect,
        explanation: currentQuestion.explanation,
        pointsEarned,
        streakAtAnswer: newStreak,
        matchType,
      },
    ]);

    if (isCorrect && matchType && matchType !== 'exact' && matchType !== 'none') {
      logger.debug(
        {
          questionId: currentQuestion.id,
          questionType: currentQuestion.question_type,
          matchType,
        },
        'Answer accepted via smart validation'
      );
    }

    setShowExplanation(true);
  }, [
    userAnswer,
    selectedQuestions,
    currentQuestionIndex,
    currentStreak,
    bestStreak,
    grade,
    subject,
    reviewMode,
    addMistake,
    removeMistake,
    updateMastery,
  ]);

  const skipQuestion = useCallback(() => {
    if (showExplanation) return;
    const currentQuestion = selectedQuestions[currentQuestionIndex];
    if (!currentQuestion) return;

    const { correctAnswer } = evaluateQuestionAnswer(currentQuestion, '', grade, subject);

    // Skipping always resets the streak
    setCurrentStreak(0);

    if (!reviewMode) {
      addMistake({
        questionId: currentQuestion.id,
        questionText: currentQuestion.question_text,
        correctAnswer,
        userAnswer: null,
      });
    }

    updateMastery(currentQuestion.topic, false);

    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        questionText: currentQuestion.question_text,
        userAnswer: null,
        correctAnswer,
        questionType: currentQuestion.question_type,
        questionOptions: 'options' in currentQuestion && Array.isArray(currentQuestion.options)
          ? currentQuestion.options
          : undefined,
        isCorrect: false,
        explanation: currentQuestion.explanation,
        pointsEarned: 0,
        streakAtAnswer: 0,
      },
    ]);

    setShowExplanation(true);
  }, [
    showExplanation,
    selectedQuestions,
    currentQuestionIndex,
    grade,
    subject,
    reviewMode,
    addMistake,
    updateMastery,
  ]);

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
    isReviewMode: reviewMode,
    mistakesError,
    setUserAnswer,
    submitAnswer,
    skipQuestion,
    nextQuestion,
    startNewSession,
  };
}
