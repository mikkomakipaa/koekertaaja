/**
 * Admin authentication utilities
 *
 * This module is separated from server-auth to enable testing without Next.js dependencies
 */
import { getServerEnv } from '@/lib/env';

/**
 * Check if a user is an admin based on email allowlist
 * Admin emails are configured via ADMIN_EMAILS environment variable (comma-separated)
 */
export function isAdmin(userEmail: string): boolean {
  const adminEmails = getServerEnv().ADMIN_EMAILS;

  if (!adminEmails) {
    return false;
  }

  const allowlist = adminEmails
    .split(',')
    .map((email: string) => email.trim().toLowerCase())
    .filter((email: string) => email.length > 0);

  return allowlist.includes(userEmail.toLowerCase());
}
