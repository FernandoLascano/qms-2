'use client'

/**
 * Alta de cuenta.
 *
 * Misma composición que el login (presentación a la izquierda, formulario a la
 * derecha): antes era una columna suelta que parecía otro producto. Tres campos
 * en vez de cinco: el teléfono lo pide igual el formulario del trámite y la
 * confirmación de contraseña se reemplazó por el botón para verla. Al terminar
 * no se manda al login a escribir todo de nuevo: se queda acá con «Revisá tu
 * correo» y la opción de reenviar el email.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { User, Mail, Lock, ArrowLeft, UserPlus, Eye, EyeOff, Check, MailCheck, LogIn } from 'lucide-react'
import { PasswordStrength } from '@/components/ui/password-strength'
import { EtiquetaCarga } from '@/components/ui/etiqueta-carga'
import { ReenviarVerificacion } from '@/components/auth/reenviar-verificacion'
import { controlBase } from '@/components/ui/input'
import { trackEvent } from '@/lib/analytics'
import { leerAtribucion, registrarAtribucion } from '@/lib/leads/atribucion-cliente'
import { validarEmailCuenta, validarNombreUsuario, validarPassword } from '@/lib/validaciones'
import { useTurnstileWidget } from '@/lib/hooks/use-turnstile-widget'
import { cn } from '@/lib/utils'

const GoogleSignInButton = dynamic(
  () => import('@/components/auth/google-sign-in-button').then((m) => m.GoogleSignInButton),
  { ssr: false, loading: () => <div className="h-12 w-full rounded-control bg-surface-3/90 animate-pulse" aria-hidden /> },
)
const AuthDivider = dynamic(
  () => import('@/components/auth/google-sign-in-button').then((m) => m.AuthDivider),
  { ssr: false, loading: () => <div className="h-6" aria-hidden /> },
)

/** Lo que gana quien crea la cuenta. Sólo cosas que la plataforma hace hoy. */
const BENEFICIOS = [
  'Crear la cuenta no tiene costo',
  'Completás el formulario a tu ritmo: el avance se guarda solo',
  'Seguís cada etapa del trámite desde tu panel',
]

type Campo = 'name' | 'email' | 'password'
type Errores = Partial<Record<Campo, string>>

const campo = cn(controlBase, 'h-12 pl-12 pr-4 text-body')

/** Error bajo un campo: se despliega con la altura justa (`.mensaje-campo`). */
function ErrorCampo({ id, mensaje }: { id: string; mensaje?: string }) {
  return (
    <div className="mensaje-campo" data-visible={!!mensaje}>
      <div>
        <p id={id} className="pt-1 pl-1 text-label text-danger">
          {mensaje}
        </p>
      </div>
    </div>
  )
}

export default function RegistroPage() {
  const router = useRouter()
  const [datos, setDatos] = useState({ name: '', email: '', password: '' })
  const [verPassword, setVerPassword] = useState(false)
  const [errores, setErrores] = useState<Errores>({})
  const [emailExistente, setEmailExistente] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviadoA, setEnviadoA] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

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

  // Quien llega directo al registro desde un anuncio también tiene que quedar
  // atribuido (antes sólo se registraba desde la portada).
  useEffect(() => {
    registrarAtribucion()
  }, [])

  const cambiar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nombre = e.target.name as Campo
    setDatos((d) => ({ ...d, [nombre]: e.target.value }))
    // El error se va apenas se corrige el campo, no recién al reenviar.
    if (errores[nombre]) setErrores((er) => ({ ...er, [nombre]: undefined }))
    if (nombre === 'email') setEmailExistente(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorGeneral('')
    setEmailExistente(false)

    // Las mismas reglas que valida el servidor, marcadas en cada campo.
    const nuevos: Errores = {
      name: validarNombreUsuario(datos.name) ?? undefined,
      email: validarEmailCuenta(datos.email) ?? undefined,
      password: validarPassword(datos.password) ?? undefined,
    }
    setErrores(nuevos)
    const primero = (Object.keys(nuevos) as Campo[]).find((k) => nuevos[k])
    if (primero) {
      formRef.current?.querySelector<HTMLInputElement>(`#${primero}`)?.focus()
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: datos.name,
          email: datos.email,
          password: datos.password,
          turnstileToken,
          website,
          atribucion: leerAtribucion(),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        if (data.codigo === 'EMAIL_EXISTENTE') {
          setEmailExistente(true)
          formRef.current?.querySelector<HTMLInputElement>('#email')?.focus()
        } else if (data.codigo === 'ANTISPAM') {
          setErrorGeneral('No pudimos comprobar que no sos un robot. Recargá la página y probá de nuevo.')
        } else {
          setErrorGeneral(data.error || 'No pudimos crear la cuenta. Probá de nuevo.')
        }
        setLoading(false)
        return
      }

      trackEvent.registro('email')
      // En local la cuenta nace verificada: directo a ingresar.
      if (data.user?.emailVerified) {
        router.push('/login?verified=true')
        return
      }
      setEnviadoA(data.user?.email ?? datos.email.trim().toLowerCase())
      setLoading(false)
    } catch {
      setErrorGeneral('Ocurrió un error de conexión. Probá de nuevo.')
      setLoading(false)
    }
  }

  const esperandoCaptcha = captchaRequired && !!siteKey && !turnstileToken

  return (
    <div className="canvas-landing min-h-screen flex flex-col">
      <header className="border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Ir al inicio" className="inline-flex min-h-10 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- ver Navbar */}
            <img src="/assets/img/qms-logo-reg.png" alt="QuieroMiSAS" width={96} height={36} className="h-9 w-auto" />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-2 text-body-sm font-medium text-ink-2 hover:text-primary transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 lg:py-16">
          {siteKey && (
            <Script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
              strategy="afterInteractive"
              onLoad={onScriptLoad}
            />
          )}

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Presentación: como en el login, sólo en pantallas grandes. */}
            <section className="hidden lg:block stagger">
              <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-full px-4 py-2 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-2 w-2 rounded-full bg-brand-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
                </span>
                <span className="text-body-sm font-medium text-brand-800">+500 empresas constituidas</span>
              </div>

              <h1 className="text-hero font-semibold text-ink tracking-tight mb-4">
                Creá tu cuenta <span className="text-primary">gratis</span>
              </h1>

              <p className="text-body text-ink-2 max-w-md mb-8">
                Es el primer paso para constituir tu S.A.S.: después completás el formulario y
                nosotros nos ocupamos del resto del trámite.
              </p>

              <ul className="space-y-3 max-w-md">
                {BENEFICIOS.map((texto) => (
                  <li key={texto} className="flex items-start gap-3 text-body text-ink-2">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    {texto}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rise w-full max-w-md mx-auto lg:mx-0 lg:justify-self-end">
              <div className="lg:hidden text-center mb-6">
                <h1 className="text-title font-semibold text-ink">
                  Creá tu cuenta <span className="text-primary">gratis</span>
                </h1>
                <p className="mt-1 text-body-sm text-ink-2">El primer paso para constituir tu S.A.S.</p>
              </div>

              <div className="bg-surface rounded-card border border-line shadow-pop p-6 sm:p-8">
                {enviadoA ? (
                  // ── Cuenta creada: falta verificar el email ──
                  <div className="text-center space-y-4" role="status">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success">
                      <MailCheck className="h-7 w-7" aria-hidden />
                    </div>
                    <div>
                      <h2 className="text-heading font-semibold text-ink">Revisá tu correo</h2>
                      <p className="mt-2 text-body-sm text-ink-2">
                        Te mandamos un link a <strong className="text-ink break-all">{enviadoA}</strong> para
                        activar tu cuenta. Puede tardar unos minutos: fijate también en spam o promociones.
                      </p>
                    </div>
                    <ReenviarVerificacion email={enviadoA} className="flex flex-col items-center" />
                    <div className="pt-4 border-t border-line space-y-2">
                      <Link
                        href="/login"
                        className="w-full h-12 bg-primary hover:bg-primary-hover text-on-primary font-semibold text-body rounded-control shadow-raise transition-all flex items-center justify-center gap-2"
                      >
                        <LogIn className="w-5 h-5" />
                        Ya lo verifiqué, ingresar
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEnviadoA(null)}
                        className="inline-flex min-h-10 items-center text-body-sm text-ink-2 hover:text-primary"
                      >
                        ¿Te equivocaste de email? Volver
                      </button>
                    </div>
                  </div>
                ) : (
                  <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {errorGeneral && (
                      <div
                        role="alert"
                        className="rise bg-danger-soft border border-danger-line text-danger p-4 rounded-control text-body-sm font-medium"
                      >
                        {errorGeneral}
                      </div>
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
                      <label htmlFor="name" className="block text-body-sm font-semibold text-ink-2">
                        Nombre y apellido
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-3" />
                        <input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Como figura en tu DNI"
                          value={datos.name}
                          onChange={cambiar}
                          disabled={loading}
                          autoComplete="name"
                          aria-invalid={!!errores.name || undefined}
                          aria-describedby="name-error"
                          className={campo}
                        />
                      </div>
                      <ErrorCampo id="name-error" mensaje={errores.name} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-body-sm font-semibold text-ink-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-3" />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          inputMode="email"
                          placeholder="tu@email.com"
                          value={datos.email}
                          onChange={cambiar}
                          disabled={loading}
                          autoComplete="email"
                          aria-invalid={!!errores.email || emailExistente || undefined}
                          aria-describedby="email-error"
                          className={campo}
                        />
                      </div>
                      <ErrorCampo id="email-error" mensaje={errores.email} />
                      {/* Ya registrado: no es un error a corregir, es otro camino. */}
                      <div className="mensaje-campo" data-visible={emailExistente}>
                        <div>
                          <p className="pt-1 pl-1 text-label text-ink-2" role={emailExistente ? 'alert' : undefined}>
                            Ya hay una cuenta con este email.{' '}
                            <Link href="/login" className="font-semibold text-primary hover:underline">
                              Ingresá con tu contraseña
                            </Link>{' '}
                            o con Google si te registraste así.
                          </p>
                        </div>
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
                          name="password"
                          type={verPassword ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          value={datos.password}
                          onChange={cambiar}
                          disabled={loading}
                          autoComplete="new-password"
                          aria-invalid={!!errores.password || undefined}
                          aria-describedby="password-error password-fortaleza"
                          className={`${campo} pr-12`}
                        />
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
                      <ErrorCampo id="password-error" mensaje={errores.password} />
                      <div className="mensaje-campo" data-visible={datos.password.length > 0 && !errores.password}>
                        <div id="password-fortaleza">
                          <PasswordStrength valor={datos.password} className="pt-1" />
                        </div>
                      </div>
                    </div>

                    {/* Captcha anti-spam */}
                    {captchaRequired && !siteKey && (
                      <div className="bg-warning-soft border border-warning-line text-warning p-3 rounded-control text-body-sm">
                        Falta configurar el anti-spam. Definí <code className="font-mono">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> y{' '}
                        <code className="font-mono">TURNSTILE_SECRET_KEY</code> en Vercel.
                      </div>
                    )}
                    {captchaRequired && siteKey && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex justify-center min-h-[65px]" ref={setContainerRef} />
                        {esperandoCaptcha && (
                          <p className="text-label text-ink-3">Comprobando que no sos un robot…</p>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || (captchaRequired && (!siteKey || !turnstileToken))}
                      className="w-full h-12 bg-primary hover:bg-primary-hover text-on-primary font-semibold text-body rounded-control shadow-raise hover:shadow-pop transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <EtiquetaCarga cargando={loading} textoCargando="Creando cuenta...">
                        <UserPlus className="w-5 h-5" />
                        Crear cuenta
                      </EtiquetaCarga>
                    </button>

                    <p className="text-center text-label text-ink-3">
                      Al crear tu cuenta aceptás los{' '}
                      <Link href="/terminos" className="underline hover:text-primary">
                        Términos y condiciones
                      </Link>{' '}
                      y la{' '}
                      <Link href="/privacidad" className="underline hover:text-primary">
                        Política de privacidad
                      </Link>
                      .
                    </p>

                    <p className="text-center text-body-sm text-ink-2 pt-4 border-t border-line">
                      ¿Ya tenés cuenta?{' '}
                      <Link href="/login" className="inline-flex min-h-10 items-center text-primary font-semibold hover:underline">
                        Ingresá
                      </Link>
                    </p>
                  </form>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
