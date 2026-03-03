import { GithubLogo } from '@phosphor-icons/react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white/80 py-2 backdrop-blur-sm transition-colors dark:border-gray-700 dark:bg-gray-900/80">
      <div className="mx-auto flex max-w-7xl justify-center px-4">
        <div className="inline-flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
          <a
            href="https://github.com/mikkomakipaa/koekertaaja"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400"
          >
            <GithubLogo weight="duotone" className="h-4 w-4" />
            <span>GitHub</span>
          </a>
          <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">
            /
          </span>
          <span>© Mikko Mäkipää</span>
        </div>
      </div>
    </footer>
  );
}
