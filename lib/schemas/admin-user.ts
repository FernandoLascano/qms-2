import { z } from 'zod'

export const adminUsuarioPatchSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('reset_password'),
    newPassword: z.string().min(6).max(200),
  }),
  z.object({
    action: z.literal('change_rol'),
    newRol: z.enum(['CLIENTE', 'ADMIN']),
  }),
])
