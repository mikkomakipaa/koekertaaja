/**
 * Generates a random 6-character alphanumeric code
 * Format: XXXXXX (uppercase letters and numbers)
 */
export function generateCode(): string {
  return Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
}

/**
 * Validates if a code matches the expected format
 */
export function isValidCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}
