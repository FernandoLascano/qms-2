import { prisma } from '@/lib/prisma'
import { cuitValido, soloDigitos } from '@/lib/validaciones'

/**
 * Situación crediticia en la Central de Deudores del BCRA, para los clientes
 * a los que les prestamos el domicilio: si la sociedad o sus socios andan mal
 * financieramente, queremos enterarnos antes de que llegue una carta documento
 * a la sede.
 *
 * La API es pública y sin clave (https://api.bcra.gob.ar). El BCRA actualiza
 * los datos una vez por mes, así que el seguimiento es mensual. Los montos
 * vienen en miles de pesos. Un 404 no es un error: la persona no figura, que
 * es la mejor noticia posible.
 */

const API = 'https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas'

export const SITUACIONES: Record<number, string> = {
  0: 'No figura',
  1: 'Normal',
  2: 'Riesgo bajo',
  3: 'Riesgo medio',
  4: 'Riesgo alto',
  5: 'Irrecuperable',
  6: 'Irrecuperable (disp. técnica)',
}

export type Nivel = 'OK' | 'ATENCION' | 'RIESGO' | 'ERROR' | 'SIN_CONSULTAR'
const ORDEN_NIVEL: Record<Nivel, number> = { SIN_CONSULTAR: 0, ERROR: 0, OK: 1, ATENCION: 2, RIESGO: 3 }

export type RolBcra = 'SOCIEDAD' | 'SOCIO' | 'ADMINISTRADOR' | 'SOCIO_ADMINISTRADOR'
export type EntidadBcra = { entidad: string; situacion: number; monto: number; diasAtraso: number; procesoJudicial: boolean }
export type MesBcra = { periodo: string; situacion: number; monto: number }
export type ChequeBcra = { entidad: string; causal: string; fecha: string; monto: number; pagado: boolean }

export type ResultadoBcra = {
  periodo: string | null
  peorSituacion: number
  deudaTotal: number
  entidades: EntidadBcra[]
  historial: MesBcra[]
  chequesRechazados: number
  chequesSinPagar: number
  cheques: ChequeBcra[]
}

/** Lo que pesa en el semáforo: situación 2 o un cheque rechazado (pagado) avisa; 3+ o cheque impago es riesgo. */
export function nivelDe(c: { peorSituacion: number; chequesRechazados: number; chequesSinPagar: number; error?: string | null } | null): Nivel {
  if (!c) return 'SIN_CONSULTAR'
  if (c.error) return 'ERROR'
  if (c.peorSituacion >= 3 || c.chequesSinPagar > 0) return 'RIESGO'
  if (c.peorSituacion === 2 || c.chequesRechazados > 0) return 'ATENCION'
  return 'OK'
}

/** El peor nivel de un grupo de personas (el de la sociedad para el semáforo general). */
export function peorNivel(niveles: Nivel[]): Nivel {
  if (niveles.length === 0) return 'SIN_CONSULTAR'
  const conDatos = niveles.filter((n) => n !== 'SIN_CONSULTAR' && n !== 'ERROR')
  if (conDatos.length === 0) return niveles.includes('ERROR') ? 'ERROR' : 'SIN_CONSULTAR'
  return conDatos.reduce((a, b) => (ORDEN_NIVEL[b] > ORDEN_NIVEL[a] ? b : a))
}

async function pedir(ruta: string): Promise<{ results?: Record<string, unknown> } | null> {
  const res = await fetch(`${API}/${ruta}`, { signal: AbortSignal.timeout(20_000), cache: 'no-store' })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`BCRA respondió ${res.status}`)
  return res.json()
}

type PeriodoApi = { periodo: string; entidades?: { entidad: string; situacion: number; monto: number; diasAtrasoPago?: number; procesoJud?: boolean }[] }

/** Las tres consultas del BCRA para un CUIT, resumidas. */
export async function consultarCuit(cuit: string): Promise<ResultadoBcra> {
  const [actual, historicas, cheques] = await Promise.all([
    pedir(cuit),
    pedir(`Historicas/${cuit}`),
    pedir(`ChequesRechazados/${cuit}`),
  ])

  const ultimo = ((actual?.results?.periodos as PeriodoApi[] | undefined) ?? [])[0]
  const entidades: EntidadBcra[] = (ultimo?.entidades ?? []).map((e) => ({
    entidad: e.entidad,
    situacion: e.situacion,
    monto: e.monto,
    diasAtraso: e.diasAtrasoPago ?? 0,
    procesoJudicial: !!e.procesoJud,
  }))

  const historial: MesBcra[] = ((historicas?.results?.periodos as PeriodoApi[] | undefined) ?? [])
    .map((p) => ({
      periodo: p.periodo,
      situacion: Math.max(0, ...(p.entidades ?? []).map((e) => e.situacion)),
      monto: (p.entidades ?? []).reduce((a, e) => a + (e.monto || 0), 0),
    }))
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .slice(-24)

  type CausalApi = { causal: string; entidades?: { entidad: number | string; detalle?: { fechaRechazo: string; monto: number; fechaPago?: string | null }[] }[] }
  const listaCheques: ChequeBcra[] = ((cheques?.results?.causales as CausalApi[] | undefined) ?? []).flatMap((c) =>
    (c.entidades ?? []).flatMap((e) =>
      (e.detalle ?? []).map((d) => ({
        entidad: String(e.entidad),
        causal: c.causal,
        fecha: d.fechaRechazo,
        monto: d.monto,
        pagado: !!d.fechaPago,
      })),
    ),
  )

  return {
    periodo: ultimo?.periodo ?? null,
    peorSituacion: Math.max(0, ...entidades.map((e) => e.situacion)),
    deudaTotal: entidades.reduce((a, e) => a + (e.monto || 0), 0),
    entidades,
    historial,
    chequesRechazados: listaCheques.length,
    chequesSinPagar: listaCheques.filter((c) => !c.pagado).length,
    cheques: listaCheques,
  }
}

type PersonaJson = { nombre?: string; apellido?: string; cuit?: string }
const lista = (v: unknown): PersonaJson[] => (Array.isArray(v) ? (v as PersonaJson[]) : [])
const nombreDe = (p: PersonaJson) => `${p.nombre || ''} ${p.apellido || ''}`.trim()

/** A quién se consulta: la sociedad (si ya tiene CUIT), los socios y los administradores, sin repetir. */
export function personasAConsultar(tramite: {
  cuit: string | null
  denominacionAprobada: string | null
  denominacionSocial1: string | null
  socios: unknown
  administradores: unknown
}): { cuit: string; rol: RolBcra; nombre: string }[] {
  const porCuit = new Map<string, { cuit: string; rol: RolBcra; nombre: string }>()
  const sumar = (cuitCrudo: string | null | undefined, rol: RolBcra, nombre: string) => {
    const cuit = soloDigitos(cuitCrudo)
    if (!cuitValido(cuit)) return
    const ya = porCuit.get(cuit)
    if (ya) {
      if ((ya.rol === 'SOCIO' && rol === 'ADMINISTRADOR') || (ya.rol === 'ADMINISTRADOR' && rol === 'SOCIO')) ya.rol = 'SOCIO_ADMINISTRADOR'
      return
    }
    porCuit.set(cuit, { cuit, rol, nombre })
  }
  sumar(tramite.cuit, 'SOCIEDAD', tramite.denominacionAprobada || tramite.denominacionSocial1 || 'La sociedad')
  for (const s of lista(tramite.socios)) sumar(s.cuit, 'SOCIO', nombreDe(s))
  for (const a of lista(tramite.administradores)) sumar(a.cuit, 'ADMINISTRADOR', nombreDe(a))
  return [...porCuit.values()]
}

export type Empeoro = { nombre: string; rol: RolBcra; antes: Nivel; ahora: Nivel; peorSituacion: number; chequesNuevos: number }

/**
 * Consulta a todas las personas de un trámite y guarda una fila por CUIT.
 * Devuelve quiénes empeoraron respecto de su consulta anterior (para el aviso).
 */
export async function consultarTramite(tramiteId: string): Promise<{ consultados: number; empeoraron: Empeoro[] }> {
  const tramite = await prisma.tramite.findUnique({
    where: { id: tramiteId },
    select: { cuit: true, denominacionAprobada: true, denominacionSocial1: true, socios: true, administradores: true },
  })
  if (!tramite) throw new Error('Trámite no encontrado')

  const personas = personasAConsultar(tramite)
  const empeoraron: Empeoro[] = []

  // De a una: la API del BCRA es pública y no conviene apurarla.
  for (const p of personas) {
    const anterior = await prisma.consultaBcra.findFirst({
      where: { tramiteId, cuit: p.cuit, error: null },
      orderBy: { consultadoEl: 'desc' },
    })
    let r: ResultadoBcra | null = null
    let error: string | null = null
    try {
      r = await consultarCuit(p.cuit)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Error al consultar el BCRA'
    }
    await prisma.consultaBcra.create({
      data: {
        tramiteId,
        cuit: p.cuit,
        rol: p.rol,
        nombre: p.nombre,
        periodo: r?.periodo ?? null,
        peorSituacion: r?.peorSituacion ?? 0,
        deudaTotal: r?.deudaTotal ?? 0,
        entidades: r?.entidades ?? [],
        historial: r?.historial ?? [],
        chequesRechazados: r?.chequesRechazados ?? 0,
        chequesSinPagar: r?.chequesSinPagar ?? 0,
        cheques: r?.cheques ?? [],
        error,
      },
    })
    if (!r) continue
    const antes = nivelDe(anterior)
    const ahora = nivelDe({ ...r, error: null })
    const chequesNuevos = r.chequesRechazados - (anterior?.chequesRechazados ?? 0)
    if (ORDEN_NIVEL[ahora] > Math.max(ORDEN_NIVEL[antes], ORDEN_NIVEL.OK) || chequesNuevos > 0) {
      empeoraron.push({ nombre: p.nombre, rol: p.rol, antes, ahora, peorSituacion: r.peorSituacion, chequesNuevos: Math.max(0, chequesNuevos) })
    }
  }

  return { consultados: personas.length, empeoraron }
}

export type FilaBcra = {
  cuit: string
  rol: string
  nombre: string
  periodo: string | null
  peorSituacion: number
  deudaTotal: number
  entidades: EntidadBcra[]
  historial: MesBcra[]
  chequesRechazados: number
  chequesSinPagar: number
  cheques: ChequeBcra[]
  error: string | null
  consultadoEl: string
  nivel: Nivel
}

/** La última consulta de cada CUIT de varios trámites, agrupada por trámite. */
export async function ultimasConsultas(tramiteIds: string[]): Promise<Map<string, FilaBcra[]>> {
  const porTramite = new Map<string, FilaBcra[]>()
  if (tramiteIds.length === 0) return porTramite
  const filas = await prisma.consultaBcra.findMany({
    where: { tramiteId: { in: tramiteIds } },
    orderBy: { consultadoEl: 'desc' },
  })
  const vistos = new Set<string>()
  for (const f of filas) {
    const clave = `${f.tramiteId}:${f.cuit}`
    if (vistos.has(clave)) continue
    vistos.add(clave)
    const fila: FilaBcra = {
      cuit: f.cuit,
      rol: f.rol,
      nombre: f.nombre,
      periodo: f.periodo,
      peorSituacion: f.peorSituacion,
      deudaTotal: f.deudaTotal,
      entidades: f.entidades as EntidadBcra[],
      historial: f.historial as MesBcra[],
      chequesRechazados: f.chequesRechazados,
      chequesSinPagar: f.chequesSinPagar,
      cheques: f.cheques as ChequeBcra[],
      error: f.error,
      consultadoEl: f.consultadoEl.toISOString(),
      nivel: nivelDe(f),
    }
    porTramite.set(f.tramiteId, [...(porTramite.get(f.tramiteId) ?? []), fila])
  }
  // Primero la sociedad, después socios y administradores.
  for (const lista of porTramite.values()) lista.sort((a, b) => Number(b.rol === 'SOCIEDAD') - Number(a.rol === 'SOCIEDAD'))
  return porTramite
}

/** Resumen para la lista: semáforo general y fecha de la última consulta. */
export function resumenBcra(filas: FilaBcra[] | undefined) {
  if (!filas || filas.length === 0) return { nivel: 'SIN_CONSULTAR' as Nivel, consultadoEl: null, personas: 0 }
  return {
    nivel: peorNivel(filas.map((f) => f.nivel)),
    consultadoEl: filas.map((f) => f.consultadoEl).sort().at(-1) ?? null,
    personas: filas.length,
  }
}
