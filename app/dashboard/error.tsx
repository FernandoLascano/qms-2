'use client'

import { useEffect } from 'react'
import { ErrorState } from '@/components/ui/states'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[dashboard]', error)
  }, [error])

  return (
    <div className="py-8">
      <ErrorState
        title="No pudimos cargar esta pantalla"
        description="Ocurrió un problema al obtener los datos. Probá de nuevo; si sigue pasando, escribinos y lo revisamos."
        onRetry={reset}
      />
    </div>
  )
}
