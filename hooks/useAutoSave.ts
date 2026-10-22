import { useCallback, useEffect, useRef, useState } from 'react'

interface UseAutoSaveOptions<T> {
  data: T
  /** Tiene que rechazar (throw) si no se pudo guardar: si no, se muestra «Guardado» igual. */
  onSave: (data: T) => Promise<void>
  delay?: number // milisegundos
  enabled?: boolean
}

/**
 * Guarda `data` un rato después del último cambio.
 *
 * Además de la espera, guarda en el momento cuando se lo piden (`guardarAhora`,
 * p. ej. al cambiar de paso), cuando la pestaña se oculta o se cierra y cuando
 * el componente se desmonta. Antes, salir por el menú o cerrar la pestaña
 * perdía lo escrito en los últimos segundos.
 */
export function useAutoSave<T>({ data, onSave, delay = 3000, enabled = true }: UseAutoSaveOptions<T>) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const guardadoRef = useRef<string | undefined>(undefined)
  const dataRef = useRef(data)
  const onSaveRef = useRef(onSave)
  const enabledRef = useRef(enabled)

  useEffect(() => {
    dataRef.current = data
    onSaveRef.current = onSave
    enabledRef.current = enabled
  })

  const guardarAhora = useCallback(async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (!enabledRef.current) return
    const actual = JSON.stringify(dataRef.current)
    if (actual === guardadoRef.current) return
    try {
      setIsSaving(true)
      await onSaveRef.current(dataRef.current)
      guardadoRef.current = actual
      setLastSaved(new Date())
      setError(false)
    } catch (e) {
      console.error('Error en auto-guardado:', e)
      setError(true)
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Al activarse (p. ej. cuando termina de cargar el borrador) lo que hay en
  // pantalla es el punto de partida: no hace falta volver a guardarlo.
  const activoAntesRef = useRef(false)

  // Guardado con espera después de cada cambio
  useEffect(() => {
    if (!enabled) {
      activoAntesRef.current = false
      return
    }
    if (!activoAntesRef.current) {
      activoAntesRef.current = true
      guardadoRef.current = JSON.stringify(data)
      return
    }
    if (JSON.stringify(data) === guardadoRef.current) return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => void guardarAhora(), delay)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [data, delay, enabled, guardarAhora])

  // Pestaña oculta, cierre o salida de la página: guardar lo pendiente ya.
  useEffect(() => {
    const alOcultar = () => {
      if (document.visibilityState === 'hidden') void guardarAhora()
    }
    const alSalir = () => void guardarAhora()
    document.addEventListener('visibilitychange', alOcultar)
    window.addEventListener('pagehide', alSalir)
    return () => {
      document.removeEventListener('visibilitychange', alOcultar)
      window.removeEventListener('pagehide', alSalir)
      void guardarAhora()
    }
  }, [guardarAhora])

  return { isSaving, lastSaved, error, guardarAhora }
}
