'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingScreen } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';

function ResetPasswordForm() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase redirects here with #access_token=...&type=recovery
    // The SSR client picks up the fragment and fires PASSWORD_RECOVERY.
    let client: Awaited<ReturnType<typeof import('@/lib/supabase/auth').createBrowserClient>> | null = null;

    async function init() {
      const { createBrowserClient } = await import('@/lib/supabase/auth');
      client = createBrowserClient();

      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setReady(true);
        }
      });

      // Also check if session already exists (user refreshed the page)
      const { data: { session } } = await client.auth.getSession();
      if (session) {
        setReady(true);
      }

      return subscription;
    }

    const subPromise = init();

    return () => {
      subPromise.then((sub) => sub?.unsubscribe());
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Salasanan on oltava vähintään 8 merkkiä pitkä.');
      return;
    }
    if (password !== confirm) {
      setError('Salasanat eivät täsmää.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { createBrowserClient } = await import('@/lib/supabase/auth');
      const supabase = createBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.push('/create');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Salasanan vaihto epäonnistui. Yritä uudelleen.'
      );
      setIsSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <LoadingScreen
        message="Tarkistetaan palautuslinkkiä..."
        className="bg-gradient-to-br from-blue-50 to-indigo-100"
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vaihda salasana</h1>
            <p className="text-gray-600">Syötä uusi salasanasi.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700 px-4 py-3">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password">Uusi salasana</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Vähintään 8 merkkiä"
                required
                disabled={isSubmitting}
                autoFocus
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Vahvista salasana</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isSubmitting}
                className="w-full"
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Vaihdetaan...' : 'Vaihda salasana'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <LoadingScreen
          message="Ladataan..."
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        />
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
