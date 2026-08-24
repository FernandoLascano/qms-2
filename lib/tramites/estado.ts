/**
 * Fuente única de verdad del estado de un trámite.
 *
 * Antes esto vivía duplicado en tres lugares con criterios distintos:
 *   - app/dashboard/page.tsx            → 7 etapas, inline
 *   - app/dashboard/tramites/page.tsx   → 8 etapas, inline (sumaba documentosRevisados)
 *   - lib/tramites-helpers.ts           → 7 etapas
 * Resultado: el mismo trámite mostraba 71% en "Inicio" y 63% en "Mis Trámites".
 *
 * El progreso es de 7 etapas. "Documentos revisados" (aprobación del borrador
 * por el cliente) es un sub-paso interno de la firma y no suma porcentaje.
 */

export type Tone = 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger'

/** Quién está mirando: cambia la redacción, nunca el color ni el porcentaje. */
export type Audiencia = 'cliente' | 'admin'

export interface EtapaDef {
  key: string
  campo: string
  /** Etiqueta corta para el timeline. */
  label: string
  /** Qué se está esperando, en voz del cliente. */
  esperandoCliente: string
  /** Qué se está esperando, en voz del admin. */
  esperandoAdmin: string
}

export const ETAPAS: EtapaDef[] = [
  {
    key: 'formulario',
    campo: 'formularioCompleto',
    label: 'Formulario',
    esperandoCliente: 'Completá el formulario',
    esperandoAdmin: 'Formulario pendiente',
  },
  {
    key: 'denominacion',
    campo: 'denominacionReservada',
    label: 'Denominación',
    esperandoCliente: 'Estamos reservando la denominación',
    esperandoAdmin: 'Reservar denominación',
  },
  {
    key: 'capital',
    campo: 'capitalDepositado',
    label: 'Capital',
    esperandoCliente: 'Depositá el 25% del capital',
    esperandoAdmin: 'Esperando depósito de capital',
  },
  {
    key: 'tasa',
    campo: 'tasaPagada',
    label: 'Tasas',
    esperandoCliente: 'Pagá la tasa del organismo',
    esperandoAdmin: 'Esperando pago de tasa',
  },
  {
    key: 'firma',
    campo: 'documentosFirmados',
    label: 'Firma',
    esperandoCliente: 'Firmá los documentos',
    esperandoAdmin: 'Esperando firma de documentos',
  },
  {
    key: 'ingreso',
    campo: 'tramiteIngresado',
    label: 'Ingreso',
    esperandoCliente: 'Estamos ingresando el trámite',
    esperandoAdmin: 'Ingresar el trámite al organismo',
  },
  {
    key: 'inscripcion',
    campo: 'sociedadInscripta',
    label: 'Inscripción',
    esperandoCliente: 'Esperando la inscripción',
    esperandoAdmin: 'Esperando resolución del organismo',
  },
]

export const TOTAL_ETAPAS = ETAPAS.length

type TramiteLike = Record<string, unknown>

const hecho = (tramite: TramiteLike, campo: string) => Boolean(tramite?.[campo])

/** Porcentaje 0-100 sobre las 7 etapas. */
export function calcularProgreso(tramite: TramiteLike): number {
  if (!tramite) return 0
  const completadas = ETAPAS.filter((e) => hecho(tramite, e.campo)).length
  return Math.round((completadas / TOTAL_ETAPAS) * 100)
}

export interface EtapaEstado extends EtapaDef {
  completada: boolean
  actual: boolean
}

/** Estado de cada etapa, para dibujar el timeline. */
export function detalleEtapas(tramite: TramiteLike): EtapaEstado[] {
  const primeraPendiente = ETAPAS.findIndex((e) => !hecho(tramite, e.campo))
  return ETAPAS.map((etapa, i) => ({
    ...etapa,
    completada: hecho(tramite, etapa.campo),
    actual: i === primeraPendiente,
  }))
}

/** La etapa en curso, redactada según quién mira. */
export function etapaActual(
  tramite: TramiteLike,
  audiencia: Audiencia = 'cliente',
): string {
  const pendiente = ETAPAS.find((e) => !hecho(tramite, e.campo))
  if (!pendiente) return 'Sociedad inscripta'
  return audiencia === 'admin' ? pendiente.esperandoAdmin : pendiente.esperandoCliente
}

export interface EstadoVisual {
  label: string
  tone: Tone
  /** true cuando la pelota está del lado del cliente. */
  requiereCliente: boolean
}

/**
 * Estado visual del trámite.
 *
 * El tono es el mismo para ambas audiencias (para que un trámite no sea gris
 * en una pantalla y violeta en otra); sólo cambia la redacción.
 */
export function getEstado(
  tramite: TramiteLike,
  audiencia: Audiencia = 'cliente',
): EstadoVisual {
  const esAdmin = audiencia === 'admin'
  const progreso = calcularProgreso(tramite)
  const inscripta = hecho(tramite, 'sociedadInscripta')
  const estadoGeneral = String(tramite?.estadoGeneral ?? '')
  const estadoValidacion = String(tramite?.estadoValidacion ?? '')

  if (estadoGeneral === 'CANCELADO') {
    return { label: 'Cancelado', tone: 'danger', requiereCliente: false }
  }

  if (progreso === 100 || inscripta) {
    return { label: 'Completado', tone: 'success', requiereCliente: false }
  }

  // Borrador: empezó el formulario y nunca lo envió.
  if (!hecho(tramite, 'formularioCompleto')) {
    return {
      label: esAdmin ? 'Borrador' : 'Sin enviar',
      tone: 'neutral',
      requiereCliente: true,
    }
  }

  if (estadoValidacion === 'PENDIENTE_VALIDACION') {
    return {
      label: esAdmin ? 'Por validar' : 'En revisión',
      tone: 'warning',
      requiereCliente: false,
    }
  }

  if (estadoValidacion === 'REQUIERE_CORRECCIONES') {
    return {
      label: esAdmin ? 'Con correcciones' : 'Requiere correcciones',
      tone: 'warning',
      requiereCliente: true,
    }
  }

  if (estadoGeneral === 'ESPERANDO_CLIENTE') {
    return {
      label: esAdmin ? 'Esperando al cliente' : 'Te toca a vos',
      tone: 'warning',
      requiereCliente: true,
    }
  }

  if (estadoGeneral === 'ESPERANDO_APROBACION') {
    return {
      label: esAdmin ? 'Esperando al organismo' : 'En el organismo',
      tone: 'info',
      requiereCliente: false,
    }
  }

  if (estadoGeneral === 'INICIADO') {
    return { label: 'Iniciado', tone: 'info', requiereCliente: false }
  }

  return { label: 'En proceso', tone: 'info', requiereCliente: false }
}

/**
 * ¿El trámite necesita una acción del cliente ahora?
 * Un trámite ya inscripto nunca requiere atención.
 */
export function requiereAtencionCliente(tramite: {
  pagos?: unknown[]
  enlacesPago?: unknown[]
  documentos?: unknown[]
  estadoGeneral?: string
  sociedadInscripta?: boolean
  [k: string]: unknown
}): boolean {
  if (calcularProgreso(tramite) === 100 || tramite.sociedadInscripta) return false
  return Boolean(
    tramite.pagos?.length ||
      tramite.enlacesPago?.length ||
      tramite.documentos?.length ||
      tramite.estadoGeneral === 'ESPERANDO_CLIENTE' ||
      tramite.estadoValidacion === 'REQUIERE_CORRECCIONES',
  )
}
