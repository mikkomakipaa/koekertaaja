import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Harjoittele | Koekertaaja',
  description:
    'Selaa ja harjoittele eri aihealueita. Tietovisoja ja muistikortteja äidinkielessä, matematiikassa, englannissa, historiassa ja muissa oppiaineissa.',
  alternates: {
    canonical: '/play',
  },
};

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
