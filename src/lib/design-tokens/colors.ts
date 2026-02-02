/**
 * Color design tokens (mode-specific and semantic)
 * Usage: <button className={colors.quiz.primary}>
 */
export const colors = {
  // Mode colors (Quiz, Study, Review)
  quiz: {
    primary: 'bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-500 dark:to-indigo-400',
    hover: 'hover:from-indigo-700 hover:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-500',
    light: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    ring: 'ring-indigo-500 dark:ring-indigo-400',
  },

  study: {
    primary: 'bg-gradient-to-r from-teal-600 to-teal-500 dark:from-teal-500 dark:to-teal-400',
    hover: 'hover:from-teal-700 hover:to-teal-600 dark:hover:from-teal-600 dark:hover:to-teal-500',
    light: 'bg-teal-50 dark:bg-teal-900/20',
    text: 'text-teal-600 dark:text-teal-400',
    ring: 'ring-teal-500 dark:ring-teal-400',
  },

  review: {
    primary: 'bg-gradient-to-r from-rose-600 to-rose-500 dark:from-rose-500 dark:to-rose-400',
    hover: 'hover:from-rose-700 hover:to-rose-600 dark:hover:from-rose-600 dark:hover:to-rose-500',
    light: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-600 dark:text-rose-400',
    ring: 'ring-rose-500 dark:ring-rose-400',
  },

  // Semantic colors
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-500',
    text: 'text-green-900 dark:text-green-100',
  },

  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-500',
    text: 'text-red-900 dark:text-red-100',
  },

  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-500',
    text: 'text-amber-900 dark:text-amber-100',
  },

  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-500',
    text: 'text-blue-900 dark:text-blue-100',
  },

  // Difficulty colors
  difficulty: {
    helppo: {
      gradient: 'from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600',
      icon: 'text-cyan-400',
      badge: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200',
    },
    normaali: {
      gradient: 'from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700',
      icon: 'text-amber-100',
      badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
    },
  },

  // Grade level colors (4-9)
  grade: {
    4: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-800 dark:text-amber-200',
      border: 'border-amber-600/20',
      ring: 'ring-amber-600',
    },
    5: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-200',
      border: 'border-green-600/20',
      ring: 'ring-green-600',
    },
    6: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-800 dark:text-emerald-200',
      border: 'border-emerald-600/20',
      ring: 'ring-emerald-600',
    },
    7: {
      bg: 'bg-cyan-100 dark:bg-cyan-900/30',
      text: 'text-cyan-800 dark:text-cyan-200',
      border: 'border-cyan-600/20',
      ring: 'ring-cyan-600',
    },
    8: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-200',
      border: 'border-blue-600/20',
      ring: 'ring-blue-600',
    },
    9: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-800 dark:text-purple-200',
      border: 'border-purple-600/20',
      ring: 'ring-purple-600',
    },
  },

  // Borders
  border: {
    standard: 'border-gray-200 dark:border-gray-700',
    frosted: 'border-white/60 dark:border-gray-800',
    subtle: 'border-gray-100 dark:border-gray-800',
  },

  // Backgrounds
  bg: {
    base: 'bg-white dark:bg-gray-900',
    elevated: 'bg-white dark:bg-gray-800',
    subtle: 'bg-gray-50 dark:bg-gray-800',
    frosted: 'bg-white/80 dark:bg-gray-900/70',
  },
} as const;

export type ColorMode = keyof typeof colors;
