import { createElement } from 'react';
import {
  Sparkle,
  Fire,
  Barbell,
  Target,
  Star,
  Rocket,
  Lightning,
  Palette,
  Trophy,
} from '@phosphor-icons/react';
import { type BadgeId } from '@/types';

/**
 * Get Phosphor icon for a badge based on its ID.
 */
export const getBadgeIcon = (badgeId: BadgeId, size: number = 32) => {
  const iconMap: Record<BadgeId, ReturnType<typeof createElement>> = {
    first_session: createElement(Sparkle, { size, weight: 'fill', className: 'inline' }),
    '5_sessions': createElement(Fire, { size, weight: 'duotone', className: 'inline' }),
    '10_sessions': createElement(Barbell, { size, weight: 'bold', className: 'inline' }),
    '25_sessions': createElement(Trophy, { size, weight: 'duotone', className: 'inline' }),
    perfect_score: createElement(Star, { size, weight: 'fill', className: 'inline' }),
    nopea_tarkka: createElement(Target, { size, weight: 'duotone', className: 'inline' }),
    beat_personal_best: createElement(Rocket, { size, weight: 'duotone', className: 'inline' }),
    speed_demon: createElement(Lightning, { size, weight: 'fill', className: 'inline' }),
    tried_both_levels: createElement(Palette, { size, weight: 'duotone', className: 'inline' }),
    streak_3: createElement(Fire, { size, weight: 'duotone', className: 'inline' }),
    streak_5: createElement(Fire, { size, weight: 'fill', className: 'inline' }),
    streak_10: createElement(Fire, { size, weight: 'fill', className: 'inline text-orange-600' }),
  };

  return iconMap[badgeId] ?? createElement(Star, { size, weight: 'regular', className: 'inline' });
};

/**
 * Get Tailwind color classes for a badge based on its category.
 */
export const getBadgeColors = (badgeId: string) => {
  if (['first_session', '5_sessions', '10_sessions', '25_sessions'].includes(badgeId)) {
    return {
      light: 'from-indigo-50 to-indigo-100 border-indigo-500',
      dark: 'dark:from-indigo-900/30 dark:to-indigo-800/20 dark:border-indigo-600',
      text: 'text-indigo-900 dark:text-indigo-100',
    };
  }

  if (['perfect_score', 'nopea_tarkka', 'beat_personal_best'].includes(badgeId)) {
    return {
      light: 'from-amber-50 to-amber-100 border-amber-500',
      dark: 'dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-600',
      text: 'text-amber-900 dark:text-amber-100',
    };
  }

  if (badgeId === 'speed_demon') {
    return {
      light: 'from-cyan-50 to-cyan-100 border-cyan-500',
      dark: 'dark:from-cyan-900/30 dark:to-cyan-800/20 dark:border-cyan-600',
      text: 'text-cyan-900 dark:text-cyan-100',
    };
  }

  if (badgeId === 'tried_both_levels') {
    return {
      light: 'from-teal-50 to-teal-100 border-teal-500',
      dark: 'dark:from-teal-900/30 dark:to-teal-800/20 dark:border-teal-600',
      text: 'text-teal-900 dark:text-teal-100',
    };
  }

  if (['streak_3', 'streak_5', 'streak_10'].includes(badgeId)) {
    return {
      light: 'from-orange-50 to-red-100 border-orange-400',
      dark: 'dark:from-orange-900 dark:to-red-900 dark:border-orange-600',
      text: 'text-orange-900 dark:text-orange-100',
    };
  }

  return {
    light: 'from-gray-50 to-gray-100 border-gray-400',
    dark: 'dark:from-gray-800 dark:to-gray-700 dark:border-gray-700',
    text: 'text-gray-900 dark:text-gray-100',
  };
};
