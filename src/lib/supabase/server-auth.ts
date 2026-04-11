import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/database';
import type { WriteActorContext } from '@/types/questions';
import { isAdmin } from '@/lib/auth/admin';
import { getServerEnv } from '@/lib/env';
import {
  CSRF_FAILURE_MESSAGE,
  validateCsrfRequest,
} from '@/lib/security/csrf';

type CookieStoreAdapter = {
  get(name: string): string | undefined;
  set(name: string, value: string, options: CookieOptions): void;
  remove(name: string, options: CookieOptions): void;
};

type CookieOptions = {
  domain?: string;
  maxAge?: number;
  path?: string;
  sameSite?: 'lax' | 'strict' | 'none' | boolean;
  secure?: boolean;
  httpOnly?: boolean;
  expires?: Date;
};

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: 'unauthorized' | 'forbidden' | 'csrf'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export function resolveAuthError(
  error: unknown,
  messages?: {
    unauthorized?: string;
    forbidden?: string;
  }
): { status: number; message: string } {
  if (error instanceof AuthError) {
    if (error.code === 'csrf') {
      return { status: 403, message: CSRF_FAILURE_MESSAGE };
    }

    if (error.code === 'forbidden') {
      return {
        status: 403,
        message: messages?.forbidden ?? 'Forbidden',
      };
    }

    return {
      status: 401,
      message: messages?.unauthorized ?? 'Unauthorized',
    };
  }

  return {
    status: 401,
    message: messages?.unauthorized ?? 'Unauthorized',
  };
}

/**
 * Create a Supabase client for server-side authentication
 * Uses @supabase/ssr to properly handle cookies in Next.js App Router
 */
export async function createServerClient() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return createSupabaseServerClient({
    get(name) {
      return cookieStore.get(name)?.value;
    },
    set(name, value, options) {
      try {
        cookieStore.set({ name, value, ...options });
      } catch {
        // Cookie setting can fail in some server render contexts.
      }
    },
    remove(name, options) {
      try {
        cookieStore.set({ name, value: '', ...options, maxAge: 0 });
      } catch {
        // Cookie removal can fail in some server render contexts.
      }
    },
  });
}

/**
 * Create a Supabase client for Next.js middleware so auth cookies refresh
 * on every matched request.
 */
export function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  return createSupabaseServerClient({
    get(name) {
      return request.cookies.get(name)?.value;
    },
    set(name, value, options) {
      request.cookies.set({ name, value, ...options });
      response.cookies.set({ name, value, ...options });
    },
    remove(name, options) {
      request.cookies.set({ name, value: '' });
      response.cookies.set({ name, value: '', ...options, maxAge: 0 });
    },
  });
}

export function copyResponseCookies(
  source: NextResponse,
  target: NextResponse
) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
}

function createSupabaseServerClient(cookieAdapter: CookieStoreAdapter) {
  const env = getServerEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return createSSRServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: cookieAdapter,
  });
}

/**
 * Verify that the request is authenticated
 * Returns user if authenticated, null otherwise
 */
export async function verifyAuth() {
  const supabase = await createServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Require authentication for API routes
 * Throws error if not authenticated
 */
export async function requireAuth(request?: NextRequest) {
  if (request && !validateCsrfRequest(request)) {
    throw new AuthError(CSRF_FAILURE_MESSAGE, 403, 'csrf');
  }

  const user = await verifyAuth();

  if (!user) {
    throw new AuthError('Unauthorized', 401, 'unauthorized');
  }

  return user;
}

/**
 * Require admin access for API routes
 * Throws error if not authenticated or not an admin
 */
export async function requireAdmin(request?: NextRequest) {
  const user = await requireAuth(request);

  if (!isAdmin(user.email || '')) {
    throw new AuthError(
      'Forbidden: Admin access required',
      403,
      'forbidden'
    );
  }

  return user;
}

/**
 * Convert an authenticated user to write authorization context.
 */
export function toWriteActorContext(user: {
  id: string;
  email?: string | null;
}): WriteActorContext {
  return {
    userId: user.id,
    isAdmin: isAdmin(user.email ?? ''),
  };
}
