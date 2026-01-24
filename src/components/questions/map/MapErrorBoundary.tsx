/**
 * MapErrorBoundary - Error boundary for map rendering failures
 * Catches errors in map components and displays user-friendly error message
 */

'use client';

import { Component, ReactNode } from 'react';
import { WarningCircle } from '@phosphor-icons/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Map rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-6">
          <div className="flex items-start gap-3">
            <WarningCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" weight="duotone" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                Kartan lataaminen epäonnistui
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                Karttaa ei voitu näyttää. Yritä päivittää sivu tai käytä tekstivalintaa.
              </p>
              {this.state.error && (
                <details className="text-xs text-red-600 dark:text-red-400">
                  <summary className="cursor-pointer font-medium">Tekninen virhe</summary>
                  <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
