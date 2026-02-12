"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import * as Dialog from '@radix-ui/react-dialog';
import {
  CheckCircle,
  X,
  Sparkle,
  ChartBar,
  LightbulbFilament,
  Warning
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { TopicAnalysisResult, EnhancedTopic } from '@/lib/ai/topicIdentifier';

interface TopicWithQuestions extends EnhancedTopic {
  recommendedQuestions: number;
  adjustedQuestions: number;
}

interface TopicConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (totalQuestions: number, topicDistribution: Array<{ topic: string; count: number }>) => void;
  topicAnalysis: TopicAnalysisResult;
  initialQuestionCount?: number;
}

export function TopicConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  topicAnalysis,
  initialQuestionCount = 50
}: TopicConfirmationDialogProps) {
  const [totalQuestions, setTotalQuestions] = useState(initialQuestionCount);
  const [topics, setTopics] = useState<TopicWithQuestions[]>([]);

  // Calculate recommended pool size based on topic analysis
  const calculateRecommendedPoolSize = (): number => {
    if (typeof topicAnalysis.metadata.recommendedQuestionPoolSize === 'number') {
      return Math.max(20, Math.min(200, topicAnalysis.metadata.recommendedQuestionPoolSize));
    }

    const { totalConcepts, completeness } = topicAnalysis.metadata;

    // Base multiplier: 3-5x concepts depending on completeness
    const baseMultiplier = 3 + (completeness * 2); // 3-5x

    // Importance factor: weight high-importance topics
    const highImportanceTopics = topicAnalysis.topics.filter(t => t.importance === 'high').length;
    const importanceFactor = 1 + (highImportanceTopics * 0.1); // Up to 1.5x

    const recommended = Math.round(totalConcepts * baseMultiplier * importanceFactor);

    // Ensure minimum of 30, maximum of 200
    return Math.max(30, Math.min(200, recommended));
  };

  // Initialize topics with recommended question counts
  useEffect(() => {
    if (topicAnalysis && isOpen) {
      const recommendedTotal = calculateRecommendedPoolSize();
      setTotalQuestions(recommendedTotal);

      const topicsWithQuestions = topicAnalysis.topics.map(topic => {
        const baseCount = Math.round(recommendedTotal * topic.coverage);

        // Adjust by importance
        let importanceMultiplier = 1.0;
        if (topic.importance === 'high') importanceMultiplier = 1.2;
        if (topic.importance === 'low') importanceMultiplier = 0.8;

        const recommendedQuestions = Math.round(baseCount * importanceMultiplier);

        return {
          ...topic,
          recommendedQuestions,
          adjustedQuestions: recommendedQuestions
        };
      });

      // Normalize to match total exactly
      const sum = topicsWithQuestions.reduce((acc, t) => acc + t.adjustedQuestions, 0);
      const normalizedTopics = topicsWithQuestions.map(t => ({
        ...t,
        adjustedQuestions: Math.round((t.adjustedQuestions / sum) * recommendedTotal)
      }));

      setTopics(normalizedTopics);
    }
  }, [topicAnalysis, isOpen]);

  // Redistribute when total changes
  const handleTotalChange = (newTotal: number) => {
    setTotalQuestions(newTotal);

    // Redistribute proportionally based on recommended distribution
    const totalRecommended = topics.reduce((acc, t) => acc + t.recommendedQuestions, 0);
    const updatedTopics = topics.map(t => ({
      ...t,
      adjustedQuestions: Math.round((t.recommendedQuestions / totalRecommended) * newTotal)
    }));

    setTopics(updatedTopics);
  };

  // Adjust individual topic
  const handleTopicAdjust = (index: number, newCount: number) => {
    const updated = [...topics];
    updated[index].adjustedQuestions = newCount;

    // Update total to reflect change
    const newTotal = updated.reduce((acc, t) => acc + t.adjustedQuestions, 0);
    setTotalQuestions(newTotal);
    setTopics(updated);
  };

  const handleConfirm = () => {
    const distribution = topics.map(t => ({
      topic: t.name,
      count: t.adjustedQuestions
    }));

    onConfirm(totalQuestions, distribution);
  };

  const actualTotal = topics.reduce((acc, t) => acc + t.adjustedQuestions, 0);
  const totalMismatch = actualTotal !== totalQuestions;

  const getImportanceBadge = (importance: 'high' | 'medium' | 'low') => {
    const config = {
      high: { label: 'Tärkeä', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
      medium: { label: 'Keskitärkeä', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
      low: { label: 'Vähemmän tärkeä', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' }
    };

    const { label, className } = config[importance];
    return <Badge variant="outline" size="sm" className={className}>{label}</Badge>;
  };

  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-3xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                  <Sparkle weight="duotone" className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Aihealueet tunnistettu
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Tarkista ja säädä kysymysmääriä ennen luontia
                  </Dialog.Description>
                </div>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Sulje"
                >
                  <X size={24} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Analysis Summary */}
            <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle weight="fill" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Materiaalin analyysi</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Aihealueita</div>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {topicAnalysis.topics.length}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Käsitteitä</div>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {topicAnalysis.metadata.totalConcepts}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Kattavuus</div>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {Math.round(topicAnalysis.metadata.completeness * 100)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Vaikeustaso</div>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 capitalize">
                    {topicAnalysis.metadata.estimatedDifficulty}
                  </div>
                </div>
              </div>
            </div>

            {/* Total Questions Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <ChartBar weight="duotone" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Kysymysten kokonaismäärä
                </label>
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {totalQuestions}
                </div>
              </div>
              <Slider
                value={[totalQuestions]}
                onValueChange={([value]) => handleTotalChange(value)}
                min={20}
                max={200}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
                <span>20</span>
                <span>200</span>
              </div>
            </div>

            {/* Topic Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <LightbulbFilament weight="duotone" className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Jakautuma aihealueittain
                </h3>
              </div>

              <div className="space-y-3">
                {topics.map((topic, index) => (
                  <div
                    key={topic.name}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {topic.name}
                          </h4>
                          {getImportanceBadge(topic.importance)}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {topic.keywords.slice(0, 3).map((keyword, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Kattavuus: {Math.round(topic.coverage * 100)}%
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {topic.adjustedQuestions}
                        </div>
                        <div className="text-xs text-gray-500">kysymystä</div>
                      </div>
                    </div>

                    {/* Individual topic slider */}
                    <div className="space-y-1">
                      <Slider
                        value={[topic.adjustedQuestions]}
                        onValueChange={([value]) => handleTopicAdjust(index, value)}
                        min={0}
                        max={Math.min(100, totalQuestions)}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
                        <span>Suositus: {topic.recommendedQuestions}</span>
                        {topic.adjustedQuestions !== topic.recommendedQuestions && (
                          <span className="text-amber-600 dark:text-amber-400">
                            (mukautettu)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mismatch Warning */}
            {totalMismatch && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
                <Warning weight="fill" className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900 dark:text-amber-200">
                  <strong>Huomio:</strong> Aihealueiden summa ({actualTotal}) ei vastaa kokonaismäärää ({totalQuestions}).
                  Säädä joko kokonaismäärää tai yksittäisiä aihealueita.
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex gap-3 justify-end">
              <Button onClick={onClose} variant="secondary">
                Peruuta
              </Button>
              <Button
                onClick={handleConfirm}
                variant="primary"
                disabled={totalMismatch}
                className="min-w-[140px]"
              >
                <CheckCircle weight="bold" className="w-4 h-4 mr-2" />
                Vahvista ja luo
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
