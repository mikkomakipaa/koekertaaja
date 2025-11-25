import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

/**
 * Client-side Supabase client for authentication
 * This instance is used for auth operations on the client side
 */
export function createBrowserClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Server-side auth helpers for App Router
 */
export interface AuthUser {
  id: string;
  email: string | undefined;
}

/**
 * Check if user is authenticated (server-side)
 * Returns user if authenticated, null otherwise
 */
export async function getServerUser(): Promise<AuthUser | null> {
  // For now, we'll use a simple approach with cookies
  // In a full implementation, you'd use Next.js cookies() API
  // and validate the session token with Supabase

  // This is a placeholder - we'll implement proper server-side auth
  // using middleware or server components
  return null;
}
