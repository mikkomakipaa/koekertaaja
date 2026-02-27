import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.koekertaaja.fi'),
  title: 'Koekertaaja – Kivaa koeharjoittelua',
  description:
    'Harjoittele kokeisiin hauskasti! Luo omista materiaaleista AI-tekoälyn tekemät visat ja muistikortit, kerää pisteitä ja pidä putki käynnissä.',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.png',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: '9JhD0hqfjr3HYcRFsbZrxRUrkHafo0zXkL3ePvDCmwc',
  },
  openGraph: {
    title: 'Koekertaaja – Kivaa koeharjoittelua',
    description:
      'Harjoittele kokeisiin hauskasti! Luo omista materiaaleista AI-tekoälyn tekemät visat ja muistikortit, kerää pisteitä ja pidä putki käynnissä.',
    url: '/',
    siteName: 'Koekertaaja',
    locale: 'fi_FI',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Koekertaaja – Kivaa koeharjoittelua',
    description:
      'Harjoittele kokeisiin hauskasti! Luo omista materiaaleista AI-tekoälyn tekemät visat ja muistikortit, kerää pisteitä ja pidä putki käynnissä.',
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
        <Toaster richColors position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
