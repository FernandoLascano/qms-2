'use client'

import { useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Lock, ArrowLeft, UserPlus, Loader2 } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
const GoogleSignInButton = dynamic(
  () => import('@/components/auth/google-sign-in-button').then((m) => m.GoogleSignInButton),
  { ssr: false, loading: () => <div className="h-12 w-full rounded-control bg-surface-3/90 animate-pulse" aria-hidden /> }
)
const AuthDivider = dynamic(
  () => import('@/components/auth/google-sign-in-button').then((m) => m.AuthDivider),
  { ssr: false, loading: () => <div className="h-6" aria-hidden /> }
)
import Script from 'next/script'
import { useTurnstileWidget } from '@/lib/hooks/use-turnstile-widget'

export default function RegistroPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  // Honeypot: bots suelen completar campos ocultos
  const [website, setWebsite] = useState('')

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const captchaRequired = process.env.NODE_ENV === 'production'

  const onTurnstileToken = useCallback((token: string | null) => setTurnstileToken(token), [])
  const { setContainerRef, onScriptLoad } = useTurnstileWidget({
    siteKey,
    captchaRequired,
    onTokenChange: onTurnstileToken,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          turnstileToken,
          website,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.details
          ? `${data.error}: ${data.details}`
          : data.error || 'Error al crear la cuenta'
        setError(errorMessage)
        setLoading(false)
        console.error('Error en registro:', data)
        return
      }

      trackEvent.registro('email')
      router.push('/login?registered=true')
    } catch (error) {
      setError('Ocurrió un error. Intenta nuevamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {siteKey && (
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onLoad={onScriptLoad}
          />
        )}

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
            Registro
          </span>
          <h1 className="text-display md:text-display font-semibold text-ink mb-2">
            Crear <span className="text-primary">cuenta</span>
          </h1>
          <p className="text-ink-2">
            Registrate para comenzar tu trámite
          </p>
        </motion.div>

        {/* Card de Registro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-surface rounded-card border border-line shadow-pop p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary-soft border border-primary-line text-primary p-4 rounded-control text-body-sm font-medium"
              >
                {error}
              </motion.div>
            )}

            <GoogleSignInButton disabled={loading} label="Registrarse con Google" />
            <AuthDivider />

            {/* Honeypot (oculto). Humanos no deberían completarlo. */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-body-sm font-semibold text-ink-2">
                Nombre completo
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <User className="w-5 h-5 text-ink-3" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 text-body text-ink placeholder:text-ink-3 border border-line rounded-control focus:border-primary-line focus:ring-2 focus:ring-ring outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

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
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 text-body text-ink placeholder:text-ink-3 border border-line rounded-control focus:border-primary-line focus:ring-2 focus:ring-ring outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-body-sm font-semibold text-ink-2">
                Teléfono <span className="text-ink-3 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Phone className="w-5 h-5 text-ink-3" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+54 9 351 123 4567"
                  value={formData.phone}
                  onChange={handleChange}
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
                  name="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 text-body text-ink placeholder:text-ink-3 border border-line rounded-control focus:border-primary-line focus:ring-2 focus:ring-ring outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <p className="text-label text-ink-3 pl-1">Debe tener al menos 6 caracteres</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-body-sm font-semibold text-ink-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Lock className="w-5 h-5 text-ink-3" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 text-body text-ink placeholder:text-ink-3 border border-line rounded-control focus:border-primary-line focus:ring-2 focus:ring-ring outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Captcha anti-spam */}
            {captchaRequired && !siteKey && (
              <div className="bg-warning-soft border border-warning-line text-warning p-3 rounded-control text-body-sm">
                Falta configurar el anti-spam. Definí <code className="font-mono">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> y{' '}
                <code className="font-mono">TURNSTILE_SECRET_KEY</code> en Vercel.
              </div>
            )}

            {captchaRequired && siteKey && <div className="flex justify-center min-h-[65px]" ref={setContainerRef} />}

            <button
              type="submit"
              disabled={loading || (captchaRequired && (!siteKey || !turnstileToken))}
              className="w-full h-12 bg-primary hover:bg-primary-hover text-on-primary font-semibold text-body rounded-control shadow-raise hover:shadow-pop transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Crear cuenta
                </>
              )}
            </button>

            <div className="text-center pt-5 border-t border-line">
              <p className="text-body-sm text-ink-2">
                ¿Ya tenés cuenta?{' '}
                <Link href="/login" className="text-primary hover:text-primary font-semibold transition">
                  Ingresá aquí
                </Link>
              </p>
            </div>
          </form>
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
