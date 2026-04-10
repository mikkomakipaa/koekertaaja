import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.koekertaaja.fi'),
  title: 'Koekertaaja – Kivaa koeharjoittelua',
  description:
    'Harjoittele kokeisiin hauskasti! Luo omista materiaaleista AI-tekoälyn tekemät visat ja muistikortit, kerää pisteitä ja pidä putki käynnissä.',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png' },
    ],
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e0e7ff' },
    { media: '(prefers-color-scheme: dark)', color: '#4f46e5' },
  ],
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
      <body className="flex min-h-full flex-col antialiased">
        <main className="flex-1">
          {children}
        </main>
        <Toaster richColors position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
