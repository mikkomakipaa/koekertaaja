import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import {
  buildCorsHeaders,
  getAllowedCorsOrigins,
  isAllowedCorsOrigin,
  isSameOriginRequest,
  normalizeOrigin,
} from '@/lib/security/cors';
import {
  buildContentSecurityPolicy,
  CSP_NONCE_HEADER,
  generateCspNonce,
} from '@/lib/security/csp';

function applySecurityHeaders(
  response: NextResponse,
  cspValue: string,
  nonce: string
): NextResponse {
  response.headers.set('Content-Security-Policy', cspValue);
  response.headers.set(CSP_NONCE_HEADER, nonce);
  return response;
}

export default async function middleware(request: NextRequest) {
  const nonce = generateCspNonce();
  const cspValue = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CSP_NONCE_HEADER, nonce);

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/generate-questions')) {
    if (process.env.NODE_ENV === 'development') {
      return applySecurityHeaders(
        NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        }),
        cspValue,
        nonce
      );
    }

    const ip = getClientIp(request.headers);

    // Very strict rate limit: 5 requests per hour (expensive AI operations)
    const rateLimitResult = await checkRateLimit(ip, {
      limit: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimitResult.success) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            error: 'Too many requests. Please try again later.',
            retryAfter: new Date(rateLimitResult.reset).toISOString(),
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimitResult.limit.toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': rateLimitResult.reset.toString(),
              'Retry-After': Math.ceil(
                (rateLimitResult.reset - Date.now()) / 1000
              ).toString(),
            },
          }
        ),
        cspValue,
        nonce
      );
    }

    // Add rate limit headers to successful requests
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.headers.set(
      'X-RateLimit-Limit',
      rateLimitResult.limit.toString()
    );
    response.headers.set(
      'X-RateLimit-Remaining',
      rateLimitResult.remaining.toString()
    );
    response.headers.set(
      'X-RateLimit-Reset',
      rateLimitResult.reset.toString()
    );

    return applySecurityHeaders(response, cspValue, nonce);
  }

  // CORS configuration for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const requestOrigin = request.nextUrl.origin;
    const normalizedOrigin = normalizeOrigin(origin ?? '');
    const allowedOrigins = getAllowedCorsOrigins(process.env);
    const isAllowedOrigin =
      isSameOriginRequest(origin, requestOrigin) ||
      isAllowedCorsOrigin(origin, allowedOrigins);

    // Same-origin requests typically omit Origin and are allowed by default.
    if (origin && !isAllowedOrigin) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'CORS: Origin not allowed' }, { status: 403 }),
        cspValue,
        nonce
      );
    }

    // Handle OPTIONS preflight requests
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      if (normalizedOrigin) {
        const headers = buildCorsHeaders(normalizedOrigin);
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      }
      return applySecurityHeaders(response, cspValue, nonce);
    }

    // Add CORS headers to all API responses (not just OPTIONS)
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Set CORS headers only for trusted cross-origin requests.
    if (normalizedOrigin) {
      const headers = buildCorsHeaders(normalizedOrigin);
      for (const [key, value] of Object.entries(headers)) {
        response.headers.set(key, value);
      }
    }

    return applySecurityHeaders(response, cspValue, nonce);
  }

  return applySecurityHeaders(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }),
    cspValue,
    nonce
  );
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff|woff2)$).*)',
  ],
};
