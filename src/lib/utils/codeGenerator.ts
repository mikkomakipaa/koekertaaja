import crypto from 'crypto';

/**
 * Generates a cryptographically secure random 6-character alphanumeric code
 * Format: XXXXXX (uppercase letters and numbers)
 * Uses crypto.randomBytes() instead of Math.random() for security
 */
export function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(6);
  let code = '';

  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }

  return code;
}

/**
 * Validates if a code matches the expected format
 */
export function isValidCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}
