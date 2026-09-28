import { prisma } from '@/lib/prisma'

/**
 * Estado del respaldo diario a S3 y del uso de espacio, para el panel del admin.
 *
 * Todos los cálculos con la hora actual se hacen acá, del lado del servidor,
 * y la tarjeta sólo pinta el resultado.
 */

const HORA_MS = 60 * 60 * 1000

/** Un backup OK en las últimas 36 h = al día (corre cada 24 h, con margen). */
const HORAS_BACKUP_AL_DIA = 36
/** Supabase pausa a los 7 días sin actividad; avisamos mucho antes. */
const HORAS_ACTIVIDAD = 48

// Topes del plan gratis de Supabase.
const TOPE_BASE_BYTES = 500 * 1024 * 1024
const TOPE_ARCHIVOS_BYTES = 1024 * 1024 * 1024
const PORCENTAJE_ALERTA = 80

export interface UsoEspacio {
  bytes: number
  tope: number
  porcentaje: number
  alerta: boolean
}

export interface EstadoRespaldo {
  ultimoBackupOk: string | null
  alDia: boolean
  /** Error de la última corrida, si la última corrida falló. */
  errorUltimo: string | null
  ultimaActividad: string | null
  activa: boolean
  base: UsoEspacio
  archivos: UsoEspacio & { cantidad: number }
}

function fechaAR(fecha: Date): string {
  return fecha.toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function uso(bytes: number, tope: number): UsoEspacio {
  const porcentaje = Math.round((bytes / tope) * 1000) / 10
  return { bytes, tope, porcentaje, alerta: porcentaje >= PORCENTAJE_ALERTA }
}

export async function getEstadoRespaldo(): Promise<EstadoRespaldo> {
  const [ultimoBackup, ultimoBackupOk, ultimaCorrida, [espacio]] = await Promise.all([
    prisma.maintenanceRun.findFirst({ where: { kind: 'backup' }, orderBy: { createdAt: 'desc' } }),
    prisma.maintenanceRun.findFirst({ where: { kind: 'backup', ok: true }, orderBy: { createdAt: 'desc' } }),
    prisma.maintenanceRun.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.$queryRaw<{ db_bytes: bigint; storage_bytes: bigint; storage_objects: bigint }[]>`
      SELECT * FROM public.storage_usage()
    `,
  ])

  const ahora = Date.now()
  const detalle = ultimoBackup?.detail as { error?: string } | null

  return {
    ultimoBackupOk: ultimoBackupOk ? fechaAR(ultimoBackupOk.createdAt) : null,
    alDia:
      !!ultimoBackupOk &&
      ahora - ultimoBackupOk.createdAt.getTime() < HORAS_BACKUP_AL_DIA * HORA_MS,
    errorUltimo: ultimoBackup && !ultimoBackup.ok ? detalle?.error ?? 'Error desconocido' : null,
    ultimaActividad: ultimaCorrida ? fechaAR(ultimaCorrida.createdAt) : null,
    activa: !!ultimaCorrida && ahora - ultimaCorrida.createdAt.getTime() < HORAS_ACTIVIDAD * HORA_MS,
    base: uso(Number(espacio.db_bytes), TOPE_BASE_BYTES),
    archivos: {
      ...uso(Number(espacio.storage_bytes), TOPE_ARCHIVOS_BYTES),
      cantidad: Number(espacio.storage_objects),
    },
  }
}
