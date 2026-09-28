import { AlertTriangle, CheckCircle2, DatabaseBackup, HardDrive } from 'lucide-react'
import { Card, CardBody, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { EstadoRespaldo, UsoEspacio } from '@/lib/respaldo'

/**
 * Respaldo diario a S3 y espacio usado contra los topes del plan gratis de
 * Supabase. Los datos (y las cuentas con la hora actual) vienen calculados del
 * servidor: ver lib/respaldo.ts.
 */
export function RespaldoStatus({ estado }: { estado: EstadoRespaldo | null }) {
  if (!estado) {
    return (
      <Card>
        <CardBody>
          <div className="rounded-control bg-danger-soft border border-danger-line px-4 py-3 text-body-sm text-danger">
            No se pudo leer el estado del respaldo.
          </div>
        </CardBody>
      </Card>
    )
  }

  const problema = !estado.alDia || !estado.activa || estado.base.alerta || estado.archivos.alerta

  return (
    <Card className={problema ? 'border-2 border-warning-line' : ''}>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
        <div
          className={cn(
            'h-10 w-10 rounded-control flex items-center justify-center',
            problema ? 'bg-warning-soft' : 'bg-success-soft',
          )}
        >
          <DatabaseBackup className={cn('h-5 w-5', problema ? 'text-warning' : 'text-success')} />
        </div>
        <div>
          <CardTitle className="text-body font-semibold text-ink">Respaldo y espacio</CardTitle>
          <p className="text-label text-ink-2">Copia diaria de la base y los archivos en AWS S3</p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-body-sm font-medium text-ink">Último respaldo completo</p>
              {estado.alDia ? (
                <Badge tone="success" dot size="sm">Al día</Badge>
              ) : (
                <Badge tone="warning" dot size="sm">Atrasado</Badge>
              )}
            </div>
            <p className="text-body-sm text-ink-2 tnum">{estado.ultimoBackupOk ?? 'Todavía no hubo ninguno'}</p>
            {estado.errorUltimo && (
              <p className="mt-2 rounded-control bg-danger-soft border border-danger-line px-3 py-2 text-label text-danger">
                Falló la última corrida: {estado.errorUltimo}
              </p>
            )}
          </div>

          <div className="flex items-start gap-2 text-body-sm">
            {estado.activa ? (
              <>
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success mt-0.5" />
                <p className="text-ink-2">
                  La base tuvo actividad en las últimas 48 h: no se va a pausar.
                </p>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-warning mt-0.5" />
                <p className="text-warning">
                  Sin actividad registrada en las últimas 48 h
                  {estado.ultimaActividad ? ` (última: ${estado.ultimaActividad})` : ''}. Supabase pausa la
                  base a los 7 días: revisá el cron de latido y el respaldo.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <BarraUso titulo="Base de datos" uso={estado.base} />
          <BarraUso
            titulo="Archivos"
            uso={estado.archivos}
            extra={`${estado.archivos.cantidad} archivo${estado.archivos.cantidad !== 1 ? 's' : ''}`}
          />
          <p className="flex items-center gap-1.5 text-label text-ink-3">
            <HardDrive className="h-3.5 w-3.5" />
            Topes del plan gratis de Supabase
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function formatoBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

function BarraUso({ titulo, uso, extra }: { titulo: string; uso: UsoEspacio; extra?: string }) {
  const ancho = Math.min(100, Math.max(uso.porcentaje, 1))
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-body-sm">
        <span className="font-medium text-ink">
          {titulo}
          {extra && <span className="ml-1.5 font-normal text-ink-3">· {extra}</span>}
        </span>
        <span className={cn('tnum', uso.alerta ? 'font-semibold text-warning' : 'text-ink-2')}>
          {formatoBytes(uso.bytes)} de {formatoBytes(uso.tope)}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-surface-3"
        role="progressbar"
        aria-label={`${titulo}: ${uso.porcentaje}% usado`}
        aria-valuenow={uso.porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full rounded-full', uso.alerta ? 'bg-warning-solid' : 'bg-primary')}
          style={{ width: `${ancho}%` }}
        />
      </div>
    </div>
  )
}
