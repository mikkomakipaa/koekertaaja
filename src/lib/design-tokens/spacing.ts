/**
 * Spacing design tokens (4px grid system)
 * Usage: <div className={spacing.cardStandard}>
 */
export const spacing = {
  // Container padding
  cardCompact: 'p-4',
  cardStandard: 'p-5',
  cardLarge: 'p-6',
  modalPadding: 'p-6',

  // Responsive container padding
  pageX: 'px-4 md:px-6',
  pageY: 'py-6 md:py-12',
  pageXY: 'px-4 md:px-6 py-6 md:py-12',

  // Gaps (flex/grid spacing)
  gapTight: 'gap-2', // 8px
  gapStandard: 'gap-3', // 12px
  gapGenerous: 'gap-4', // 16px
  gapLarge: 'gap-6', // 24px

  // Vertical spacing (stack)
  stackTight: 'space-y-2',
  stackStandard: 'space-y-4',
  stackGenerous: 'space-y-6',

  // Margins (use sparingly, prefer gap)
  mb2: 'mb-2',
  mb3: 'mb-3',
  mb4: 'mb-4',
  mb6: 'mb-6',

  // Touch targets
  touchTarget: 'min-h-11', // 44px minimum
  touchTargetLarge: 'min-h-12', // 48px
} as const;

export type SpacingToken = keyof typeof spacing;
