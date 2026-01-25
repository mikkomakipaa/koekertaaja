'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Flashcard } from '@/types';
import { shuffleArray } from '@/lib/utils';
import { FlashcardCard } from './FlashcardCard';
import { Button } from '@/components/ui/button';
import {
  Book,
  CheckCircle,
  ClockCounterClockwise,
  Shuffle,
  ThumbsDown,
  Minus,
  ThumbsUp,
  X,
  ArrowsClockwise,
} from '@phosphor-icons/react';

type Confidence = 'hard' | 'medium' | 'easy';
const FLIP_HINT_KEY = 'has_seen_flip_hint';
const getReviewKey = (cardId: string) => `flashcard_reviews_${cardId}`;
const getConfidenceKey = (questionId: string) => `flashcard_confidence_${questionId}`;

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
  const [isComplete, setIsComplete] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [isShuffled, setIsShuffled] = useState(false);
  const [orderedFlashcards, setOrderedFlashcards] = useState<Flashcard[]>(flashcards);
  const [currentFlashcards, setCurrentFlashcards] = useState<Flashcard[]>(flashcards);

  const [cardConfidence, setCardConfidence] = useState<Record<string, Confidence>>({});
  const [reviewCounts, setReviewCounts] = useState<Record<string, number>>({});
  const [hasSeenFlipHint, setHasSeenFlipHint] = useState<boolean | null>(null);

  const previousIsFlippedRef = useRef(false);
  const confidenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalCards = currentFlashcards.length;
  const currentFlashcard = currentFlashcards[currentIndex];
  const progress = totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0;

  const readStoredNumber = useCallback((key: string): number => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return 0;
      const parsed = parseInt(stored, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    } catch {
      return 0;
    }
  }, []);

  const loadReviewCount = useCallback((cardId: string) => {
    const count = readStoredNumber(getReviewKey(cardId));
    setReviewCounts((prev) => ({ ...prev, [cardId]: count }));
  }, [readStoredNumber]);

  const incrementReviewCount = useCallback((cardId: string) => {
    try {
      const key = getReviewKey(cardId);
      const nextCount = readStoredNumber(key) + 1;
      localStorage.setItem(key, String(nextCount));
      setReviewCounts((prev) => ({ ...prev, [cardId]: nextCount }));
    } catch (error) {
      console.error('Error incrementing flashcard review count:', error);
    }
  }, [readStoredNumber]);

  const loadConfidence = useCallback((card: Flashcard) => {
    try {
      const stored = localStorage.getItem(getConfidenceKey(card.questionId));
      if (!stored) return;
      const parsed = JSON.parse(stored) as { confidence?: Confidence } | null;
      const confidence = parsed?.confidence;
      if (!confidence) return;
      setCardConfidence((prev) => ({ ...prev, [card.id]: confidence }));
    } catch {
      // Ignore malformed localStorage data
    }
  }, []);

  useEffect(() => {
    setOrderedFlashcards(flashcards);
    setCurrentFlashcards(flashcards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsComplete(false);
    setIsShuffled(false);
    setShowExitConfirm(false);
    previousIsFlippedRef.current = false;
    if (confidenceTimeoutRef.current) {
      clearTimeout(confidenceTimeoutRef.current);
      confidenceTimeoutRef.current = null;
    }
  }, [flashcards]);

  useEffect(() => {
    try {
      const hasSeenHint = localStorage.getItem(FLIP_HINT_KEY);
      setHasSeenFlipHint(Boolean(hasSeenHint));
    } catch {
      setHasSeenFlipHint(false);
    }
  }, []);

  useEffect(() => {
    if (!currentFlashcard) return;
    loadReviewCount(currentFlashcard.id);
    loadConfidence(currentFlashcard);
  }, [currentFlashcard, loadReviewCount, loadConfidence]);

  useEffect(() => {
    if (!currentFlashcard) return;
    if (isFlipped && !previousIsFlippedRef.current) {
      incrementReviewCount(currentFlashcard.id);
    }
    previousIsFlippedRef.current = isFlipped;
  }, [isFlipped, currentFlashcard, incrementReviewCount]);

  useEffect(() => {
    return () => {
      if (confidenceTimeoutRef.current) {
        clearTimeout(confidenceTimeoutRef.current);
      }
    };
  }, []);

  const handleFlip = useCallback(() => {
    if (showExitConfirm) return;
    setIsFlipped((prev) => {
      const next = !prev;
      if (next && hasSeenFlipHint === false) {
        setHasSeenFlipHint(true);
        try {
          localStorage.setItem(FLIP_HINT_KEY, 'true');
        } catch (error) {
          console.error('Error saving flip hint state:', error);
        }
      }
      return next;
    });
  }, [hasSeenFlipHint, showExitConfirm]);

  const handleAdvance = useCallback(() => {
    if (!currentFlashcard) return;
    if (currentIndex < totalCards - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      previousIsFlippedRef.current = false;
      return;
    }
    setIsComplete(true);
  }, [currentFlashcard, currentIndex, totalCards]);

  const handlePrevious = useCallback(() => {
    if (currentIndex === 0) return;
    if (confidenceTimeoutRef.current) {
      clearTimeout(confidenceTimeoutRef.current);
      confidenceTimeoutRef.current = null;
    }
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setIsFlipped(false);
    previousIsFlippedRef.current = false;
  }, [currentIndex]);

  const markConfidence = useCallback((confidence: Confidence) => {
    if (!currentFlashcard) return;
    setCardConfidence((prev) => ({
      ...prev,
      [currentFlashcard.id]: confidence,
    }));

    try {
      const key = getConfidenceKey(currentFlashcard.questionId);
      localStorage.setItem(
        key,
        JSON.stringify({ confidence, timestamp: Date.now() })
      );
    } catch (error) {
      console.error('Error saving flashcard confidence:', error);
    }

    if (confidenceTimeoutRef.current) {
      clearTimeout(confidenceTimeoutRef.current);
    }
    confidenceTimeoutRef.current = setTimeout(() => {
      handleAdvance();
    }, 300);
  }, [currentFlashcard, handleAdvance]);

  const toggleShuffle = useCallback(() => {
    if (totalCards === 0) return;
    const activeCardId = currentFlashcards[currentIndex]?.id;
    const nextIsShuffled = !isShuffled;
    const nextCards = nextIsShuffled
      ? shuffleArray([...orderedFlashcards])
      : orderedFlashcards;

    setIsShuffled(nextIsShuffled);
    setCurrentFlashcards(nextCards);
    setIsFlipped(false);
    previousIsFlippedRef.current = false;

    if (activeCardId) {
      const newIndex = nextCards.findIndex((card) => card.id === activeCardId);
      setCurrentIndex(newIndex >= 0 ? newIndex : 0);
      return;
    }
    setCurrentIndex(0);
  }, [
    totalCards,
    currentFlashcards,
    currentIndex,
    isShuffled,
    orderedFlashcards,
  ]);

  const handleExit = useCallback(() => {
    if (isComplete) {
      onExit();
      return;
    }
    setShowExitConfirm(true);
  }, [isComplete, onExit]);

  useEffect(() => {
    if (!currentFlashcard || isComplete) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (showExitConfirm) return;

      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        handleFlip();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevious();
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (!isFlipped) {
          handleFlip();
          return;
        }
        handleAdvance();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    currentFlashcard,
    isComplete,
    showExitConfirm,
    isFlipped,
    handleFlip,
    handlePrevious,
    handleAdvance,
  ]);

  if (!currentFlashcard) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-6 transition-colors">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Kortteja ei löytynyt
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Valitse toinen aihe tai palaa valikkoon.
          </p>
          <Button onClick={onExit} className="bg-teal-600 hover:bg-teal-700 text-white">
            Takaisin valikkoon
          </Button>
        </div>
      </div>
    );
  }

  const currentReviewCount = reviewCounts[currentFlashcard.id] ?? 0;
  const currentConfidence = cardConfidence[currentFlashcard.id];
  const showFlipHint = currentIndex === 0 && hasSeenFlipHint === false && !isFlipped;

  const overlay = (
    <>
      {showFlipHint && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-wiggle">
            <div className="w-16 h-16 bg-teal-500/20 dark:bg-teal-500/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <ArrowsClockwise size={32} weight="bold" className="text-teal-600 dark:text-teal-400" />
            </div>
          </div>
        </div>
      )}
    </>
  );

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

          <div className="bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-500 dark:border-teal-600 rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Book size={48} weight="duotone" className="text-teal-600 dark:text-teal-400" />
              <div className="text-5xl font-bold text-teal-600 dark:text-teal-400">
                {totalCards}
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              Korttia käyty läpi
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => {
                setCurrentIndex(0);
                setIsFlipped(false);
                setIsComplete(false);
                setIsShuffled(false);
                setCurrentFlashcards(orderedFlashcards);
                previousIsFlippedRef.current = false;
              }}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-6 rounded-xl font-medium"
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Header with progress */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 dark:from-teal-700 dark:to-teal-600 text-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Book size={20} weight="fill" className="text-teal-100" />
              <div>
                <h2 className="text-lg font-semibold">{questionSetName}</h2>
                <p className="text-sm text-teal-100">
                  Kortti {currentIndex + 1} / {totalCards}
                </p>
              </div>
            </div>
            <Button
              onClick={handleExit}
              variant="ghost"
              size="sm"
              aria-label="Lopeta opettelu"
              className="text-white/90 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5 mr-1" />
              Lopeta
            </Button>
          </div>

          {/* Progress bar + Percentage (same row) */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/30 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-teal-100 font-medium whitespace-nowrap">
              {Math.round(progress)}% valmis
            </span>
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <FlashcardCard
          flashcard={currentFlashcard}
          isFlipped={isFlipped}
          onFlip={handleFlip}
          overlay={overlay}
        />

        {isFlipped && (
          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 font-medium">
              Kuinka hyvin osasit?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => markConfidence('hard')}
                type="button"
                aria-label="En osannut"
                className={`min-h-12 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md ${currentConfidence === 'hard' ? 'ring-2 ring-rose-200 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''}`}
              >
                <ThumbsDown size={20} weight="fill" />
                <span className="text-sm">En osannut</span>
              </button>
              <button
                onClick={() => markConfidence('medium')}
                type="button"
                aria-label="Osittain"
                className={`min-h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md ${currentConfidence === 'medium' ? 'ring-2 ring-amber-200 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''}`}
              >
                <Minus size={20} weight="bold" />
                <span className="text-sm">Osittain</span>
              </button>
              <button
                onClick={() => markConfidence('easy')}
                type="button"
                aria-label="Osasin"
                className={`min-h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md ${currentConfidence === 'easy' ? 'ring-2 ring-emerald-200 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''}`}
              >
                <ThumbsUp size={20} weight="fill" />
                <span className="text-sm">Osasin!</span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center justify-center gap-4">
          <span className="inline-flex items-center gap-1">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono">
              Space
            </kbd>
            kääntää kortin
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono">
              ←
            </kbd>
            edellinen
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono">
              →
            </kbd>
            seuraava
          </span>
        </div>
      </div>

      {showExitConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Haluatko varmasti lopettaa?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Olet käynyt läpi {currentIndex + 1}/{totalCards} korttia.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setShowExitConfirm(false)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg"
              >
                Jatka opiskelua
              </Button>
              <Button
                onClick={() => {
                  setShowExitConfirm(false);
                  onExit();
                }}
                type="button"
                variant="secondary"
                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-lg"
              >
                Lopeta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
