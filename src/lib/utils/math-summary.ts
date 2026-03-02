function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function formatMathSummary(value: string): string {
  return normalizeWhitespace(
    value
      .replace(/\$\$\s*(-?\d+)\s*\\frac\s*{([^}]*)}\s*{([^}]*)}\s*\$\$/g, '$1 $2/$3')
      .replace(/\$\$\s*\\frac\s*{([^}]*)}\s*{([^}]*)}\s*\$\$/g, '$1/$2')
      .replace(/\$\$/g, '')
      .replace(/\\div/g, '÷')
      .replace(/\\times|\\cdot/g, '·')
      .replace(/\\left|\\right/g, '')
      .replace(/[{}]/g, '')
  );
}
