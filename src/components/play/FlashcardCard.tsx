'use client';

import { Flashcard } from '@/types';
import { MathText } from '@/components/ui/math-text';
import { Cards, CheckCircle } from '@phosphor-icons/react';

interface FlashcardCardProps {
  flashcard: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}

export function FlashcardCard({ flashcard, isFlipped, onFlip }: FlashcardCardProps) {
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
        {/* Front Side - Question */}
        <div
          className={`
            absolute inset-0 backface-hidden
            bg-white dark:bg-gray-800
            border-2 border-purple-500 dark:border-purple-600
            rounded-2xl shadow-lg
            p-8
            flex flex-col items-center justify-center
            ${isFlipped ? 'invisible' : 'visible'}
          `}
        >
          <div className="mb-6">
            <Cards size={48} weight="duotone" className="text-purple-600 dark:text-purple-400" />
          </div>

          <div className="text-center space-y-4 w-full">
            <div className="text-xl md:text-2xl font-medium text-gray-900 dark:text-gray-100">
              <MathText>{flashcard.front}</MathText>
            </div>
          </div>

          <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            Napauta nähdäksesi vastaus
          </div>
        </div>

        {/* Back Side - Answer + Explanation */}
        <div
          className={`
            absolute inset-0 backface-hidden rotate-y-180
            bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20
            border-2 border-purple-500 dark:border-purple-600
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

          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Answer */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="text-lg font-medium text-gray-900 dark:text-gray-100 whitespace-pre-line">
                <MathText>{flashcard.back.answer}</MathText>
              </div>
            </div>

            {/* Explanation */}
            {flashcard.back.explanation && (
              <div>
                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  Selitys:
                </h4>
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  <MathText>{flashcard.back.explanation}</MathText>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            Napauta jatkaaksesi
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
