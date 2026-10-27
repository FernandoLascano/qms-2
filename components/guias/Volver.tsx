'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

/**
 * «Volver» de las guías: vuelve a donde estaba la persona (el panel, el
 * trámite). Si entró directo, por ejemplo desde Google, va al inicio.
 */
export function Volver() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => {
        const vieneDelSitio = document.referrer.startsWith(window.location.origin) && window.history.length > 1
        if (vieneDelSitio) router.back()
        else router.push('/')
      }}
      className="inline-flex min-h-10 items-center gap-2 text-body-sm font-medium text-ink-2 hover:text-primary"
    >
      <ArrowLeft className="h-4 w-4" /> Volver
    </button>
  )
}
