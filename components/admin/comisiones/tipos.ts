import type { Beneficiario, Originador } from '@/lib/comisiones'

export type Movimiento = {
  id: string
  fecha: string
  cliente: string
  asunto: string
  monto: number
  originador: Originador
  origen: 'PAGO' | 'MANUAL'
  pagoId: string | null
  tramiteId: string | null
  notas: string | null
}

export type Liquidacion = {
  periodo: string
  beneficiario: Beneficiario
  monto: number
  pagado: boolean
  fechaPago: string | null
}

export type Distribucion = {
  id: string
  fecha: string
  beneficiario: Beneficiario
  monto: number
  notas: string | null
}

export type Gasto = {
  id: string
  fecha: string
  concepto: string
  monto: number
  imputadoA: Beneficiario | null
  notas: string | null
}

export const ORIGINADORES: Originador[] = ['NINGUNO', 'FERNANDO', 'JUSTINIANO', 'MW']

/** Orden fijo en toda la pantalla: antes cada bloque los listaba distinto. */
export const BENEFICIARIOS: Beneficiario[] = ['FERNANDO', 'JUSTINIANO', 'MW']

/** Un color por persona, el mismo en avatares, barras y leyendas. */
export const COLOR_DE: Record<Beneficiario, { suave: string; solido: string }> = {
  FERNANDO: { suave: 'bg-a3-soft text-a3 ring-a3-line', solido: 'bg-a3-solid' },
  JUSTINIANO: { suave: 'bg-a4-soft text-a4 ring-a4-line', solido: 'bg-a4-solid' },
  MW: { suave: 'bg-a1-soft text-a1 ring-a1-line', solido: 'bg-primary' },
}

export const fmt = (n: number) =>
  '$' + (Math.round(n * 100) / 100).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

/** Sin centavos: para las cifras grandes de las tarjetas. */
export const fmtRedondo = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')

/* Las fechas se guardan como medianoche UTC. Sin fijar la zona, el navegador
   las pasa a hora argentina (UTC−3) y retrocede un día. */
export const fmtFecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { timeZone: 'UTC' })

export const periodoDeISO = (iso: string) => {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/** fetch + JSON + error legible en un solo lugar. */
export async function pedir(url: string, init?: RequestInit & { json?: unknown }) {
  const res = await fetch(url, {
    ...init,
    headers: init?.json !== undefined ? { 'Content-Type': 'application/json' } : init?.headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Algo salió mal')
  return data
}
