import { z } from 'zod';

const strongPassword = z
  .string()
  .min(12, 'Senha deve ter no mínimo 12 caracteres')
  .max(200)
  .regex(/[a-z]/, 'Senha deve conter letra minúscula')
  .regex(/[A-Z]/, 'Senha deve conter letra maiúscula')
  .regex(/[0-9]/, 'Senha deve conter número')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter caractere especial');

export const createOwnerSchema = z
  .object({
    name: z.string().trim().min(1, 'Nome obrigatório').max(200),
    email: z.string().trim().email('E-mail inválido').max(320),
    password: strongPassword,
    confirmPassword: z.string().min(1).max(200),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  });

export type CreateOwnerBody = z.infer<typeof createOwnerSchema>;
