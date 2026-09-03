import { z } from 'zod';

export const secretProviderSchema = z.enum([
  'database',
  'openrouter',
  'elevenlabs',
  'telegram',
]);

export const storeSecretSchema = z.object({
  provider: secretProviderSchema,
  name: z.string().min(1, 'Name is required').max(120),
  secret: z.string().min(1, 'Secret is required'),
});

export const testSecretSchema = z
  .object({
    id: z.string().uuid().optional(),
    provider: secretProviderSchema.optional(),
    secret: z.string().min(1).optional(),
  })
  .refine((data) => Boolean(data.id) || (Boolean(data.provider) && Boolean(data.secret)), {
    message: 'Provide either id, or provider + secret',
  });

export type StoreSecretBody = z.infer<typeof storeSecretSchema>;
export type TestSecretBody = z.infer<typeof testSecretSchema>;
