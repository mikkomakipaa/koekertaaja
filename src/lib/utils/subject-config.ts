import { createElement, type ReactNode } from 'react';
import { SUBJECTS, SUBJECTS_BY_ID } from '@/config/subjects';
import {
  GlobeHemisphereWest,
  MathOperations,
  Scroll,
  Bank,
  BookOpenText,
  Leaf,
  MapTrifold,
  Translate,
  Atom,
  Flask,
  Plant,
  Star,
  Scales,
  PaintBrush,
  MusicNotes,
  Lightning,
  Scissors,
} from '@phosphor-icons/react';

export interface SubjectIconConfig {
  icon: ReactNode;
  color: string;
}

export interface SubjectConfig {
  icon: ReactNode;
  label: string;
  color: string;
}

const iconProps = { size: 20, weight: 'duotone' as const };

export const subjectIconConfigs: Record<string, SubjectIconConfig> = {
  english: { icon: createElement(GlobeHemisphereWest, iconProps), color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
  swedish: { icon: createElement(Translate, iconProps), color: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400' },
  finnish: { icon: createElement(BookOpenText, iconProps), color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' },
  math: { icon: createElement(MathOperations, iconProps), color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
  physics: { icon: createElement(Atom, iconProps), color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400' },
  chemistry: { icon: createElement(Flask, iconProps), color: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400' },
  biology: { icon: createElement(Leaf, iconProps), color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
  'environmental-studies': { icon: createElement(Plant, iconProps), color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' },
  history: { icon: createElement(Scroll, iconProps), color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
  society: { icon: createElement(Bank, iconProps), color: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
  geography: { icon: createElement(MapTrifold, iconProps), color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' },
  religion: { icon: createElement(Star, iconProps), color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' },
  ethics: { icon: createElement(Scales, iconProps), color: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
  art: { icon: createElement(PaintBrush, iconProps), color: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400' },
  music: { icon: createElement(MusicNotes, iconProps), color: 'bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400' },
  pe: { icon: createElement(Lightning, iconProps), color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
  crafts: { icon: createElement(Scissors, iconProps), color: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' },
};

export const getSubjectConfig = (subject: string): SubjectConfig => {
  // Resolve legacy Finnish names (e.g. 'matematiikka') to canonical subject IDs (e.g. 'math')
  const subjectDef =
    SUBJECTS_BY_ID[subject] ??
    SUBJECTS.find((s) => s.name.toLowerCase() === subject.toLowerCase());

  const canonicalId = subjectDef?.id ?? subject;

  const iconConfig = subjectIconConfigs[canonicalId] ?? {
    icon: createElement(BookOpenText, iconProps),
    color: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  };

  return {
    ...iconConfig,
    label: subjectDef?.name ?? subject,
  };
};
