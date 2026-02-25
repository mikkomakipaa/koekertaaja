import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Luo kysymyssarja | Koekertaaja',
  description:
    'Luo AI-tekoälyn avulla omia tietovisoja ja muistikortteja opiskelumateriaalista. Nopea ja helppo tapa harjoitella kokeisiin.',
  alternates: {
    canonical: '/create',
  },
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
