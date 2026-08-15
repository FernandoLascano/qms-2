'use client'

/**
 * Ingreso a la plataforma.
 *
 * Sigue el lenguaje de la portada: mismo lienzo, misma píldora con el punto,
 * mismo titular grande con una palabra en el color de marca y las mismas
 * tarjetas de confianza. Antes era una tarjeta suelta centrada sobre un lavado
 * rosa, que leía como otro producto.
 */

import { useState, Suspense, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CircleCheck,
  Mail,
  Lock,
  ArrowLeft,
  LogIn,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Zap,
  Users,
} from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { controlBase } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const GoogleSignInButton = dynamic(
  () => import('@/components/auth/google-sign-in-button').then((m) => m.GoogleSignInButton),
  { ssr: false, loading: () => <div className="h-12 w-full rounded-control bg-surface-3/90 animate-pulse" aria-hidden /> },
)
const AuthDivider = dynamic(
  () => import('@/components/auth/google-sign-in-button').then((m) => m.AuthDivider),
  { ssr: false, loading: () => <div className="h-6" aria-hidden /> },
)

/** Los mismos avales que muestra la portada, para que la entrada no se sienta otro sitio. */
const AVALES = [
  { icon: Shield, texto: 'Seguro' },
  { icon: Zap, texto: 'Rápido' },
  { icon: Users, texto: 'Soporte' },
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const cajaError = useRef<HTMLDivElement>(null)

  // Los errores que vuelven de Google no son culpa de lo que se escribió en los
  // campos: marcarlos en rojo mandaría a corregir algo que está bien. Sólo se
  // marcan cuando el rechazo vino del formulario.
  const [credencialesMal, setCredencialesMal] = useState(false)

  const isFromRegistration = searchParams.get('registered') === 'true'
  const isFromVerification = searchParams.get('verified') === 'true'
  const oauthError = searchParams.get('error')

  useEffect(() => {
    if (!oauthError) return
    if (oauthError === 'OAuthAccountNotLinked') {
      setError(
        'Ese correo ya está registrado en la plataforma (otro método de acceso). ' +
          'Iniciá sesión con email y contraseña, o usá otro correo para continuar con Google. ' +
          'Si creías que ibas a crear una cuenta nueva, necesitás un Gmail distinto al de tu cuenta de equipo.',
      )
      return
    }
    if (oauthError === 'AccessDenied') {
      setError('Acceso con Google cancelado o no autorizado.')
      return
    }
    if (oauthError === 'GoogleEmailMismatch') {
      setError(
        'El correo de Google no coincide con la cuenta interna que se intentó usar. Suele pasar si esa cuenta de Google ya quedó vinculada a otra cuenta en el sistema. ' +
          'Probá cerrar sesión en google.com, usar otro correo de Google, o entrá con email y contraseña. ' +
          'Si sos administrador y probás con un Gmail distinto, cada uno debe ser una cuenta aparte en la plataforma.',
      )
      return
    }
    if (oauthError === 'GoogleProfileEmail' || oauthError === 'GoogleUserMissing') {
      setError('Google no devolvió un email válido o hubo un problema al localizar el usuario. Reintentá con otro navegador o método de acceso.')
      return
    }
    setError('No pudimos completar el inicio de sesión con Google. Probá de nuevo o usá email y contraseña.')
  }, [oauthError])

  // El aviso puede quedar fuera de la vista en pantallas chicas: se lo trae.
  useEffect(() => {
    if (error) cajaError.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCredencialesMal(false)
    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()

      const result = await signIn('credentials', {
        email: normalizedEmail,
        password,
        redirect: false,
      })

      if (result?.error) {
        console.error('Error de login:', result.error)
        if (result.error === 'EMAIL_NOT_VERIFIED') {
          setError('Te falta verificar el email. Revisá tu casilla y abrí el link de confirmación.')
        } else {
          setError('Email o contraseña incorrectos')
          setCredencialesMal(true)
        }
        setLoading(false)
        return
      }

      if (result?.ok) {
        trackEvent.login('email')
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('Error al iniciar sesión. Intenta nuevamente.')
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Error en login:', error)
      setError('Ocurrió un error. Intenta nuevamente.')
      setLoading(false)
    }
  }

  // El mismo estilo de control que el resto del sistema (borde, anillo de foco
  // al 25%, estado inválido en rojo de peligro). Antes esta pantalla lo tenía
  // escrito aparte, con el anillo a opacidad plena: al enfocar el campo se veía
  // como si estuviera mal completado.
  const campo = cn(controlBase, 'h-12 pl-12 pr-4 text-body')

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {isFromVerification && (
        <div className="rise flex items-start gap-3 bg-success-soft border border-success-line text-success p-4 rounded-control text-body-sm font-medium">
          <CircleCheck className="h-5 w-5 shrink-0 mt-px" />
          <span>Email verificado. Ya podés iniciar sesión.</span>
        </div>
      )}

      {isFromRegistration && (
        <div className="rise flex items-start gap-3 bg-success-soft border border-success-line text-success p-4 rounded-control text-body-sm font-medium">
          <CircleCheck className="h-5 w-5 shrink-0 mt-px" />
          <span>
            Cuenta creada. Te enviamos un email para <strong>verificar tu cuenta</strong>: revisá tu
            casilla (y el spam) y volvé para iniciar sesión.
          </span>
        </div>
      )}

      {error && (
        <div
          ref={cajaError}
          role="alert"
          aria-live="polite"
          className="rise bg-danger-soft border border-danger-line text-danger p-4 rounded-control text-body-sm font-medium"
        >
          {error}
        </div>
      )}

      <GoogleSignInButton disabled={loading} />
      <AuthDivider />

      <div className="space-y-2">
        <label htmlFor="email" className="block text-body-sm font-semibold text-ink-2">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-3" />
          <input
            id="email"
            type="email"
            inputMode="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoComplete="email"
            aria-invalid={credencialesMal || undefined}
            className={campo}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-body-sm font-semibold text-ink-2">
          Contraseña
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-3" />
          <input
            id="password"
            type={verPassword ? 'text' : 'password'}
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            autoComplete="current-password"
            aria-invalid={credencialesMal || undefined}
            className={`${campo} pr-12`}
          />
          {/* Sin esto no hay forma de comprobar lo que se tipeó, que es la
              causa más común de un login fallido en el teléfono. */}
          <button
            type="button"
            onClick={() => setVerPassword((v) => !v)}
            disabled={loading}
            aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={verPassword}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-control text-ink-3 hover:text-ink-2 hover:bg-surface-2 transition disabled:opacity-50"
          >
            {verPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-primary hover:bg-primary-hover text-on-primary font-semibold text-body rounded-control shadow-raise hover:shadow-pop transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Ingresando…
          </>
        ) : (
          <>
            <LogIn className="w-5 h-5" />
            Ingresar
          </>
        )}
      </button>

      <p className="text-center text-body-sm text-ink-2 pt-4 border-t border-line">
        ¿No tenés cuenta?{' '}
        <Link href="/registro" className="text-primary font-semibold hover:underline">
          Creá una gratis
        </Link>
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="canvas-landing min-h-screen flex flex-col">
      {/* Cabecera mínima, con el mismo peso que la de la portada. */}
      <header className="border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Ir al inicio">
            <img src="/assets/img/qms-logo-reg.png" alt="QuieroMiSAS" className="h-9 w-auto" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-body-sm font-medium text-ink-2 hover:text-primary transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/*
            Columna de presentación. En el teléfono se oculta: quien entra por
            acá ya conoce el producto y lo que necesita es el formulario, no
            otra pantalla de venta antes de poder escribir.
          */}
          <section className="hidden lg:block stagger">
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-full px-4 py-2 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 rounded-full bg-brand-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
              </span>
              <span className="text-body-sm font-medium text-brand-800">+500 empresas constituidas</span>
            </div>

            <h1 className="text-hero font-semibold text-ink tracking-tight mb-4">
              Bienvenido de <span className="text-primary">vuelta</span>
            </h1>

            <p className="text-body text-ink-2 max-w-md mb-8">
              Entrá para seguir tu trámite paso a paso, subir la documentación que falte y descargar
              los papeles de tu sociedad cuando los necesites.
            </p>

            <ul className="grid grid-cols-3 gap-3 max-w-md">
              {AVALES.map(({ icon: Icono, texto }) => (
                <li
                  key={texto}
                  className="flex flex-col items-center gap-2 p-3 rounded-card bg-surface border border-line shadow-raise"
                >
                  <Icono className="w-5 h-5 text-primary" />
                  <span className="text-body-sm font-medium text-ink-2">{texto}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Formulario */}
          <section className="rise w-full max-w-md mx-auto lg:mx-0 lg:justify-self-end">
            <div className="lg:hidden text-center mb-6">
              <h1 className="text-title font-semibold text-ink">
                Bienvenido de <span className="text-primary">vuelta</span>
              </h1>
              <p className="text-body-sm text-ink-2 mt-1">Ingresá a tu cuenta de QuieroMiSAS</p>
            </div>

            <div className="bg-surface rounded-card border border-line shadow-pop p-6 sm:p-8">
              <Suspense
                fallback={
                  <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                    <p className="text-ink-2 mt-3 text-body-sm">Cargando…</p>
                  </div>
                }
              >
                <LoginForm />
              </Suspense>
            </div>
          </section>
          </div>
        </div>
      </main>
    </div>
  )
}
