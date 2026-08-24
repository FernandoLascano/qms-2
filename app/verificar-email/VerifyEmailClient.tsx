'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export function VerifyEmailClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setError('Falta el token de verificación.')
      return
    }

    let cancelled = false
    ;(async () => {
      setStatus('loading')
      try {
        const res = await fetch('/api/auth/verificar-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'No se pudo verificar el email')
        if (cancelled) return
        setStatus('ok')
        setTimeout(() => router.push('/login?verified=true'), 800)
      } catch (e: unknown) {
        if (cancelled) return
        setStatus('error')
        setError(e instanceof Error ? e.message : 'No se pudo verificar el email')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, router])

  return (
    <div className="canvas-landing min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface border border-line rounded-card shadow-pop p-8">
        <h1 className="text-title font-semibold text-ink mb-2">Verificación de email</h1>
        <p className="text-ink-2 mb-6">Estamos confirmando tu dirección de email.</p>

        {status === 'loading' && (
          <div className="flex items-center gap-3 text-ink-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Verificando…
          </div>
        )}

        {status === 'ok' && (
          <div className="flex items-start gap-3 bg-success-soft border border-success-line text-success p-4 rounded-control">
            <CheckCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold">¡Listo! Tu email fue verificado.</p>
              <p className="text-body-sm">Te redirigimos al login…</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-3 bg-primary-soft border border-primary-line text-primary p-4 rounded-control">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold">No se pudo verificar el email.</p>
              <p className="text-body-sm">{error}</p>
              <div className="mt-3">
                <Link href="/login" className="text-primary font-semibold hover:text-primary">
                  Ir al login
                </Link>
              </div>
            </div>
          </div>
        )}

        {status === 'idle' && <div className="text-ink-2 text-body-sm">Preparando verificación…</div>}
      </div>
    </div>
  )
}

