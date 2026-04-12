'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle, CircleNotch, Key, Trash } from '@phosphor-icons/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { withCsrfHeaders } from '@/lib/security/csrf-client';

type Provider = 'anthropic' | 'openai';

type ApiKeyStatusResponse = {
  anthropic: boolean;
  openai: boolean;
};

const PROVIDER_COPY: Record<
  Provider,
  {
    title: string;
    description: string;
    inputPlaceholder: string;
    label: string;
  }
> = {
  anthropic: {
    title: 'Anthropic API-avain',
    description: 'Käytetään Claude-pohjaiseen kysymysten generointiin.',
    inputPlaceholder: 'sk-ant-...',
    label: 'Anthropic API-avain',
  },
  openai: {
    title: 'OpenAI API-avain',
    description: 'Käytetään OpenAI-pohjaiseen kysymysten generointiin.',
    inputPlaceholder: 'sk-...',
    label: 'OpenAI API-avain',
  },
};

interface ApiKeyStatusProps {
  provider: Provider;
  onSaved?: () => void;
  onStatusChange?: (isSet: boolean) => void;
}

export function ApiKeyStatus({ provider, onSaved, onStatusChange }: ApiKeyStatusProps) {
  const copy = PROVIDER_COPY[provider];
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeySet, setIsKeySet] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [lastAction, setLastAction] = useState<'saved' | 'deleted' | null>(null);

  const loadStatus = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/school/api-key', {
        method: 'GET',
        credentials: 'same-origin',
      });
      const payload = (await response.json()) as ApiKeyStatusResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'API-avainstatuksen lataus epäonnistui');
      }

      setIsKeySet(Boolean(payload[provider]));
      onStatusChange?.(Boolean(payload[provider]));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'API-avainstatuksen lataus epäonnistui'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, [provider]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('Anna API-avain.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setLastAction(null);

    try {
      const response = await fetch('/api/school/api-key', {
        method: 'POST',
        headers: withCsrfHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'same-origin',
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'API-avaimen tallennus epäonnistui');
      }

      setApiKey('');
      setLastAction('saved');
      await loadStatus();
      onSaved?.();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'API-avaimen tallennus epäonnistui'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError('');
    setLastAction(null);

    try {
      const response = await fetch('/api/school/api-key', {
        method: 'DELETE',
        headers: withCsrfHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'same-origin',
        body: JSON.stringify({ provider }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'API-avaimen poisto epäonnistui');
      }

      setApiKey('');
      setLastAction('deleted');
      await loadStatus();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'API-avaimen poisto epäonnistui'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      variant="standard"
      padding="none"
      className="overflow-hidden border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
    >
      <CardHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-700 dark:bg-slate-900">
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Key className="h-5 w-5 text-indigo-600 dark:text-indigo-400" weight="duotone" />
          {copy.title}
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          {copy.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 px-6 py-5">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <CircleNotch className="h-4 w-4 animate-spin" />
            Tarkistetaan avaimen tila...
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
            <span className="font-medium text-slate-900 dark:text-slate-100">{copy.title}:</span>{' '}
            {isKeySet ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                asetettu <CheckCircle className="h-4 w-4" weight="fill" />
              </span>
            ) : (
              <span className="text-slate-600 dark:text-slate-400">ei asetettu</span>
            )}
          </div>
        )}

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {lastAction ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-100">
            <AlertDescription>
              {lastAction === 'saved' ? (
                'Avain tallennettu.'
              ) : (
                'Avain poistettu.'
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && isKeySet ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tallennettua avainta ei voi näyttää tai hakea takaisin. Jos haluat vaihtaa sen, poista avain ja tallenna uusi.
            </p>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              <Trash className="h-4 w-4" weight="duotone" />
              {isSubmitting ? 'Poistetaan...' : 'Poista avain'}
            </Button>
          </div>
        ) : null}

        {!isLoading && !isKeySet ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${provider}-provider`}>Palveluntarjoaja</Label>
              <select
                id={`${provider}-provider`}
                value={provider}
                disabled
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value={provider}>
                  {provider === 'anthropic' ? 'Anthropic' : 'OpenAI'}
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${provider}-api-key`}>{copy.label}</Label>
              <Input
                id={`${provider}-api-key`}
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={copy.inputPlaceholder}
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="button"
              mode="neutral"
              variant="primary"
              onClick={handleSave}
              disabled={isSubmitting || !apiKey.trim()}
            >
              {isSubmitting ? 'Tallennetaan...' : 'Tallenna avain'}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
