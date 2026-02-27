/**
 * Rate limiter with pluggable backends.
 *
 * Default backend is in-memory. For production shared state, set:
 * - RATE_LIMIT_BACKEND=upstash
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

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

export interface RateLimitBackend {
  kind: 'memory' | 'upstash';
  check(identifier: string, config: RateLimitConfig): Promise<RateLimitResult>;
  reset?(): void;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);
cleanupTimer.unref?.();

function checkRateLimitInMemory(
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

function createMemoryRateLimitBackend(): RateLimitBackend {
  return {
    kind: 'memory',
    async check(identifier: string, config: RateLimitConfig) {
      return checkRateLimitInMemory(identifier, config);
    },
    reset() {
      rateLimitStore.clear();
    },
  };
}

class UpstashRateLimitBackend implements RateLimitBackend {
  kind: 'upstash' = 'upstash';

  constructor(
    private readonly restUrl: string,
    private readonly restToken: string
  ) {}

  private async runPipeline(commands: string[][]): Promise<Array<unknown>> {
    const response = await fetch(`${this.restUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.restToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Upstash pipeline failed: ${response.status}`);
    }

    const data = await response.json() as Array<{ result?: unknown; error?: string }>;

    return data.map((entry) => {
      if (entry.error) {
        throw new Error(`Upstash pipeline command failed: ${entry.error}`);
      }
      return entry.result;
    });
  }

  async check(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const [countRaw, ttlRaw] = await this.runPipeline([
      ['INCR', identifier],
      ['PTTL', identifier],
    ]);

    const parsedCount = Number(countRaw);
    const count = Number.isFinite(parsedCount) ? parsedCount : 0;

    const parsedTtl = Number(ttlRaw);
    let ttl = Number.isFinite(parsedTtl) ? parsedTtl : -1;

    // Key has no expiry yet. Set one matching the configured window.
    if (count <= 1 || ttl < 0) {
      await this.runPipeline([
        ['PEXPIRE', identifier, String(config.windowMs)],
      ]);
      ttl = config.windowMs;
    }

    const reset = now + Math.max(0, ttl);

    return {
      success: count <= config.limit,
      limit: config.limit,
      remaining: Math.max(0, config.limit - count),
      reset,
    };
  }
}

let backendCache: RateLimitBackend | undefined;
let warnedAboutFallback = false;

function createBackendFromEnv(env: NodeJS.ProcessEnv): RateLimitBackend {
  const backend = env.RATE_LIMIT_BACKEND?.toLowerCase();

  if (backend === 'upstash') {
    const restUrl = env.UPSTASH_REDIS_REST_URL;
    const restToken = env.UPSTASH_REDIS_REST_TOKEN;

    if (restUrl && restToken) {
      return new UpstashRateLimitBackend(restUrl, restToken);
    }

    if (!warnedAboutFallback) {
      warnedAboutFallback = true;
      console.warn(
        '[ratelimit] RATE_LIMIT_BACKEND=upstash but missing UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN; falling back to in-memory backend.'
      );
    }
  }

  return createMemoryRateLimitBackend();
}

export function getRateLimitBackend(): RateLimitBackend {
  if (!backendCache) {
    backendCache = createBackendFromEnv(process.env);
  }

  return backendCache;
}

/**
 * Testing helper to inject a custom backend.
 */
export function setRateLimitBackendForTests(backend: RateLimitBackend | undefined) {
  backendCache = backend;
}

/**
 * Check if a request should be rate limited
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const backend = getRateLimitBackend();
  return backend.check(identifier, config);
}

/**
 * Build a stable rate limit key from IP and session/client identifier
 */
export function buildRateLimitKey(identity: RateLimitIdentity): string {
  const sessionPart = identity.userId ?? identity.clientId ?? 'anonymous';
  const prefix = identity.prefix ?? 'global';
  return `${prefix}:${identity.ip}:${sessionPart}`;
}

function normalizeIdentityPart(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

/**
 * Fast non-cryptographic stable hash suitable for abuse fingerprinting.
 */
function stableHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

export interface ServerRateLimitIdentityOptions {
  prefix?: string;
  userId?: string;
}

/**
 * Build a server-derived rate limit key that ignores user-provided client IDs.
 */
export function buildServerRateLimitKey(
  headers: Headers,
  options: ServerRateLimitIdentityOptions = {}
): string {
  const ip = getClientIp(headers);

  const identitySeed = options.userId
    ? `user:${options.userId}`
    : [
        normalizeIdentityPart(headers.get('cookie')),
        normalizeIdentityPart(headers.get('user-agent')),
        normalizeIdentityPart(headers.get('accept-language')),
      ].join('|');

  const identityFingerprint = stableHash(`${ip}|${identitySeed}`);

  return buildRateLimitKey({
    ip,
    userId: `srv-${identityFingerprint}`,
    prefix: options.prefix,
  });
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

  if (backendCache?.kind === 'memory') {
    backendCache.reset?.();
  }

  backendCache = undefined;
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

  const connectingIp = headers.get('cf-connecting-ip');
  if (connectingIp) {
    return connectingIp;
  }

  // Fallback to a default (in development)
  return 'unknown';
}
