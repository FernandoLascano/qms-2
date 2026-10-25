'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Aviso } from '@/components/ui/aviso'
import { cn } from '@/lib/utils'
import type { Guia } from '@/lib/guias'
import { ReproductorVideo } from './ReproductorVideo'

/**
 * Guía paso a paso: un paso a la vez con su captura, lista de pasos para
 * saltar y «Ya lo hice» para ir tachando. Lo hecho se recuerda en este
 * navegador (sólo es una ayuda: si falla, la guía funciona igual).
 */
export function GuiaInteractiva({ guia }: { guia: Guia }) {
  const [seccionId, setSeccionId] = useState(guia.secciones[0].id)
  const [indice, setIndice] = useState(0)
  const [hechos, setHechos] = useState<string[]>([])
  const claveMemoria = `guia-${guia.slug}`

  useEffect(() => {
    try {
      const guardado = JSON.parse(window.localStorage.getItem(claveMemoria) ?? '[]')
      // Lectura del navegador al montar: no existe en el servidor.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(guardado)) setHechos(guardado)
    } catch {
      // Sin almacenamiento (modo privado): se empieza de cero.
    }
  }, [claveMemoria])

  const guardar = (lista: string[]) => {
    setHechos(lista)
    try {
      window.localStorage.setItem(claveMemoria, JSON.stringify(lista))
    } catch {
      // ignorar
    }
  }

  const seccion = guia.secciones.find((s) => s.id === seccionId) ?? guia.secciones[0]
  const paso = seccion.pasos[indice]
  const clave = (i: number) => `${seccion.id}.${i}`
  const totalPasos = guia.secciones.reduce((n, s) => n + s.pasos.length, 0)
  const totalHechos = hechos.length
  const todoListo = totalHechos >= totalPasos

  const marcarYSeguir = () => {
    if (!hechos.includes(clave(indice))) guardar([...hechos, clave(indice)])
    if (indice < seccion.pasos.length - 1) {
      setIndice(indice + 1)
      return
    }
    // Último paso de la sección: pasar a la siguiente, si hay.
    const siguiente = guia.secciones[guia.secciones.findIndex((s) => s.id === seccion.id) + 1]
    if (siguiente) {
      setSeccionId(siguiente.id)
      setIndice(0)
    }
  }

  const cambiarSeccion = (id: string) => {
    setSeccionId(id)
    setIndice(0)
  }

  return (
    <div className="space-y-6">
      {guia.video && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-heading font-semibold text-ink">
            <PlayCircle className="h-5 w-5 text-primary" aria-hidden /> Miralo en video
          </h2>
          <ReproductorVideo video={guia.video} titulo={guia.titulo} />
          <p className="text-body-sm text-ink-2">¿Preferís ir a tu ritmo? Abajo está la guía paso a paso.</p>
        </section>
      )}

      {/* Avance total */}
      <div className="rounded-card border border-line bg-surface p-4 shadow-raise">
        <div className="mb-2 flex items-center justify-between text-body-sm">
          <span className="font-semibold text-ink">Tu avance</span>
          <span className="tnum text-ink-2">
            {Math.min(totalHechos, totalPasos)} de {totalPasos} pasos
          </span>
        </div>
        <div className="h-2 rounded-full bg-n-200">
          <div
            className="h-2 rounded-full bg-success-solid transition-all duration-500"
            style={{ width: `${(Math.min(totalHechos, totalPasos) / totalPasos) * 100}%` }}
          />
        </div>
      </div>

      {guia.secciones.length > 1 && (
        <div className="inline-flex w-full rounded-control border border-line bg-surface p-1 sm:w-auto" role="tablist">
          {guia.secciones.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === seccion.id}
              onClick={() => cambiarSeccion(s.id)}
              className={cn(
                'flex-1 rounded-[6px] px-4 py-2 text-body-sm font-semibold transition-colors sm:flex-none',
                s.id === seccion.id ? 'bg-primary text-on-primary' : 'text-ink-2 hover:text-ink',
              )}
            >
              {i + 1}. {s.titulo}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        {/* Lista de pasos */}
        <ol className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
          {seccion.pasos.map((p, i) => {
            const hecho = hechos.includes(clave(i))
            const activo = i === indice
            return (
              <li key={p.titulo} className="shrink-0 md:shrink">
                <button
                  type="button"
                  onClick={() => setIndice(i)}
                  aria-current={activo ? 'step' : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-control border px-3 py-2.5 text-left transition-colors',
                    activo ? 'border-primary bg-primary-soft' : 'border-line bg-surface hover:bg-surface-2',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-7 w-7 shrink-0 place-items-center rounded-full text-label font-semibold',
                      hecho ? 'bg-success-solid text-white' : activo ? 'bg-primary text-on-primary' : 'bg-surface-3 text-ink-2',
                    )}
                  >
                    {hecho ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className={cn('hidden text-body-sm md:block', activo ? 'font-semibold text-ink' : 'text-ink-2')}>
                    {p.titulo}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        {/* Paso actual */}
        <section key={`${seccion.id}-${indice}`} className="paso-adelante rounded-card border border-line bg-surface p-5 shadow-raise sm:p-6">
          <p className="text-label font-semibold uppercase tracking-wide text-primary">
            Paso {indice + 1} de {seccion.pasos.length}
            {paso.opcional && <span className="ml-2 rounded-full bg-surface-3 px-2 py-0.5 normal-case tracking-normal text-ink-2">Opcional</span>}
          </p>
          <h2 className="mt-1 text-title text-ink">{paso.titulo}</h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="space-y-3 text-body text-ink-2">
              <p>{paso.texto}</p>
              {paso.items && (
                <ul className="space-y-2">
                  {paso.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-success" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {paso.imagen && (
              <figure className="mx-auto grid place-items-center rounded-card bg-surface-2 p-4 sm:mx-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- capturas chicas y locales */}
                <img
                  src={paso.imagen.src}
                  alt={paso.imagen.alt}
                  width={paso.imagen.ancho}
                  height={paso.imagen.alto}
                  className="h-auto max-h-72 w-auto max-w-full rounded-control"
                />
              </figure>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" onClick={() => setIndice(indice - 1)} disabled={indice === 0} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button onClick={marcarYSeguir} className="gap-2">
              <Check className="h-4 w-4" />
              {hechos.includes(clave(indice)) ? 'Hecho · siguiente' : 'Ya lo hice'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>

      {todoListo && (
        <div className="rise flex items-start gap-3 rounded-card border border-success-line bg-success-soft p-5 text-success">
          <Check className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">¡Listo!</p>
            <p className="text-body-sm">{guia.cierre}</p>
            <Link href="/dashboard" className="mt-2 inline-flex items-center gap-1 text-body-sm font-semibold text-primary hover:underline">
              Ir a mi panel <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}


      <Aviso>
        QuieroMiSAS no tiene relación con Ciudadano Digital: es una plataforma del Gobierno de la Provincia de Córdoba.
        Si algo de la app cambió y no coincide con esta guía, escribinos y te ayudamos.
      </Aviso>
    </div>
  )
}
