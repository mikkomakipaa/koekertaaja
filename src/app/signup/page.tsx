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

type Provider = 'anthropic' | 'openai';

interface FormState {
  registrationToken: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  schoolId: string;
  provider: Provider;
  apiKey: string;
}

const initialFormState: FormState = {
  registrationToken: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  schoolId: '',
  provider: 'openai',
  apiKey: '',
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
          provider: form.provider,
          apiKey: form.apiKey,
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
                  type="password"
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

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="provider">AI-palvelu</Label>
                  <select
                    id="provider"
                    value={form.provider}
                    onChange={(event) => updateField('provider', event.target.value as Provider)}
                    disabled={isSubmitting}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="anthropic">Anthropic</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API-avain</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={form.apiKey}
                    onChange={(event) => updateField('apiKey', event.target.value)}
                    required
                    minLength={10}
                    disabled={isSubmitting}
                  />
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

        <Card variant="standard" className="mt-6 border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80">
          <CardContent className="p-6">
          <PageTitle as="h2" className="mb-1 text-base text-slate-700 dark:text-slate-100 max-[480px]:text-base">
            Mistä saan API-avaimen?
          </PageTitle>
          <p className="mb-4 text-xs text-slate-500">
            API-avain on henkilökohtainen tunniste, jolla Koekertaaja saa luvan käyttää tekoälypalvelua sinun puolestasi. Käyttö veloitetaan suoraan omalta tililtäsi palveluntarjoajan hinnaston mukaan — ei Koekertaajalta.
          </p>

          <div className="space-y-5 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-800">OpenAI (suositeltu)</p>
              <ol className="mt-2 space-y-1.5 pl-4" style={{ listStyleType: 'decimal' }}>
                <li>Mene osoitteeseen <span className="font-mono text-xs text-slate-800">platform.openai.com</span> ja luo tili tai kirjaudu sisään.</li>
                <li>Uudet tilit saavat yleensä pienen ilmaisen käyttökiintiön. Jatkuvaan käyttöön tarvitset maksutavan: klikkaa oikeasta yläkulmasta profiilisi nimeä → <span className="italic">Billing</span> → <span className="italic">Add payment method</span>.</li>
                <li>Siirry kohtaan <span className="italic">API keys</span> (valikosta tai osoitteesta <span className="font-mono text-xs text-slate-800">platform.openai.com/api-keys</span>).</li>
                <li>Klikkaa <span className="italic">Create new secret key</span>, anna avaimelle nimi (esim. "Koekertaaja") ja klikkaa <span className="italic">Create secret key</span>.</li>
                <li>Kopioi avain heti — se näytetään vain tässä hetkessä. Avain alkaa merkinnällä <span className="font-mono text-xs text-slate-800">sk-</span>.</li>
              </ol>
              <p className="mt-2 text-xs text-slate-500">
                Voit asettaa kuukausittaisen käyttörajan kohdassa <span className="italic">Billing → Usage limits</span>, jotta kulut pysyvät hallinnassa.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-800">Anthropic</p>
              <ol className="mt-2 space-y-1.5 pl-4" style={{ listStyleType: 'decimal' }}>
                <li>Mene osoitteeseen <span className="font-mono text-xs text-slate-800">console.anthropic.com</span> ja luo tili tai kirjaudu sisään.</li>
                <li>Lisää maksutapa: valikosta <span className="italic">Settings → Billing</span> → <span className="italic">Add credit</span>. Anthropic vaatii prepaid-saldon ennen API-käytön aloittamista.</li>
                <li>Siirry kohtaan <span className="italic">API keys</span> vasemmasta valikosta.</li>
                <li>Klikkaa <span className="italic">Create Key</span>, anna avaimelle nimi ja kopioi se heti. Avain alkaa merkinnällä <span className="font-mono text-xs text-slate-800">sk-ant-</span>.</li>
              </ol>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-xs text-amber-800">
              <span className="font-semibold">Tärkeää:</span> Avain tallennetaan salattuna eikä sitä voi enää tarkastella tallennuksen jälkeen. Tallenna avain myös omaan salasananhallintasovellukseesi (esim. 1Password, Bitwarden) — tarvitset sen, jos haluat vaihtaa avaimen myöhemmin.
            </div>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
