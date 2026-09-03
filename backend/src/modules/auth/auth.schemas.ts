import { z } from 'zod';

/** Accepts a real email or the temporary setup username "admin". */
export const loginSchema = z.object({
  email: z.string().trim().min(1).max(320),
  password: z.string().min(1).max(200),
});

export type LoginBody = z.infer<typeof loginSchema>;
