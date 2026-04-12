'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Gear, SignIn, SignOut, UserPlus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { PageTitle } from '@/components/ui/page-title';
import { useAuth } from '@/hooks/useAuth';

interface AppHeaderProps {
  title: string;
  subtitle: string;
  hideLoginLink?: boolean;
  hideSignupLink?: boolean;
}

const ACTION_BUTTON_CLASS =
  'h-11 rounded-[14px] border border-black/[0.08] bg-black/[0.02] px-4 text-slate-700 transition-all hover:bg-black/[0.04] hover:text-slate-900 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800';

export function AppHeader({
  title,
  subtitle,
  hideLoginLink = false,
  hideSignupLink = false,
}: AppHeaderProps) {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="mx-auto max-w-4xl px-4 pt-6 md:px-8">
      <section className="border-b border-slate-200/80 pb-4 dark:border-white/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <IconButton
              type="button"
              onClick={() => router.push('/')}
              aria-label="Takaisin etusivulle"
            >
              <ArrowLeft size={20} weight="regular" aria-hidden="true" />
            </IconButton>
            <div className="min-w-0">
              <PageTitle>
                {title}
              </PageTitle>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                {subtitle}
              </p>
            </div>
          </div>

          {!loading && user ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button asChild variant="outline" className={ACTION_BUTTON_CLASS}>
                <Link href="/create">Luo</Link>
              </Button>
              <Button asChild variant="outline" className={ACTION_BUTTON_CLASS}>
                <Link href="/setup">
                  <Gear className="h-5 w-5" weight="duotone" />
                  Asetukset
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleSignOut}
                aria-label="Kirjaudu ulos"
                className="h-11 w-11 shrink-0 rounded-[14px] border border-black/[0.08] bg-black/[0.02] text-slate-700 transition-all hover:bg-black/[0.04] hover:text-slate-900 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <SignOut className="h-5 w-5" weight="duotone" />
              </Button>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              {!hideLoginLink ? (
                <Button asChild variant="outline" className={ACTION_BUTTON_CLASS}>
                  <Link href="/login">
                    <SignIn className="h-5 w-5" weight="duotone" />
                    Kirjaudu
                  </Link>
                </Button>
              ) : null}
              {!hideSignupLink ? (
                <Button asChild className="h-11 rounded-[14px] px-4">
                  <Link href="/signup">
                    <UserPlus className="h-5 w-5" weight="duotone" />
                    Rekisteröidy
                  </Link>
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </header>
  );
}
