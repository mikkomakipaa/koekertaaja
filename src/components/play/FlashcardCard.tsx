'use client';

import type { ReactNode } from 'react';
import { Flashcard } from '@/types';
import { MathText } from '@/components/ui/math-text';
import { Cards, CheckCircle } from '@phosphor-icons/react';

interface FlashcardCardProps {
  flashcard: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
  onShowAnswer: () => void;
  onShowQuestion: () => void;
  overlay?: ReactNode;
}

export function FlashcardCard({
  flashcard,
  isFlipped,
  onFlip,
  onShowAnswer,
  onShowQuestion,
  overlay,
}: FlashcardCardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto perspective-1000">
      <div
        className={`
          relative w-full h-[400px] cursor-pointer transition-transform duration-500 transform-style-3d
          ${isFlipped ? 'rotate-y-180' : ''}
        `}
        onClick={onFlip}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFlip();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? 'Käännä kortti takaisin' : 'Käännä kortti nähdäksesi vastaus'}
      >
        {overlay && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {overlay}
          </div>
        )}

        {/* Front Side - Question */}
        <div
          className={`
            absolute inset-0 backface-hidden
            bg-white dark:bg-gray-800
            border-2 border-teal-500 dark:border-teal-600
            rounded-2xl shadow-lg
            p-8
            flex flex-col items-center justify-center
            ${isFlipped ? 'invisible' : 'visible'}
          `}
        >
          <div className="mb-6">
            <Cards size={48} weight="duotone" className="text-teal-600 dark:text-teal-400" />
          </div>

          <div className="text-center space-y-4 w-full">
            <div className="text-xl md:text-2xl font-medium text-gray-900 dark:text-gray-100">
              <MathText>{flashcard.front}</MathText>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onShowAnswer();
              }}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              Näytä vastaus
            </button>
          </div>
        </div>

        {/* Back Side - Answer and explanation */}
        <div
          className={`
            absolute inset-0 backface-hidden rotate-y-180
            bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20
            border-2 border-teal-500 dark:border-teal-600
            rounded-2xl shadow-lg
            p-8
            flex flex-col
            ${isFlipped ? 'visible' : 'invisible'}
          `}
        >
          <div className="mb-4 flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle size={24} weight="fill" />
            <span className="font-semibold">Oikea vastaus:</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {flashcard.back.answer && (
              <div className="mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100 whitespace-pre-line">
                <MathText>{flashcard.back.answer}</MathText>
              </div>
            )}
            {flashcard.back.explanation && (
              <div className="border-t border-teal-200 pt-3 text-base text-gray-800 dark:border-teal-700 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                <MathText>{flashcard.back.explanation}</MathText>
              </div>
            )}
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onShowQuestion();
              }}
              className="inline-flex items-center justify-center rounded-lg border border-teal-500 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-900/20"
            >
              Näytä kysymys
            </button>
          </div>
        </div>
      </div>

      {/* Custom CSS for 3D flip effect */}
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }

        .transform-style-3d {
          transform-style: preserve-3d;
        }

        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
