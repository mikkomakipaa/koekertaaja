import { GithubLogo } from '@phosphor-icons/react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-slate-50/70 py-4 transition-colors dark:border-slate-800/80 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-4xl justify-center px-4 md:px-8">
        <div className="inline-flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <a
            href="https://github.com/mikkomakipaa/koekertaaja"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-slate-700 dark:hover:text-slate-200"
          >
            <GithubLogo weight="duotone" className="h-4 w-4" />
            <span>GitHub</span>
          </a>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
            /
          </span>
          <span>© Mikko Mäkipää</span>
        </div>
      </div>
    </footer>
  );
}
