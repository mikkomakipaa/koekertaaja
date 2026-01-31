import { z } from 'zod';

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  ADMIN_EMAILS: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
});

const formatIssues = (issues: z.ZodIssue[]) =>
  issues.map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`);

export function validateEnv(
  rawEnv: Record<string, string | undefined>,
  isServer: true
): ServerEnv;
export function validateEnv(
  rawEnv: Record<string, string | undefined>,
  isServer: false
): PublicEnv;
export function validateEnv(
  rawEnv: Record<string, string | undefined>,
  isServer = typeof window === 'undefined'
) {
  const schema = isServer ? serverSchema : publicSchema;
  const result = schema.safeParse(rawEnv);

  if (!result.success) {
    const message = formatIssues(result.error.issues).join('\n');
    throw new Error(`Invalid environment variables:\n${message}`);
  }

  return result.data;
}

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

const isServer = typeof window === 'undefined';
const skipValidation = process.env.SKIP_ENV_VALIDATION === 'true' || process.env.NODE_ENV === 'test';

export function getServerEnv(): ServerEnv {
  if (skipValidation) {
    return process.env as unknown as ServerEnv;
  }

  return validateEnv(process.env, true);
}

export function getPublicEnv(): PublicEnv {
  if (skipValidation) {
    return process.env as unknown as PublicEnv;
  }

  if (isServer) {
    return validateEnv(process.env, false);
  }

  // Avoid throwing in the browser bundle; rely on server-side validation.
  return process.env as unknown as PublicEnv;
}
