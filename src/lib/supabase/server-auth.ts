import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { isAdmin } from '@/lib/auth/admin';

/**
 * Create a Supabase client for server-side authentication
 * Uses @supabase/ssr to properly handle cookies in Next.js App Router
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createSSRServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Cookie setting can fail in middleware
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        } catch {
          // Cookie removal can fail in middleware
        }
      },
    },
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
export async function requireAuth() {
  const user = await verifyAuth();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Require admin access for API routes
 * Throws error if not authenticated or not an admin
 */
export async function requireAdmin() {
  const user = await requireAuth();

  if (!isAdmin(user.email || '')) {
    throw new Error('Forbidden: Admin access required');
  }

  return user;
}
