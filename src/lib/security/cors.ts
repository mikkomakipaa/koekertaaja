const CORS_ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
const CORS_ALLOWED_HEADERS = 'Content-Type, Authorization, X-CSRF-Token';
const CORS_MAX_AGE_SECONDS = '86400';
const DEFAULT_ALLOWED_ORIGINS = [
  'https://koekertaaja.vercel.app',
  'http://localhost:3000',
] as const;

export function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getAllowedCorsOrigins(env: NodeJS.ProcessEnv): string[] {
  const configuredOrigins = (env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allOrigins = [
    ...DEFAULT_ALLOWED_ORIGINS,
    env.NEXT_PUBLIC_APP_URL,
    ...configuredOrigins,
  ].filter(Boolean) as string[];

  const normalizedOrigins = new Set<string>();

  for (const origin of allOrigins) {
    const normalized = normalizeOrigin(origin);
    if (normalized) {
      normalizedOrigins.add(normalized);
    }
  }

  return Array.from(normalizedOrigins);
}

export function isAllowedCorsOrigin(
  origin: string | null,
  allowedOrigins: readonly string[]
): origin is string {
  if (!origin) {
    return false;
  }

  const normalized = normalizeOrigin(origin);
  return normalized !== null && allowedOrigins.includes(normalized);
}

export function isSameOriginRequest(
  origin: string | null,
  requestOrigin: string
): boolean {
  if (!origin) {
    return false;
  }

  const normalizedOrigin = normalizeOrigin(origin);
  const normalizedRequestOrigin = normalizeOrigin(requestOrigin);
  if (!normalizedOrigin || !normalizedRequestOrigin) {
    return false;
  }

  return normalizedOrigin === normalizedRequestOrigin;
}

export function buildCorsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': CORS_ALLOWED_METHODS,
    'Access-Control-Allow-Headers': CORS_ALLOWED_HEADERS,
    'Access-Control-Max-Age': CORS_MAX_AGE_SECONDS,
    Vary: 'Origin',
  };
}
