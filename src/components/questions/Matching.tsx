import { MatchingQuestion, MatchingPair } from '@/types';
import { useState, useEffect } from 'react';
import { shuffleArray } from '@/lib/utils';
import { MathText } from '@/components/ui/math-text';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface MatchingProps {
  question: MatchingQuestion;
  userMatches: Record<string, string>;
  showExplanation: boolean;
  onMatchChange: (matches: Record<string, string>) => void;
}

export function Matching({
  question,
  userMatches,
  showExplanation,
  onMatchChange,
}: MatchingProps) {
  const [shuffledRights, setShuffledRights] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  useEffect(() => {
    // Shuffle right options once on mount
    if (question.pairs && question.pairs.length > 0) {
      setShuffledRights(shuffleArray(question.pairs.map(p => p.right)));
    }
  }, [question.pairs]);

  const handleLeftClick = (left: string) => {
    if (showExplanation) return;
    setSelectedLeft(left);
  };

  const handleRightClick = (right: string) => {
    if (showExplanation || !selectedLeft) return;

    const newMatches = { ...userMatches, [selectedLeft]: right };
    onMatchChange(newMatches);
    setSelectedLeft(null);
  };

  const getMatchStatus = (left: string) => {
    if (!showExplanation || !userMatches[left]) return null;
    const correctRight = question.pairs.find(p => p.left === left)?.right;
    return userMatches[left] === correctRight;
  };

  // Safety check for empty or missing pairs
  if (!question.pairs || question.pairs.length === 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">Virhe: Kysymyksellä ei ole yhdistettäviä pareja.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
        Yhdistä vasen ja oikea puoli klikkaamalla ensin vasenta, sitten oikeaa.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Vasen</h4>
          {question.pairs.map((pair) => {
            const isSelected = selectedLeft === pair.left;
            const matchStatus = getMatchStatus(pair.left);

            return (
              <div key={pair.left} className="space-y-1">
                <button
                  onClick={() => handleLeftClick(pair.left)}
                  disabled={showExplanation}
                  className={cn(
                    "w-full p-3 text-left rounded-lg border-2 transition-all text-gray-900 dark:text-gray-100",
                    isSelected && "border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400",
                    !isSelected && !showExplanation && "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500",
                    showExplanation && matchStatus === true && "border-green-500 bg-green-50 dark:bg-green-900 dark:border-green-400",
                    showExplanation && matchStatus === false && "border-red-500 bg-red-50 dark:bg-red-900 dark:border-red-400",
                    showExplanation ? "cursor-default" : "cursor-pointer"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      <MathText>{pair.left}</MathText>
                    </span>
                    {showExplanation && matchStatus !== null && (
                      matchStatus ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )
                    )}
                  </div>
                </button>
                {userMatches[pair.left] && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                    → <MathText>{userMatches[pair.left]}</MathText>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Oikea</h4>
          {shuffledRights.map((right) => {
            const isUsed = Object.values(userMatches).includes(right);

            return (
              <button
                key={right}
                onClick={() => handleRightClick(right)}
                disabled={showExplanation || !selectedLeft}
                className={cn(
                  "w-full p-3 text-left rounded-lg border-2 transition-all text-gray-900 dark:text-gray-100",
                  isUsed && "opacity-50",
                  !isUsed && selectedLeft && !showExplanation && "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900",
                  !selectedLeft && "border-gray-200 dark:border-gray-700 cursor-not-allowed",
                  showExplanation && "cursor-default border-gray-200 dark:border-gray-700"
                )}
              >
                <MathText>{right}</MathText>
              </button>
            );
          })}
        </div>
      </div>

      {showExplanation && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Oikeat vastaukset:</p>
          <div className="space-y-1">
            {question.pairs.map((pair) => (
              <p key={pair.left} className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">
                  <MathText>{pair.left}</MathText>
                </span>
                {' → '}
                <span className="font-medium">
                  <MathText>{pair.right}</MathText>
                </span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
