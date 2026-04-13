import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getServerEnv } from '@/lib/env';

const signupSchema = z.object({
  registrationToken: z.string().min(1, 'Rekisteröitymiskoodi puuttuu'),
  name: z.string().trim().min(2, 'Nimen on oltava vähintään 2 merkkiä pitkä'),
  email: z.string().trim().email('Anna kelvollinen sähköpostiosoite'),
  password: z.string().min(8, 'Salasanan on oltava vähintään 8 merkkiä pitkä'),
  schoolId: z.string().uuid('Valitse koulu listasta'),
});


function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return 'Rekisteröityminen epäonnistui';
}

function formatStageError(stage: string, error: unknown) {
  return {
    stage,
    message: getErrorMessage(error),
    raw:
      error && typeof error === 'object'
        ? error
        : { value: String(error) },
  };
}

function isValidRegistrationToken(
  submittedToken: string,
  expectedToken: string | undefined
): boolean {
  if (!expectedToken) {
    return false;
  }

  const normalizedSubmittedToken = submittedToken.trim();
  const normalizedExpectedToken = expectedToken.trim();

  const submittedBuffer = Buffer.from(normalizedSubmittedToken, 'utf8');
  const expectedBuffer = Buffer.from(normalizedExpectedToken, 'utf8');

  if (submittedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(submittedBuffer, expectedBuffer);
}

async function rollbackProvisioning(userId?: string) {
  const supabaseAdmin = getSupabaseAdmin();

  if (userId) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
  }
}


export async function POST(request: Request) {
  try {
    const env = getServerEnv();
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Virheelliset tiedot';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const payload = parsed.data;
    if (!isValidRegistrationToken(payload.registrationToken, env.ADMIN_SIGNUP_TOKEN)) {
      return NextResponse.json(
        {
          error: 'Virheellinen rekisteröitymiskoodi',
          debug:
            process.env.NODE_ENV === 'development'
              ? {
                  hasExpectedToken: Boolean(env.ADMIN_SIGNUP_TOKEN),
                  submittedLength: payload.registrationToken.trim().length,
                  expectedLength: env.ADMIN_SIGNUP_TOKEN?.trim().length ?? 0,
                }
              : undefined,
        },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    let userId: string | undefined;

    const { data: existingSchool, error: schoolLookupError } = await supabaseAdmin
      .from('schools')
      .select('id')
      .eq('id', payload.schoolId)
      .single();

    if (schoolLookupError || !existingSchool?.id) {
      return NextResponse.json({ error: 'Valittu koulu ei ole saatavilla' }, { status: 400 });
    }

    try {
      const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser(
        {
          email: payload.email,
          password: payload.password,
          user_metadata: {
            name: payload.name,
          },
          email_confirm: true,
        }
      );

      if (createUserError || !createdUser.user) {
        return NextResponse.json(
          { error: createUserError?.message ?? 'Käyttäjän luonti epäonnistui' },
          { status: 400 }
        );
      }

      userId = createdUser.user.id;

      const { error: memberError } = await supabaseAdmin
        .from('school_members')
        .insert({
          user_id: userId,
          school_id: payload.schoolId,
          role: 'admin',
        });

      if (memberError) {
        throw formatStageError('insert_school_member', memberError);
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      await rollbackProvisioning(userId);
      throw error;
    }
  } catch (error) {
    const message = getErrorMessage(error);
    return NextResponse.json(
      {
        error: message,
        debug:
          process.env.NODE_ENV === 'development'
            ? {
                errorType: error instanceof Error ? error.name : typeof error,
                raw: error && typeof error === 'object' ? error : { value: String(error) },
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}
