/**
 * Deriva "qué pasa ahora" con un trámite.
 *
 * Esta lógica vivía dentro de components/cliente/ProximosPasos.tsx, así que la
 * pantalla de Inicio no podía mostrar la acción pendiente: el cliente tenía que
 * entrar al trámite para enterarse de que le tocaba pagar o firmar. Extraída
 * acá, la usan tanto el Inicio (servidor) como el detalle (cliente).
 *
 * Las reglas de negocio son las mismas que había; sólo cambia la presentación:
 * los emojis salen de los títulos y pasan a ser una clave de icono.
 */

export type Responsable = 'cliente' | 'qms' | 'ninguno'
export type Urgencia = 'alta' | 'media' | 'baja' | 'completado'
export type ConfirmarAccion = 'ciudadano_digital' | 'aprobar_borrador'

export type IconoAccion =
  | 'pago'
  | 'documento'
  | 'firma'
  | 'identidad'
  | 'espera'
  | 'organismo'
  | 'revision'
  | 'completado'

export interface Accion {
  tipo: string
  titulo: string
  descripcion: string
  urgencia: Urgencia
  responsable: Responsable
  icono: IconoAccion
  /** Texto del botón principal, si hay. */
  accion: string | null
  /** Destino del botón: ruta o ancla (#seccion). */
  link: string | null
  /** Paso que el cliente confirma por sí mismo. */
  confirmar?: ConfirmarAccion
  ayuda?: { label: string; href: string }[]
}

const CONCEPTOS: Record<string, string> = {
  HONORARIOS_BASICO: 'los honorarios del plan Básico',
  HONORARIOS_EMPRENDEDOR: 'los honorarios del plan Emprendedor',
  HONORARIOS_PREMIUM: 'los honorarios del plan Premium',
  DEPOSITO_CAPITAL: 'el depósito del 25% del capital',
  TASA_RESERVA_NOMBRE: 'la tasa de reserva de nombre',
  TASA_RETRIBUTIVA: 'la tasa retributiva final',
  PUBLICACION_BOLETIN: 'la publicación en el Boletín',
  CERTIFICACION_FIRMA: 'la certificación de firma',
  OTROS: 'el concepto pendiente',
}

const conceptoTexto = (c: string) => CONCEPTOS[c] ?? c

const pesos = (n: number) => `$${Number(n ?? 0).toLocaleString('es-AR')}`

export interface EntradaAcciones {
  tramite: any
  pagos?: any[]
  enlacesPago?: any[]
  documentos?: any[]
  notificaciones?: any[]
}

export function calcularAcciones({
  tramite,
  pagos = [],
  enlacesPago = [],
  documentos = [],
  notificaciones = [],
}: EntradaAcciones): Accion[] {
  const acciones: Accion[] = []

  /* ── Validación del formulario ─────────────────────────────────────── */

  if (tramite.estadoValidacion === 'PENDIENTE_VALIDACION') {
    return [
      {
        tipo: 'VALIDACION_PENDIENTE',
        titulo: 'Estamos revisando tu formulario',
        descripcion:
          'Recibimos tu formulario. En breve nos vamos a contactar por teléfono o WhatsApp para despejar dudas y coordinar el pago de los honorarios. No necesitás hacer nada por ahora.',
        urgencia: 'media',
        responsable: 'qms',
        icono: 'revision',
        accion: null,
        link: null,
      },
    ]
  }

  if (tramite.estadoValidacion === 'REQUIERE_CORRECCIONES') {
    return [
      {
        tipo: 'REQUIERE_CORRECCIONES',
        titulo: 'Tu formulario requiere correcciones',
        descripcion:
          tramite.observacionesValidacion ||
          'El formulario requiere correcciones. Revisá los mensajes del equipo para más detalles.',
        urgencia: 'alta',
        responsable: 'cliente',
        icono: 'documento',
        accion: null,
        link: null,
      },
    ]
  }

  /* ── Pagos ─────────────────────────────────────────────────────────── */

  const honorariosPendientes = pagos.filter(
    (p) => p.concepto?.includes('HONORARIOS') && p.estado === 'PENDIENTE' && p.mercadoPagoLink,
  )

  if (honorariosPendientes.length > 0) {
    const p = honorariosPendientes[0]
    acciones.push({
      tipo: 'PAGO_HONORARIOS',
      titulo: 'Pagar honorarios',
      descripcion: `Para continuar con el trámite necesitamos que abones ${conceptoTexto(p.concepto)}: ${pesos(p.monto)}.`,
      urgencia: 'alta',
      responsable: 'cliente',
      icono: 'pago',
      accion: 'Ver forma de pago',
      link: '#pago-honorarios',
    })
  }

  if (tramite.honorariosPagados && !tramite.ciudadanoDigitalOk && !tramite.sociedadInscripta) {
    acciones.push({
      tipo: 'CIUDADANO_DIGITAL',
      titulo: 'Obtener Ciudadano Digital Nivel 2',
      descripcion:
        'Todas las personas que intervienen en la sociedad (socios y administradores) necesitan Ciudadano Digital Nivel 2 para avanzar. Cuando lo tengas listo, confirmalo acá.',
      urgencia: 'alta',
      responsable: 'cliente',
      icono: 'identidad',
      accion: null,
      link: null,
      confirmar: 'ciudadano_digital',
      ayuda: [
        { label: 'Ver el instructivo', href: '/assets/img/CiudadanoDigital.jpeg' },
        {
          label: 'Tengo dudas — hablar por WhatsApp',
          href: 'https://wa.me/5493512136212?text=Hola!%20Tengo%20una%20consulta%20sobre%20Ciudadano%20Digital%20Nivel%202%20para%20mi%20tr%C3%A1mite.',
        },
      ],
    })
  }

  const tasasPendientes = enlacesPago.filter((e) => e.estado === 'PENDIENTE' && !e.reportadoVencido)

  if (tasasPendientes.length > 0) {
    const t = tasasPendientes[0]
    acciones.push({
      tipo: 'PAGO_TASA',
      titulo: 'Pagar la tasa del organismo',
      descripcion: `Tenés que abonar ${conceptoTexto(t.concepto)}: ${pesos(t.monto)}.`,
      urgencia: 'alta',
      responsable: 'cliente',
      icono: 'pago',
      accion: 'Ir al pago de la tasa',
      link: '#enlaces-pago',
    })
  }

  /* ── Depósito del 25% del capital ──────────────────────────────────── */

  const comprobanteCapital = documentos.find(
    (d) => typeof d.nombre === 'string' && d.nombre.includes('DEPOSITO_CAPITAL'),
  )
  const comprobanteAprobado = comprobanteCapital?.estado === 'APROBADO'

  const notifDeposito = notificaciones.find((n) => {
    if (typeof n.titulo !== 'string') return false
    const t = n.titulo.toLowerCase()
    return (
      t.includes('depósito del 25% del capital') ||
      t.includes('depósito del 25%') ||
      t.includes('deposito del 25%') ||
      t.includes('datos para depósito')
    )
  })

  if (notifDeposito && !comprobanteAprobado) {
    const enRevision = Boolean(comprobanteCapital)
    acciones.push({
      tipo: 'DEPOSITO_CAPITAL',
      titulo: enRevision ? 'Revisando tu comprobante de depósito' : 'Depositar el 25% del capital',
      descripcion: enRevision
        ? 'Tu comprobante de depósito está en revisión. Te avisamos apenas quede aprobado.'
        : 'Tenés que depositar el 25% del capital social y subir el comprobante para que podamos avanzar.',
      urgencia: enRevision ? 'media' : 'alta',
      responsable: enRevision ? 'qms' : 'cliente',
      icono: enRevision ? 'revision' : 'pago',
      accion: enRevision ? null : 'Ver datos bancarios',
      link: enRevision ? null : '#deposito-capital',
    })
  }

  /* ── Esperas del lado de QMS ───────────────────────────────────────── */

  const hayDatosBancarios = Boolean(notifDeposito) && !comprobanteAprobado

  if (
    tramite.denominacionReservada &&
    !tramite.tasaPagada &&
    tasasPendientes.length === 0 &&
    !hayDatosBancarios
  ) {
    acciones.push({
      tipo: 'ESPERA_INSTRUCCIONES',
      titulo: 'Preparando el próximo paso',
      descripcion:
        'Tu denominación quedó reservada. Pronto vas a recibir las instrucciones para pagar la tasa final y depositar el capital.',
      urgencia: 'media',
      responsable: 'qms',
      icono: 'espera',
      accion: null,
      link: null,
    })
  }

  /* ── Borrador ──────────────────────────────────────────────────────── */

  if (tramite.borradorEnviado && !tramite.borradorAprobadoCliente) {
    const borrador = documentos.find((d) => d.tipo === 'BORRADOR')
    acciones.push({
      tipo: 'CONTROLAR_BORRADOR',
      titulo: 'Controlá el borrador',
      descripcion:
        'Te enviamos el borrador de los documentos. Revisalo con atención y, si está todo correcto, aprobalo para que preparemos la versión final para la firma.',
      urgencia: 'alta',
      responsable: 'cliente',
      icono: 'documento',
      accion: null,
      link: null,
      confirmar: 'aprobar_borrador',
      ...(borrador
        ? { ayuda: [{ label: 'Ver el borrador', href: `/api/documentos/${borrador.id}/view` }] }
        : {}),
    })
  }

  if (tramite.tasaPagada && tramite.capitalDepositado && !tramite.documentosRevisados) {
    acciones.push({
      tipo: 'ESPERA_DOCUMENTOS',
      titulo: 'Preparando tus documentos',
      descripcion:
        'Estamos armando los documentos para que los firmes. Te notificamos cuando estén listos.',
      urgencia: 'baja',
      responsable: 'qms',
      icono: 'espera',
      accion: null,
      link: null,
    })
  }

  /* ── Firma ─────────────────────────────────────────────────────────── */

  const TIPOS_PARA_FIRMAR = ['ESTATUTO_PARA_FIRMAR', 'ACTA_PARA_FIRMAR', 'DOCUMENTO_PARA_FIRMAR']
  const docsParaFirmar = documentos.filter((d) => TIPOS_PARA_FIRMAR.includes(d.tipo || ''))

  const hayDocsPendientesFirma = docsParaFirmar.some((docParaFirmar) => {
    const tieneFirmado = documentos.some((docFirmado) => {
      if (TIPOS_PARA_FIRMAR.includes(docFirmado.tipo || '')) return false
      const descripcion = (docFirmado.descripcion ?? '').toLowerCase()
      const nombre = (docParaFirmar.nombre ?? '').toLowerCase()
      return descripcion.includes('correspondiente a') && descripcion.includes(nombre)
    })
    return !tieneFirmado
  })

  if (tramite.documentosRevisados && !tramite.documentosFirmados && hayDocsPendientesFirma) {
    acciones.push({
      tipo: 'FIRMAR_DOCUMENTOS',
      titulo: 'Firmar y subir los documentos',
      descripcion: 'Los documentos están listos. Descargalos, firmalos y subilos escaneados.',
      urgencia: 'alta',
      responsable: 'cliente',
      icono: 'firma',
      accion: 'Ir a documentos para firmar',
      link: '#documentos-para-firmar',
    })
  } else if (
    tramite.documentosRevisados &&
    !tramite.documentosFirmados &&
    docsParaFirmar.length > 0
  ) {
    acciones.push({
      tipo: 'DOCS_EN_VALIDACION',
      titulo: 'Revisando tus documentos firmados',
      descripcion: 'Nuestro equipo está revisando los documentos que subiste.',
      urgencia: 'media',
      responsable: 'qms',
      icono: 'revision',
      accion: null,
      link: null,
    })
  }

  /* ── Organismo ─────────────────────────────────────────────────────── */

  if (tramite.documentosFirmados && !tramite.tramiteIngresado) {
    acciones.push({
      tipo: 'ESPERA_INGRESO',
      titulo: 'Preparando el ingreso del trámite',
      descripcion:
        'Tus documentos fueron aprobados. Estamos armando el expediente para presentarlo en el organismo.',
      urgencia: 'baja',
      responsable: 'qms',
      icono: 'espera',
      accion: null,
      link: null,
    })
  }

  if (tramite.tramiteIngresado && !tramite.sociedadInscripta && !tramite.tramiteObservado) {
    acciones.push({
      tipo: 'ESPERA_APROBACION',
      titulo: 'Trámite presentado en el organismo',
      descripcion: `Tu trámite ya fue ingresado en ${tramite.jurisdiccion === 'CORDOBA' ? 'el IPJ' : 'la IGJ'}. Estamos esperando la resolución.`,
      urgencia: 'baja',
      responsable: 'qms',
      icono: 'organismo',
      accion: null,
      link: null,
    })
  }

  if (tramite.tramiteObservado && !tramite.sociedadInscripta) {
    acciones.push({
      tipo: 'OBSERVADO',
      titulo: 'El organismo observó el trámite',
      descripcion: tramite.observacionesOrganismo
        ? `Observaciones del organismo: ${tramite.observacionesOrganismo} Ya las estamos gestionando; te avisamos apenas se resuelva.`
        : 'El organismo hizo observaciones al trámite. Ya las estamos gestionando; te avisamos apenas se resuelva.',
      urgencia: 'media',
      responsable: 'qms',
      icono: 'revision',
      accion: null,
      link: null,
    })
  }

  if (tramite.sociedadInscripta) {
    acciones.push({
      tipo: 'COMPLETADO',
      titulo: 'Tu sociedad está inscripta',
      descripcion: 'Ya podés consultar los datos oficiales (CUIT y matrícula) en el legajo.',
      urgencia: 'completado',
      responsable: 'ninguno',
      icono: 'completado',
      accion: 'Ver el legajo',
      link: '/dashboard/mi-sociedad',
    })
  }

  if (acciones.length > 0) return acciones

  return [
    {
      tipo: 'EN_PROCESO',
      titulo: 'Trámite en proceso',
      descripcion:
        'Estamos trabajando en tu trámite. Te avisamos apenas necesitemos algo de tu parte.',
      urgencia: 'media',
      responsable: 'qms',
      icono: 'espera',
      accion: null,
      link: null,
    },
  ]
}

/** La acción más urgente: primero lo que depende del cliente. */
export function accionPrincipal(acciones: Accion[]): Accion | undefined {
  const orden: Record<Urgencia, number> = { alta: 0, media: 1, baja: 2, completado: 3 }
  return [...acciones].sort((a, b) => {
    if (a.responsable === 'cliente' && b.responsable !== 'cliente') return -1
    if (b.responsable === 'cliente' && a.responsable !== 'cliente') return 1
    return orden[a.urgencia] - orden[b.urgencia]
  })[0]
}
