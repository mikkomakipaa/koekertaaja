import type { AIProvider } from '@/lib/ai/providerTypes';

export function parseRequestedProvider(rawProvider: FormDataEntryValue | null): AIProvider | undefined {
  if (typeof rawProvider !== 'string') {
    return undefined;
  }
  const normalized = rawProvider.trim().toLowerCase();
  if (normalized === 'anthropic' || normalized === 'openai') {
    return normalized;
  }
  return undefined;
}

export function validateRequestedProvider(provider: AIProvider | undefined): string | null {
  if (provider !== 'openai') {
    return null;
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return 'OpenAI API key puuttuu palvelimen ympäristömuuttujista.';
  }

  return null;
}
