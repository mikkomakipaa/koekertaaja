/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-based rate limiting (e.g., @upstash/ratelimit)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed
   */
  limit: number;
  /**
   * Time window in milliseconds
   */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimitIdentity {
  ip: string;
  userId?: string;
  clientId?: string;
  prefix?: string;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No entry or expired entry
  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime,
    });

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: resetTime,
    };
  }

  // Entry exists and is still valid
  if (entry.count < config.limit) {
    entry.count++;
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - entry.count,
      reset: entry.resetTime,
    };
  }

  // Rate limit exceeded
  return {
    success: false,
    limit: config.limit,
    remaining: 0,
    reset: entry.resetTime,
  };
}

/**
 * Build a stable rate limit key from IP and session/client identifier
 */
export function buildRateLimitKey(identity: RateLimitIdentity): string {
  const sessionPart = identity.userId ?? identity.clientId ?? 'anonymous';
  const prefix = identity.prefix ?? 'global';
  return `${prefix}:${identity.ip}:${sessionPart}`;
}

/**
 * Build headers for rate limit responses
 */
export function createRateLimitHeaders(
  result: RateLimitResult,
  retryAfterSeconds?: number
): Headers {
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  if (retryAfterSeconds !== undefined) {
    headers.set('Retry-After', String(retryAfterSeconds));
  }
  return headers;
}

/**
 * Reset rate limit store (tests only)
 */
export function resetRateLimitStore() {
  rateLimitStore.clear();
}

/**
 * Get client IP from request headers
 */
export function getClientIp(headers: Headers): string {
  // Check common proxy headers
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default (in development)
  return 'unknown';
}
