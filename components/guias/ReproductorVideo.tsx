'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Captions, CaptionsOff, Maximize, Minimize, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface VideoGuia {
  /** MP4 (H.264) en el bucket público de Supabase. */
  src: string
  poster: string
  /** WebVTT en /public (mismo origen: un <track> de otro dominio pide CORS). */
  subtitulos: string
  /** Duración en segundos, para mostrarla antes de cargar el video. */
  duracion: number
}

const mmss = (s: number) => {
  const t = Math.max(0, Math.floor(s))
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

/**
 * Reproductor propio para los videos de las guías (sin YouTube). El video no
 * se descarga hasta que tocan play (preload="none" + póster). Los subtítulos
 * se dibujan acá y no con ::cue, que no se puede estilizar igual en todos los
 * navegadores; arrancan prendidos porque en el teléfono muchos lo miran sin sonido.
 */
export function ReproductorVideo({ video, titulo }: { video: VideoGuia; titulo: string }) {
  const contenedor = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLVideoElement>(null)
  const [empezado, setEmpezado] = useState(false)
  const [reproduciendo, setReproduciendo] = useState(false)
  const [terminado, setTerminado] = useState(false)
  const [tiempo, setTiempo] = useState(0)
  const [duracion, setDuracion] = useState(video.duracion)
  const [cargado, setCargado] = useState(0)
  const [silencio, setSilencio] = useState(false)
  const [subtitulos, setSubtitulos] = useState(true)
  const [frase, setFrase] = useState('')
  const [pantallaCompleta, setPantallaCompleta] = useState(false)
  const [controlesVisibles, setControlesVisibles] = useState(true)
  const ocultar = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Mientras reproduce, los controles se esconden a los 2,5 s sin movimiento.
  const mostrarControles = useCallback(() => {
    setControlesVisibles(true)
    if (ocultar.current) clearTimeout(ocultar.current)
    ocultar.current = setTimeout(() => {
      if (ref.current && !ref.current.paused) setControlesVisibles(false)
    }, 2500)
  }, [])

  useEffect(() => () => { if (ocultar.current) clearTimeout(ocultar.current) }, [])

  // `muted` como prop de React no se actualiza después del primer render.
  useEffect(() => {
    if (ref.current) ref.current.muted = silencio
  }, [silencio])

  useEffect(() => {
    const v = ref.current
    const pista = v?.textTracks[0]
    if (!pista) return
    // Es una propiedad del TextTrack del DOM, no de un objeto de React.
    // eslint-disable-next-line react-hooks/immutability
    pista.mode = 'hidden' // los cues llegan igual, pero el navegador no los dibuja
    const alCambiar = () => {
      const activo = pista.activeCues?.[0] as VTTCue | undefined
      setFrase(activo?.text ?? '')
    }
    pista.addEventListener('cuechange', alCambiar)
    return () => pista.removeEventListener('cuechange', alCambiar)
  }, [])

  useEffect(() => {
    const alCambiar = () => setPantallaCompleta(document.fullscreenElement === contenedor.current)
    document.addEventListener('fullscreenchange', alCambiar)
    return () => document.removeEventListener('fullscreenchange', alCambiar)
  }, [])

  const alternar = () => {
    const v = ref.current
    if (!v) return
    if (v.paused || v.ended) {
      setEmpezado(true)
      void v.play()
    } else {
      v.pause()
    }
    mostrarControles()
  }

  const mover = (segundos: number) => {
    const v = ref.current
    if (!v) return
    v.currentTime = Math.min(Math.max(0, segundos), v.duration || duracion)
    setTiempo(v.currentTime)
  }

  const alternarPantallaCompleta = () => {
    const v = ref.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else if (contenedor.current?.requestFullscreen) {
      void contenedor.current.requestFullscreen()
    } else {
      v?.webkitEnterFullscreen?.() // iPhone: sólo el <video> puede ir a pantalla completa
    }
  }

  const teclado = (e: React.KeyboardEvent) => {
    const acciones: Record<string, () => void> = {
      ' ': alternar,
      k: alternar,
      ArrowRight: () => mover(tiempo + 5),
      ArrowLeft: () => mover(tiempo - 5),
      m: () => setSilencio((s) => !s),
      c: () => setSubtitulos((s) => !s),
      f: alternarPantallaCompleta,
    }
    const accion = acciones[e.key]
    if (!accion) return
    e.preventDefault()
    accion()
  }

  const porcentaje = duracion ? (tiempo / duracion) * 100 : 0
  const verControles = !reproduciendo || controlesVisibles

  return (
    <div
      ref={contenedor}
      role="region"
      aria-label={`Video: ${titulo}`}
      tabIndex={0}
      onKeyDown={teclado}
      onMouseMove={mostrarControles}
      onTouchStart={mostrarControles}
      className={cn(
        'group relative overflow-hidden bg-n-950 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        pantallaCompleta ? 'flex h-full w-full items-center' : 'aspect-video rounded-card border border-line shadow-raise',
        reproduciendo && !controlesVisibles && 'cursor-none',
      )}
    >
      <video
        ref={ref}
        className="h-full w-full"
        poster={video.poster}
        preload="none"
        playsInline
        onClick={alternar}
        onPlay={() => { setReproduciendo(true); setTerminado(false); mostrarControles() }}
        onPause={() => setReproduciendo(false)}
        onEnded={() => { setReproduciendo(false); setTerminado(true); setControlesVisibles(true) }}
        onTimeUpdate={(e) => setTiempo(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuracion(e.currentTarget.duration)}
        onProgress={(e) => {
          const v = e.currentTarget
          if (v.buffered.length && v.duration) setCargado((v.buffered.end(v.buffered.length - 1) / v.duration) * 100)
        }}
      >
        <source src={video.src} type="video/mp4" />
        <track kind="subtitles" src={video.subtitulos} srcLang="es" label="Español" default />
      </video>

      {/* Subtítulos */}
      {subtitulos && frase && (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 flex justify-center px-4 transition-[bottom] duration-200',
            verControles ? 'bottom-[4.5rem] sm:bottom-20' : 'bottom-3 sm:bottom-8',
          )}
        >
          <p className="max-w-[92%] rounded-control bg-n-950/80 px-2.5 py-1 text-center text-[13px] font-medium leading-snug text-white sm:max-w-[80%] sm:px-3 sm:py-1.5 sm:text-body">
            {frase}
          </p>
        </div>
      )}

      {/* Portada: botón grande hasta que empieza, y «Ver de nuevo» al terminar */}
      {(!empezado || terminado) && (
        <button
          type="button"
          onClick={() => (terminado ? (mover(0), alternar()) : alternar())}
          className="absolute inset-0 flex items-end justify-start gap-3 bg-gradient-to-t from-n-950/70 via-n-950/5 to-transparent p-4 text-left text-white sm:gap-4 sm:p-7"
          aria-label={terminado ? 'Ver de nuevo' : `Reproducir video: ${titulo}`}
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary shadow-raise transition-transform group-hover:scale-105 sm:h-20 sm:w-20">
            {terminado ? <RotateCcw className="h-6 w-6 sm:h-7 sm:w-7" /> : <Play className="ml-1 h-7 w-7 fill-current sm:h-9 sm:w-9" />}
          </span>
          <span className="mb-2 rounded-full bg-n-950/60 px-3 py-1 text-body-sm font-semibold tnum sm:mb-4">
            {terminado ? 'Ver de nuevo' : `Ver el video · ${mmss(video.duracion)}`}
          </span>
        </button>
      )}

      {/* Controles */}
      {empezado && (
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 bg-gradient-to-t from-n-950/85 to-transparent px-3 pb-2 pt-10 text-white transition-opacity duration-200 sm:px-4 sm:pb-3',
            verControles ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <div className="relative h-5">
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/25">
              <div className="absolute inset-y-0 left-0 rounded-full bg-white/35" style={{ width: `${cargado}%` }} />
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${porcentaje}%` }} />
            </div>
            <input
              type="range"
              min={0}
              max={duracion || 0}
              step={0.1}
              value={tiempo}
              onChange={(e) => mover(Number(e.target.value))}
              aria-label="Posición del video"
              aria-valuetext={`${mmss(tiempo)} de ${mmss(duracion)}`}
              className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>
          <div className="mt-1 flex items-center gap-1">
            <BotonControl onClick={alternar} etiqueta={reproduciendo ? 'Pausa' : 'Reproducir'}>
              {reproduciendo ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </BotonControl>
            <BotonControl onClick={() => setSilencio((s) => !s)} etiqueta={silencio ? 'Activar sonido' : 'Silenciar'}>
              {silencio ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </BotonControl>
            <span className="ml-1 text-body-sm tnum text-white/85">
              {mmss(tiempo)} / {mmss(duracion)}
            </span>
            <span className="flex-1" />
            <BotonControl
              onClick={() => setSubtitulos((s) => !s)}
              etiqueta={subtitulos ? 'Ocultar subtítulos' : 'Mostrar subtítulos'}
              activo={subtitulos}
            >
              {subtitulos ? <Captions className="h-5 w-5" /> : <CaptionsOff className="h-5 w-5" />}
            </BotonControl>
            <BotonControl onClick={alternarPantallaCompleta} etiqueta={pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}>
              {pantallaCompleta ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </BotonControl>
          </div>
        </div>
      )}
    </div>
  )
}

function BotonControl({
  onClick,
  etiqueta,
  activo,
  children,
}: {
  onClick: () => void
  etiqueta: string
  activo?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      aria-pressed={activo}
      title={etiqueta}
      className="flex h-11 w-11 items-center justify-center rounded-control text-white/90 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-white sm:h-10 sm:w-10"
    >
      {children}
    </button>
  )
}
