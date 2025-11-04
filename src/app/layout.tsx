import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Exam Prepper - Kielikokeen kertaaja',
  description: 'Luo AI-pohjaisia kysymyssarjoja oppimateriaalista ja harjoittele kokeisiin',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
