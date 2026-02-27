import { NextRequest, NextResponse } from 'next/server';
import {
  isMutatingMethod,
  validateCsrfInput,
} from '@/lib/security/csrf-core';

export const CSRF_COOKIE_NAME = 'koekertaaja_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';
export const CSRF_FAILURE_MESSAGE = 'Forbidden: CSRF validation failed';

export function validateCsrfRequest(request: NextRequest): boolean {
  return validateCsrfInput({
    method: request.method,
    requestOrigin: request.nextUrl.origin,
    originHeader: request.headers.get('origin'),
    refererHeader: request.headers.get('referer'),
    cookieToken: request.cookies.get(CSRF_COOKIE_NAME)?.value ?? null,
    headerToken: request.headers.get(CSRF_HEADER_NAME),
  });
}

export function csrfErrorResponse() {
  return NextResponse.json(
    { error: CSRF_FAILURE_MESSAGE },
    { status: 403 }
  );
}
