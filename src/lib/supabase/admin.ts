import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

let adminClient: SupabaseClient<Database> | null = null;

/**
 * Get admin Supabase client with service role key
 * ONLY use this for server-side operations that need to bypass RLS
 * This client has full database access - use with caution!
 *
 * Uses lazy initialization to avoid requiring env vars during build time
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (adminClient) {
    return adminClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables for admin client');
  }

  adminClient = createClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return adminClient;
}
