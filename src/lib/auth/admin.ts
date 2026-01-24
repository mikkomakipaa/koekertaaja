/**
 * Admin authentication utilities
 *
 * This module is separated from server-auth to enable testing without Next.js dependencies
 */

/**
 * Check if a user is an admin based on email allowlist
 * Admin emails are configured via ADMIN_EMAILS environment variable (comma-separated)
 */
export function isAdmin(userEmail: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS;

  if (!adminEmails) {
    return false;
  }

  const allowlist = adminEmails
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0);

  return allowlist.includes(userEmail.toLowerCase());
}
