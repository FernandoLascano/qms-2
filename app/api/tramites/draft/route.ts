import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    
    // Log para debugging (remover en producción)
    console.log('Datos recibidos:', {
      tieneJurisdiccion: !!data.jurisdiccion,
      tienePlan: !!data.plan,
      tieneSocios: !!data.socios,
      tieneAdministradores: !!data.administradores,
      tramiteId: data.tramiteId
    })
    
    // Si viene un tramiteId específico, usar ese trámite
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
    } else {
      // Si no hay tramiteId, buscar el borrador más reciente
      existingDraft = await prisma.tramite.findFirst({
        where: {
          userId: session.user.id,
          estadoGeneral: 'INICIADO',
          formularioCompleto: false
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })
    }

    // Preparar datos
    const objetoSocialPreAprobado = 'La sociedad tiene por objeto realizar por cuenta propia y/o de terceros, o asociadas a terceros en el país o en el extranjero, las siguientes actividades: 1) Construcción de todo tipo de obras, públicas o privadas, edificios, viviendas, locales comerciales y plantas industriales; realizar refacciones, remodelaciones, instalaciones, trabajos de albañilería y/o cualquier trabajo de la construcción. 2) Transporte nacional o internacional de cargas en general, ya sea por vía terrestre, aérea o marítima, con medios de transporte propios o de terceros, pudiendo realizar todo lo inherente a su logística. 3) Compra, venta y permuta, explotación, arrendamientos y administración de bienes inmuebles, urbanos y rurales y la realización de operaciones de propiedad horizontal. 4) Realizar toda clase de operaciones financieras por todos los medios autorizados por la legislación vigente. Se exceptúan las operaciones comprendidas en la Ley de Entidades Financiera. 5) Realizar la explotación directa por sí o por terceros en establecimientos rurales, ganaderos, agrícolas, avícolas, frutícolas, vitivinícolas, forestales, cría, venta y cruza de ganado, explotación de tambos, cultivos, compra, venta y acopio de cereales. 6) Elaboración, producción, transformación y comercialización de productos y subproductos alimenticios de todo tipo, expendio de todo tipo de bebidas, explotación de servicio de catering, de concesiones gastronómicas, bares, restoranes, comedores, organización y logística en eventos sociales. 7) Creación, producción, elaboración, transformación, desarrollo, reparación, implementación, servicio técnico, consultoría, comercialización, distribución, importación y exportación de softwares, equipos informáticos, eléctricos y electrónicos. 8) Producción, organización y explotación de espectáculos públicos y privados, teatrales, musicales, coreográficos, desfiles, exposiciones, ferias, conciertos musicales, recitales, y eventos sociales. 9) Explotación de agencia de viajes y turismo, pudiendo realizar reservas y ventas de pasajes, terrestres, aéreos, marítimos, nacionales o internacionales; organización, reserva y ventas de excursiones, reservas de hotelería, reserva, organización y ventas de charters y traslados, dentro y fuera del país de contingentes. 10) Organización, administración, gerenciamiento y explotación de centros médicos asistenciales, con atención polivalente e integral de medicina, atención clínica, terapéutica y quirúrgica, con o sin internación y demás actividades relacionadas a la salud y servicios de atención médica. 11) Constituir, instalar y comercializar editoriales y gráficas en cualquier soporte. 12) Instalación y explotación de establecimientos destinados a la industrialización, fabricación y elaboración de las materias primas, productos y subproductos relacionados directamente con su objeto social. 13) Importación y exportación de bienes y servicios. 14) Actuar como fiduciante, fiduciaria, beneficiaria, fideicomisaria, por cuenta propia o por cuenta de terceros y/o asociada a terceros, en todo tipo de emprendimientos.'
    
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
      departamento: data.departamento || ''
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
        // Si falla por el campo datosUsuario, intentar sin él
        if (error.message?.includes('datosUsuario')) {
          console.warn('Campo datosUsuario no disponible, guardando sin él...')
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
        
        console.log('Intentando crear trámite con datos:', {
          jurisdiccion: datosCreacion.jurisdiccion,
          plan: datosCreacion.plan,
          denominacionSocial1: datosCreacion.denominacionSocial1,
          objetoSocial: datosCreacion.objetoSocial.substring(0, 50) + '...',
          capitalSocial: datosCreacion.capitalSocial,
          domicilioLegal: datosCreacion.domicilioLegal,
          tieneSocios: Array.isArray(datosCreacion.socios) && datosCreacion.socios.length > 0,
          tieneAdministradores: Array.isArray(datosCreacion.administradores) && datosCreacion.administradores.length > 0
        })
        
        try {
          // Intentar con datosUsuario primero
          tramite = await (prisma.tramite.create as any)({
            data: datosCreacion
          })
        } catch (error: any) {
          // Si falla por el campo datosUsuario, intentar sin él
          if (error.message?.includes('datosUsuario')) {
            console.warn('Campo datosUsuario no disponible, creando sin él...')
            const { datosUsuario, ...datosSinUsuario } = datosCreacion
            tramite = await prisma.tramite.create({
              data: datosSinUsuario
            })
          } else {
            throw error
          }
        }
        
        console.log('Trámite creado exitosamente:', tramite.id)
      } catch (error: any) {
        console.error('Error al crear borrador:', error)
        console.error('Stack trace:', error.stack)
        // Si falla, intentar con valores mínimos
        return NextResponse.json(
          { error: 'Error al guardar borrador', details: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      tramiteId: tramite.id,
      message: 'Borrador guardado'
    })

  } catch (error) {
    console.error('Error al guardar borrador:', error)
    return NextResponse.json(
      { 
        error: 'Error al guardar borrador', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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

  } catch (error) {
    console.error('Error al obtener borrador:', error)
    return NextResponse.json(
      { error: 'Error al obtener borrador' },
      { status: 500 }
    )
  }
}

