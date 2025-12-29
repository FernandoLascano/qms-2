import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enviarEmailTramiteEnviado } from '@/lib/emails/send'

export async function POST(request: Request) {
  try {
    console.log('=== INICIO DEL POST ===')
    
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('Usuario no autenticado')
      return NextResponse.json(
        { error: 'No autenticado', details: 'Debes iniciar sesión para crear un trámite' },
        { status: 401 }
      )
    }

    console.log('Usuario autenticado:', session.user.id)

    const data = await request.json()
    console.log('Datos recibidos:', JSON.stringify(data, null, 2))

    // VALIDACIÓN DE CAMPOS REQUERIDOS
    const erroresValidacion = []

    // Validar campos básicos del paso 1
    if (!data.nombre?.trim()) erroresValidacion.push('Nombre del usuario')
    if (!data.apellido?.trim()) erroresValidacion.push('Apellido del usuario')
    if (!data.dni?.trim()) erroresValidacion.push('DNI del usuario')
    if (!data.telefono?.trim()) erroresValidacion.push('Teléfono del usuario')
    if (!data.email?.trim()) erroresValidacion.push('Email del usuario')
    if (!data.plan) erroresValidacion.push('Plan')
    if (!data.jurisdiccion) erroresValidacion.push('Jurisdicción')

    // Validar denominaciones del paso 2
    if (!data.denominacion1?.trim()) erroresValidacion.push('Primera opción de denominación social')
    if (!data.denominacion2?.trim()) erroresValidacion.push('Segunda opción de denominación social')
    if (!data.denominacion3?.trim()) erroresValidacion.push('Tercera opción de denominación social')

    // Validar objeto social y domicilio del paso 3
    if (!data.objetoSocial?.trim() && !data.objetoPersonalizado?.trim()) {
      erroresValidacion.push('Objeto social')
    }
    if (!data.sinDomicilio) {
      if (!data.domicilio?.trim()) erroresValidacion.push('Domicilio legal')
      if (!data.ciudad?.trim()) erroresValidacion.push('Ciudad')
      if (!data.departamento?.trim()) erroresValidacion.push('Departamento')
    }

    // Validar capital social del paso 4
    if (!data.capitalSocial || parseFloat(String(data.capitalSocial).replace(/\./g, '').replace(',', '.')) < 635600) {
      erroresValidacion.push('Capital social (debe ser mayor o igual a $635,600)')
    }

    // Validar socios del paso 5
    if (!data.socios || !Array.isArray(data.socios) || data.socios.length === 0) {
      erroresValidacion.push('Debe haber al menos un socio')
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.socios.forEach((socio: any, index: number) => {
        if (!socio.nombre?.trim()) erroresValidacion.push(`Nombre del socio ${index + 1}`)
        if (!socio.apellido?.trim()) erroresValidacion.push(`Apellido del socio ${index + 1}`)
        if (!socio.dni?.trim()) erroresValidacion.push(`DNI del socio ${index + 1}`)
        if (!socio.cuit?.trim()) erroresValidacion.push(`CUIT del socio ${index + 1}`)
        if (!socio.domicilio?.trim()) erroresValidacion.push(`Domicilio del socio ${index + 1}`)
        if (!socio.estadoCivil) erroresValidacion.push(`Estado civil del socio ${index + 1}`)
        if (!socio.profesion?.trim()) erroresValidacion.push(`Profesión del socio ${index + 1}`)
        if (!socio.aporteCapital || parseFloat(String(socio.aporteCapital).replace(/\./g, '').replace(',', '.')) <= 0) {
          erroresValidacion.push(`Aporte de capital del socio ${index + 1}`)
        }
      })
    }

    // Validar administradores del paso 6
    if (!data.administradores || !Array.isArray(data.administradores) || data.administradores.length < 2) {
      erroresValidacion.push('Debe haber al menos 2 administradores')
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.administradores.forEach((admin: any, index: number) => {
        if (!admin.nombre?.trim()) erroresValidacion.push(`Nombre del administrador ${index + 1}`)
        if (!admin.apellido?.trim()) erroresValidacion.push(`Apellido del administrador ${index + 1}`)
        if (!admin.dni?.trim()) erroresValidacion.push(`DNI del administrador ${index + 1}`)
        if (!admin.cuit?.trim()) erroresValidacion.push(`CUIT del administrador ${index + 1}`)
        if (!admin.domicilio?.trim()) erroresValidacion.push(`Domicilio del administrador ${index + 1}`)
        if (!admin.estadoCivil) erroresValidacion.push(`Estado civil del administrador ${index + 1}`)
        if (!admin.profesion?.trim()) erroresValidacion.push(`Profesión del administrador ${index + 1}`)
      })
    }

    // Validar fecha de cierre del paso 7
    if (!data.fechaCierre?.trim()) erroresValidacion.push('Fecha de cierre de ejercicio')

    // Si hay errores, devolver respuesta con detalles
    if (erroresValidacion.length > 0) {
      console.log('Errores de validación:', erroresValidacion)
      return NextResponse.json(
        {
          error: 'Formulario incompleto',
          details: `Faltan los siguientes campos obligatorios: ${erroresValidacion.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Usar el usuario de la sesión
    const usuario = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!usuario) {
      console.log('Usuario no encontrado en BD')
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    console.log('Usuario encontrado:', usuario.email)

    // Preparar objeto social
    const objetoSocialFinal = data.objetoSocial === 'PERSONALIZADO' 
      ? data.objetoPersonalizado 
      : 'La sociedad tiene por objeto realizar por cuenta propia y/o de terceros, o asociadas a terceros en el país o en el extranjero, las siguientes actividades: Compra, venta y permuta, explotación, arrendamientos y administración de bienes inmuebles, urbanos y rurales y la realización de operaciones de propiedad horizontal. Realizar toda clase de operaciones financieras por todos los medios autorizados por la legislación vigente. Se excluyen las operaciones comprendidas en la Ley de Entidades Financiera. Importación y exportación de bienes y servicios. Actuar como fiduciante, fiduciaria, beneficiaria, fideicomisaria, por cuenta propia o por cuenta de terceros y/o asociada a terceros, en todo tipo de emprendimientos. El objeto social comprende además la realización de toda actividad que se relacione directa o indirectamente con el objeto principal.'

    console.log('Objeto social final:', objetoSocialFinal)

    // Preparar domicilio legal
    const domicilioLegal = data.sinDomicilio 
      ? 'A informar' 
      : `${data.domicilio || ''}, ${data.ciudad || ''}, ${data.departamento || ''}, ${data.provincia || ''}`

    console.log('Domicilio legal:', domicilioLegal)

    // Preparar datos del usuario como JSON (incluyendo campos adicionales del formulario)
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
      sinDomicilio: data.sinDomicilio || false,
      objetoSocial: data.objetoSocial || 'PRE_APROBADO',
      objetoPersonalizado: data.objetoPersonalizado || ''
    }

    console.log('Datos usuario JSON:', datosUsuarioJSON)

    // Preparar capital social
    let capitalSocial = 0
    try {
      const capitalStr = String(data.capitalSocial || '0')
      capitalSocial = parseFloat(capitalStr.replace(/\./g, '').replace(',', '.'))
      console.log('Capital social parseado:', capitalSocial)
    } catch (err) {
      console.error('Error al parsear capital social:', err)
      capitalSocial = 635600
    }

    // Preparar socios como JSON
    const sociosJSON = data.socios && data.socios.length > 0 
      ? data.socios.map((socio: any, index: number) => {
          let aporteCapital = 0
          try {
            // El aporteCapital puede venir como string o número
            // Si viene como string, puede tener formato con puntos o comas
            const aporteStr = String(socio.aporteCapital || '0')
            // Remover puntos (separadores de miles) y reemplazar coma por punto (decimal)
            aporteCapital = parseFloat(aporteStr.replace(/\./g, '').replace(',', '.'))
            // Validar que no sea NaN
            if (isNaN(aporteCapital)) {
              aporteCapital = 0
            }
          } catch (err) {
            console.error('Error al parsear aporte capital del socio:', err)
            aporteCapital = 0
          }
          
          // Calcular porcentaje correctamente
          const porcentajeCalculado = capitalSocial > 0 
            ? ((aporteCapital / capitalSocial) * 100).toFixed(2)
            : '0'
          
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
            aportePorcentaje: socio.aportePorcentaje || porcentajeCalculado,
            porcentaje: porcentajeCalculado
          }
        })
      : []

    // Preparar administradores como JSON
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

    console.log('Buscando borrador existente...')
    
    // Buscar si existe un borrador con la misma denominación y que pertenezca al usuario
    const borradorExistente = await prisma.tramite.findFirst({
      where: {
        userId: usuario.id,
        denominacionSocial1: data.denominacion1 || '',
        formularioCompleto: false,
        estadoGeneral: 'INICIADO'
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    
    let tramite
    
    if (borradorExistente) {
      console.log('Actualizando borrador existente:', borradorExistente.id)
      // Actualizar el borrador existente en lugar de crear uno nuevo
      tramite = await prisma.tramite.update({
        where: { id: borradorExistente.id },
        data: {
          jurisdiccion: data.jurisdiccion as 'CORDOBA' | 'CABA',
          plan: data.plan as 'BASICO' | 'EMPRENDEDOR' | 'PREMIUM',
          estadoGeneral: 'INICIADO',
          
          // Datos de la sociedad
          denominacionSocial1: data.denominacion1 || '',
          denominacionSocial2: data.denominacion2 || null,
          denominacionSocial3: data.denominacion3 || null,
          objetoSocial: objetoSocialFinal,
          capitalSocial: capitalSocial,
          domicilioLegal: domicilioLegal,
          
          // Socios y administradores como JSON
          socios: sociosJSON,
          administradores: administradoresJSON,

          // Datos del usuario (JSON con campos adicionales)
          datosUsuario: datosUsuarioJSON,

          // Estados
          formularioCompleto: true,
          fechaFormularioCompleto: new Date(),
          estadoValidacion: 'PENDIENTE_VALIDACION',
        }
      })
    } else {
      console.log('Creando nuevo trámite...')
      // Crear el trámite solo si no existe un borrador
      tramite = await prisma.tramite.create({
        data: {
          userId: usuario.id,
          jurisdiccion: data.jurisdiccion as 'CORDOBA' | 'CABA',
          plan: data.plan as 'BASICO' | 'EMPRENDEDOR' | 'PREMIUM',
          estadoGeneral: 'INICIADO',
          
          // Datos de la sociedad
          denominacionSocial1: data.denominacion1 || '',
          denominacionSocial2: data.denominacion2 || null,
          denominacionSocial3: data.denominacion3 || null,
          objetoSocial: objetoSocialFinal,
          capitalSocial: capitalSocial,
          domicilioLegal: domicilioLegal,
          
          // Socios y administradores como JSON
          socios: sociosJSON,
          administradores: administradoresJSON,

          // Datos del usuario (JSON con campos adicionales)
          datosUsuario: datosUsuarioJSON,

          // Estados
          formularioCompleto: true,
          fechaFormularioCompleto: new Date(),
          estadoValidacion: 'PENDIENTE_VALIDACION',
        }
      })
    }

    console.log('Trámite creado exitosamente:', tramite.id)

    // Crear notificación para el usuario
    console.log('Creando notificación...')
    await prisma.notificacion.create({
      data: {
        userId: usuario.id,
        tramiteId: tramite.id,
        tipo: 'EXITO',
        titulo: 'Trámite creado exitosamente',
        mensaje: `Tu trámite de constitución de "${data.denominacion1}" ha sido creado. Está pendiente de validación por nuestro equipo. Te notificaremos cuando sea revisado.`,
      }
    })

    // Notificar a todos los admins sobre el nuevo trámite pendiente de validación
    const admins = await prisma.user.findMany({
      where: { rol: 'ADMIN' }
    })

    await Promise.all(admins.map(admin => 
      prisma.notificacion.create({
        data: {
          userId: admin.id,
          tramiteId: tramite.id,
          tipo: 'ACCION_REQUERIDA',
          titulo: 'Nuevo trámite pendiente de validación',
          mensaje: `El cliente ${usuario.name} ha completado el formulario para "${data.denominacion1}". Requiere validación inicial.`,
          link: `/dashboard/admin/tramites/${tramite.id}`
        }
      })
    ))

    // Enviar email de confirmación (no fallar si hay error)
    try {
      await enviarEmailTramiteEnviado(
        usuario.email,
        usuario.name,
        tramite.id,
        data.denominacion1
      )
    } catch (emailError) {
      console.error("Error al enviar email de confirmación (no crítico):", emailError)
    }

    // Crear historial de estado
    console.log('Creando historial...')
    await prisma.historialEstado.create({
      data: {
        tramiteId: tramite.id,
        estadoAnterior: null,
        estadoNuevo: 'INICIADO',
        descripcion: 'Trámite de constitución creado desde formulario web',
      }
    })

    console.log('=== TODO EXITOSO ===')
    
    return NextResponse.json({
      success: true,
      tramite: {
        id: tramite.id,
        estado: tramite.estadoGeneral,
      }
    })

  } catch (error) {
    console.error('=== ERROR EN EL POST ===')
    console.error('Error completo:', error)
    console.error('Mensaje:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json(
      { 
        error: 'Error al crear el trámite', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null
      },
      { status: 500 }
    )
  }
}

// Endpoint para obtener trámites del usuario
export async function GET(request: Request) {
  try {
    const tramites = await prisma.tramite.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        pagos: true,
        documentos: true,
        notificaciones: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ tramites })

  } catch (error) {
    console.error('Error al obtener trámites:', error)
    return NextResponse.json(
      { error: 'Error al obtener trámites' },
      { status: 500 }
    )
  }
}