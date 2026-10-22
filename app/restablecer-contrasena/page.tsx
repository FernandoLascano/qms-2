'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, KeyRound, Lock } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { EtiquetaCarga } from '@/components/ui/etiqueta-carga'
import { PasswordStrength } from '@/components/ui/password-strength'
import { controlBase } from '@/components/ui/input'
import { validarPassword } from '@/lib/validaciones'
import { cn } from '@/lib/utils'

/** Elegir la contraseña nueva, desde el link del email. */
function Formulario() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [ver, setVer] = useState(false)
  const [error, setError] = useState('')
  // El link venció o ya se usó: no tiene sentido seguir probando con este.
  const [linkInvalido, setLinkInvalido] = useState(!token)
  const [enviando, setEnviando] = useState(false)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    const errorPassword = validarPassword(password)
    if (errorPassword) {
      setError(errorPassword)
      return
    }
    setError('')
    setEnviando(true)
    try {
      const res = await fetch('/api/auth/restablecer-contrasena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        router.push('/login?restablecida=true')
        return
      }
      setError(data.error || 'No pudimos cambiar la contraseña. Probá de nuevo.')
      if (res.status === 400 && /link/i.test(data.error ?? '')) setLinkInvalido(true)
    } catch {
      setError('Ocurrió un error de conexión. Probá de nuevo.')
    }
    setEnviando(false)
  }

  if (linkInvalido) {
    return (
      <div className="text-center space-y-4">
        <p className="text-body-sm text-ink-2">
          {error || 'Este link no es válido.'} Los links para cambiar la contraseña sirven una sola vez y vencen en 1 hora.
        </p>
        <Link
          href="/recuperar-contrasena"
          className="w-full h-12 bg-primary hover:bg-primary-hover text-on-primary font-semibold text-body rounded-control shadow-raise transition-all flex items-center justify-center gap-2"
        >
          Pedir un link nuevo
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={guardar} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor="password" className="block text-body-sm font-semibold text-ink-2">
          Contraseña nueva
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-3" />
          <input
            id="password"
            type={ver ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            aria-invalid={!!error || undefined}
            aria-describedby="password-error"
            disabled={enviando}
            className={cn(controlBase, 'h-12 pl-12 pr-12 text-body')}
          />
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={ver}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-control text-ink-3 hover:text-ink-2 hover:bg-surface-2 transition"
          >
            {ver ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {error && (
          <p id="password-error" role="alert" className="pl-1 text-label text-danger">
            {error}
          </p>
        )}
        <div className="mensaje-campo" data-visible={password.length > 0 && !error}>
          <div>
            <PasswordStrength valor={password} className="pt-1" />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="w-full h-12 bg-primary hover:bg-primary-hover text-on-primary font-semibold text-body rounded-control shadow-raise transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
      >
        <EtiquetaCarga cargando={enviando} textoCargando="Guardando…">
          <KeyRound className="w-5 h-5" />
          Guardar contraseña
        </EtiquetaCarga>
      </button>
    </form>
  )
}

export default function RestablecerContrasenaPage() {
  return (
    <AuthShell titulo="Elegí una contraseña nueva" bajada="Después ingresás con tu email y esta contraseña">
      <Suspense>
        <Formulario />
      </Suspense>
    </AuthShell>
  )
}
