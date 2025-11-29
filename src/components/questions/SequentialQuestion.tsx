'use client';

import { useState, useEffect } from 'react';
import { SequentialQuestion as SequentialQuestionType } from '@/types';
import { Button } from '@/components/ui/button';
import { MathText } from '@/components/ui/math-text';
import { ArrowUp, ArrowDown, ListNumbers, CheckCircle, XCircle } from '@phosphor-icons/react';

interface SequentialQuestionProps {
  question: SequentialQuestionType;
  userAnswer: number[] | null;
  showExplanation: boolean;
  onAnswerChange: (answer: number[]) => void;
}

export function SequentialQuestion({
  question,
  userAnswer,
  showExplanation,
  onAnswerChange,
}: SequentialQuestionProps) {
  // State: current order of items (indices)
  const [currentOrder, setCurrentOrder] = useState<number[]>([]);

  // Initialize: shuffle items on mount or use userAnswer if it exists
  useEffect(() => {
    if (userAnswer && userAnswer.length > 0) {
      setCurrentOrder(userAnswer);
    } else {
      // Fisher-Yates shuffle
      const indices = question.items.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setCurrentOrder(indices);
      onAnswerChange(indices); // Set initial answer
    }
  }, [question.items]);

  // Move item up
  const moveUp = (index: number) => {
    if (index === 0 || showExplanation) return;
    const newOrder = [...currentOrder];
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    setCurrentOrder(newOrder);
    onAnswerChange(newOrder);
  };

  // Move item down
  const moveDown = (index: number) => {
    if (index === currentOrder.length - 1 || showExplanation) return;
    const newOrder = [...currentOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setCurrentOrder(newOrder);
    onAnswerChange(newOrder);
  };

  // Get item status (correct position / incorrect position / not submitted yet)
  const getItemStatus = (index: number): 'correct' | 'incorrect' | 'pending' => {
    if (!showExplanation) return 'pending';
    return currentOrder[index] === question.correct_order[index] ? 'correct' : 'incorrect';
  };

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <div className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-start gap-2">
        <ListNumbers size={24} weight="duotone" className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
        <MathText>{question.question_text}</MathText>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {currentOrder.map((itemIndex, displayIndex) => {
          const status = getItemStatus(displayIndex);
          const item = question.items[itemIndex];

          return (
            <div
              key={`${itemIndex}-${displayIndex}`}
              className={`
                flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                ${status === 'correct' ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600' : ''}
                ${status === 'incorrect' ? 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-600' : ''}
                ${status === 'pending' ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600' : ''}
              `}
            >
              {/* Position Number */}
              <div
                className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                  ${status === 'correct' ? 'bg-green-500 dark:bg-green-600 text-white' : ''}
                  ${status === 'incorrect' ? 'bg-red-500 dark:bg-red-600 text-white' : ''}
                  ${status === 'pending' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' : ''}
                `}
              >
                {displayIndex + 1}
              </div>

              {/* Item Text */}
              <div className="flex-1 text-gray-900 dark:text-gray-100">
                <MathText>{item}</MathText>
              </div>

              {/* Status Icon (after submission) */}
              {showExplanation && (
                <div className="flex-shrink-0">
                  {status === 'correct' ? (
                    <CheckCircle size={24} weight="fill" className="text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle size={24} weight="fill" className="text-red-600 dark:text-red-400" />
                  )}
                </div>
              )}

              {/* Arrow Controls (before submission) */}
              {!showExplanation && (
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => moveUp(displayIndex)}
                    disabled={displayIndex === 0}
                    className={`
                      p-1.5 rounded transition-colors
                      ${displayIndex === 0
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                      }
                    `}
                    aria-label="Move up"
                  >
                    <ArrowUp size={20} weight="bold" />
                  </button>
                  <button
                    onClick={() => moveDown(displayIndex)}
                    disabled={displayIndex === currentOrder.length - 1}
                    className={`
                      p-1.5 rounded transition-colors
                      ${displayIndex === currentOrder.length - 1
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                      }
                    `}
                    aria-label="Move down"
                  >
                    <ArrowDown size={20} weight="bold" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Correct Order Display (after wrong answer) */}
      {showExplanation && JSON.stringify(currentOrder) !== JSON.stringify(question.correct_order) && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-600 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Oikea järjestys:</h4>
          <ol className="space-y-2">
            {question.correct_order.map((itemIndex, position) => (
              <li key={position} className="flex items-start gap-2 text-blue-900 dark:text-blue-100">
                <span className="font-bold">{position + 1}.</span>
                <MathText>{question.items[itemIndex]}</MathText>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
