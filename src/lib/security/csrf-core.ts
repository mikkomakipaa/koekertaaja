export interface CsrfValidationInput {
  method: string;
  requestOrigin: string;
  originHeader: string | null;
  refererHeader: string | null;
  cookieToken: string | null;
  headerToken: string | null;
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function isMutatingMethod(method: string): boolean {
  return MUTATING_METHODS.has(method.toUpperCase());
}

function parseUrl(value: string | null): URL | null {
  if (!value) return null;

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function hasValidOriginOrReferer(input: CsrfValidationInput): boolean {
  const origin = parseUrl(input.originHeader);
  if (origin) {
    return origin.origin === input.requestOrigin;
  }

  const referer = parseUrl(input.refererHeader);
  if (!referer) {
    return false;
  }

  return referer.origin === input.requestOrigin;
}

function hasValidCsrfToken(input: CsrfValidationInput): boolean {
  if (!input.cookieToken || !input.headerToken) {
    return false;
  }

  return input.cookieToken === input.headerToken;
}

export function validateCsrfInput(input: CsrfValidationInput): boolean {
  if (!isMutatingMethod(input.method)) {
    return true;
  }

  return hasValidOriginOrReferer(input) && hasValidCsrfToken(input);
}
