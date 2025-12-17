import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Endpoint para migrar domicilios de trámites existentes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Solo admins pueden ejecutar esta migración
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Obtener todos los trámites
    const tramites = await prisma.tramite.findMany({
      where: {
        formularioCompleto: true
      }
    })

    let actualizados = 0
    let errores = 0

    for (const tramite of tramites) {
      try {
        const socios = (tramite.socios as any[]) || []
        const administradores = (tramite.administradores as any[]) || []
        
        let necesitaActualizacion = false
        
        // Verificar y actualizar socios
        const sociosActualizados = socios.map((socio: any) => {
          const necesitaUpdate = !socio.ciudad || !socio.departamento || !socio.provincia
          
          if (necesitaUpdate) {
            necesitaActualizacion = true
            return {
              ...socio,
              ciudad: socio.ciudad || (tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba' : 'Ciudad Autónoma de Buenos Aires'),
              departamento: socio.departamento || (tramite.jurisdiccion === 'CORDOBA' ? 'Capital' : 'Comuna 1'),
              provincia: socio.provincia || (tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba' : 'Ciudad Autónoma de Buenos Aires')
            }
          }
          return socio
        })
        
        // Verificar y actualizar administradores
        const administradoresActualizados = administradores.map((admin: any) => {
          const necesitaUpdate = !admin.ciudad || !admin.departamento || !admin.provincia
          
          if (necesitaUpdate) {
            necesitaActualizacion = true
            return {
              ...admin,
              ciudad: admin.ciudad || (tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba' : 'Ciudad Autónoma de Buenos Aires'),
              departamento: admin.departamento || (tramite.jurisdiccion === 'CORDOBA' ? 'Capital' : 'Comuna 1'),
              provincia: admin.provincia || (tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba' : 'Ciudad Autónoma de Buenos Aires')
            }
          }
          return admin
        })
        
        // Actualizar el trámite si es necesario
        if (necesitaActualizacion) {
          await prisma.tramite.update({
            where: { id: tramite.id },
            data: {
              socios: sociosActualizados,
              administradores: administradoresActualizados
            }
          })
          actualizados++
          console.log(`✅ Trámite ${tramite.id} (${tramite.denominacionSocial1}) actualizado`)
        }
      } catch (error) {
        console.error(`❌ Error al actualizar trámite ${tramite.id}:`, error)
        errores++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migración completada`,
      total: tramites.length,
      actualizados,
      errores
    })

  } catch (error) {
    console.error('Error en la migración:', error)
    return NextResponse.json(
      { error: 'Error al ejecutar la migración', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}

