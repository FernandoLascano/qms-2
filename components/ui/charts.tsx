import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Gráficos mínimos en SVG.
 *
 * No usan librería: son formas simples y una dependencia de 500 KB para
 * dibujar siete rectángulos no se justifica. Todos toman el color de los
 * tokens, así que rebrandean con el resto.
 *
 * Se renderizan en el servidor (sin 'use client'): llegan pintados en el HTML
 * inicial, sin salto ni espera.
 */

/* ─────────────────────────────  Sparkline  ───────────────────────────── */

/**
 * Tendencia de una métrica. Un número solo es un dato; con su recorrido al
 * lado es información: dice si sube o baja sin ocupar espacio.
 */
export function Sparkline({
  datos,
  tono = 'primary',
  className,
  alto = 32,
}: {
  /** Serie de valores, del más viejo al más nuevo. */
  datos: number[]
  tono?: 'primary' | 'success' | 'info' | 'neutral'
  className?: string
  alto?: number
}) {
  if (datos.length < 2) return null

  const ANCHO = 100
  const max = Math.max(...datos, 1)
  const min = Math.min(...datos, 0)
  const rango = max - min || 1

  const puntos = datos.map((v, i) => ({
    x: 2 + (i / (datos.length - 1)) * (ANCHO - 4),
    y: alto - ((v - min) / rango) * (alto - 4) - 2,
  }))

  // Curva suave: cada tramo usa el punto medio como destino, con control en el
  // vértice. Evita los picos duros de una polilínea.
  const linea = puntos.reduce((d, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const previo = arr[i - 1]
    const cx = (previo.x + p.x) / 2
    return `${d} C ${cx} ${previo.y}, ${cx} ${p.y}, ${p.x} ${p.y}`
  }, '')

  const area = `${linea} L ${ANCHO - 2} ${alto} L 2 ${alto} Z`

  const COLOR = {
    primary: 'text-primary',
    success: 'text-success-solid',
    info: 'text-info-solid',
    neutral: 'text-ink-3',
  }[tono]

  // Id estable derivado de la serie: `useId` es un hook y esto se renderiza
  // en el servidor. Dos sparklines con los mismos datos comparten degradado,
  // que es exactamente lo que queremos.
  const id = datos.reduce((h, v, i) => (h * 31 + v * (i + 1)) % 99991, 7).toString(36)

  return (
    <svg
      viewBox={`0 0 ${ANCHO} ${alto}`}
      preserveAspectRatio="none"
      className={cn('w-full', COLOR, className)}
      style={{ height: alto }}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sp-${id})`} />
      <path
        d={linea}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={puntos[puntos.length - 1].x}
        cy={puntos[puntos.length - 1].y}
        r="2"
        fill="currentColor"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/* ───────────────────────────  Anillo de progreso  ─────────────────────── */

/**
 * Progreso en anillo. Tiene mucha más presencia que una barra chata y deja
 * el porcentaje en el centro, donde el ojo ya está mirando.
 */
export function AnilloProgreso({
  valor,
  tamano = 132,
  grosor = 10,
  etiqueta,
  className,
}: {
  /** 0 a 100 */
  valor: number
  tamano?: number
  grosor?: number
  etiqueta?: string
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, Math.round(valor)))
  const completo = pct === 100
  const r = (tamano - grosor) / 2
  const circunferencia = 2 * Math.PI * r
  const avance = circunferencia * (1 - pct / 100)

  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: tamano, height: tamano }}
      role="img"
      aria-label={`${etiqueta ?? 'Progreso'}: ${pct}%`}
    >
      <svg width={tamano} height={tamano} className="-rotate-90" aria-hidden>
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          fill="none"
          strokeWidth={grosor}
          className="stroke-surface-3"
        />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          fill="none"
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={avance}
          className={completo ? 'stroke-success-solid' : 'stroke-primary'}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            'text-display tnum leading-none',
            completo ? 'text-success' : 'text-ink',
          )}
        >
          {pct}
          <span className="text-title">%</span>
        </span>
        {etiqueta && (
          <span className="mt-1 text-label text-ink-2">{etiqueta}</span>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────  Barra de distribución  ───────────────────────── */

export interface Tramo {
  label: string
  valor: number
  /** Clase de fondo del tramo (usar tokens). */
  color: string
}

/**
 * Distribución apilada: en un solo renglón muestra cómo se reparte el total.
 * Reemplaza a leer cuatro números sueltos y hacer la cuenta mentalmente.
 */
export function BarraDistribucion({
  tramos,
  className,
}: {
  tramos: Tramo[]
  className?: string
}) {
  const total = tramos.reduce((acc, t) => acc + t.valor, 0)
  if (total === 0) return null

  return (
    <div className={className}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
        {tramos.map((t) =>
          t.valor === 0 ? null : (
            <div
              key={t.label}
              className={t.color}
              style={{ width: `${(t.valor / total) * 100}%` }}
              title={`${t.label}: ${t.valor}`}
            />
          ),
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {tramos.map((t) => (
          <li key={t.label} className="flex items-center gap-2">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', t.color)} aria-hidden />
            <span className="text-body-sm text-ink-2">{t.label}</span>
            <span className="text-body-sm font-semibold text-ink tnum">{t.valor}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ────────────────────────────  Embudo  ────────────────────────────────── */

export interface PasoEmbudo {
  label: string
  valor: number
}

/**
 * Embudo de conversión. Cada tramo se dibuja proporcional al primero, con la
 * caída respecto del paso anterior — que es el dato que uno viene a buscar.
 */
export function Embudo({
  pasos,
  className,
}: {
  pasos: PasoEmbudo[]
  className?: string
}) {
  const base = pasos[0]?.valor || 1

  return (
    <ol className={cn('space-y-2.5', className)}>
      {pasos.map((paso, i) => {
        const ancho = Math.max((paso.valor / base) * 100, 3)
        const previo = i > 0 ? pasos[i - 1].valor : null
        const caida = previo && previo > 0 ? Math.round((1 - paso.valor / previo) * 100) : null

        return (
          <li key={paso.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="text-body-sm text-ink-2">{paso.label}</span>
              <span className="flex items-baseline gap-2">
                <span className="text-body font-semibold text-ink tnum">{paso.valor}</span>
                {caida !== null && caida > 0 && (
                  <span className="text-label text-ink-3 tnum">−{caida}%</span>
                )}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${ancho}%`, opacity: 1 - i * 0.13 }}
              />
            </div>
          </li>
        )
      })}
    </ol>
  )
}
