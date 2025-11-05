import { MatchingQuestion, MatchingPair } from '@/types';
import { useState, useEffect } from 'react';
import { shuffleArray } from '@/lib/utils';
import { MathText } from '@/components/ui/math-text';
import { CheckCircle2, XCircle } from 'lucide-react';
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
    setShuffledRights(shuffleArray(question.pairs.map(p => p.right)));
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 font-medium">
        Yhdistä vasen ja oikea puoli klikkaamalla ensin vasenta, sitten oikeaa.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-gray-700 mb-3">Vasen</h4>
          {question.pairs.map((pair) => {
            const isSelected = selectedLeft === pair.left;
            const matchStatus = getMatchStatus(pair.left);

            return (
              <div key={pair.left} className="space-y-1">
                <button
                  onClick={() => handleLeftClick(pair.left)}
                  disabled={showExplanation}
                  className={cn(
                    "w-full p-3 text-left rounded-lg border-2 transition-all",
                    isSelected && "border-blue-500 bg-blue-50",
                    !isSelected && !showExplanation && "border-gray-200 hover:border-blue-300",
                    showExplanation && matchStatus === true && "border-green-500 bg-green-50",
                    showExplanation && matchStatus === false && "border-red-500 bg-red-50",
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
                  <div className="text-xs text-gray-500 pl-2">
                    → <MathText>{userMatches[pair.left]}</MathText>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-gray-700 mb-3">Oikea</h4>
          {shuffledRights.map((right) => {
            const isUsed = Object.values(userMatches).includes(right);

            return (
              <button
                key={right}
                onClick={() => handleRightClick(right)}
                disabled={showExplanation || !selectedLeft}
                className={cn(
                  "w-full p-3 text-left rounded-lg border-2 transition-all",
                  isUsed && "opacity-50",
                  !isUsed && selectedLeft && !showExplanation && "border-gray-300 hover:border-blue-400 hover:bg-blue-50",
                  !selectedLeft && "border-gray-200 cursor-not-allowed",
                  showExplanation && "cursor-default border-gray-200"
                )}
              >
                <MathText>{right}</MathText>
              </button>
            );
          })}
        </div>
      </div>

      {showExplanation && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-bold text-gray-800 mb-2">Oikeat vastaukset:</p>
          <div className="space-y-1">
            {question.pairs.map((pair) => (
              <p key={pair.left} className="text-sm text-gray-700">
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
