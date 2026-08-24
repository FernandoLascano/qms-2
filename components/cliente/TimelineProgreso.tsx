'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Check } from 'lucide-react'

import { Card, CardBody } from '@/components/ui/card'
import { LabeledProgress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { ETAPAS, calcularProgreso } from '@/lib/tramites/estado'

/**
 * Línea de tiempo de las 7 etapas.
 *
 * Usa ETAPAS de lib/tramites/estado: antes esta lista estaba escrita a mano acá
 * con otros nombres y otro orden que el resto de las pantallas.
 */

const DESCRIPCIONES: Record<string, string> = {
  formulario: 'Datos de la sociedad cargados',
  denominacion: 'Nombre aprobado y reservado',
  capital: '25% del capital social depositado',
  tasa: 'Tasa retributiva abonada',
  firma: 'Documentación firmada y validada',
  ingreso: 'Expediente presentado en el organismo',
  inscripcion: 'CUIT y matrícula asignados',
}

const CAMPOS_FECHA: Record<string, string> = {
  formulario: 'createdAt',
  denominacion: 'fechaReservaNombre',
  capital: 'fechaDepositoCapital',
  tasa: 'fechaPagoTasa',
  ingreso: 'fechaIngresoTramite',
  inscripcion: 'fechaInscripcion',
}

export default function TimelineProgreso({ tramite }: { tramite: any }) {
  const progreso = calcularProgreso(tramite)
  const completo = progreso === 100

  const etapas = ETAPAS.map((etapa) => {
    const campoFecha = CAMPOS_FECHA[etapa.key]
    const fecha = campoFecha ? tramite[campoFecha] : null
    return {
      ...etapa,
      completada: Boolean(tramite[etapa.campo]),
      fecha: fecha ? new Date(fecha) : null,
    }
  })

  const indiceActual = etapas.findIndex((e) => !e.completada)

  return (
    <Card>
      <CardBody className="space-y-4">
        <LabeledProgress
          value={progreso}
          caption={completo ? 'Trámite completado' : 'Progreso del trámite'}
          tone={completo ? 'success' : 'primary'}
        />

        <ol className="relative space-y-0">
          {etapas.map((etapa, i) => {
            const actual = i === indiceActual
            const ultima = i === etapas.length - 1

            return (
              <li key={etapa.key} className="relative flex gap-3 pb-5 last:pb-0">
                {/* Conector */}
                {!ultima && (
                  <span
                    className={cn(
                      'absolute left-[11px] top-6 bottom-0 w-px',
                      etapa.completada ? 'bg-success-solid/40' : 'bg-line',
                    )}
                    aria-hidden
                  />
                )}

                <span
                  className={cn(
                    'relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                    etapa.completada
                      ? 'border-success-solid bg-success-solid text-on-primary'
                      : actual
                        ? 'border-primary bg-surface'
                        : 'border-line bg-surface',
                  )}
                  aria-hidden
                >
                  {etapa.completada ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : actual ? (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  ) : null}
                </span>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p
                      className={cn(
                        'text-body font-medium',
                        etapa.completada ? 'text-ink' : actual ? 'text-primary' : 'text-ink-3',
                      )}
                    >
                      {etapa.label}
                      {actual && (
                        <span className="ml-2 text-label font-normal text-ink-2">
                          — etapa actual
                        </span>
                      )}
                    </p>
                    {etapa.fecha && etapa.completada && (
                      <time
                        dateTime={etapa.fecha.toISOString()}
                        className="text-label text-ink-3 tnum"
                      >
                        {format(etapa.fecha, "d MMM yyyy", { locale: es })}
                      </time>
                    )}
                  </div>
                  <p
                    className={cn(
                      'text-body-sm',
                      etapa.completada || actual ? 'text-ink-2' : 'text-ink-3',
                    )}
                  >
                    {actual && !etapa.completada
                      ? etapa.esperandoCliente
                      : DESCRIPCIONES[etapa.key]}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </CardBody>
    </Card>
  )
}
