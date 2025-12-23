'use client';

import { useState, useRef, useEffect } from 'react';
import { Flashcard } from '@/types';
import { FlashcardCard } from './FlashcardCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Check, X, Book, CheckCircle } from '@phosphor-icons/react';
import posthog from 'posthog-js';

interface FlashcardSessionProps {
  flashcards: Flashcard[];
  questionSetName: string;
  onExit: () => void;
}

export function FlashcardSession({
  flashcards,
  questionSetName,
  onExit,
}: FlashcardSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const currentFlashcard = flashcards[currentIndex];
  const totalCards = flashcards.length;
  const progress = ((currentIndex + 1) / totalCards) * 100;

  // Track if session started event has been captured
  const sessionStartedRef = useRef(false);

  // PostHog: Track flashcard session started (on first render)
  useEffect(() => {
    if (!sessionStartedRef.current && flashcards.length > 0) {
      sessionStartedRef.current = true;
      posthog.capture('flashcard_session_started', {
        question_set_name: questionSetName,
        total_cards: totalCards,
      });
    }
  }, [flashcards.length, questionSetName, totalCards]);

  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      // Move to next card
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setReviewedCount(reviewedCount + 1);
    } else {
      // Session complete
      setReviewedCount(reviewedCount + 1);
      setIsComplete(true);

      // PostHog: Track flashcard session completed
      posthog.capture('flashcard_session_completed', {
        question_set_name: questionSetName,
        total_cards: totalCards,
        cards_reviewed: reviewedCount + 1,
      });
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewedCount(0);
    setIsComplete(false);
  };

  // Completion screen
  if (isComplete) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-8 transition-colors">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <CheckCircle size={80} weight="fill" className="text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Hienoa työtä!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Kävit läpi kaikki {totalCards} korttia
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500 dark:border-purple-600 rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Book size={48} weight="duotone" className="text-purple-600 dark:text-purple-400" />
              <div className="text-5xl font-bold text-purple-600 dark:text-purple-400">
                {totalCards}
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              Korttia käyty läpi
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleRestart}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-xl font-medium"
            >
              Opettele uudelleen
            </Button>
            <Button
              onClick={onExit}
              variant="outline"
              className="flex-1 py-6 rounded-xl font-medium"
            >
              Takaisin valikkoon
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Study session
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Header with progress */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {questionSetName}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Kortti {currentIndex + 1} / {totalCards}
              </p>
            </div>
            <Button
              onClick={onExit}
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <X className="w-5 h-5 mr-1" />
              Lopeta
            </Button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <FlashcardCard
          flashcard={currentFlashcard}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />

        {/* Next button (only shown after flipping) */}
        {isFlipped && (
          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleNext}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transition-all"
            >
              {currentIndex < flashcards.length - 1 ? (
                <>
                  Seuraava
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              ) : (
                <>
                  Valmis
                  <Check className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Instruction hint (before first flip) */}
        {!isFlipped && currentIndex === 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4" />
              Napauta korttia nähdäksesi vastauksen
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
