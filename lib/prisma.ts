import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Configuración para producción (Supabase requiere SSL)
const prismaClientOptions: any = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
}

// Si estamos en producción y usamos Supabase, agregar configuración SSL
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL?.includes('supabase')) {
  // Supabase pooler ya maneja SSL, pero podemos ser explícitos
  if (!process.env.DATABASE_URL.includes('sslmode')) {
    console.warn('⚠️ DATABASE_URL de Supabase detectada. Asegúrate de usar el pooler con SSL.')
  }
}

export const prisma = global.prisma || new PrismaClient(prismaClientOptions)

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}