'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingScreen } from '@/components/ui/loading';
import { PageTitle } from '@/components/ui/page-title';
import { AppHeader } from '@/components/shared/AppHeader';
import { getAllSchools } from '@/lib/supabase/schools';
import { createBrowserClient } from '@/lib/supabase/auth';
import { useAuth } from '@/hooks/useAuth';
import { School } from '@/types';

interface FormState {
  registrationToken: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  schoolId: string;
}

const initialFormState: FormState = {
  registrationToken: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  schoolId: '',
};

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/create');
    }
  }, [loading, router, user]);

  useEffect(() => {
    let isCancelled = false;

    const loadSchools = async () => {
      setIsLoadingSchools(true);

      try {
        const availableSchools = await getAllSchools();

        if (isCancelled) {
          return;
        }

        setSchools(availableSchools);
        setForm((current) => ({
          ...current,
          schoolId:
            current.schoolId || availableSchools[0]?.id || '',
        }));
      } catch {
        if (!isCancelled) {
          setSchools([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSchools(false);
        }
      }
    };

    loadSchools();

    return () => {
      isCancelled = true;
    };
  }, []);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Salasanat eivät täsmää');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationToken: form.registrationToken,
          name: form.name,
          email: form.email,
          password: form.password,
          schoolId: form.schoolId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(typeof result?.error === 'string' ? result.error : 'Rekisteröityminen epäonnistui');
        return;
      }

      const supabase = createBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push('/create');
      router.refresh();
    } catch {
      setError('Rekisteröityminen epäonnistui');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Ladataan..." className="bg-gradient-to-br from-sky-50 to-cyan-100" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-100">
      <AppHeader
        title="Rekisteröidy pääkäyttäjäksi"
        subtitle="Luo pääkäyttäjätili tällä lomakkeella."
        hideSignupLink
      />
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <Card variant="standard" padding="none" className="rounded-2xl border-slate-200 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/95">
          <CardContent className="p-8">
          <CardHeader className="mb-8 px-0 pt-0 text-center">
            <PageTitle as="h2" className="text-3xl text-slate-900 dark:text-slate-100 max-[480px]:text-[28px]">
              Rekisteröidy pääkäyttäjäksi
            </PageTitle>
            <p className="mt-2 text-sm text-slate-600">
              Luo pääkäyttäjätili tällä lomakkeella.
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-700">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="registrationToken">Rekisteröitymiskoodi</Label>
                <Input
                  id="registrationToken"
                  type="text"
                  value={form.registrationToken}
                  onChange={(event) => updateField('registrationToken', event.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nimi</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Sähköposti</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder=""
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Salasana</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    required
                    minLength={8}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Vahvista salasana</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(event) => updateField('confirmPassword', event.target.value)}
                    required
                    minLength={8}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schoolId">Koulu</Label>
                  <select
                    id="schoolId"
                    value={form.schoolId}
                    onChange={(event) => updateField('schoolId', event.target.value)}
                    required
                    disabled={isSubmitting || isLoadingSchools || schools.length === 0}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {schools.length === 0 ? (
                      <option value="">
                        {isLoadingSchools ? 'Ladataan kouluja...' : 'Ei kouluja saatavilla'}
                      </option>
                    ) : null}
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Luodaan tiliä...' : 'Luo tili'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Onko sinulla jo tili?
            {' '}
            <Link href="/login" className="font-medium text-sky-700 underline-offset-4 hover:underline">
              Kirjaudu sisään
            </Link>
          </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
