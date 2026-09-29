/**
 * Cuentas de la cartera de clientes: vencimientos e ingreso recurrente.
 * Módulo puro, sin Prisma, para usarlo en páginas, APIs y el panel «Hoy».
 */

export type Modalidad = 'UNICO' | 'MENSUAL' | 'ANUAL' | 'SIN_COSTO' | 'A_CONSULTAR'

export const MODALIDAD_TEXTO: Record<Modalidad, string> = {
  UNICO: 'Único',
  MENSUAL: 'Mensual',
  ANUAL: 'Anual',
  SIN_COSTO: 'Sin costo',
  A_CONSULTAR: 'A consultar',
}

/** Sólo lo mensual y lo anual se renueva; el resto no tiene vencimiento propio. */
export const esRecurrente = (m: Modalidad) => m === 'MENSUAL' || m === 'ANUAL'

/** Un período más a partir de una fecha (mediodía UTC, para no correr de día). */
export function sumarPeriodo(desde: Date, modalidad: Modalidad): Date | null {
  if (!esRecurrente(modalidad)) return null
  const d = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth(), desde.getUTCDate(), 12))
  if (modalidad === 'MENSUAL') d.setUTCMonth(d.getUTCMonth() + 1)
  else d.setUTCFullYear(d.getUTCFullYear() + 1)
  return d
}

/**
 * Renovar: el período nuevo arranca desde el vencimiento actual si todavía
 * no pasó, o desde hoy si ya venció (no se cobra el tiempo sin servicio).
 * Mismo criterio que la renovación del domicilio en sede.
 */
export function renovar(vencimientoActual: Date | null, modalidad: Modalidad, hoy = hoyArgentina()): Date | null {
  const base = vencimientoActual && vencimientoActual > hoy ? vencimientoActual : hoy
  return sumarPeriodo(base, modalidad)
}

/*
 * Lo mensual y lo anual se suman por separado. El domicilio en sede, por
 * ejemplo, se cobra una vez al año: dividirlo por 12 mostraba un ingreso
 * mensual que no entra ningún mes.
 */

/** Lo que entra todos los meses. */
export function ingresoMensual(monto: number | null | undefined, modalidad: Modalidad): number {
  return monto && modalidad === 'MENSUAL' ? monto : 0
}

/** Lo que entra una vez por año (renovaciones anuales). */
export function ingresoAnual(monto: number | null | undefined, modalidad: Modalidad): number {
  return monto && modalidad === 'ANUAL' ? monto : 0
}

/**
 * Hoy según el calendario argentino, a mediodía UTC como el resto de las
 * fechas. En UTC puro el día cambia a las 21 h de Argentina y los
 * vencimientos se correrían uno a la noche.
 */
export function hoyArgentina(): Date {
  const dia = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  return new Date(`${dia}T12:00:00.000Z`)
}

/** Un día elegido en un input de fecha (YYYY-MM-DD) → fecha para guardar. */
export const diaParaGuardar = (dia: string) => new Date(`${dia}T12:00:00.000Z`)

/** Días hasta una fecha (negativo = vencido), por día calendario. */
export function diasHasta(fecha: Date, hoy = hoyArgentina()): number {
  const a = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate())
  const b = Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate())
  return Math.round((b - a) / 86_400_000)
}

/** Ventana en la que un vencimiento ya se muestra como «por vencer». */
export const DIAS_AVISO = 30
