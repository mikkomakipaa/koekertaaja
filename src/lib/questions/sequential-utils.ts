import { SequentialItem, isSequentialItemArray, isStringArray } from '@/types';

export type SequentialDisplayMode = 'list' | 'timeline';

export const normalizeSequentialItems = (items: SequentialItem[] | string[]): SequentialItem[] => {
  if (isSequentialItemArray(items)) {
    return items;
  }
  if (isStringArray(items)) {
    return items.map((text) => ({ text }));
  }
  return [];
};

export const getSequentialDisplayMode = (items: SequentialItem[]): SequentialDisplayMode => {
  return items.some((item) => typeof item.year === 'number') ? 'timeline' : 'list';
};
