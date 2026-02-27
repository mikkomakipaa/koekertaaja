import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import type { MindMapLayoutNode } from '@/types/mindMap';

interface MindMapNodeProps {
  node: MindMapLayoutNode;
  isFocused?: boolean;
  onFocus?: (nodeId: string) => void;
}

const MASTERY_STYLES = {
  none: 'fill-slate-100 stroke-slate-400 text-slate-800 dark:fill-slate-800 dark:stroke-slate-500 dark:text-slate-100',
  partial: 'fill-amber-100 stroke-amber-500 text-amber-900 dark:fill-amber-900/35 dark:stroke-amber-400 dark:text-amber-100',
  mastered: 'fill-emerald-100 stroke-emerald-500 text-emerald-900 dark:fill-emerald-900/35 dark:stroke-emerald-400 dark:text-emerald-100',
} as const;

const KIND_RADIUS = {
  root: 52,
  branch: 34,
} as const;

const getMasteryLabel = (mastery: MindMapLayoutNode['mastery']) => {
  if (mastery === 'mastered') return 'hallittu';
  if (mastery === 'partial') return 'osittain hallittu';
  return 'ei harjoiteltu';
};

const getVisibleMasteryLabel = (mastery: MindMapLayoutNode['mastery']) => {
  if (mastery === 'mastered') return 'Hallittu';
  if (mastery === 'partial') return 'Osittain';
  return 'Ei harjoit.';
};

const onEnterOrSpace = (event: KeyboardEvent<SVGGElement>, callback: () => void) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  callback();
};

export function MindMapNode({ node, isFocused = false, onFocus }: MindMapNodeProps) {
  const radius = KIND_RADIUS[node.kind];
  const masteryClass = node.kind === 'branch' ? MASTERY_STYLES[node.mastery] : MASTERY_STYLES.none;
  const isInteractive = Boolean(onFocus);

  const action = () => {
    if (!onFocus) return;
    onFocus(node.id);
  };

  return (
    <g
      data-testid={`mind-map-node-${node.id}`}
      className={cn(
        'transition-all duration-150',
        isInteractive && 'cursor-pointer',
        isFocused && 'drop-shadow-[0_0_8px_rgba(139,92,246,0.55)]'
      )}
      transform={`translate(${node.x} ${node.y})`}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? action : undefined}
      onKeyDown={isInteractive ? (event) => onEnterOrSpace(event, action) : undefined}
      aria-label={`${node.label}: ${node.questionCount} kysymystä, hallinta ${getMasteryLabel(node.mastery)}`}
    >
      <circle
        r={radius}
        className={cn(
          'stroke-[2.5] transition-all duration-150',
          masteryClass,
          isFocused && 'stroke-violet-600 dark:stroke-violet-300'
        )}
      />
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        className={cn(
          'pointer-events-none select-none fill-current font-semibold',
          node.kind === 'root' && 'text-[16px]',
          node.kind === 'branch' && 'text-[13px]'
        )}
      >
        {node.label}
      </text>
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        y={radius + 18}
        className="pointer-events-none select-none text-[12px] font-medium fill-slate-700 dark:fill-slate-300"
      >
        {node.questionCount} kys.
      </text>
      {node.kind === 'branch' ? (
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          y={radius + 34}
          className="pointer-events-none select-none text-[10px] font-semibold fill-violet-700 dark:fill-violet-300"
        >
          {getVisibleMasteryLabel(node.mastery)}
        </text>
      ) : null}
    </g>
  );
}
