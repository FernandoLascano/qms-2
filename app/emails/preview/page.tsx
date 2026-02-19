'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const TEMPLATES = [
  { id: 'emailBienvenida', label: '1. Bienvenida' },
  { id: 'emailTramiteEnviado', label: '2. Trámite Enviado' },
  { id: 'emailPagoPendiente', label: '3. Pago Pendiente' },
  { id: 'emailDocumentoRechazado', label: '4. Documento Rechazado' },
  { id: 'emailEtapaCompletada', label: '5. Etapa Completada' },
  { id: 'emailSociedadInscripta', label: '6. Sociedad Inscripta' },
  { id: 'emailNotificacion', label: '7. Notificación' },
  { id: 'emailRecordatorioPago', label: '8. Recordatorio Pago' },
  { id: 'emailRecordatorioDocumento', label: '9. Recordatorio Documento' },
  { id: 'emailRecordatorioTramiteEstancado', label: '10. Trámite Estancado' },
  { id: 'emailAlertaDenominacion', label: '11. Alerta Denominación' },
  { id: 'emailValidacionTramite', label: '12. Validación Trámite' },
]

export default function EmailPreviewPage() {
  const [template, setTemplate] = useState('emailBienvenida')
  const [nombre, setNombre] = useState('Fernando')
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ template, nombre })
    fetch(`/api/emails/preview?${params}`)
      .then((res) => res.text())
      .then(setHtml)
      .catch(() => setHtml('<p style="color:red">Error al cargar el preview</p>'))
      .finally(() => setLoading(false))
  }, [template, nombre])

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Preview de Emails
          </h1>
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar - Controles */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-fit sticky top-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Template
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            {(template === 'emailBienvenida' || template === 'emailNotificacion') && (
              <>
                <label className="block text-sm font-semibold text-gray-700 mt-4 mb-2">
                  Nombre (ejemplo)
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Fernando"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </>
            )}

            <p className="mt-4 text-xs text-gray-500">
              Vista previa del email como se verá en el cliente de correo.
            </p>
          </div>

          {/* Preview - iframe */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                {TEMPLATES.find((t) => t.id === template)?.label}
              </span>
              {loading && (
                <span className="text-xs text-gray-500">Cargando...</span>
              )}
            </div>
            <div className="p-4 bg-gray-100 min-h-[600px]">
              <iframe
                srcDoc={html}
                title="Email preview"
                className="w-full border-0 rounded-lg bg-white shadow-inner"
                style={{ minHeight: '700px' }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
