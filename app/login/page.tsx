'use client'

import { useState, Suspense, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, Mail, Lock, ArrowLeft, LogIn, Loader2 } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
const GoogleSignInButton = dynamic(
  () => import('@/components/auth/google-sign-in-button').then((m) => m.GoogleSignInButton),
  { ssr: false, loading: () => <div className="h-12 w-full rounded-control bg-surface-3/90 animate-pulse" aria-hidden /> }
)
const AuthDivider = dynamic(
  () => import('@/components/auth/google-sign-in-button').then((m) => m.AuthDivider),
  { ssr: false, loading: () => <div className="h-6" aria-hidden /> }
)

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Verificar si viene de registro exitoso
  const isFromRegistration = searchParams.get('registered') === 'true'
  const isFromVerification = searchParams.get('verified') === 'true'
  const oauthError = searchParams.get('error')

  useEffect(() => {
    if (!oauthError) return
    if (oauthError === 'OAuthAccountNotLinked') {
      setError(
        'Ese correo ya está registrado en la plataforma (otro método de acceso). ' +
          'Iniciá sesión con email y contraseña, o usá otro correo para continuar con Google. ' +
          'Si creías que ibas a crear una cuenta nueva, necesitás un Gmail distinto al de tu cuenta de equipo.'
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
          'Si sos administrador y probás con un Gmail distinto, cada uno debe ser una cuenta aparte en la plataforma.'
      )
      return
    }
    if (oauthError === 'GoogleProfileEmail' || oauthError === 'GoogleUserMissing') {
      setError('Google no devolvió un email válido o hubo un problema al localizar el usuario. Reintentá con otro navegador o método de acceso.')
      return
    }
    setError('No pudimos completar el inicio de sesión con Google. Probá de nuevo o usá email y contraseña.')
  }, [oauthError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Normalizar email antes de enviar
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isFromVerification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success-soft border border-success-line text-success p-4 rounded-control text-body-sm font-medium flex items-center gap-3"
        >
          <div className="w-8 h-8 bg-success-soft rounded-control flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-4 w-4" />
          </div>
          <span>Email verificado. Ya podés iniciar sesión.</span>
        </motion.div>
      )}

      {isFromRegistration && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success-soft border border-success-line text-success p-4 rounded-control text-body-sm font-medium flex items-center gap-3"
        >
          <div className="w-8 h-8 bg-success-soft rounded-control flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-4 w-4" />
          </div>
          <span>
            Cuenta creada exitosamente. Te enviamos un email para <strong>verificar tu cuenta</strong>.
            <br />
            Revisá tu casilla (y spam) y luego volvé para iniciar sesión.
          </span>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-soft border border-primary-line text-primary p-4 rounded-control text-body-sm font-medium"
        >
          {error}
        </motion.div>
      )}

      <GoogleSignInButton disabled={loading} />
      <AuthDivider />

      <div className="space-y-2">
        <label htmlFor="email" className="text-body-sm font-semibold text-ink-2">
          Email
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <Mail className="w-5 h-5 text-ink-3" />
          </div>
          <input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full h-12 pl-12 pr-4 text-body text-ink placeholder:text-ink-3 border border-line rounded-control focus:border-primary-line focus:ring-2 focus:ring-ring outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-body-sm font-semibold text-ink-2">
          Contraseña
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <Lock className="w-5 h-5 text-ink-3" />
          </div>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full h-12 pl-12 pr-4 text-body text-ink placeholder:text-ink-3 border border-line rounded-control focus:border-primary-line focus:ring-2 focus:ring-ring outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
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
            Ingresando...
          </>
        ) : (
          <>
            <LogIn className="w-5 h-5" />
            Ingresar
          </>
        )}
      </button>

      <div className="text-center pt-5 border-t border-line">
        <p className="text-body-sm text-ink-2">
          ¿No tenés cuenta?{' '}
          <Link href="/registro" className="text-primary hover:text-primary font-semibold transition">
            Registrate aquí
          </Link>
        </p>
      </div>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="inline-block mb-4">
            <img
              src="/assets/img/qms-logo-reg.png"
              alt="QuieroMiSAS Logo"
              className="h-16 w-auto mx-auto"
            />
          </Link>
          <span className="block text-primary font-semibold text-body-sm mb-4">
            Acceso
          </span>
          <h1 className="text-display md:text-display font-semibold text-ink mb-2">
            Bienvenido de <span className="text-primary">vuelta</span>
          </h1>
          <p className="text-ink-2">
            Ingresá a tu cuenta de QuieroMiSAS
          </p>
        </motion.div>

        {/* Card de Login */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-surface rounded-card border border-line shadow-pop p-8"
        >
          <Suspense fallback={
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-line mx-auto"></div>
              <p className="text-ink-2 mt-3 text-body-sm">Cargando...</p>
            </div>
          }>
            <LoginForm />
          </Suspense>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-body-sm text-ink-2 hover:text-primary transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
