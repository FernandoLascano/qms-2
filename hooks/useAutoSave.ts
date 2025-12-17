import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface UseAutoSaveOptions {
  data: any
  onSave: (data: any) => Promise<void>
  delay?: number // milliseconds
  enabled?: boolean
}

export function useAutoSave({ data, onSave, delay = 3000, enabled = true }: UseAutoSaveOptions) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const previousDataRef = useRef<string>()

  useEffect(() => {
    if (!enabled) return

    const currentData = JSON.stringify(data)
    
    // Solo guardar si los datos han cambiado
    if (currentData === previousDataRef.current) {
      return
    }

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Configurar nuevo timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true)
        await onSave(data)
        previousDataRef.current = currentData
        setLastSaved(new Date())
      } catch (error) {
        console.error('Error en auto-guardado:', error)
        toast.error('Error al guardar automáticamente')
      } finally {
        setIsSaving(false)
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, onSave, delay, enabled])

  return { isSaving, lastSaved }
}

