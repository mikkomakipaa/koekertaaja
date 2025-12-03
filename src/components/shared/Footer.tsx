import { GithubLogo } from '@phosphor-icons/react';

export function Footer() {
  return (
    <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 py-2 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <a
          href="https://github.com/mikkomakipaa/koekertaaja"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <Github className="w-4 h-4" />
          <span className="text-xs font-medium">GitHub</span>
        </a>
      </div>
    </footer>
  );
}
