import { getSupabaseAdmin } from '@/lib/supabase/admin';

type SchoolSettingsRow = {
  anthropic_key_secret_id: string | null;
  openai_key_secret_id: string | null;
};

export type SchoolApiKeyStatus = {
  anthropic: boolean;
  openai: boolean;
};

export async function getSchoolApiKeyStatus(
  schoolId: string
): Promise<SchoolApiKeyStatus> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('school_settings')
    .select('anthropic_key_secret_id, openai_key_secret_id')
    .eq('school_id', schoolId)
    .maybeSingle<SchoolSettingsRow>();

  if (error) {
    throw error;
  }

  return {
    anthropic: Boolean(data?.anthropic_key_secret_id),
    openai: Boolean(data?.openai_key_secret_id),
  };
}

export function hasAnySchoolApiKey(status: SchoolApiKeyStatus): boolean {
  return status.anthropic || status.openai;
}
