export type ProviderPreference = 'anthropic' | 'openai';

export const CREATE_PROVIDER_OPTIONS: Array<{
  value: ProviderPreference;
  label: string;
  description: string;
}> = [
  {
    value: 'anthropic',
    label: 'Claude',
    description: 'Käyttää valmiiksi määriteltyjä Claude-malleja tehtäväkohtaisesti.',
  },
  {
    value: 'openai',
    label: 'OpenAI',
    description: 'Käyttää valmiiksi määriteltyjä OpenAI-malleja tehtäväkohtaisesti.',
  },
];

export const DEFAULT_CREATE_PROVIDER: ProviderPreference = 'openai';

export const DEFAULT_CREATE_PROVIDER_LABEL =
  CREATE_PROVIDER_OPTIONS.find((option) => option.value === DEFAULT_CREATE_PROVIDER)?.label ?? 'OpenAI';

export function appendProviderPreference(
  formData: FormData,
  providerPreference: ProviderPreference = DEFAULT_CREATE_PROVIDER
): FormData {
  formData.set('provider', providerPreference);
  return formData;
}
