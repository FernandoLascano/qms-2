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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-brand-50 to-white">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-black text-gray-900 mb-2">Verificación de email</h1>
        <p className="text-gray-600 mb-6">Estamos confirmando tu dirección de email.</p>

        {status === 'loading' && (
          <div className="flex items-center gap-3 text-gray-700">
            <Loader2 className="w-5 h-5 animate-spin" />
            Verificando…
          </div>
        )}

        {status === 'ok' && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl">
            <CheckCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold">¡Listo! Tu email fue verificado.</p>
              <p className="text-sm">Te redirigimos al login…</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-3 bg-brand-50 border border-brand-200 text-brand-800 p-4 rounded-xl">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold">No se pudo verificar el email.</p>
              <p className="text-sm">{error}</p>
              <div className="mt-3">
                <Link href="/login" className="text-brand-700 font-semibold hover:text-brand-800">
                  Ir al login
                </Link>
              </div>
            </div>
          </div>
        )}

        {status === 'idle' && <div className="text-gray-600 text-sm">Preparando verificación…</div>}
      </div>
    </div>
  )
}

