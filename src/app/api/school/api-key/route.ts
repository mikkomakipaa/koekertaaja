import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSchoolMember } from '@/lib/auth/roles';
import { getSchoolApiKeyStatus } from '@/lib/school/apiKeyStatus';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth, resolveAuthError } from '@/lib/supabase/server-auth';

const upsertSchema = z.object({
  provider: z.enum(['anthropic', 'openai']),
  apiKey: z.string().trim().min(10, 'API-avaimen on oltava vähintään 10 merkkiä pitkä'),
});

const deleteSchema = z.object({
  provider: z.enum(['anthropic', 'openai']),
});

type SchoolSettingsRow = {
  anthropic_key_secret_id: string | null;
  openai_key_secret_id: string | null;
};

function getProviderColumn(provider: 'anthropic' | 'openai') {
  return provider === 'anthropic' ? 'anthropic_key_secret_id' : 'openai_key_secret_id';
}

export async function GET() {
  try {
    const user = await requireAuth();
    const membership = await requireSchoolMember(user.id);
    const status = await getSchoolApiKeyStatus(membership.school_id);

    return NextResponse.json(status);
  } catch (error) {
    const { status, message } = resolveAuthError(error, {
      unauthorized: 'Kirjaudu sisään jatkaaksesi.',
      forbidden: 'Tiliäsi ei ole liitetty kouluun.',
    });

    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'API-avainstatuksen lataus epäonnistui',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const membership = await requireSchoolMember(user.id);
    const payload = upsertSchema.parse(await request.json());
    const supabaseAdmin = getSupabaseAdmin();
    const providerColumn = getProviderColumn(payload.provider);
    const secretName = `${membership.school_id}-${payload.provider}`;
    const { data: existingSettings, error: existingSettingsError } = await supabaseAdmin
      .from('school_settings')
      .select('anthropic_key_secret_id, openai_key_secret_id')
      .eq('school_id', membership.school_id)
      .maybeSingle<SchoolSettingsRow>();

    if (existingSettingsError) {
      throw existingSettingsError;
    }

    const { data: vaultSecretId, error: vaultError } = await (supabaseAdmin as any).rpc('create_vault_secret', {
      secret_value: payload.apiKey,
      secret_name: secretName,
      secret_description: '',
    });

    if (vaultError || !vaultSecretId) {
      throw vaultError ?? new Error('API-avaimen tallennus epäonnistui');
    }

    const { error: settingsError } = await supabaseAdmin
      .from('school_settings')
      .upsert(
        {
          school_id: membership.school_id,
          [providerColumn]: vaultSecretId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'school_id' }
      );

    if (settingsError) {
      await (supabaseAdmin as any).rpc('delete_vault_secret', {
        secret_id: vaultSecretId,
      });
      throw settingsError;
    }

    const previousSecretId = existingSettings?.[providerColumn];
    if (previousSecretId && previousSecretId !== vaultSecretId) {
      await (supabaseAdmin as any).rpc('delete_vault_secret', {
        secret_id: previousSecretId,
      });
    }

    return NextResponse.json({ keySet: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Virheellinen pyyntö' },
        { status: 400 }
      );
    }

    const { status, message } = resolveAuthError(error, {
      unauthorized: 'Kirjaudu sisään jatkaaksesi.',
      forbidden: 'Tiliäsi ei ole liitetty kouluun.',
    });

    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'API-avaimen tallennus epäonnistui',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const membership = await requireSchoolMember(user.id);
    const payload = deleteSchema.parse(await request.json());
    const supabaseAdmin = getSupabaseAdmin();
    const providerColumn = getProviderColumn(payload.provider);

    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('school_settings')
      .select('anthropic_key_secret_id, openai_key_secret_id')
      .eq('school_id', membership.school_id)
      .maybeSingle<SchoolSettingsRow>();

    if (settingsError) {
      throw settingsError;
    }

    const secretId = settings?.[providerColumn];
    if (secretId) {
      const { error: deleteError } = await (supabaseAdmin as any).rpc('delete_vault_secret', {
        secret_id: secretId,
      });

      if (deleteError) {
        throw deleteError;
      }
    }

    if (settings) {
      const { error: updateError } = await supabaseAdmin
        .from('school_settings')
        .update({
          [providerColumn]: null,
          updated_at: new Date().toISOString(),
        })
        .eq('school_id', membership.school_id);

      if (updateError) {
        throw updateError;
      }
    }

    return NextResponse.json({ keySet: false });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Virheellinen pyyntö' },
        { status: 400 }
      );
    }

    const { status, message } = resolveAuthError(error, {
      unauthorized: 'Kirjaudu sisään jatkaaksesi.',
      forbidden: 'Tiliäsi ei ole liitetty kouluun.',
    });

    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'API-avaimen poisto epäonnistui',
      },
      { status: 500 }
    );
  }
}
