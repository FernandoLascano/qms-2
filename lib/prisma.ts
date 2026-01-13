import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Configuración para producción (Supabase requiere SSL)
const prismaClientOptions: any = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
}

// Si estamos usando Supabase, agregar configuración SSL explícita
if (process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('pooler.supabase.com')) {
  // Asegurar que la URL tenga los parámetros correctos para el pooler
  let dbUrl = process.env.DATABASE_URL
  
  // Si no tiene sslmode, agregarlo
  if (!dbUrl.includes('sslmode')) {
    // Agregar sslmode=require al final (o después de pgbouncer=true)
    if (dbUrl.includes('?pgbouncer=true')) {
      dbUrl = dbUrl.replace('?pgbouncer=true', '?pgbouncer=true&sslmode=require')
    } else if (dbUrl.includes('?')) {
      dbUrl = dbUrl + '&sslmode=require'
    } else {
      dbUrl = dbUrl + '?sslmode=require'
    }
    
    // Actualizar la variable de entorno temporalmente para esta instancia
    process.env.DATABASE_URL = dbUrl
    console.log('ℹ️ Agregado sslmode=require a DATABASE_URL para Supabase')
  }
  
  // Configurar opciones de conexión para Supabase
  prismaClientOptions.datasources = {
    db: {
      url: dbUrl
    }
  }
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