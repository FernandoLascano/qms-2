'use client'

/**
 * Vista previa de los mails automáticos.
 *
 * Son las plantillas que viven en lib/emails/templates.tsx y salen solas
 * cuando pasa algo en un trámite. No se editan desde el panel — para eso están
 * las plantillas de la base, en /dashboard/admin/emails/plantillas — así que
 * esta pantalla es sólo de lectura.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Monitor, Smartphone, RefreshCw } from 'lucide-react'

/** Agrupadas por el momento en que se disparan, que es como se piensan. */
const GRUPOS = [
  {
    titulo: 'Alta de cuenta',
    items: [
      { id: 'emailBienvenida', label: 'Bienvenida', cuando: 'Al registrarse' },
      { id: 'emailVerificarCuenta', label: 'Verificar email', cuando: 'Al pedir activación' },
    ],
  },
  {
    titulo: 'Durante el trámite',
    items: [
      { id: 'emailTramiteEnviado', label: 'Trámite recibido', cuando: 'Al enviar el formulario' },
      { id: 'emailValidacionTramite', label: 'Trámite validado', cuando: 'Cuando lo aprueba el equipo' },
      { id: 'emailPagoPendiente', label: 'Pago requerido', cuando: 'Al cargar un pago' },
      { id: 'emailDocumentoRechazado', label: 'Documento rechazado', cuando: 'Al rechazar un documento' },
      { id: 'emailEtapaCompletada', label: 'Etapa completada', cuando: 'Al avanzar de etapa' },
      { id: 'emailSociedadInscripta', label: 'Sociedad inscripta', cuando: 'Al cerrar el trámite' },
      { id: 'emailNotificacion', label: 'Notificación suelta', cuando: 'Aviso manual' },
    ],
  },
  {
    titulo: 'Recordatorios automáticos',
    items: [
      { id: 'emailRecordatorioPago', label: 'Pago pendiente', cuando: 'Pago sin resolver' },
      { id: 'emailRecordatorioDocumento', label: 'Documento pendiente', cuando: 'Documento sin subir' },
      { id: 'emailRecordatorioTramiteEstancado', label: 'Trámite estancado', cuando: 'Sin avance por varios días' },
      { id: 'emailAlertaDenominacion', label: 'Denominación por vencer', cuando: 'Reserva próxima a vencer' },
    ],
  },
]

const TODOS = GRUPOS.flatMap((g) => g.items)

export default function PreviewMailsPage() {
  const [template, setTemplate] = useState('emailBienvenida')
  const [html, setHtml] = useState('')
  const [cargando, setCargando] = useState(true)
  const [ancho, setAncho] = useState<'escritorio' | 'telefono'>('escritorio')
  const [alto, setAlto] = useState(700)
  const marco = useRef<HTMLIFrameElement>(null)

  const cargar = useCallback(() => {
    setCargando(true)
    fetch(`/api/emails/preview?template=${template}&nombre=Fernando`)
      .then((res) => res.text())
      .then(setHtml)
      .catch(() =>
        setHtml('<p style="font-family: sans-serif; padding: 24px;">No se pudo cargar la vista previa.</p>'),
      )
      .finally(() => setCargando(false))
  }, [template])

  useEffect(cargar, [cargar])

  // El alto del mail depende del contenido: se mide una vez que cargó para que
  // no queden ni recortes ni un hueco blanco abajo.
  const medir = () => {
    const doc = marco.current?.contentDocument
    if (doc) setAlto(doc.body.scrollHeight + 24)
  }

  const actual = TODOS.find((t) => t.id === template)

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/admin/emails"
        className="inline-flex items-center gap-2 text-body-sm text-ink-2 hover:text-ink"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a la bandeja
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="text-body-sm font-semibold text-primary">Correo</span>
          <h1 className="text-title font-semibold text-ink mt-1">Mails automáticos</h1>
          <p className="text-ink-2 text-body-sm mt-1 max-w-2xl">
            Los que salen solos cuando pasa algo en un trámite. Se editan en el código, no desde acá:
            para las plantillas que usás al redactar a mano andá a{' '}
            <Link href="/dashboard/admin/emails/plantillas" className="text-primary font-semibold hover:underline">
              Plantillas
            </Link>
            .
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-control border border-line p-0.5">
            <button
              type="button"
              onClick={() => setAncho('escritorio')}
              aria-pressed={ancho === 'escritorio'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-chip text-label font-semibold transition ${
                ancho === 'escritorio' ? 'bg-surface-3 text-ink' : 'text-ink-2 hover:text-ink'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Escritorio
            </button>
            <button
              type="button"
              onClick={() => setAncho('telefono')}
              aria-pressed={ancho === 'telefono'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-chip text-label font-semibold transition ${
                ancho === 'telefono' ? 'bg-surface-3 text-ink' : 'text-ink-2 hover:text-ink'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Teléfono
            </button>
          </div>
          <button
            type="button"
            onClick={cargar}
            className="inline-flex items-center gap-2 px-4 py-2 border border-line rounded-control text-body-sm font-medium text-ink-2 hover:bg-surface-2 transition"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-start">
        {/* Listado */}
        <nav className="bg-surface rounded-card border border-line shadow-raise p-2 lg:sticky lg:top-4">
          {GRUPOS.map((grupo) => (
            <div key={grupo.titulo} className="mb-3 last:mb-1">
              <p className="px-3 pt-2 pb-1.5 text-label font-semibold text-ink-3">{grupo.titulo}</p>
              <ul className="space-y-0.5">
                {grupo.items.map((t) => {
                  const activo = t.id === template
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setTemplate(t.id)}
                        aria-current={activo ? 'true' : undefined}
                        className={`w-full text-left px-3 py-2 rounded-control transition ${
                          activo ? 'bg-nav-active-bg text-nav-active' : 'text-ink-2 hover:bg-surface-2'
                        }`}
                      >
                        <span className={`block text-body-sm ${activo ? 'font-semibold' : 'font-medium'}`}>
                          {t.label}
                        </span>
                        <span className="block text-label text-ink-3 mt-0.5">{t.cuando}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Vista previa */}
        <div className="bg-surface rounded-card border border-line shadow-raise overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-body-sm font-semibold text-ink truncate">{actual?.label}</p>
              <p className="text-label text-ink-3 font-mono truncate">{template}</p>
            </div>
            {cargando && <span className="text-label text-ink-3 shrink-0">Cargando…</span>}
          </div>

          <div className="p-4 bg-surface-2 overflow-x-auto">
            <div className={`mx-auto transition-all ${ancho === 'telefono' ? 'max-w-[390px]' : 'max-w-[680px]'}`}>
              <iframe
                ref={marco}
                srcDoc={html}
                title={`Vista previa de ${actual?.label}`}
                onLoad={medir}
                className="w-full border-0 rounded-control bg-white block"
                style={{ height: alto }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
