'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ArrowRight, Building2, CornerDownLeft, FileText, Loader2, Search, UserRound, UserSearch } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NAV_ADMIN } from '@/lib/dashboard/navigation'
import type { ResultadoBusqueda } from '@/app/api/admin/buscar/route'
import { cn } from '@/lib/utils'

type Opcion = { id: string; grupo: string; titulo: string; detalle?: string; href: string; icono: LucideIcon }

const GRUPOS: Record<ResultadoBusqueda['tipo'], { nombre: string; icono: LucideIcon }> = {
  tramite: { nombre: 'Trámites', icono: Building2 },
  borrador: { nombre: 'Formularios sin terminar', icono: FileText },
  lead: { nombre: 'Consultas', icono: UserSearch },
  usuario: { nombre: 'Clientes sin trámite', icono: UserRound },
}

const PAGINAS: Opcion[] = NAV_ADMIN.flatMap((g) => g.items).map((i) => ({
  id: `pagina:${i.href}`,
  grupo: 'Ir a',
  titulo: i.name,
  detalle: i.description,
  href: i.href,
  icono: i.icon,
}))

/** Sin tildes ni mayúsculas, para que «tramites» encuentre «Trámites». */
const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/**
 * Buscador del panel admin: ⌘K (o Ctrl+K) desde cualquier pantalla. Busca
 * trámites por denominación, CUIT o matrícula, clientes por nombre, email o
 * teléfono, consultas, y las secciones del panel. Flechas para moverse, Enter
 * para abrir.
 */
export function BuscadorAdmin() {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([])
  const [cargando, setCargando] = useState(false)
  const [activo, setActivo] = useState(0)
  const lista = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setAbierto((a) => !a)
      }
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [])

  // Búsqueda en el servidor con una pausa de 200 ms entre teclas; una
  // respuesta vieja que llega tarde no pisa a la nueva.
  useEffect(() => {
    const texto = q.trim()
    if (texto.length < 2) return
    const control = new AbortController()
    const t = setTimeout(async () => {
      setCargando(true)
      try {
        const res = await fetch(`/api/admin/buscar?q=${encodeURIComponent(texto)}`, { signal: control.signal })
        if (res.ok) setResultados((await res.json()).resultados)
      } catch {
        // abortada o sin red: se queda lo anterior
      } finally {
        if (!control.signal.aborted) setCargando(false)
      }
    }, 200)
    return () => {
      clearTimeout(t)
      control.abort()
    }
  }, [q])

  const opciones = useMemo<Opcion[]>(() => {
    const texto = normalizar(q.trim())
    const paginas = texto ? PAGINAS.filter((p) => normalizar(p.titulo).includes(texto)) : PAGINAS
    const delServidor = q.trim().length < 2 ? [] : resultados.map((r, i) => ({
      id: `${r.tipo}:${i}`,
      grupo: GRUPOS[r.tipo].nombre,
      titulo: r.titulo,
      detalle: r.detalle,
      href: r.href,
      icono: GRUPOS[r.tipo].icono,
    }))
    return [...delServidor, ...paginas.slice(0, texto ? 6 : 8)]
  }, [q, resultados])

  const indice = Math.min(activo, Math.max(0, opciones.length - 1))

  useEffect(() => {
    lista.current?.querySelector(`[data-indice="${indice}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [indice])

  const abrir = (o: Opcion) => {
    cambiarAbierto(false)
    router.push(o.href)
  }

  const alTeclearEnInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActivo((indice + 1) % Math.max(1, opciones.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActivo((indice - 1 + opciones.length) % Math.max(1, opciones.length))
    } else if (e.key === 'Enter' && opciones[indice]) {
      e.preventDefault()
      abrir(opciones[indice])
    }
  }

  function cambiarAbierto(a: boolean) {
    setAbierto(a)
    if (!a) {
      setQ('')
      setResultados([])
      setActivo(0)
    }
  }

  let grupoAnterior = ''

  return (
    <DialogPrimitive.Root open={abierto} onOpenChange={cambiarAbierto}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className="flex h-11 items-center gap-2 rounded-control border border-line bg-surface px-3 text-body-sm text-ink-2 transition-colors hover:border-line-strong hover:text-ink md:h-9"
          aria-label="Buscar (⌘K)"
        >
          <Search className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Buscar</span>
          <kbd className="hidden rounded border border-line bg-surface-2 px-1.5 text-label font-medium text-ink-3 md:inline">⌘K</kbd>
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-n-950/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-modal border border-line bg-surface shadow-modal data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Buscar en el panel</DialogPrimitive.Title>
          {/* El foco se marca en la línea de abajo del buscador (el input no lleva anillo propio). */}
          <div className="flex items-center gap-3 border-b-2 border-line px-4 transition-colors focus-within:border-primary">
            {cargando ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-ink-3" aria-hidden /> : <Search className="h-5 w-5 shrink-0 text-ink-3" aria-hidden />}
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setActivo(0)
              }}
              onKeyDown={alTeclearEnInput}
              placeholder="Sociedad, cliente, email, CUIT o sección…"
              role="combobox"
              aria-expanded
              aria-controls="buscador-resultados"
              aria-activedescendant={opciones[indice] ? `buscador-${indice}` : undefined}
              style={{ outline: 'none' }}
              className="h-14 w-full bg-transparent text-body text-ink placeholder:text-ink-3"
            />
          </div>

          <div ref={lista} id="buscador-resultados" role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
            {opciones.length === 0 && (
              <p className="px-3 py-8 text-center text-body-sm text-ink-2">
                {cargando ? 'Buscando…' : `Nada para «${q.trim()}».`}
              </p>
            )}
            {opciones.map((o, i) => {
              const titulo = o.grupo !== grupoAnterior ? o.grupo : null
              grupoAnterior = o.grupo
              const Icono = o.icono
              return (
                <div key={o.id}>
                  {titulo && <p className="px-3 pb-1 pt-3 text-label font-semibold uppercase tracking-wide text-ink-3">{titulo}</p>}
                  <div
                    id={`buscador-${i}`}
                    data-indice={i}
                    role="option"
                    aria-selected={i === indice}
                    onMouseMove={() => setActivo(i)}
                    onClick={() => abrir(o)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-control px-3 py-2.5',
                      i === indice ? 'bg-primary-soft' : 'hover:bg-surface-2',
                    )}
                  >
                    <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-control', i === indice ? 'bg-primary text-on-primary' : 'bg-surface-3 text-ink-2')}>
                      <Icono className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-sm font-medium text-ink">{o.titulo}</span>
                      {o.detalle && <span className="block truncate text-label text-ink-2">{o.detalle}</span>}
                    </span>
                    {i === indice ? <CornerDownLeft className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : <ArrowRight className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="hidden items-center gap-4 border-t border-line bg-surface-2 px-4 py-2 text-label text-ink-3 sm:flex">
            <span><kbd className="font-semibold">↑ ↓</kbd> moverse</span>
            <span><kbd className="font-semibold">Enter</kbd> abrir</span>
            <span><kbd className="font-semibold">Esc</kbd> cerrar</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
