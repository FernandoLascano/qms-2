'use client'

import { useCallback, useState } from 'react'
import Script from 'next/script'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useTurnstileWidget } from '@/lib/hooks/use-turnstile-widget'
import { leerAtribucion } from '@/lib/leads/atribucion-cliente'

/**
 * Formulario para que Base93 (o su cliente) nos pase un caso. Va por
 * /api/contacto con el slug del partner: queda como lead de Base93 y llega
 * el mail al equipo con todos los datos armados en el mensaje.
 */

const TEXTOS = {
  en: {
    titulo: 'Refer a case',
    bajada: 'Tell us about the company. We reply with a full quote, the Base93 discount applied.',
    nombre: 'Your name',
    email: 'Your email',
    quien: 'You are',
    quienes: ['Base93 team or partner firm', 'Client referred by Base93'],
    cliente: 'Client or company name',
    residencia: 'Where do the shareholders live?',
    residencias: ['In Argentina', 'Abroad', 'Both'],
    extranjeros: 'Number of foreign shareholders',
    tipo: 'Entity type',
    tipos: ['S.A.S.', 'S.A.', 'S.R.L.', 'Not sure'],
    jurisdiccion: 'Jurisdiction',
    jurisdicciones: ['Córdoba', 'Buenos Aires', 'Not sure'],
    servicios: 'Services needed',
    serviciosOpciones: ['Foreign-investor package', 'CDI tax ID', 'Resident-director search', 'Registered address in Córdoba'],
    mensaje: 'Business activity and anything else we should know',
    enviar: 'Send case',
    enviando: 'Sending…',
    listo: 'Thank you. We received the case and will reply by email within 2 business days.',
    error: 'We could not send it. Please try again or write to contacto@quieromisas.com.',
  },
  es: {
    titulo: 'Pasanos un caso',
    bajada: 'Contanos sobre la sociedad. Te mandamos el presupuesto completo con el descuento de Base93.',
    nombre: 'Tu nombre',
    email: 'Tu email',
    quien: 'Sos',
    quienes: ['Equipo de Base93 o estudio asociado', 'Cliente que viene de Base93'],
    cliente: 'Nombre del cliente o de la sociedad',
    residencia: '¿Dónde viven los socios?',
    residencias: ['En Argentina', 'En el exterior', 'Ambos'],
    extranjeros: 'Cantidad de socios del exterior',
    tipo: 'Tipo de sociedad',
    tipos: ['S.A.S.', 'S.A.', 'S.R.L.', 'No sé'],
    jurisdiccion: 'Jurisdicción',
    jurisdicciones: ['Córdoba', 'CABA', 'No sé'],
    servicios: 'Servicios que necesita',
    serviciosOpciones: ['Paquete para inversores del exterior', 'CDI', 'Búsqueda de administrador residente', 'Domicilio en Córdoba'],
    mensaje: 'Actividad y cualquier otro dato útil',
    enviar: 'Enviar caso',
    enviando: 'Enviando…',
    listo: 'Gracias. Recibimos el caso y te respondemos por email en 2 días hábiles.',
    error: 'No pudimos enviarlo. Probá de nuevo o escribinos a contacto@quieromisas.com.',
  },
} as const

const campo = 'mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100'
const etiqueta = 'block text-sm font-semibold text-gray-800'

export default function FormularioBase93({ idioma }: { idioma: 'en' | 'es' }) {
  const t = TEXTOS[idioma]
  const [estado, setEstado] = useState<'inicial' | 'enviando' | 'listo' | 'error'>('inicial')
  const [activo, setActivo] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const captchaRequired = process.env.NODE_ENV === 'production'
  const onToken = useCallback((v: string | null) => setToken(v), [])
  const { setContainerRef, onScriptLoad } = useTurnstileWidget({
    siteKey,
    captchaRequired: captchaRequired && activo,
    onTokenChange: onToken,
  })

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const valor = (k: string) => String(f.get(k) ?? '').trim()
    const cliente = valor('cliente')
    const detalle = [
      `${t.quien}: ${valor('quien')}`,
      `${t.cliente}: ${cliente || '-'}`,
      `${t.residencia} ${valor('residencia')}`,
      `${t.extranjeros}: ${valor('extranjeros') || '0'}`,
      `${t.tipo}: ${valor('tipo')}`,
      `${t.jurisdiccion}: ${valor('jurisdiccion')}`,
      `${t.servicios}: ${f.getAll('servicios').join(', ') || '-'}`,
      '',
      valor('mensaje'),
    ].join('\n')

    setEstado('enviando')
    try {
      const r = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: valor('nombre'),
          email: valor('email'),
          asunto: `Base93${cliente ? `: ${cliente}` : ''}`,
          mensaje: detalle,
          website: valor('website'),
          turnstileToken: token,
          partner: 'base93',
          atribucion: leerAtribucion(),
        }),
      })
      setEstado(r.ok ? 'listo' : 'error')
    } catch {
      setEstado('error')
    }
  }

  if (estado === 'listo') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-900">
        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <p>{t.listo}</p>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} onFocus={() => setActivo(true)} className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
      {siteKey && activo && (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={onScriptLoad} />
      )}
      <div className="sm:col-span-2">
        <h2 className="text-2xl font-black text-gray-900">{t.titulo}</h2>
        <p className="mt-1 text-sm text-gray-600">{t.bajada}</p>
      </div>
      <label className={etiqueta}>
        {t.nombre}
        <input name="nombre" required maxLength={200} autoComplete="name" className={campo} />
      </label>
      <label className={etiqueta}>
        {t.email}
        <input name="email" type="email" required maxLength={200} autoComplete="email" className={campo} />
      </label>
      <label className={etiqueta}>
        {t.quien}
        <select name="quien" className={campo}>
          {t.quienes.map((o) => <option key={o}>{o}</option>)}
        </select>
      </label>
      <label className={etiqueta}>
        {t.cliente}
        <input name="cliente" maxLength={150} className={campo} />
      </label>
      <label className={etiqueta}>
        {t.residencia}
        <select name="residencia" defaultValue={t.residencias[1]} className={campo}>
          {t.residencias.map((o) => <option key={o}>{o}</option>)}
        </select>
      </label>
      <label className={etiqueta}>
        {t.extranjeros}
        <input name="extranjeros" type="number" min={0} max={50} inputMode="numeric" className={campo} />
      </label>
      <label className={etiqueta}>
        {t.tipo}
        <select name="tipo" className={campo}>
          {t.tipos.map((o) => <option key={o}>{o}</option>)}
        </select>
      </label>
      <label className={etiqueta}>
        {t.jurisdiccion}
        <select name="jurisdiccion" className={campo}>
          {t.jurisdicciones.map((o) => <option key={o}>{o}</option>)}
        </select>
      </label>
      <fieldset className="sm:col-span-2">
        <legend className={etiqueta}>{t.servicios}</legend>
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
          {t.serviciosOpciones.map((o) => (
            <label key={o} className="flex min-h-11 items-center gap-3 rounded-xl border border-gray-200 px-3 text-sm text-gray-800">
              <input type="checkbox" name="servicios" value={o} className="h-5 w-5 accent-brand-700" />
              {o}
            </label>
          ))}
        </div>
      </fieldset>
      <label className={`${etiqueta} sm:col-span-2`}>
        {t.mensaje}
        <textarea name="mensaje" required rows={4} maxLength={3000} className={campo} />
      </label>
      {/* Honeypot: invisible para personas. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {captchaRequired && siteKey && <div className="min-h-[65px] sm:col-span-2" ref={setContainerRef} />}
      {estado === 'error' && <p className="text-sm text-red-700 sm:col-span-2">{t.error}</p>}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={estado === 'enviando' || (captchaRequired && (!siteKey || !token))}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-700 px-6 font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
        >
          {estado === 'enviando' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {estado === 'enviando' ? t.enviando : t.enviar}
        </button>
      </div>
    </form>
  )
}
