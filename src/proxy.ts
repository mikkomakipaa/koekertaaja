import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';

export function proxy(request: NextRequest) {
  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/generate-questions')) {
    const ip = getClientIp(request.headers);

    // Very strict rate limit: 5 requests per hour (expensive AI operations)
    const rateLimitResult = checkRateLimit(ip, {
      limit: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
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
      );
    }

    // Add rate limit headers to successful requests
    const response = NextResponse.next();
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

    return response;
  }

  // CORS configuration for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'http://localhost:3000',
    ];

    // Block requests from disallowed origins
    if (origin && !allowedOrigins.includes(origin)) {
      return NextResponse.json(
        { error: 'CORS: Origin not allowed' },
        { status: 403 }
      );
    }

    // Allow preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
