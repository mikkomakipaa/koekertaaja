import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

/**
 * Client-side Supabase client for authentication
 * Uses @supabase/ssr to properly handle cookies for Next.js
 */
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createSSRBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [cookieName, cookieValue] = cookie.split('=').map(c => c.trim());
          if (cookieName === name) {
            return decodeURIComponent(cookieValue);
          }
        }
        return null;
      },
      set(name: string, value: string, options: any) {
        let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

        if (options?.maxAge) {
          cookie += `; max-age=${options.maxAge}`;
        }
        if (options?.path) {
          cookie += `; path=${options.path}`;
        }
        if (options?.domain) {
          cookie += `; domain=${options.domain}`;
        }
        if (options?.sameSite) {
          cookie += `; samesite=${options.sameSite}`;
        }
        if (options?.secure) {
          cookie += '; secure';
        }

        document.cookie = cookie;
      },
      remove(name: string, options: any) {
        this.set(name, '', { ...options, maxAge: 0 });
      },
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
  if (typeof window !== 'undefined') {
    return null;
  }

  const [{ createServerClient }, { cookies }, { getServerEnv }] =
    await Promise.all([
      import('@supabase/ssr'),
      import('next/headers'),
      import('@/lib/env'),
    ]);

  const cookieStore = await cookies();
  const env = getServerEnv();
  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server components cannot always mutate cookies.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch {
            // Server components cannot always mutate cookies.
          }
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}
