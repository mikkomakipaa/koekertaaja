'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingScreen } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AppHeader } from '@/components/shared/AppHeader';
import { PageTitle } from '@/components/ui/page-title';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signIn, error: authError } = useAuth();

  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const redirectTo = searchParams.get('redirect') || '/create';

  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!email || !password) {
      setError('Sähköposti ja salasana ovat pakollisia');
      setIsSubmitting(false);
      return;
    }

    const result = await signIn(email, password);

    if (!result.success) {
      setError(result.error || 'Kirjautuminen epäonnistui');
      setIsSubmitting(false);
    } else {
      router.push(redirectTo);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!email) {
      setError('Sähköpostiosoite on pakollinen');
      setIsSubmitting(false);
      return;
    }

    try {
      const { createBrowserClient } = await import('@/lib/supabase/auth');
      const supabase = createBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setResetSent(true);
    } catch {
      setError('Salasanan palautusviestin lähettäminen epäonnistui. Tarkista sähköpostiosoite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchToForgot = () => {
    setMode('forgot');
    setError('');
    setResetSent(false);
  };

  const switchToLogin = () => {
    setMode('login');
    setError('');
    setResetSent(false);
  };

  if (loading) {
    return <LoadingScreen message="Ladataan..." className="bg-slate-50 dark:bg-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppHeader
        title={mode === 'login' ? 'Kirjaudu sisään' : 'Palauta salasana'}
        subtitle={
          mode === 'login'
            ? 'Pääsy koealueiden luomiseen.'
            : 'Lähetämme sähköpostiin linkin salasanan vaihtamista varten.'
        }
        hideLoginLink
      />
      <div className="flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md">
          <Card variant="standard" padding="none" className="rounded-2xl border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-8">

          {/* ── Login mode ── */}
          {mode === 'login' && (
            <>
              <CardHeader className="mb-8 px-0 pt-0 text-center">
                <PageTitle as="h2" className="text-3xl text-gray-900 dark:text-slate-100 max-[480px]:text-[28px]">
                  Kirjaudu sisään
                </PageTitle>
                <p className="text-gray-600">Pääsy koealueiden luomiseen</p>
              </CardHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                {(error || authError) && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700 px-4 py-3">
                    <AlertDescription>{error || authError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Sähköposti</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nimi@esimerkki.fi"
                    required
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Salasana</Label>
                    <button
                      type="button"
                      onClick={switchToForgot}
                      className="text-xs text-blue-600 hover:underline underline-offset-4"
                    >
                      Unohditko salasanasi?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Kirjaudutaan...' : 'Kirjaudu sisään'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">Vain pääkäyttäjät voivat kirjautua sisään</p>
              </div>
            </>
          )}

          {/* ── Forgot password mode ── */}
          {mode === 'forgot' && (
            <>
              <CardHeader className="mb-8 px-0 pt-0 text-center">
                <PageTitle as="h2" className="text-3xl text-gray-900 dark:text-slate-100 max-[480px]:text-[28px]">
                  Palauta salasana
                </PageTitle>
                <p className="text-gray-600">
                  Lähetämme sinulle sähköpostilinkin salasanan vaihtamiseksi.
                </p>
              </CardHeader>

              {resetSent ? (
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50 text-green-800 px-4 py-3">
                    <AlertDescription>
                      Palautuslinkki lähetetty osoitteeseen <span className="font-medium">{email}</span>. Tarkista myös roskapostikansio.
                    </AlertDescription>
                  </Alert>
                  <Button variant="outline" onClick={switchToLogin} className="w-full">
                    Takaisin kirjautumiseen
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700 px-4 py-3">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Sähköposti</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nimi@esimerkki.fi"
                      required
                      disabled={isSubmitting}
                      className="w-full"
                      autoFocus
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Lähetetään...' : 'Lähetä palautuslinkki'}
                  </Button>

                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="w-full text-sm text-gray-500 hover:text-gray-700 underline-offset-4 hover:underline"
                  >
                    Takaisin kirjautumiseen
                  </button>
                </form>
              )}
            </>
          )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<LoadingScreen message="Ladataan..." className="bg-slate-50 dark:bg-slate-950" />}
    >
      <LoginForm />
    </Suspense>
  );
}
