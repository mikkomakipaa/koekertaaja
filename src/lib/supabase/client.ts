import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { getPublicEnv } from '@/lib/env';

// Lazy initialization to avoid errors during build time when env vars might not be set
let supabaseInstance: SupabaseClient<Database> | null = null;

function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const env = getPublicEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

// Export as a getter to maintain backward compatibility
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient<Database>];
  }
});
