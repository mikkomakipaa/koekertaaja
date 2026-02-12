import { z } from 'zod';

const requiredString = (message: string) =>
  z.string({ required_error: message }).min(1, message);

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: requiredString('NEXT_PUBLIC_SUPABASE_URL is required').url(
    'NEXT_PUBLIC_SUPABASE_URL must be a valid URL'
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredString('NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
});

const optionalNonEmptyString = (message: string) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim().length === 0 ? undefined : value),
    z.string().min(1, message).optional()
  );

const openAIFlagSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z.enum(['true', 'false']).optional().default('false')
);

const providerDefaultSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z.enum(['anthropic', 'openai']).optional().default('anthropic')
);

const serverSchema = publicSchema
  .extend({
    SUPABASE_SERVICE_ROLE_KEY: requiredString('SUPABASE_SERVICE_ROLE_KEY is required'),
    ANTHROPIC_API_KEY: requiredString('ANTHROPIC_API_KEY is required'),
    OPENAI_API_KEY: optionalNonEmptyString('OPENAI_API_KEY is required'),
    AI_PROVIDER_DEFAULT: providerDefaultSchema,
    AI_ENABLE_OPENAI: openAIFlagSchema,
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_STANDARD_PRICE_ID: z.string().optional(),
    STRIPE_PREMIUM_PRICE_ID: z.string().optional(),
    ADMIN_EMAILS: z.string().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  })
  .superRefine((env, ctx) => {
    const openAIRequested = env.AI_ENABLE_OPENAI === 'true' || env.AI_PROVIDER_DEFAULT === 'openai';

    if (env.AI_PROVIDER_DEFAULT === 'openai' && env.AI_ENABLE_OPENAI !== 'true') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AI_ENABLE_OPENAI'],
        message: 'AI_ENABLE_OPENAI must be "true" when AI_PROVIDER_DEFAULT is "openai"',
      });
    }

    if (openAIRequested && !env.OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['OPENAI_API_KEY'],
        message: 'OPENAI_API_KEY is required when OpenAI is enabled (set AI_ENABLE_OPENAI="true" or AI_PROVIDER_DEFAULT="openai")',
      });
    }
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
