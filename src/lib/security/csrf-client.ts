import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from '@/lib/security/csrf';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const encodedPrefix = `${encodeURIComponent(name)}=`;
  const item = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(encodedPrefix));

  if (!item) {
    return null;
  }

  return decodeURIComponent(item.slice(encodedPrefix.length));
}

function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; SameSite=Strict${secureFlag}`;
}

function createToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getOrCreateCsrfToken(): string {
  const existing = readCookie(CSRF_COOKIE_NAME);
  if (existing) {
    return existing;
  }

  const token = createToken();
  writeCookie(CSRF_COOKIE_NAME, token);
  return token;
}

export function withCsrfHeaders(headers?: HeadersInit): Headers {
  const resolvedHeaders = new Headers(headers);
  resolvedHeaders.set(CSRF_HEADER_NAME, getOrCreateCsrfToken());
  return resolvedHeaders;
}
