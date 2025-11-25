import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { cookies } from 'next/headers';

/**
 * Create a Supabase client for server-side authentication
 * This uses cookies to maintain session
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        cookie: cookieStore.toString(),
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
