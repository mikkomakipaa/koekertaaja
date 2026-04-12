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
      </div>
    </div>
  );
}
