import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.koekertaaja.fi'),
  title: 'Koekertaaja – Kivaa koeharjoittelua 4-6-luokkalaisille',
  description:
    'Harjoittele kokeisiin hauskasti! Luo omista materiaaleista AI-tekoälyn tekemät visat ja muistikortit, kerää pisteitä ja pidä putki käynnissä.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Koekertaaja – Kivaa koeharjoittelua 4-6-luokkalaisille',
    description:
      'Harjoittele kokeisiin hauskasti! Luo omista materiaaleista AI-tekoälyn tekemät visat ja muistikortit, kerää pisteitä ja pidä putki käynnissä.',
    url: '/',
    siteName: 'Koekertaaja',
    locale: 'fi_FI',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fi" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} flex flex-col h-full`}>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
