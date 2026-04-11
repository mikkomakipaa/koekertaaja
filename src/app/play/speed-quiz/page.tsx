import type { Metadata } from 'next';
import {
  getSpeedQuizModeData,
  SpeedQuizModePageContent,
} from '@/app/play/speed-quiz/speedQuizPageContent';

export const metadata: Metadata = {
  title: 'Aikahaaste | Koekertaaja',
  description: 'Nopea aikahaaste – vastaa 10 kysymykseen 15 sekunnissa. Testaa tietosi ja paranna tulostasi!',
  alternates: {
    canonical: '/play/speed-quiz',
  },
};

export default async function SpeedQuizModePage() {
  const data = await getSpeedQuizModeData();

  return <SpeedQuizModePageContent eligibleSets={data.eligibleSets} ineligibleSets={data.ineligibleSets} />;
}
