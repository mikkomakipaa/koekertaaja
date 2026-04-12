import type { AIProvider } from '@/lib/ai/providerTypes';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const MISSING_API_KEY_MESSAGE =
  'API-avainta ei ole asetettu. Lisää avain koulun asetuksissa.';

type SchoolSettingsRow = {
  anthropic_key_secret_id: string | null;
  openai_key_secret_id: string | null;
};

export async function getApiKeyForSchool(
  schoolId: string,
  provider: AIProvider
): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();
  const providerColumn =
    provider === 'anthropic' ? 'anthropic_key_secret_id' : 'openai_key_secret_id';

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from('school_settings')
    .select('anthropic_key_secret_id, openai_key_secret_id')
    .eq('school_id', schoolId)
    .maybeSingle<SchoolSettingsRow>();

  if (settingsError) {
    throw settingsError;
  }

  const secretId = settings?.[providerColumn];
  if (!secretId) {
    throw new Error(MISSING_API_KEY_MESSAGE);
  }

  const { data, error: secretError } = await (supabaseAdmin as any).rpc('get_vault_secret', {
    secret_id: secretId,
  });

  if (secretError) {
    throw secretError;
  }

  const apiKey = typeof data === 'string' ? data.trim() : '';
  if (!apiKey) {
    throw new Error(MISSING_API_KEY_MESSAGE);
  }

  return apiKey;
}
