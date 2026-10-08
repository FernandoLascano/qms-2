/**
 * Fuente única de verdad del estado de un trámite.
 *
 * Antes esto vivía duplicado en tres lugares con criterios distintos:
 *   - app/dashboard/page.tsx            → 7 etapas, inline
 *   - app/dashboard/tramites/page.tsx   → 8 etapas, inline (sumaba documentosRevisados)
 *   - lib/tramites-helpers.ts           → 7 etapas
 * Resultado: el mismo trámite mostraba 71% en "Inicio" y 63% en "Mis Trámites".
 *
 * Hay dos listas, cada una con su uso, y las dos viven acá:
 *   - ETAPAS_FLUJO: los 14 pasos reales del proceso (los que el admin marca en
 *     «Control de Etapas»). El PORCENTAJE de progreso se calcula sobre esta
 *     lista, en todas las pantallas (cliente y admin).
 *   - ETAPAS: los 7 hitos que se muestran en la línea de tiempo y que definen
 *     la «etapa actual» redactada. No se usan para el porcentaje.
 * Antes el encabezado del trámite calculaba sobre 7 y el control sobre 14, y
 * el mismo trámite mostraba 14% arriba y 3/14 (21%) abajo.
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

/** De quién depende un paso del flujo. */
export type Responsable = 'cliente' | 'qms'

export interface PasoFlujo {
  /** Campo booleano del trámite. */
  campo: string
  label: string
  descripcion: string
  responsable: Responsable
}

/** Flujo lineal, en el orden real del proceso. Base del porcentaje de progreso. */
export const ETAPAS_FLUJO: PasoFlujo[] = [
  { campo: 'formularioCompleto', label: 'Formulario Completo', descripcion: 'Cliente completó el formulario', responsable: 'cliente' },
  { campo: 'honorariosPagados', label: 'Honorarios Pagados', descripcion: 'Pago de honorarios confirmado (por ahora manual)', responsable: 'cliente' },
  { campo: 'homonimiaAnalizada', label: 'Análisis de Homonimia', descripcion: 'Se analizó la opción de nombre más viable', responsable: 'qms' },
  { campo: 'ciudadanoDigitalOk', label: 'Ciudadano Digital Nivel 2', descripcion: 'El cliente tiene Ciudadano Digital Nivel 2', responsable: 'cliente' },
  { campo: 'denominacionReservada', label: 'Reserva de Nombre', descripcion: 'Tasa pagada y nombre reservado en IPJ/IGJ', responsable: 'qms' },
  { campo: 'cuentaBancariaAbierta', label: 'Cuenta Bancaria Abierta', descripcion: 'Se abrió la cuenta para el depósito del capital', responsable: 'qms' },
  { campo: 'capitalDepositado', label: 'Capital Depositado (25%)', descripcion: 'Cliente depositó el 25% del capital social', responsable: 'cliente' },
  { campo: 'tasaPagada', label: 'Tasa Final Pagada', descripcion: 'Tasa retributiva final abonada', responsable: 'cliente' },
  { campo: 'borradorEnviado', label: 'Borrador Enviado', descripcion: 'Se envió el borrador al cliente para que lo controle', responsable: 'qms' },
  { campo: 'borradorAprobadoCliente', label: 'Borrador Aprobado', descripcion: 'El cliente controló y aprobó el borrador', responsable: 'cliente' },
  { campo: 'documentosRevisados', label: 'Documentos Enviados', descripcion: 'Estatutos y actas enviados para firma', responsable: 'qms' },
  { campo: 'documentosFirmados', label: 'Documentos Firmados', descripcion: 'Cliente firmó y envió los docs escaneados', responsable: 'cliente' },
  { campo: 'tramiteIngresado', label: 'Trámite Ingresado', descripcion: 'Trámite ingresado en IPJ/IGJ', responsable: 'qms' },
  { campo: 'sociedadInscripta', label: 'Sociedad Inscripta', descripcion: 'CUIT asignado y resolución obtenida', responsable: 'qms' },
]

export const TOTAL_PASOS_FLUJO = ETAPAS_FLUJO.length

type TramiteLike = Record<string, unknown>

const hecho = (tramite: TramiteLike, campo: string) => Boolean(tramite?.[campo])

export interface ResumenProgreso {
  completadas: number
  total: number
  /** 0-100, redondeado. */
  porcentaje: number
}

/** Cuántos pasos del flujo (ETAPAS_FLUJO) están hechos. */
export function resumenProgreso(tramite: TramiteLike): ResumenProgreso {
  const total = TOTAL_PASOS_FLUJO
  if (!tramite) return { completadas: 0, total, porcentaje: 0 }
  // Una sociedad inscripta está terminada aunque falte tildar algún paso intermedio.
  if (hecho(tramite, 'sociedadInscripta')) return { completadas: total, total, porcentaje: 100 }
  const completadas = ETAPAS_FLUJO.filter((e) => hecho(tramite, e.campo)).length
  return { completadas, total, porcentaje: Math.round((completadas / total) * 100) }
}

/** Porcentaje 0-100 sobre los pasos del flujo (ETAPAS_FLUJO). */
export function calcularProgreso(tramite: TramiteLike): number {
  return resumenProgreso(tramite).porcentaje
}

/** Valores de `estadoGeneral` (enum de Prisma). */
export type EstadoGeneral =
  | 'INICIADO'
  | 'EN_PROCESO'
  | 'ESPERANDO_CLIENTE'
  | 'ESPERANDO_APROBACION'
  | 'COMPLETADO'
  | 'CANCELADO'

/**
 * `select` de Prisma con todo lo que necesitan `estadoDerivado`, `getEstado` y
 * `calcularProgreso`. Si falta un campo, el paso cuenta como no hecho.
 */
export const SELECT_ESTADO_DERIVADO = {
  estadoGeneral: true,
  estadoValidacion: true,
  formularioCompleto: true,
  honorariosPagados: true,
  homonimiaAnalizada: true,
  ciudadanoDigitalOk: true,
  denominacionReservada: true,
  cuentaBancariaAbierta: true,
  capitalDepositado: true,
  tasaPagada: true,
  borradorEnviado: true,
  borradorAprobadoCliente: true,
  documentosRevisados: true,
  documentosFirmados: true,
  tramiteIngresado: true,
  sociedadInscripta: true,
} as const

/**
 * Estado del trámite derivado de las etapas tildadas en «Control de Etapas».
 *
 * Es la fuente de verdad para filtros, contadores y etiquetas. El
 * `estadoGeneral` guardado sólo se cambia a mano (Gestión de Estado) y nadie lo
 * actualizaba al tildar etapas: un trámite esperando el depósito de capital
 * seguía guardado como EN_PROCESO y no aparecía en «Esperando cliente». Del
 * guardado sólo se respeta CANCELADO, que es una decisión manual.
 *
 * Para decidir de quién es la pelota se mira el paso siguiente al último
 * tildado (no el primero sin tildar): los trámites viejos tienen pasos
 * intermedios que nunca se marcaron (p. ej. honorariosPagados) y no por eso
 * están esperando al cliente.
 */
export function estadoDerivado(tramite: TramiteLike): EstadoGeneral {
  if (String(tramite?.estadoGeneral ?? '') === 'CANCELADO') return 'CANCELADO'
  if (hecho(tramite, 'sociedadInscripta')) return 'COMPLETADO'
  if (!hecho(tramite, 'formularioCompleto')) return 'INICIADO'

  const estadoValidacion = String(tramite?.estadoValidacion ?? '')
  if (estadoValidacion === 'REQUIERE_CORRECCIONES') return 'ESPERANDO_CLIENTE'
  if (hecho(tramite, 'tramiteIngresado')) return 'ESPERANDO_APROBACION'
  if (estadoValidacion === 'PENDIENTE_VALIDACION') return 'EN_PROCESO'

  let ultimoHecho = -1
  ETAPAS_FLUJO.forEach((e, i) => {
    if (hecho(tramite, e.campo)) ultimoHecho = i
  })
  const siguiente = ETAPAS_FLUJO.slice(ultimoHecho + 1).find((e) => !hecho(tramite, e.campo))
  if (!siguiente) return 'EN_PROCESO'
  return siguiente.responsable === 'cliente' ? 'ESPERANDO_CLIENTE' : 'EN_PROCESO'
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

  // Desde acá manda lo que dicen las etapas, no el estado guardado a mano.
  const derivado = estadoDerivado(tramite)

  if (derivado === 'ESPERANDO_CLIENTE') {
    return {
      label: esAdmin ? 'Esperando al cliente' : 'Te toca a vos',
      tone: 'warning',
      requiereCliente: true,
    }
  }

  if (derivado === 'ESPERANDO_APROBACION') {
    return {
      label: esAdmin ? 'Esperando al organismo' : 'En el organismo',
      tone: 'info',
      requiereCliente: false,
    }
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
      estadoDerivado(tramite) === 'ESPERANDO_CLIENTE',
  )
}
