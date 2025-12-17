import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Verificar que DATABASE_URL esté configurada
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: "DATABASE_URL no está configurada",
          hasUrl: false
        },
        { status: 500 }
      )
    }

    // Intentar conectar a la base de datos
    await prisma.$connect()
    
    // Hacer una query simple
    const userCount = await prisma.user.count()
    
    // Desconectar
    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: "Conexión a la base de datos exitosa",
      userCount,
      hasUrl: true,
      urlPrefix: dbUrl.substring(0, 20) + "..." // Solo mostrar prefijo por seguridad
    })
  } catch (error: any) {
    console.error("Error en test-db:", error)
    
    return NextResponse.json({
      success: false,
      error: error?.message || "Error desconocido",
      code: error?.code,
      name: error?.name,
      hasUrl: !!process.env.DATABASE_URL,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}

