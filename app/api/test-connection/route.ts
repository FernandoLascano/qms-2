import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Intentar conectar
    await prisma.$connect()
    
    // Intentar una query simple
    const userCount = await prisma.user.count()
    
    // Desconectar
    await prisma.$disconnect()
    
    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa a la base de datos',
      userCount,
      databaseUrl: process.env.DATABASE_URL 
        ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') // Ocultar password
        : 'No configurada',
      isPooler: process.env.DATABASE_URL?.includes('6543') || process.env.DATABASE_URL?.includes('pgbouncer'),
      port: process.env.DATABASE_URL?.match(/:(\d+)\//)?.[1] || 'No detectado'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      databaseUrl: process.env.DATABASE_URL 
        ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')
        : 'No configurada',
      isPooler: process.env.DATABASE_URL?.includes('6543') || process.env.DATABASE_URL?.includes('pgbouncer'),
      port: process.env.DATABASE_URL?.match(/:(\d+)\//)?.[1] || 'No detectado',
      suggestion: error.message?.includes('5432') 
        ? 'Estás usando el puerto 5432 (conexión directa). Cambia a 6543 (pooler) y agrega ?pgbouncer=true'
        : 'Verifica que DATABASE_URL esté configurada correctamente'
    }, { status: 500 })
  }
}


