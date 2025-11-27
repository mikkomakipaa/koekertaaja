import { Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-2 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <a
          href="https://github.com/mikkomakipaa/koekertaaja"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-gray-600 hover:text-purple-600 transition-colors"
        >
          <Github className="w-4 h-4" />
          <span className="text-xs font-medium">GitHub</span>
        </a>
      </div>
    </footer>
  );
}
