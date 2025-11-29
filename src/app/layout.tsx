import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Koekertaaja',
  description: 'Harjoittele kokeisiin ja opi uutta! Luo AI-pohjaisia kysymyssarjoja ja kerää pisteitä.',
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
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
