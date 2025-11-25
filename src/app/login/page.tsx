'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signIn, error: authError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = searchParams.get('redirect') || '/create';

  // Redirect if already logged in
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ladataan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Kirjaudu sisään
            </h1>
            <p className="text-gray-600">
              Pääsy koealueiden luomiseen
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {(error || authError) && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">{error || authError}</p>
              </div>
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
              <Label htmlFor="password">Salasana</Label>
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

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Kirjaudutaan...' : 'Kirjaudu sisään'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Vain admin-käyttäjät voivat kirjautua sisään
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-gray-600"
          >
            ← Takaisin etusivulle
          </Button>
        </div>
      </div>
    </div>
  );
}
