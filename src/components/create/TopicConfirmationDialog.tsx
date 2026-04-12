"use client";

import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle, ChartBar, LightbulbFilament, Sparkle, X } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calcQuestionsPerTopic } from '@/config/generationConfig';
import { cn } from '@/lib/utils';
import type { EnhancedTopic, TopicAnalysisResult } from '@/lib/ai/topicIdentifier';

interface TopicWithState extends EnhancedTopic {
  selected: boolean;
}

interface TopicConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmedTopics: EnhancedTopic[]) => void;
  topicAnalysis: TopicAnalysisResult;
  mode: 'quiz' | 'flashcard' | 'both';
  examLength: number;
}

interface TopicConfirmationPreview {
  questionsPerTopic: number;
  totalPerMode: number;
  totalCombined: number;
  estimatedRounds: number;
}

function buildTopicSelectionState(topicAnalysis: TopicAnalysisResult): TopicWithState[] {
  return topicAnalysis.topics.map((topic) => ({
    ...topic,
    selected: true,
  }));
}

export function isTopicConfirmationDisabled(selectedTopicCount: number): boolean {
  return selectedTopicCount === 0;
}

export function getTopicConfirmationPreview(
  totalConcepts: number,
  selectedTopicCount: number,
  mode: 'quiz' | 'flashcard' | 'both',
  examLength: number
): TopicConfirmationPreview {
  const questionsPerTopic = selectedTopicCount > 0
    ? calcQuestionsPerTopic(totalConcepts, selectedTopicCount)
    : 0;
  const totalPerMode = selectedTopicCount * questionsPerTopic;

  return {
    questionsPerTopic,
    totalPerMode,
    totalCombined: mode === 'both' ? totalPerMode * 2 : totalPerMode,
    estimatedRounds: examLength > 0
      ? Math.round((totalPerMode / examLength) * 10) / 10
      : 0,
  };
}

export function TopicConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  topicAnalysis,
  mode,
  examLength,
}: TopicConfirmationDialogProps) {
  const [topics, setTopics] = useState<TopicWithState[]>(
    () => buildTopicSelectionState(topicAnalysis)
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTopics(buildTopicSelectionState(topicAnalysis));
  }, [isOpen, topicAnalysis]);

  const selectedTopics = useMemo(
    () => topics.filter((topic) => topic.selected),
    [topics]
  );

  const { questionsPerTopic, totalPerMode, totalCombined, estimatedRounds } =
    getTopicConfirmationPreview(
      topicAnalysis.metadata.totalConcepts,
      selectedTopics.length,
      mode,
      examLength
    );

  const toggleTopic = (topicName: string) => {
    setTopics((currentTopics) =>
      currentTopics.map((topic) =>
        topic.name === topicName
          ? { ...topic, selected: !topic.selected }
          : topic
      )
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedTopics.map(({ selected, ...topic }) => topic));
  };

  const getImportanceBadge = (importance: 'high' | 'medium' | 'low') => {
    const config = {
      high: {
        label: 'Tärkeä',
        className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      },
      medium: {
        label: 'Keskitärkeä',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      },
      low: {
        label: 'Vähemmän tärkeä',
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      },
    };

    const { label, className } = config[importance];
    return (
      <Badge variant="outline" size="sm" className={className}>
        {label}
      </Badge>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[95vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-5 dark:border-gray-700 dark:from-indigo-950/30 dark:to-purple-950/30">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/50">
                  <Sparkle weight="duotone" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Aihealueet tunnistettu
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Tarkista tunnistetut aihealueet ennen luontia
                  </Dialog.Description>
                </div>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Sulje"
                >
                  <X size={24} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/20">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle weight="fill" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Materiaalin analyysi</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
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
                  <div className="text-lg font-bold capitalize text-indigo-600 dark:text-indigo-400">
                    {topicAnalysis.metadata.estimatedDifficulty}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
              <div className="mb-2 flex items-center gap-2">
                <ChartBar weight="duotone" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Luonnin esikatselu</h3>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {selectedTopics.length === 0 ? (
                  'Valitse vähintään yksi aihealue nähdäksesi luonnin arvion.'
                ) : mode === 'both' ? (
                  <>
                    Luodaan <strong>{selectedTopics.length}</strong> × <strong>{questionsPerTopic}</strong>{' '}
                    tietovisa + <strong>{selectedTopics.length}</strong> × <strong>{questionsPerTopic}</strong>{' '}
                    muistikortti = <strong>{totalCombined} yhteensä</strong>
                  </>
                ) : (
                  <>
                    Luodaan <strong>{selectedTopics.length}</strong> aihealuetta ×{' '}
                    <strong>{questionsPerTopic}</strong> kysymystä = <strong>{totalPerMode} kysymystä</strong>{' '}
                    (~<strong>{estimatedRounds}</strong> kierrosta)
                  </>
                )}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <LightbulbFilament weight="duotone" className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Valitse mukaan tulevat aihealueet
                </h3>
              </div>

              <div className="space-y-3">
                {topics.map((topic) => (
                  <button
                    key={topic.name}
                    type="button"
                    onClick={() => toggleTopic(topic.name)}
                    aria-pressed={topic.selected}
                    className={cn(
                      'w-full rounded-lg border p-4 text-left transition-colors',
                      topic.selected
                        ? 'border-indigo-300 bg-white hover:border-indigo-400 dark:border-indigo-700 dark:bg-gray-800/50 dark:hover:border-indigo-600'
                        : 'border-dashed border-gray-200 bg-gray-50/80 opacity-70 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/20 dark:hover:border-gray-600'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={topic.selected}
                        readOnly
                        tabIndex={-1}
                        aria-hidden="true"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {topic.name}
                          </h4>
                          {getImportanceBadge(topic.importance)}
                          {!topic.selected && (
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Ei mukana luonnissa
                            </span>
                          )}
                        </div>
                        <div className="mb-2 flex flex-wrap gap-1">
                          {topic.keywords.slice(0, 3).map((keyword) => (
                            <span
                              key={`${topic.name}-${keyword}`}
                              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-500">
                          <span>Kattavuus: {Math.round(topic.coverage * 100)}%</span>
                          <span>Aliaiheet: {topic.subtopics.length}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedTopics.length === 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                Valitse vähintään yksi aihealue ennen vahvistamista.
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex justify-end gap-3">
              <Button onClick={onClose} variant="secondary">
                Peruuta
              </Button>
              <Button
                onClick={handleConfirm}
                variant="primary"
                disabled={isTopicConfirmationDisabled(selectedTopics.length)}
                className="min-w-[140px]"
              >
                <CheckCircle weight="bold" className="mr-2 h-4 w-4" />
                Vahvista ja luo
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
