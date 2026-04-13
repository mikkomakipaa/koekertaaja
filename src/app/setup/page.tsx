import { redirect } from 'next/navigation';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { SetupApiKeysPanel } from '@/components/admin/SetupApiKeysPanel';
import { AppHeader } from '@/components/shared/AppHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { getSchoolForUser } from '@/lib/auth/roles';
import { getSchoolApiKeyStatus } from '@/lib/school/apiKeyStatus';
import { verifyAuth } from '@/lib/supabase/server-auth';

export default async function SetupPage() {
  const user = await verifyAuth();

  if (!user) {
    redirect('/login?redirect=/setup');
  }

  const membership = await getSchoolForUser(user.id);
  const apiKeyStatus = membership
    ? await getSchoolApiKeyStatus(membership.school_id)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppHeader
        title="API-avaimet"
        subtitle="Lisää tai vaihda käytössäsi oleva API-avain."
        hideSetupLink
      />
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-5">
        <Card padding="none" className="overflow-hidden border-slate-200 dark:border-slate-800">
          <CardContent className="space-y-4 px-6 py-5">
            <Alert className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
              <WarningCircle className="h-4 w-4" weight="fill" />
              <AlertTitle>API-avainta ei voi näyttää tallennuksen jälkeen</AlertTitle>
              <AlertDescription>
                Jos haluat vaihtaa avaimen, poista nykyinen avain ja tallenna uusi. Avainta ei voi kopioida, viedä tai lukea takaisin käyttöliittymästä.
              </AlertDescription>
            </Alert>

            {membership ? (
              <SetupApiKeysPanel
                initialAnthropicSet={Boolean(apiKeyStatus?.anthropic)}
                initialOpenAiSet={Boolean(apiKeyStatus?.openai)}
              />
            ) : (
              <Alert variant="destructive">
                <AlertTitle>Tiliäsi ei ole liitetty kouluun</AlertTitle>
                <AlertDescription>
                  API-avaimen hallinta vaatii koululiitoksen. Ota yhteyttä ylläpitäjään ennen kuin yrität luoda harjoituksia.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card padding="none" className="overflow-hidden border-slate-200 dark:border-slate-800">
          <CardContent className="px-6 py-5">
            <h2 className="mb-1 text-base font-semibold text-slate-800 dark:text-slate-100">
              Mistä saan API-avaimen?
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              API-avain on henkilökohtainen tunniste, jolla Koekertaaja saa luvan käyttää tekoälypalvelua sinun puolestasi. Käyttö veloitetaan suoraan omalta tililtäsi palveluntarjoajan hinnaston mukaan — ei Koekertaajalta.
            </p>

            <div className="space-y-5 text-sm text-slate-600 dark:text-slate-400">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">OpenAI (suositeltu)</p>
                <ol className="mt-2 space-y-1.5 pl-4" style={{ listStyleType: 'decimal' }}>
                  <li>Mene osoitteeseen <span className="font-mono text-xs text-slate-800 dark:text-slate-300">platform.openai.com</span> ja luo tili tai kirjaudu sisään.</li>
                  <li>Uudet tilit saavat yleensä pienen ilmaisen käyttökiintiön. Jatkuvaan käyttöön tarvitset maksutavan: klikkaa oikeasta yläkulmasta profiilisi nimeä → <span className="italic">Billing</span> → <span className="italic">Add payment method</span>.</li>
                  <li>Siirry kohtaan <span className="italic">API keys</span> (valikosta tai osoitteesta <span className="font-mono text-xs text-slate-800 dark:text-slate-300">platform.openai.com/api-keys</span>).</li>
                  <li>Klikkaa <span className="italic">Create new secret key</span>, anna avaimelle nimi (esim. &quot;Koekertaaja&quot;) ja klikkaa <span className="italic">Create secret key</span>.</li>
                  <li>Kopioi avain heti — se näytetään vain tässä hetkessä. Avain alkaa merkinnällä <span className="font-mono text-xs text-slate-800 dark:text-slate-300">sk-</span>.</li>
                </ol>
              </div>

              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Anthropic</p>
                <ol className="mt-2 space-y-1.5 pl-4" style={{ listStyleType: 'decimal' }}>
                  <li>Mene osoitteeseen <span className="font-mono text-xs text-slate-800 dark:text-slate-300">console.anthropic.com</span> ja luo tili tai kirjaudu sisään.</li>
                  <li>Lisää maksutapa: valikosta <span className="italic">Settings → Billing</span> → <span className="italic">Add credit</span>. Anthropic vaatii prepaid-saldon ennen API-käytön aloittamista.</li>
                  <li>Siirry kohtaan <span className="italic">API keys</span> vasemmasta valikosta.</li>
                  <li>Klikkaa <span className="italic">Create Key</span>, anna avaimelle nimi ja kopioi se heti. Avain alkaa merkinnällä <span className="font-mono text-xs text-slate-800 dark:text-slate-300">sk-ant-</span>.</li>
                </ol>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                <span className="font-semibold">Tärkeää:</span> Avain tallennetaan salattuna eikä sitä voi enää tarkastella tallennuksen jälkeen. Tallenna avain myös omaan salasananhallintasovellukseesi (esim. 1Password, Bitwarden) — tarvitset sen, jos haluat vaihtaa avaimen myöhemmin.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card padding="none" className="overflow-hidden border-slate-200 dark:border-slate-800">
          <CardContent className="px-6 py-5">
            <h2 className="mb-1 text-base font-semibold text-slate-800 dark:text-slate-100">
              Aseta saldoraja — suositeltavaa
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              Saldoraja estää odottamattomat suuret kulut. Suosittelemme asettamaan rajan ennen aktiivista käyttöä.
            </p>

            <div className="space-y-5 text-sm text-slate-600 dark:text-slate-400">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">OpenAI</p>
                <ol className="mt-2 space-y-1.5 pl-4" style={{ listStyleType: 'decimal' }}>
                  <li>Kirjaudu osoitteeseen <span className="font-mono text-xs text-slate-800 dark:text-slate-300">platform.openai.com</span>.</li>
                  <li>Avaa oikeasta yläkulmasta profiilisi → <span className="italic">Billing</span>.</li>
                  <li>Valitse <span className="italic">Usage limits</span>.</li>
                  <li>Aseta <span className="italic">Monthly budget</span> haluamallesi tasolle (esim. 5 €). OpenAI keskeyttää API-käytön automaattisesti, kun raja ylittyy.</li>
                </ol>
              </div>

              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Anthropic</p>
                <ol className="mt-2 space-y-1.5 pl-4" style={{ listStyleType: 'decimal' }}>
                  <li>Kirjaudu osoitteeseen <span className="font-mono text-xs text-slate-800 dark:text-slate-300">console.anthropic.com</span>.</li>
                  <li>Siirry <span className="italic">Settings → Billing</span>.</li>
                  <li>Kohdassa <span className="italic">Spend limits</span> voit asettaa kuukausittaisen enimmäiskulun.</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
