import type { Metadata } from 'next';
import { BadgeVisualRegressionPage } from '@/app/dev/visual-regression/badges/BadgeVisualRegressionPage';

export const metadata: Metadata = {
  title: 'Badge Visual Regression',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function BadgeVisualRegressionRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const theme = params.theme === 'dark' ? 'dark' : 'light';

  return <BadgeVisualRegressionPage theme={theme} />;
}
