'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Script from 'next/script'

interface FormData {
  nombre: string
  email: string
  asunto: string
  mensaje: string
}

export function Contacto() {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileReady, setTurnstileReady] = useState(false)
  const widgetIdRef = useRef<string | null>(null)
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null)
  const [website, setWebsite] = useState('')

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const captchaRequired = process.env.NODE_ENV === 'production'

  useEffect(() => {
    window.onTurnstileSuccessContacto = (token: string) => setTurnstileToken(token)
    window.onTurnstileExpiredContacto = () => setTurnstileToken(null)
    return () => {
      try {
        delete window.onTurnstileSuccessContacto
        delete window.onTurnstileExpiredContacto
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    if (!captchaRequired || !siteKey || !turnstileReady) return
    if (!turnstileContainerRef.current) return

    const turnstile = (window as any).turnstile as
      | undefined
      | { render: (el: HTMLElement, opts: Record<string, unknown>) => string; remove: (id: string) => void }

    if (!turnstile?.render) return

    try {
      if (widgetIdRef.current) {
        turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
      setTurnstileToken(null)
      widgetIdRef.current = turnstile.render(turnstileContainerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => window.onTurnstileSuccessContacto?.(token),
        'expired-callback': () => window.onTurnstileExpiredContacto?.(),
      })
    } catch {
      // ignore
    }
  }, [captchaRequired, siteKey, turnstileReady])

  // Leer asunto desde el hash de la URL (viene de OtrosServicios)
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash
      if (hash.includes('contacto?asunto=')) {
        const asunto = decodeURIComponent(hash.split('asunto=')[1] || '')
        if (asunto) {
          setFormData(prev => ({ ...prev, asunto: `Consulta: ${asunto}` }))
        }
      }
    }
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/contacto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, turnstileToken, website }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el mensaje')
      }

      setSuccess(true)
      setFormData({
        nombre: '',
        email: '',
        asunto: '',
        mensaje: ''
      })
    } catch (err: any) {
      setError(err.message || 'Error al enviar el mensaje. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Dirección',
      lines: [
        { label: 'Oficina Centro', text: ' Ituzaingo 87, 5to Piso, B° Centro' },
        { label: 'Oficina Norte', text: ' Pasaje Chagas 6043, B° Villa Belgrano' },
        'Córdoba, Argentina'
      ]
    },
    {
      icon: Phone,
      title: 'Teléfono',
      lines: ['+54 9 351 428 4037'],
      href: 'tel:+5493514284037'
    },
    {
      icon: Mail,
      title: 'Email',
      lines: ['contacto@quieromisas.com'],
      href: 'mailto:contacto@quieromisas.com'
    }
  ]

  return (
    <section id="contacto" className="py-20 md:py-28 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {siteKey && (
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onLoad={() => setTurnstileReady(true)}
          />
        )}

        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-brand-700 font-semibold text-sm tracking-wider uppercase mb-4">
            Contacto
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            ¿Tenés alguna <span className="text-brand-700">consulta</span>?
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Escribinos y te responderemos a la brevedad
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Info de contacto */}
            <motion.div
              className="lg:col-span-2 space-y-6"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {contactInfo.map((item, index) => (
                <motion.div
                  key={item.title}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-brand-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                    {item.lines.map((line, i) => (
                      item.href ? (
                        <a
                          key={i}
                          href={item.href}
                          className="block text-gray-600 hover:text-brand-700 transition-colors"
                        >
                          {typeof line === 'string' ? line : `${line.label}:${line.text}`}
                        </a>
                      ) : (
                        <p key={i} className="text-gray-600">
                          {typeof line === 'string' ? line : (
                            <>
                              <span className="font-semibold text-gray-900">{line.label}:</span>
                              {line.text}
                            </>
                          )}
                        </p>
                      )
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Horario */}
              <motion.div
                className="mt-8 p-6 bg-white rounded-2xl border border-gray-200"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <h3 className="font-bold text-gray-900 mb-3">Horario de atención</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lunes a Viernes</span>
                    <span className="font-semibold text-gray-900">9:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sábados</span>
                    <span className="font-semibold text-gray-900">9:00 - 13:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Domingos</span>
                    <span className="font-semibold text-gray-500">Cerrado</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Formulario */}
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 md:p-8">
                {success ? (
                  <motion.div
                    className="text-center py-12"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Mensaje enviado</h3>
                    <p className="text-gray-600 mb-6">Te responderemos a la brevedad.</p>
                    <button
                      onClick={() => setSuccess(false)}
                      className="text-brand-700 font-semibold hover:text-brand-800 transition-colors"
                    >
                      Enviar otro mensaje
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 bg-brand-50 border border-brand-200 text-brand-700 p-4 rounded-xl text-sm"
                      >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}

                    {/* Honeypot */}
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

                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label htmlFor="nombre" className="text-sm font-semibold text-gray-700">
                          Nombre y Apellido
                        </label>
                        <input
                          id="nombre"
                          name="nombre"
                          type="text"
                          placeholder="Juan Pérez"
                          value={formData.nombre}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className="w-full h-12 px-4 text-base text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                          Email
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="tu@email.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className="w-full h-12 px-4 text-base text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="asunto" className="text-sm font-semibold text-gray-700">
                        Asunto
                      </label>
                      <input
                        id="asunto"
                        name="asunto"
                        type="text"
                        placeholder="¿En qué podemos ayudarte?"
                        value={formData.asunto}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="w-full h-12 px-4 text-base text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="mensaje" className="text-sm font-semibold text-gray-700">
                        Mensaje
                      </label>
                      <textarea
                        id="mensaje"
                        name="mensaje"
                        rows={5}
                        placeholder="Escribí tu consulta..."
                        value={formData.mensaje}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="w-full px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Captcha anti-spam */}
                    {captchaRequired && !siteKey && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-sm">
                        Falta configurar el anti-spam. Definí <code className="font-mono">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> y{' '}
                        <code className="font-mono">TURNSTILE_SECRET_KEY</code> en Vercel.
                      </div>
                    )}

                    {captchaRequired && siteKey && <div className="flex justify-center" ref={turnstileContainerRef} />}

                    <button
                      type="submit"
                      disabled={loading || (captchaRequired && (!siteKey || !turnstileToken))}
                      className="w-full h-12 bg-brand-700 hover:bg-brand-800 text-white font-semibold text-base rounded-xl shadow-lg shadow-brand-200 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Enviar mensaje
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

declare global {
  interface Window {
    onTurnstileSuccessContacto?: (token: string) => void
    onTurnstileExpiredContacto?: () => void
  }
}
