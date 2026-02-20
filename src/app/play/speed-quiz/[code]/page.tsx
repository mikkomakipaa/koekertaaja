import Link from 'next/link';
import { WarningCircle, ArrowClockwise } from '@phosphor-icons/react/dist/ssr';
import { SpeedQuizGame } from '@/components/speedQuiz/SpeedQuizGame';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getQuestionSetByCode } from '@/lib/supabase/queries';
import { getSpeedQuizEligibilityMessage, getSpeedQuizEligibleQuestionCount } from '@/lib/utils/speedQuiz';

export const dynamic = 'force-dynamic';

export type SpeedQuizPlayPageParams = Promise<{ code: string }>;

type PageStatus = 'not-found' | 'ineligible' | 'error';

interface SpeedQuizPageErrorViewProps {
  code: string;
  status: PageStatus;
  message: string;
}

async function fetchQuestionSetByCode(code: string) {
  return getQuestionSetByCode(code);
}

function SpeedQuizPageErrorView({ code, status, message }: SpeedQuizPageErrorViewProps) {
  const title =
    status === 'not-found'
      ? 'Kysymyssarjaa ei löytynyt'
      : status === 'ineligible'
        ? 'Sarja ei sovi pika-kokeeseen'
        : 'Lataus epäonnistui';

  return (
    <main className="min-h-screen bg-white px-4 py-10 dark:bg-gray-900">
      <div className="mx-auto w-full max-w-xl">
        <Card variant="frosted" padding="standard">
          <CardContent className="space-y-5 text-center">
            <div className="flex justify-center">
              <WarningCircle size={40} className="text-red-500" weight="duotone" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Koodi: {code.toUpperCase()}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              {status === 'error' && (
                <Button asChild className="gap-2">
                  <Link href={`/play/speed-quiz/${code}`}>
                    <ArrowClockwise size={16} />
                    Yritä uudelleen
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="/play/speed-quiz">Valitse toinen sarja</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/play">Takaisin pelaamaan</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default async function SpeedQuizPlayPage({
  params,
}: {
  params: SpeedQuizPlayPageParams;
}) {
  const { code } = await params;

  try {
    const questionSet = await fetchQuestionSetByCode(code);

    if (!questionSet) {
      return (
        <SpeedQuizPageErrorView
          code={code}
          status="not-found"
          message="Tarkista koodi tai valitse toinen julkaistu kysymyssarja."
        />
      );
    }

    const eligibilityMessage = getSpeedQuizEligibilityMessage(questionSet);
    if (eligibilityMessage) {
      return (
        <SpeedQuizPageErrorView
          code={code}
          status="ineligible"
          message={`${eligibilityMessage}. Aikahaaste vaatii vähintään 10 tietovisakysymystä.`}
        />
      );
    }

    const eligibleQuestionCount = getSpeedQuizEligibleQuestionCount(questionSet.questions);
    if (eligibleQuestionCount < 10) {
      return (
        <SpeedQuizPageErrorView
          code={code}
          status="ineligible"
          message="Aikahaaste vaatii vähintään 10 kysymystä ilman Yhdistä-tehtäviä."
        />
      );
    }

    return <SpeedQuizGame questionSet={questionSet} />;
  } catch {
    return (
      <SpeedQuizPageErrorView
        code={code}
        status="error"
        message="Verkkovirhe tai palveluhäiriö esti kysymyssarjan lataamisen."
      />
    );
  }
}

export { fetchQuestionSetByCode, SpeedQuizPageErrorView };
