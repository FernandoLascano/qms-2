'use client'

import { useState } from 'react'
import { AlertTriangle, Check, ChevronDown } from 'lucide-react'

import { Card, CardBody } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatearFecha } from '@/lib/fechas'
import { pasosCliente } from '@/lib/tramites/pasos-cliente'

/**
 * Línea de tiempo del trámite, vista por el cliente.
 *
 * Sigue los pasos que ve el cliente (lib/tramites/pasos-cliente), con la
 * fecha real de cada uno y quién tiene que moverse en el paso actual.
 */

export default function TimelineProgreso({ tramite }: { tramite: Record<string, unknown> }) {
  const { pasos, porcentaje, indiceActual, inscripta } = pasosCliente(tramite)
  const observado = Boolean(tramite.tramiteObservado) && !inscripta

  // Lo ya hecho se pliega para que el paso actual quede a la vista.
  const [verHechos, setVerHechos] = useState(false)
  const corte = inscripta ? pasos.length - 1 : indiceActual
  const plegables = corte > 2 ? corte - 1 : 0

  return (
    <Card>
      <CardBody className="space-y-5">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-body-sm font-semibold text-ink">
              {inscripta ? '¡Sociedad inscripta!' : `Paso ${indiceActual + 1} de ${pasos.length}`}
            </p>
            <span className="text-label font-semibold text-ink-2 tnum">{porcentaje}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-n-200" role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100} aria-label="Avance del trámite">
            <div
              className={cn('h-full rounded-full transition-[width] duration-700 ease-out', inscripta ? 'bg-success-solid' : 'bg-primary')}
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>

        <ol className="relative">
          {plegables > 0 && (
            <li className="relative flex gap-3 pb-4">
              <span className="absolute bottom-0 left-[11px] top-6 w-0.5 bg-success-solid/40" aria-hidden />
              <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-solid text-on-primary" aria-hidden>
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <button
                type="button"
                onClick={() => setVerHechos((v) => !v)}
                aria-expanded={verHechos}
                className="-my-1 flex min-h-8 items-center gap-1 rounded-control px-1 text-body-sm font-medium text-ink-2 hover:text-ink"
              >
                {verHechos ? 'Ocultar' : 'Ver'} {plegables} pasos completados
                <ChevronDown className={cn('h-4 w-4 transition-transform', verHechos && 'rotate-180')} aria-hidden />
              </button>
            </li>
          )}

          {pasos.map((paso, i) => {
            if (plegables > 0 && !verHechos && i < plegables) return null
            const actual = i === indiceActual
            const ultimo = i === pasos.length - 1
            const deVos = actual && paso.responsable === 'cliente'

            return (
              <li key={paso.key} className={cn('relative flex gap-3', !ultimo && 'pb-4')}>
                {!ultimo && (
                  <span
                    className={cn('absolute bottom-0 left-[11px] top-6 w-0.5', paso.completado ? 'bg-success-solid/40' : 'bg-line')}
                    aria-hidden
                  />
                )}

                <span
                  className={cn(
                    'relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                    paso.completado
                      ? 'border-success-solid bg-success-solid text-on-primary'
                      : actual
                        ? 'border-primary bg-surface'
                        : 'border-line bg-surface',
                  )}
                  aria-hidden
                >
                  {paso.completado ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : actual ? (
                    <>
                      <span className="absolute inset-0 animate-ping rounded-full bg-primary/25 motion-reduce:animate-none" />
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    </>
                  ) : null}
                </span>

                <div
                  className={cn(
                    'min-w-0 flex-1',
                    actual && '-mt-1 rounded-control border border-primary-line bg-primary-soft/60 px-3 py-2',
                  )}
                  aria-current={actual ? 'step' : undefined}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className={cn('text-body-sm font-semibold', paso.completado ? 'text-ink' : actual ? 'text-primary' : 'text-ink-3')}>
                      {paso.label}
                    </p>
                    {paso.completado && paso.fecha && (
                      <time dateTime={paso.fecha.toISOString()} className="text-label text-ink-3 tnum">
                        {formatearFecha(paso.fecha, { day: 'numeric', month: 'short' })}
                      </time>
                    )}
                  </div>
                  {(paso.completado || actual) && (
                    <p className="text-body-sm text-ink-2">{paso.completado ? paso.hecho : paso.pendiente}</p>
                  )}
                  {actual && (
                    <span
                      className={cn(
                        'mt-1.5 inline-flex rounded-full px-2 py-0.5 text-label font-semibold',
                        deVos ? 'bg-primary text-on-primary' : 'bg-surface text-ink-2 ring-1 ring-line',
                      )}
                    >
                      {deVos ? 'Te toca a vos' : 'Lo estamos haciendo nosotros'}
                    </span>
                  )}
                  {actual && observado && paso.key === 'inscripcion' && (
                    <p className="mt-2 flex items-start gap-1.5 text-body-sm text-warning">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      El organismo hizo una observación. Ya la estamos resolviendo.
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </CardBody>
    </Card>
  )
}
