import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ETAPAS_FLUJO } from '@/lib/tramites/estado'

/*
 * Tiempos por etapa sobre los 14 pasos reales del flujo (ETAPAS_FLUJO), los
 * mismos que el admin tilda en «Control de Etapas». Antes se medían las 7
 * etapas viejas y los pasos nuevos (honorarios, homonimia, cuenta bancaria,
 * borrador…) quedaban sumados adentro de otra etapa.
 *
 * Cada paso guarda su fecha en `fecha<Campo>` (lo pone PATCH …/etapas). El
 * tiempo de un paso se mide desde el último paso anterior que tenga fecha
 * (o desde la creación del trámite): los trámites viejos tienen pasos que
 * nunca se marcaron y no por eso hay que descartar el resto.
 */
const campoFecha = (campo: string) => `fecha${campo[0].toUpperCase()}${campo.slice(1)}`
const CAMPOS_FECHA = ETAPAS_FLUJO.map((e) => campoFecha(e.campo))
const MS_DIA = 1000 * 60 * 60 * 24

type ConFechas = { createdAt: Date } & Record<string, unknown>

const fechaDe = (tramite: ConFechas, campo: string): Date | null => {
  const valor = tramite[campoFecha(campo)]
  return valor instanceof Date ? valor : null
}

/** Milisegundos que tomó cada paso con fecha, en el orden del flujo. */
function duracionesPorPaso(tramite: ConFechas): Record<string, number> {
  const out: Record<string, number> = {}
  let anterior = tramite.createdAt
  for (const paso of ETAPAS_FLUJO) {
    const fecha = fechaDe(tramite, paso.campo)
    if (!fecha) continue
    const diff = fecha.getTime() - anterior.getTime()
    // Un paso tildado fuera de orden da negativo: no es un tiempo real.
    if (diff >= 0) out[paso.campo] = diff
    if (fecha > anterior) anterior = fecha
  }
  return out
}

const SELECT_FECHAS = Object.fromEntries(CAMPOS_FECHA.map((c) => [c, true])) as Record<string, true>


// GET - Obtener métricas de tracking de tiempo
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const tramiteId = searchParams.get('tramiteId')

    if (tramiteId) {
      // Tracking de tiempo para un trámite específico
      const tramite = (await prisma.tramite.findUnique({
        where: { id: tramiteId },
        select: {
          id: true,
          denominacionSocial1: true,
          denominacionAprobada: true,
          createdAt: true,
          ...SELECT_FECHAS,
        },
      })) as (ConFechas & { id: string; denominacionSocial1: string | null; denominacionAprobada: string | null }) | null

      if (!tramite) {
        return NextResponse.json(
          { error: 'Trámite no encontrado' },
          { status: 404 }
        )
      }

      const tiempos: Record<string, { dias: number, horas: number, minutos: number } | null> = {}
      for (const [campo, diff] of Object.entries(duracionesPorPaso(tramite))) {
        tiempos[campo] = calcularTiempo(diff)
      }

      // Tiempo total
      let tiempoTotal = null
      const fin = fechaDe(tramite, 'sociedadInscripta') ?? fechaDe(tramite, 'tramiteIngresado')
      if (fin) tiempoTotal = calcularTiempo(fin.getTime() - tramite.createdAt.getTime())

      return NextResponse.json({
        tramite: {
          id: tramite.id,
          denominacion: tramite.denominacionAprobada || tramite.denominacionSocial1
        },
        tiempos,
        tiempoTotal
      })
    } else {
      // Métricas agregadas de todos los trámites
      const tramites = (await prisma.tramite.findMany({
        where: {
          formularioCompleto: true
        },
        select: { createdAt: true, ...SELECT_FECHAS },
      })) as ConFechas[]

      // Promedio en días de cada paso, en el orden del flujo.
      const acumulado: Record<string, number[]> = {}
      for (const tramite of tramites) {
        for (const [campo, diff] of Object.entries(duracionesPorPaso(tramite))) {
          ;(acumulado[campo] ??= []).push(diff)
        }
      }
      const promedios: Record<string, number> = {}
      for (const paso of ETAPAS_FLUJO) {
        const lista = acumulado[paso.campo]
        if (lista?.length) promedios[paso.campo] = lista.reduce((a, b) => a + b, 0) / lista.length / MS_DIA
      }

      // Tiempo promedio total
      const tiemposTotales: number[] = []
      tramites.forEach(tramite => {
        const fechaFinal = fechaDe(tramite, 'sociedadInscripta') ?? fechaDe(tramite, 'tramiteIngresado')
        if (fechaFinal) {
          tiemposTotales.push(fechaFinal.getTime() - tramite.createdAt.getTime())
        }
      })

      const tiempoPromedioTotal = tiemposTotales.length > 0
        ? tiemposTotales.reduce((a, b) => a + b, 0) / tiemposTotales.length / MS_DIA
        : 0

      return NextResponse.json({
        promedios,
        tiempoPromedioTotal,
        totalTramites: tramites.length
      })
    }

  } catch {
    return NextResponse.json(
      { error: 'Error al obtener tracking de tiempo' },
      { status: 500 }
    )
  }
}

function calcularTiempo(diffMs: number) {
  const dias = Math.floor(diffMs / MS_DIA)
  const horas = Math.floor((diffMs % MS_DIA) / (1000 * 60 * 60))
  const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  return { dias, horas, minutos }
}
