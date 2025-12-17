import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 Probando conexión a la base de datos...')
    
    // Contar usuarios
    const usuariosCount = await prisma.usuario.count()
    console.log('✅ Usuarios en la BD:', usuariosCount)
    
    // Contar trámites
    const tramitesCount = await prisma.tramite.count()
    console.log('✅ Trámites en la BD:', tramitesCount)
    
    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa',
      usuarios: usuariosCount,
      tramites: tramitesCount
    })
    
  } catch (error) {
    console.error('❌ Error de conexión:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}