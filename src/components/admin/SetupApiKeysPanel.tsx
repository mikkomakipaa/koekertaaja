'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { ApiKeyStatus } from '@/components/admin/ApiKeyStatus';
import { Button } from '@/components/ui/button';

interface SetupApiKeysPanelProps {
  initialAnthropicSet: boolean;
  initialOpenAiSet: boolean;
}

export function SetupApiKeysPanel({
  initialAnthropicSet,
  initialOpenAiSet,
}: SetupApiKeysPanelProps) {
  const [providerStatus, setProviderStatus] = useState({
    anthropic: initialAnthropicSet,
    openai: initialOpenAiSet,
  });

  const hasSavedKey = providerStatus.anthropic || providerStatus.openai;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <ApiKeyStatus
          provider="anthropic"
          onStatusChange={(isSet) =>
            setProviderStatus((current) => ({ ...current, anthropic: isSet }))
          }
        />
        <ApiKeyStatus
          provider="openai"
          onStatusChange={(isSet) =>
            setProviderStatus((current) => ({ ...current, openai: isSet }))
          }
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Jatka seuraavaan vaiheeseen
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Voit siirtyä luomaan harjoituksia heti, kun vähintään yksi API-avain on tallennettu.
            </p>
          </div>

          <Button asChild disabled={!hasSavedKey}>
            <Link href="/create" aria-disabled={!hasSavedKey} tabIndex={hasSavedKey ? 0 : -1}>
              Siirry luontiin
              <ArrowRight className="h-4 w-4" weight="duotone" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
