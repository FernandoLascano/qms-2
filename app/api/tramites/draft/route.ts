import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OBJETO_SOCIAL_PREAPROBADO } from '@/lib/objeto-social'

// Guardar borrador del formulario
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const data = await request.json()
    
    // Con tramiteId se actualiza ese borrador; sin tramiteId se crea uno nuevo.
    // Antes, sin id se pisaba "el borrador más reciente": abrir «Nuevo trámite»
    // sobrescribía sin aviso otro borrador a medias del cliente.
    let existingDraft = null
    if (data.tramiteId) {
      existingDraft = await prisma.tramite.findFirst({
        where: {
          id: data.tramiteId,
          userId: session.user.id,
          estadoGeneral: 'INICIADO',
          formularioCompleto: false
        }
      })

      if (!existingDraft) {
        // Si el formulario ya se envió, el auto-guardado puede seguir corriendo
        // unos segundos más: no hay nada que guardar.
        const yaEnviado = await prisma.tramite.findFirst({
          where: { id: data.tramiteId, userId: session.user.id, formularioCompleto: true },
          select: { id: true }
        })

        if (yaEnviado) {
          return NextResponse.json({
            success: true,
            tramiteId: yaEnviado.id,
            yaEnviado: true,
            message: 'El trámite ya fue enviado, no se guarda borrador'
          })
        }

        return NextResponse.json(
          { error: 'El borrador no existe o no se puede editar' },
          { status: 404 }
        )
      }
    }

    // Preparar datos
    // El mismo texto que ve el cliente en el formulario (fuente única)
    const objetoSocialPreAprobado = OBJETO_SOCIAL_PREAPROBADO
    
    const objetoSocialFinal = data.objetoSocial === 'PERSONALIZADO' 
      ? (data.objetoPersonalizado || 'Pendiente de definir')
      : (objetoSocialPreAprobado || 'Pendiente de definir')

    const domicilioLegal = data.sinDomicilio 
      ? 'A informar' 
      : `${data.domicilio || ''}, ${data.ciudad || ''}, ${data.departamento || ''}, ${data.provincia || ''}`.trim() || 'A informar'

    let capitalSocial = 0
    try {
      const capitalStr = String(data.capitalSocial || '0')
      capitalSocial = parseFloat(capitalStr.replace(/\./g, '').replace(',', '.'))
    } catch (err) {
      capitalSocial = 635600
    }

    const sociosJSON = data.socios && data.socios.length > 0 
      ? data.socios.map((socio: any, index: number) => {
          let aporteCapital = 0
          try {
            const aporteStr = String(socio.aporteCapital || '0')
            aporteCapital = parseFloat(aporteStr.replace(/\./g, '').replace(',', '.'))
          } catch (err) {
            aporteCapital = 0
          }
          
          return {
            id: index + 1,
            nombre: socio.nombre || '',
            apellido: socio.apellido || '',
            dni: socio.dni || '',
            cuit: socio.cuit || '',
            domicilio: socio.domicilio || '',
            ciudad: socio.ciudad || '',
            departamento: socio.departamento || '',
            provincia: socio.provincia || '',
            estadoCivil: socio.estadoCivil || '',
            profesion: socio.profesion || '',
            aporteCapital: aporteCapital,
            tipoAporte: socio.tipoAporte || 'MONTO',
            aportePorcentaje: socio.aportePorcentaje || (capitalSocial > 0 ? (aporteCapital / capitalSocial * 100).toFixed(2) : '0'),
            porcentaje: capitalSocial > 0 ? (aporteCapital / capitalSocial * 100).toFixed(2) : '0'
          }
        })
      : []

    const administradoresJSON = data.administradores && data.administradores.length > 0
      ? data.administradores.map((admin: any, index: number) => ({
          id: index + 1,
          nombre: admin.nombre || '',
          apellido: admin.apellido || '',
          dni: admin.dni || '',
          cuit: admin.cuit || '',
          domicilio: admin.domicilio || '',
          ciudad: admin.ciudad || '',
          departamento: admin.departamento || '',
          provincia: admin.provincia || '',
          estadoCivil: admin.estadoCivil || '',
          profesion: admin.profesion || '',
          cargo: index === 0 ? 'TITULAR' : index === 1 ? 'SUPLENTE' : 'ADICIONAL'
        }))
      : []

    // Guardar todos los datos del usuario del formulario
    const datosUsuarioJSON = {
      nombre: data.nombre || '',
      apellido: data.apellido || '',
      dni: data.dni || '',
      telefono: data.telefono || '',
      email: data.email || '',
      marcaRegistrada: data.marcaRegistrada || false,
      cbuPrincipal: data.cbuPrincipal || '',
      cbuSecundario: data.cbuSecundario || '',
      fechaCierre: data.fechaCierre || '31-12',
      asesoramientoContable: data.asesoramientoContable || false,
      ciudad: data.ciudad || '',
      departamento: data.departamento || '',
      // Dónde vive la persona (no es la sede de la sociedad)
      provinciaResidencia: data.provinciaResidencia || '',
      // Último paso del wizard en el que estuvo, para volver ahí al recargar
      pasoActual: Number.isInteger(data.pasoActual) ? data.pasoActual : 1
    }

    let tramite

    if (existingDraft) {
      // Actualizar borrador existente
      try {
        // Intentar con datosUsuario primero
        tramite = await (prisma.tramite.update as any)({
          where: { id: existingDraft.id },
          data: {
            jurisdiccion: data.jurisdiccion as 'CORDOBA' | 'CABA',
            plan: data.plan as 'BASICO' | 'EMPRENDEDOR' | 'PREMIUM',
            denominacionSocial1: data.denominacion1 || existingDraft.denominacionSocial1,
            denominacionSocial2: data.denominacion2 || existingDraft.denominacionSocial2,
            denominacionSocial3: data.denominacion3 || existingDraft.denominacionSocial3,
            objetoSocial: objetoSocialFinal,
            capitalSocial: capitalSocial,
            domicilioLegal: domicilioLegal,
            datosUsuario: datosUsuarioJSON,
            socios: sociosJSON,
            administradores: administradoresJSON,
          }
        })
      } catch (error: any) {
        if (error.message?.includes('datosUsuario')) {
          tramite = await prisma.tramite.update({
            where: { id: existingDraft.id },
            data: {
              jurisdiccion: data.jurisdiccion as 'CORDOBA' | 'CABA',
              plan: data.plan as 'BASICO' | 'EMPRENDEDOR' | 'PREMIUM',
              denominacionSocial1: data.denominacion1 || existingDraft.denominacionSocial1,
              denominacionSocial2: data.denominacion2 || existingDraft.denominacionSocial2,
              denominacionSocial3: data.denominacion3 || existingDraft.denominacionSocial3,
              objetoSocial: objetoSocialFinal,
              capitalSocial: capitalSocial,
              domicilioLegal: domicilioLegal,
              socios: sociosJSON,
              administradores: administradoresJSON,
            }
          })
        } else {
          throw error
        }
      }
    } else {
      // Crear nuevo borrador
      // Asegurarse de que denominacionSocial1 tenga un valor (requerido por el schema)
      const denominacion1 = data.denominacion1?.trim() || 'Pendiente de definir'
      
      // Validar que jurisdiccion y plan estén presentes, usar valores por defecto si no
      const jurisdiccion = (data.jurisdiccion as 'CORDOBA' | 'CABA') || 'CORDOBA'
      const plan = (data.plan as 'BASICO' | 'EMPRENDEDOR' | 'PREMIUM') || 'EMPRENDEDOR'
      
      try {
        // Validar que todos los campos requeridos estén presentes
        // Usar 'as any' para evitar errores de tipo si el cliente de Prisma no está actualizado
        const datosCreacion: any = {
          userId: session.user.id,
          jurisdiccion: jurisdiccion,
          plan: plan,
          estadoGeneral: 'INICIADO' as const,
          denominacionSocial1: denominacion1,
          denominacionSocial2: data.denominacion2?.trim() || null,
          denominacionSocial3: data.denominacion3?.trim() || null,
          objetoSocial: objetoSocialFinal,
          capitalSocial: capitalSocial || 635600, // Valor mínimo por defecto
          domicilioLegal: domicilioLegal,
          datosUsuario: datosUsuarioJSON,
          socios: sociosJSON.length > 0 ? sociosJSON : [{ id: 1, nombre: '', apellido: '', dni: '', cuit: '', domicilio: '', ciudad: '', departamento: '', provincia: '', estadoCivil: '', profesion: '', aporteCapital: 0, tipoAporte: 'MONTO', aportePorcentaje: '0', porcentaje: '0' }],
          administradores: administradoresJSON.length > 0 ? administradoresJSON : [{ id: 1, nombre: '', apellido: '', dni: '', cuit: '', domicilio: '', estadoCivil: '', profesion: '', cargo: 'TITULAR' }],
          formularioCompleto: false,
        }
        
        try {
          // Intentar con datosUsuario primero
          tramite = await (prisma.tramite.create as any)({
            data: datosCreacion
          })
        } catch (error: any) {
          // Si falla por el campo datosUsuario, intentar sin él
          if (error.message?.includes('datosUsuario')) {
            const { datosUsuario, ...datosSinUsuario } = datosCreacion
            tramite = await prisma.tramite.create({
              data: datosSinUsuario
            })
          } else {
            throw error
          }
        }
        
      } catch {
        return NextResponse.json(
          { error: 'Error al guardar borrador' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      tramiteId: tramite.id,
      message: 'Borrador guardado'
    })

  } catch {
    return NextResponse.json(
      { error: 'Error al guardar borrador' },
      { status: 500 }
    )
  }
}

// Obtener borrador
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const draft = await prisma.tramite.findFirst({
      where: {
        userId: session.user.id,
        estadoGeneral: 'INICIADO',
        formularioCompleto: false
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    if (!draft) {
      return NextResponse.json({ draft: null })
    }

    return NextResponse.json({ draft })

  } catch {
    return NextResponse.json(
      { error: 'Error al obtener borrador' },
      { status: 500 }
    )
  }
}

