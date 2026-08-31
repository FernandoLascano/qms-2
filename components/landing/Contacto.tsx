'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTurnstileWidget } from '@/lib/hooks/use-turnstile-widget'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Script from 'next/script'
import { leerAtribucion, registrarAtribucion } from '@/lib/leads/atribucion-cliente'

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
  const [website, setWebsite] = useState('')

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const captchaRequired = process.env.NODE_ENV === 'production'

  const onTurnstileToken = useCallback((token: string | null) => setTurnstileToken(token), [])
  const { setContainerRef, onScriptLoad } = useTurnstileWidget({
    siteKey,
    captchaRequired,
    onTokenChange: onTurnstileToken,
  })

  // Guarda de dónde vino la persona la primera vez, para poder atribuir la
  // consulta a un canal en vez de que aparezca de la nada.
  useEffect(() => {
    registrarAtribucion()
  }, [])

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
        body: JSON.stringify({ ...formData, turnstileToken, website, atribucion: leerAtribucion() }),
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
      lines: ['+54 9 351 213 6212'],
      href: 'tel:+5493512136212'
    },
    {
      icon: Mail,
      title: 'Email',
      lines: ['contacto@quieromisas.com'],
      href: 'mailto:contacto@quieromisas.com'
    }
  ]

  return (
    <section id="contacto" className="py-seccion md:py-seccion-lg bg-surface-2">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {siteKey && (
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onLoad={onScriptLoad}
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
          <h2 className="text-display md:text-display-lg font-black text-ink mb-4">
            ¿Tenés alguna <span className="text-brand-700">consulta</span>?
          </h2>
          <p className="text-lead text-ink-3 max-w-2xl mx-auto">
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
                  <div className="w-12 h-12 bg-brand-100 rounded-control flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-brand-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink mb-1">{item.title}</h3>
                    {item.lines.map((line, i) => (
                      item.href ? (
                        <a
                          key={i}
                          href={item.href}
                          className="block text-ink-2 hover:text-brand-700 transition-colors"
                        >
                          {typeof line === 'string' ? line : `${line.label}:${line.text}`}
                        </a>
                      ) : (
                        <p key={i} className="text-ink-2">
                          {typeof line === 'string' ? line : (
                            <>
                              <span className="font-semibold text-ink">{line.label}:</span>
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
                className="mt-8 p-6 bg-surface rounded-card border border-line"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <h3 className="font-bold text-ink mb-3">Horario de atención</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-2">Lunes a Viernes</span>
                    <span className="font-semibold text-ink">9:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-2">Sábados</span>
                    <span className="font-semibold text-ink-3">Cerrado</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-2">Domingos</span>
                    <span className="font-semibold text-ink-3">Cerrado</span>
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
              <div className="bg-surface rounded-card border border-line shadow-pop p-6 md:p-8">
                {success ? (
                  <motion.div
                    className="text-center py-12"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-16 h-16 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-title font-bold text-ink mb-2">Mensaje enviado</h3>
                    <p className="text-ink-2 mb-6">Te responderemos a la brevedad.</p>
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
                        className="flex items-center gap-3 bg-brand-50 border border-brand-200 text-brand-700 p-4 rounded-control text-sm"
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
                        <label htmlFor="nombre" className="text-sm font-semibold text-n-700">
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
                          className="w-full h-12 px-4 text-body-lg text-ink placeholder:text-n-400 border border-line rounded-control focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-semibold text-n-700">
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
                          className="w-full h-12 px-4 text-body-lg text-ink placeholder:text-n-400 border border-line rounded-control focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="asunto" className="text-sm font-semibold text-n-700">
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
                        className="w-full h-12 px-4 text-body-lg text-ink placeholder:text-n-400 border border-line rounded-control focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="mensaje" className="text-sm font-semibold text-n-700">
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
                        className="w-full px-4 py-3 text-body-lg text-ink placeholder:text-n-400 border border-line rounded-control focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Captcha anti-spam */}
                    {captchaRequired && !siteKey && (
                      <div className="bg-warning-soft border border-warning-line text-warning p-3 rounded-control text-sm">
                        Falta configurar el anti-spam. Definí <code className="font-mono">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> y{' '}
                        <code className="font-mono">TURNSTILE_SECRET_KEY</code> en Vercel.
                      </div>
                    )}

                    {captchaRequired && siteKey && <div className="flex justify-center min-h-[65px]" ref={setContainerRef} />}

                    <button
                      type="submit"
                      disabled={loading || (captchaRequired && (!siteKey || !turnstileToken))}
                      className="w-full h-12 bg-brand-700 hover:bg-brand-800 text-white font-semibold text-body-lg rounded-control shadow-pop shadow-brand-200 hover:shadow-pop transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
