'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Mail, MailCheck, Send } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { EtiquetaCarga } from '@/components/ui/etiqueta-carga'
import { controlBase } from '@/components/ui/input'
import { validarEmail } from '@/lib/validaciones'
import { cn } from '@/lib/utils'

/** «Olvidé mi contraseña»: pide el email y manda el link para cambiarla. */
function Formulario() {
  // El login pasa el email que ya se había escrito.
  const params = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviadoA, setEnviadoA] = useState<string | null>(null)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    const errorEmail = validarEmail(email)
    if (errorEmail) {
      setError(errorEmail)
      return
    }
    setError('')
    setEnviando(true)
    try {
      const res = await fetch('/api/auth/recuperar-contrasena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.status === 429) {
        setError('Pediste varios links seguidos. Esperá unos minutos y probá de nuevo.')
      } else if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'No pudimos mandar el link. Probá de nuevo.')
      } else {
        setEnviadoA(email.trim().toLowerCase())
      }
    } catch {
      setError('Ocurrió un error de conexión. Probá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviadoA) {
    return (
      <div className="text-center space-y-4" role="status">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success">
          <MailCheck className="h-7 w-7" aria-hidden />
        </div>
        <p className="text-body-sm text-ink-2">
          Si hay una cuenta con <strong className="text-ink break-all">{enviadoA}</strong>, te llega un email con un
          link para elegir una contraseña nueva. Vence en 1 hora; fijate también en spam o promociones.
        </p>
        <div className="pt-4 border-t border-line flex flex-col items-center gap-1">
          <Link href="/login" className="inline-flex min-h-10 items-center font-semibold text-primary hover:underline">
            Volver a ingresar
          </Link>
          <button type="button" onClick={() => setEnviadoA(null)} className="inline-flex min-h-10 items-center text-body-sm text-ink-2 hover:text-primary">
            Probar con otro email
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor="email" className="block text-body-sm font-semibold text-ink-2">
          Email de tu cuenta
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-3" />
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            aria-invalid={!!error || undefined}
            aria-describedby="email-error"
            disabled={enviando}
            className={cn(controlBase, 'h-12 pl-12 pr-4 text-body')}
          />
        </div>
        {error && (
          <p id="email-error" role="alert" className="pl-1 text-label text-danger">
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="w-full h-12 bg-primary hover:bg-primary-hover text-on-primary font-semibold text-body rounded-control shadow-raise transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
      >
        <EtiquetaCarga cargando={enviando} textoCargando="Enviando…">
          <Send className="w-5 h-5" />
          Mandarme el link
        </EtiquetaCarga>
      </button>

      <p className="text-center text-body-sm text-ink-2 pt-4 border-t border-line">
        ¿Te acordaste?{' '}
        <Link href="/login" className="inline-flex min-h-10 items-center text-primary font-semibold hover:underline">
          Ingresá
        </Link>
      </p>
    </form>
  )
}

export default function RecuperarContrasenaPage() {
  return (
    <AuthShell titulo="¿Olvidaste tu contraseña?" bajada="Te mandamos un link por email para elegir una nueva">
      <Suspense>
        <Formulario />
      </Suspense>
    </AuthShell>
  )
}
