'use client'

import { useEffect, useState } from 'react'
import { RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Segundos de espera entre reenvíos, para no llenar la casilla. */
const ESPERA = 60

/**
 * Botón «Reenviar email de verificación». Lo usan la pantalla de «Revisá tu
 * correo» del registro y el login cuando la cuenta todavía no se verificó.
 */
export function ReenviarVerificacion({ email, className }: { email: string; className?: string }) {
  const [estado, setEstado] = useState<'listo' | 'enviando' | 'enviado' | 'error'>('listo')
  const [restan, setRestan] = useState(0)

  useEffect(() => {
    if (restan <= 0) return
    const id = setTimeout(() => setRestan((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [restan])

  const reenviar = async () => {
    setEstado('enviando')
    try {
      const res = await fetch('/api/auth/reenviar-verificacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setEstado(res.ok ? 'enviado' : 'error')
      if (res.ok) setRestan(ESPERA)
    } catch {
      setEstado('error')
    }
  }

  const esperando = restan > 0

  return (
    <div className={cn('space-y-1.5', className)}>
      <button
        type="button"
        onClick={reenviar}
        disabled={estado === 'enviando' || esperando || !email}
        className="inline-flex min-h-10 items-center gap-2 font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-ink-3 disabled:no-underline"
      >
        <RotateCw className={cn('h-4 w-4', estado === 'enviando' && 'animate-spin')} aria-hidden />
        {estado === 'enviando'
          ? 'Reenviando…'
          : esperando
            ? `Podés pedir otro en ${restan} s`
            : 'Reenviar el email'}
      </button>
      <p aria-live="polite" className="text-label">
        {estado === 'enviado' && <span className="text-success">Listo, te lo mandamos de nuevo. Revisá también el spam.</span>}
        {estado === 'error' && <span className="text-danger">No pudimos reenviarlo. Probá en unos minutos.</span>}
      </p>
    </div>
  )
}
