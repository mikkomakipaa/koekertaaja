/**
 * Typography design tokens
 * Usage: <h1 className={typography.h1}>Title</h1>
 */
export const typography = {
  // Display (Hero sections, major celebrations)
  display: 'text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100',

  // Headings
  h1: 'text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100',
  h2: 'text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100',
  h3: 'text-lg font-semibold text-gray-900 dark:text-gray-100',
  h4: 'text-base font-semibold text-gray-900 dark:text-gray-100',

  // Body text
  body: 'text-sm md:text-base text-gray-700 dark:text-gray-300',
  bodyLarge: 'text-base md:text-lg text-gray-700 dark:text-gray-300',
  bodySmall: 'text-sm text-gray-600 dark:text-gray-400',

  // Supporting text
  caption: 'text-xs text-gray-500 dark:text-gray-400',
  label: 'text-sm font-medium text-gray-700 dark:text-gray-300',

  // Special
  code: 'font-mono text-sm',
  link: 'text-indigo-600 dark:text-indigo-400 hover:underline',
} as const;

export type TypographyToken = keyof typeof typography;
