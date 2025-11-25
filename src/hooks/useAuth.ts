import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/auth';
import type { User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const supabase = createBrowserClient();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setState({ user: null, loading: false, error: error.message });
      } else {
        setState({ user: session?.user ?? null, loading: false, error: null });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, loading: false, error: null });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
      return { success: false, error: error.message };
    }

    setState({ user: data.user, loading: false, error: null });
    return { success: true, user: data.user };
  };

  const signUp = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
      return { success: false, error: error.message };
    }

    setState({ user: data.user, loading: false, error: null });
    return { success: true, user: data.user };
  };

  const signOut = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { error } = await supabase.auth.signOut();

    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
      return { success: false, error: error.message };
    }

    setState({ user: null, loading: false, error: null });
    return { success: true };
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
  };
}
