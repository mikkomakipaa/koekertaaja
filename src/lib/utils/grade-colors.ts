import { colors } from '@/lib/design-tokens';

/**
 * Valid grade levels supported by the system
 */
export type GradeLevel = 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Grade color configuration
 */
export interface GradeColors {
  bg: string;
  text: string;
  border: string;
  ring: string;
}

/**
 * Get color classes for a grade level
 *
 * Returns color tokens for the specified grade (4-9).
 * If an invalid grade is provided, it clamps to the nearest valid grade.
 *
 * @param grade - Grade level (4-9)
 * @returns Object with bg, text, border, ring classes
 *
 * @example
 * const colors = getGradeColors(5);
 * // Returns: { bg: 'bg-green-100 dark:bg-green-900/30', ... }
 */
export function getGradeColors(grade: number): GradeColors {
  // Clamp grade to valid range (4-9)
  const validGrade = Math.max(4, Math.min(9, grade)) as GradeLevel;
  return colors.grade[validGrade];
}

/**
 * Get combined className string for grade badge styling
 *
 * Combines background, text, and ring styles for a complete badge appearance.
 *
 * @param grade - Grade level (4-9)
 * @returns Combined className string ready for use in components
 *
 * @example
 * <span className={getGradeBadgeClasses(4)}>Luokka: 4</span>
 */
export function getGradeBadgeClasses(grade: number): string {
  const { bg, text } = getGradeColors(grade);
  return `${bg} ${text} ring-1 ring-inset ring-current/20`;
}

/**
 * Get combined className string for grade filter button styling
 *
 * Similar to badge but optimized for interactive button styling.
 *
 * @param grade - Grade level (4-9)
 * @param isSelected - Whether the filter is currently active
 * @returns Combined className string for filter buttons
 *
 * @example
 * <button className={getGradeFilterClasses(5, true)}>5 lk</button>
 */
export function getGradeFilterClasses(grade: number, isSelected = false): string {
  const { bg, text, ring } = getGradeColors(grade);
  const baseClasses = `${bg} ${text}`;
  const selectedClasses = isSelected ? `${ring} ring-2 ring-offset-2` : '';
  return `${baseClasses} ${selectedClasses}`.trim();
}
