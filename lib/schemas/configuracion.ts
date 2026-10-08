// Límites de los campos numéricos de Configuración. Módulo puro: lo usan la
// pantalla (para no mandar un campo vacío o negativo) y el PUT de la API
// (para no guardarlo aunque alguien se saltee la pantalla).
//
// Antes un campo borrado viajaba como NaN (JSON lo convierte en null) y los
// negativos se guardaban tal cual: un precio de -1 o un 0% de originación por
// error llegaban a la web y a la liquidación.

export interface LimiteNumerico {
  label: string
  min: number
  max?: number
  /** true para días/horas: sin decimales. */
  entero?: boolean
}

export const LIMITES_CONFIG = {
  diasAlertaDenominacion: { label: 'Días para alerta de denominación', min: 1, max: 30, entero: true },
  diasAlertaEstancamiento: { label: 'Días para alerta de trámite estancado', min: 1, max: 60, entero: true },
  diasVencimientoReserva: { label: 'Días de validez de la reserva', min: 1, max: 90, entero: true },
  horasLimiteRespuesta: { label: 'Horas límite de respuesta', min: 1, max: 168, entero: true },
  precioBaseSAS: { label: 'Precio base', min: 0 },
  precioPlanBasico: { label: 'Precio del Plan Básico', min: 0 },
  precioPlanEmprendedor: { label: 'Precio del Plan Emprendedor', min: 0 },
  precioPlanPremium: { label: 'Precio del Plan Premium', min: 0 },
  descuentoTransferencia: { label: 'Descuento por transferencia', min: 0, max: 100 },
  smvm: { label: 'SMVM', min: 0 },
  comisionMwPct: { label: 'Comisión MW', min: 0, max: 100 },
  comisionOperadorPct: { label: 'Comisión del operador', min: 0, max: 100 },
  comisionFondoFernandoPct: { label: 'Fondo Fernando', min: 0, max: 100 },
  comisionFondoJustinianoPct: { label: 'Fondo Justiniano', min: 0, max: 100 },
  comisionOriginacionPct: { label: 'Comisión de originación', min: 0, max: 100 },
  domicilioSedePrecioAnual: { label: 'Precio anual del domicilio', min: 0 },
  domicilioSedeDiasAlerta: { label: 'Alerta de vencimiento del domicilio', min: 0, max: 365, entero: true },
} satisfies Record<string, LimiteNumerico>

export type CampoNumericoConfig = keyof typeof LIMITES_CONFIG

/** Mensaje de error para un valor, o null si es válido. */
export function errorCampoConfig(campo: CampoNumericoConfig, valor: unknown): string | null {
  const l: LimiteNumerico = LIMITES_CONFIG[campo]
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return `${l.label}: completá un número`
  if (valor < l.min) return `${l.label}: no puede ser menor a ${l.min}`
  if (l.max !== undefined && valor > l.max) return `${l.label}: no puede ser mayor a ${l.max}`
  if (l.entero && !Number.isInteger(valor)) return `${l.label}: tiene que ser un número entero`
  return null
}

/**
 * Errores de los campos numéricos presentes en `datos`. Un campo ausente
 * (undefined) no se valida: el PUT lo deja como estaba. Además, si vienen los
 * cuatro porcentajes del esquema base, tienen que sumar 100.
 */
export function erroresConfig(datos: Record<string, unknown>): string[] {
  const errores: string[] = []
  for (const campo of Object.keys(LIMITES_CONFIG) as CampoNumericoConfig[]) {
    if (datos[campo] === undefined) continue
    const error = errorCampoConfig(campo, datos[campo])
    if (error) errores.push(error)
  }

  const esquema = ['comisionMwPct', 'comisionOperadorPct', 'comisionFondoFernandoPct', 'comisionFondoJustinianoPct']
  const valores = esquema.map((c) => datos[c])
  if (errores.length === 0 && valores.every((v) => typeof v === 'number')) {
    const suma = (valores as number[]).reduce((a, b) => a + b, 0)
    if (Math.abs(suma - 100) >= 0.001) {
      errores.push(`El esquema base (MW + Operador + Fondos) tiene que sumar 100% (hoy suma ${suma}%)`)
    }
  }
  return errores
}

/** Valor de un input numérico: vacío = NaN (lo marca la validación, no se guarda). */
export function aNumero(valor: string): number {
  return valor.trim() === '' ? NaN : Number(valor)
}

/** Lo que muestra el input: un NaN se ve como campo vacío, no como "NaN". */
export function valorInput(valor: number): number | '' {
  return Number.isFinite(valor) ? valor : ''
}
