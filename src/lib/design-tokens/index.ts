/**
 * Design Tokens
 *
 * Centralized design system tokens for consistent styling across the app.
 * These tokens map to the design guidelines in docs/DESIGN_GUIDELINES.md
 *
 * Usage:
 * import { typography, spacing, colors } from '@/lib/design-tokens';
 *
 * <h1 className={typography.h1}>Title</h1>
 * <div className={spacing.cardStandard}>Content</div>
 * <button className={colors.quiz.primary}>Submit</button>
 */
import { typography } from './typography';
import { spacing } from './spacing';

export { typography, type TypographyToken } from './typography';
export { spacing, type SpacingToken } from './spacing';
export { colors, type ColorMode } from './colors';

/**
 * Utility function to combine token classes with additional classes
 *
 * @example
 * const className = combine(typography.h1, 'mb-4', customClass);
 */
export function combine(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Common patterns assembled from tokens
 * Use these for frequently-used combinations
 */
export const patterns = {
  // Page containers
  pageContainer: combine(spacing.pageXY, 'max-w-4xl mx-auto'),

  // Section headers
  sectionHeader: combine(typography.h2, spacing.mb4),

  // Card with standard styling
  cardBase: 'rounded-xl transition-shadow duration-150',
  cardInteractive: combine(
    'rounded-xl',
    spacing.cardStandard,
    'hover:shadow-md transition-shadow duration-150'
  ),

  // Focus rings
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',

  // Transitions
  transition: {
    all: 'transition-all duration-150',
    colors: 'transition-colors duration-150',
    shadow: 'transition-shadow duration-150',
    transform: 'transition-transform duration-150',
  },
} as const;
