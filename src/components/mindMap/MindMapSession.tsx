'use client';

import { useMemo, useState, type KeyboardEvent } from 'react';
import { CaretDown, Circle } from '@phosphor-icons/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { colors } from '@/lib/design-tokens';
import { buildMindMapTree } from '@/lib/mindMap/buildMindMapTree';
import { applyTopicMasteryToTree } from '@/lib/mindMap/masteryAggregator';
import type { MindMapQuestionInput } from '@/types/mindMap';
import { MindMapCanvas, mindMapZoomBounds } from './MindMapCanvas';
import { MindMapHeader } from './MindMapHeader';
import { MindMapLegend } from './MindMapLegend';

interface MindMapSessionProps {
  questionSetCode: string;
  rootId: string;
  rootLabel: string;
  questions: MindMapQuestionInput[];
  subtitle?: string;
  onBack: () => void;
}

const getMasteryText = (mastery: 'none' | 'partial' | 'mastered') => {
  if (mastery === 'mastered') return 'Hallittu';
  if (mastery === 'partial') return 'Osittain hallittu';
  return 'Ei harjoiteltu';
};

const getMasteryColor = (mastery: 'none' | 'partial' | 'mastered') => {
  if (mastery === 'mastered') return 'text-emerald-600 dark:text-emerald-400';
  if (mastery === 'partial') return 'text-amber-600 dark:text-amber-400';
  return 'text-slate-500 dark:text-slate-400';
};

interface AccessibleTreeProps {
  questionSetCode: string;
  items: ReturnType<typeof applyTopicMasteryToTree>;
  openTopicIds: Set<string>;
  onToggleTopic: (topicId: string) => void;
  onCollapseAll: () => void;
}

function AccessibleTree({ questionSetCode, items, openTopicIds, onToggleTopic, onCollapseAll }: AccessibleTreeProps) {
  const handleTreeKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    onCollapseAll();
  };

  return (
    <ul
      role="tree"
      aria-label={`Aihekartta ${questionSetCode}`}
      onKeyDown={handleTreeKeyDown}
      className="space-y-2"
    >
      {items.children.map((topic) => (
        <li key={topic.id} role="none">
          <button
            type="button"
            role="treeitem"
            aria-label={`${topic.label}, ${topic.questionCount} kysymystä, ${getMasteryText(topic.mastery)}`}
            aria-expanded={topic.children.length > 0 ? openTopicIds.has(topic.id) : undefined}
            aria-controls={`accessible-topic-group-${topic.id}`}
            onClick={() => onToggleTopic(topic.id)}
            className="w-full rounded-md text-left focus-visible:outline-none"
          >
            <span className="font-medium">{topic.label}</span> ({topic.questionCount} kys.) - {getMasteryText(topic.mastery)}
          </button>
          {topic.children.length > 0 ? (
            <ul
              id={`accessible-topic-group-${topic.id}`}
              role="group"
              hidden={!openTopicIds.has(topic.id)}
            >
              {topic.children.map((subtopic) => (
                <li key={subtopic.id} role="treeitem">
                  {subtopic.label} ({subtopic.questionCount} kys.)
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function MindMapSession({
  questionSetCode,
  rootId,
  rootLabel,
  questions,
  subtitle,
  onBack,
}: MindMapSessionProps) {
  const [scale, setScale] = useState(1);
  const [refreshToken, setRefreshToken] = useState(0);
  const [openTopicIds, setOpenTopicIds] = useState<Set<string>>(new Set());

  const baseTree = useMemo(
    () =>
      buildMindMapTree({
        rootId,
        rootLabel,
        questions,
      }),
    [rootId, rootLabel, questions]
  );

  const tree = useMemo(() => applyTopicMasteryToTree(baseTree, questionSetCode), [baseTree, questionSetCode, refreshToken]);

  const hasTopicData = tree.children.length > 0;

  const handleTopicToggle = (topicId: string) => {
    setOpenTopicIds((previous) => {
      const next = new Set(previous);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const handleCollapseAllTopics = () => {
    setOpenTopicIds(new Set());
  };

  const handleTopicButtonKeyDown = (topicId: string, isOpen: boolean, event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Escape' || !isOpen) return;
    event.preventDefault();
    setOpenTopicIds((previous) => {
      if (!previous.has(topicId)) return previous;
      const next = new Set(previous);
      next.delete(topicId);
      return next;
    });
  };

  return (
    <section
      data-testid="mind-map-session"
      className={`mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6 ${colors.map.light}`}
    >
      <MindMapHeader
        title={rootLabel}
        subtitle={subtitle}
        scale={scale}
        onBack={onBack}
        onRefresh={() => setRefreshToken((value) => value + 1)}
        onResetZoom={() => setScale(1)}
      />

      {!hasTopicData ? (
        <Alert>
          <AlertDescription>
            Tähän kokoelmaan ei ole tallennettu aihealueita. Aihekartta näytetään, kun kysymyksillä on topic/subtopic-tiedot.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="hidden md:block">
            <MindMapCanvas
              tree={tree}
              scale={scale}
              onScaleChange={(nextScale) =>
                setScale(Math.max(mindMapZoomBounds.min, Math.min(mindMapZoomBounds.max, nextScale)))
              }
            />
          </div>

          <div className="space-y-2 md:hidden">
            {tree.children.map((topic) => {
              const isOpen = openTopicIds.has(topic.id);
              const topicContentId = `mind-map-mobile-topic-content-${topic.id}`;
              return (
                <article
                  key={topic.id}
                  data-testid={`mind-map-mobile-topic-${topic.id}`}
                  className="rounded-xl border border-violet-200 bg-white p-3 dark:border-violet-800/70 dark:bg-gray-900"
                >
                  <button
                    type="button"
                    onClick={() => handleTopicToggle(topic.id)}
                    onKeyDown={(event) => handleTopicButtonKeyDown(topic.id, isOpen, event)}
                    className="flex min-h-12 w-full items-center justify-between gap-2 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-violet-400 dark:focus-visible:ring-offset-gray-900"
                    aria-expanded={isOpen}
                    aria-controls={topicContentId}
                    aria-label={`${topic.label}, ${topic.questionCount} kysymystä, ${getMasteryText(topic.mastery)}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-base font-semibold text-gray-900 dark:text-gray-100">{topic.label}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{topic.questionCount} kysymystä</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${getMasteryColor(topic.mastery)}`}>{getMasteryText(topic.mastery)}</span>
                      <CaretDown
                        size={18}
                        weight="bold"
                        className={`text-violet-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </span>
                  </button>

                  {isOpen ? (
                    <ul id={topicContentId} className="mt-3 space-y-1 border-t border-violet-100 pt-2 dark:border-violet-900/60">
                      {topic.children.map((subtopic) => (
                        <li key={subtopic.id} className="flex items-center justify-between gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <span className="inline-flex items-center gap-1">
                            <Circle size={8} weight="fill" className="text-slate-400" />
                            {subtopic.label}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-300">{subtopic.questionCount} kys.</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              );
            })}
          </div>
        </>
      )}

      <MindMapLegend />

      <div className="hidden md:block sr-only">
        <AccessibleTree
          questionSetCode={questionSetCode}
          items={tree}
          openTopicIds={openTopicIds}
          onToggleTopic={handleTopicToggle}
          onCollapseAll={handleCollapseAllTopics}
        />
      </div>
    </section>
  );
}
