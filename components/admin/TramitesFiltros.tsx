'use client'

import { cn } from '@/lib/utils'

/**
 * Barra de filtros del listado de trámites.
 *
 * El valor vive en la URL (?filter=…), así que los enlaces del panel "Hoy"
 * ahora funcionan de verdad: antes apuntaban a ?filter=pendientes-validacion
 * y este componente ni siquiera leía el parámetro.
 */

export type FiltroTipo =
  | 'TODOS'
  | 'PENDIENTE_VALIDACION'
  | 'DOCUMENTOS_PENDIENTES'
  | 'ESPERANDO_CLIENTE'
  | 'EN_PROCESO'
  | 'COMPLETADOS'

/** Alias que llegan por URL desde otras pantallas. */
export const FILTRO_POR_SLUG: Record<string, FiltroTipo> = {
  'pendientes-validacion': 'PENDIENTE_VALIDACION',
  'documentos-pendientes': 'DOCUMENTOS_PENDIENTES',
  'esperando-cliente': 'ESPERANDO_CLIENTE',
  'en-proceso': 'EN_PROCESO',
  completados: 'COMPLETADOS',
  todos: 'TODOS',
}

export const SLUG_POR_FILTRO: Record<FiltroTipo, string> = {
  TODOS: 'todos',
  PENDIENTE_VALIDACION: 'pendientes-validacion',
  DOCUMENTOS_PENDIENTES: 'documentos-pendientes',
  ESPERANDO_CLIENTE: 'esperando-cliente',
  EN_PROCESO: 'en-proceso',
  COMPLETADOS: 'completados',
}

const ETIQUETAS: { valor: FiltroTipo; label: string }[] = [
  { valor: 'TODOS', label: 'Todos' },
  { valor: 'PENDIENTE_VALIDACION', label: 'Por validar' },
  { valor: 'DOCUMENTOS_PENDIENTES', label: 'Docs. por aprobar' },
  { valor: 'ESPERANDO_CLIENTE', label: 'Esperando cliente' },
  { valor: 'EN_PROCESO', label: 'En proceso' },
  { valor: 'COMPLETADOS', label: 'Completados' },
]

interface Props {
  contadores: Record<FiltroTipo, number>
  activo: FiltroTipo
  onChange: (filtro: FiltroTipo) => void
}

export default function TramitesFiltros({ contadores, activo, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Filtrar trámites"
      className="flex flex-wrap gap-2"
    >
      {ETIQUETAS.map(({ valor, label }) => {
        const seleccionado = activo === valor
        return (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={seleccionado}
            onClick={() => onChange(valor)}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-control border px-3 text-body-sm transition-colors',
              seleccionado
                ? 'border-primary bg-primary text-on-primary'
                : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink',
            )}
          >
            {label}
            <span
              className={cn(
                'tnum text-label',
                seleccionado ? 'text-on-primary/75' : 'text-ink-3',
              )}
            >
              {contadores[valor]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
