'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ChartBar, LightbulbFilament, Sparkle } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calcQuestionsPerTopic } from '@/config/generationConfig';
import { cn } from '@/lib/utils';
import type { EnhancedTopic, TopicAnalysisResult } from '@/lib/ai/topicIdentifier';

interface TopicWithState extends EnhancedTopic {
  selected: boolean;
}

interface TopicsConfirmationStepProps {
  onClose: () => void;
  onConfirm: (confirmedTopics: EnhancedTopic[]) => void;
  topicAnalysis: TopicAnalysisResult;
  mode: 'quiz' | 'flashcard' | 'both';
  examLength: number;
}

function buildTopicSelectionState(topicAnalysis: TopicAnalysisResult): TopicWithState[] {
  return topicAnalysis.topics.map((topic) => ({
    ...topic,
    selected: true,
  }));
}

export function TopicsConfirmationStep({
  onClose,
  onConfirm,
  topicAnalysis,
  mode,
  examLength,
}: TopicsConfirmationStepProps) {
  const [topics, setTopics] = useState<TopicWithState[]>(
    () => buildTopicSelectionState(topicAnalysis),
  );

  useEffect(() => {
    setTopics(buildTopicSelectionState(topicAnalysis));
  }, [topicAnalysis]);

  const selectedTopics = useMemo(() => topics.filter((topic) => topic.selected), [topics]);

  const questionsPerTopic =
    selectedTopics.length > 0
      ? calcQuestionsPerTopic(topicAnalysis.metadata.totalConcepts, selectedTopics.length)
      : 0;
  const totalPerMode = selectedTopics.length * questionsPerTopic;
  const totalCombined = mode === 'both' ? totalPerMode * 2 : totalPerMode;
  const estimatedRounds =
    examLength > 0 ? Math.round((totalPerMode / examLength) * 10) / 10 : 0;

  const toggleTopic = (topicName: string) => {
    setTopics((currentTopics) =>
      currentTopics.map((topic) =>
        topic.name === topicName ? { ...topic, selected: !topic.selected } : topic,
      ),
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 dark:border-indigo-800/60 dark:from-indigo-950/30 dark:to-purple-950/30">
        <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/50">
          <Sparkle weight="duotone" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Aihealueet tunnistettu</h2>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
            Tarkista tunnistetut aihealueet ennen luontia
          </p>
        </div>
      </div>

      {/* Material analysis */}
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

      {/* Creation preview */}
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
              Luodaan <strong>{selectedTopics.length}</strong> ×{' '}
              <strong>{questionsPerTopic}</strong> tietovisa +{' '}
              <strong>{selectedTopics.length}</strong> × <strong>{questionsPerTopic}</strong>{' '}
              muistikortti = <strong>{totalCombined} yhteensä</strong>
            </>
          ) : (
            <>
              Luodaan <strong>{selectedTopics.length}</strong> aihealuetta ×{' '}
              <strong>{questionsPerTopic}</strong> kysymystä ={' '}
              <strong>{totalPerMode} kysymystä</strong> (~
              <strong>{estimatedRounds}</strong> kierrosta)
            </>
          )}
        </p>
      </div>

      {/* Topic list */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <LightbulbFilament
            weight="duotone"
            className="h-5 w-5 text-amber-600 dark:text-amber-400"
          />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Valitse mukaan tulevat aihealueet
          </h3>
        </div>

        <div className="space-y-2">
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
                  : 'border-dashed border-gray-200 bg-gray-50/80 opacity-70 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/20 dark:hover:border-gray-600',
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
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{topic.name}</h4>
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

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <Button onClick={onClose} variant="secondary">
          Peruuta
        </Button>
        <Button
          onClick={handleConfirm}
          variant="primary"
          disabled={selectedTopics.length === 0}
          className="min-w-[140px]"
        >
          <CheckCircle weight="bold" className="mr-2 h-4 w-4" />
          Vahvista ja luo
        </Button>
      </div>
    </div>
  );
}
