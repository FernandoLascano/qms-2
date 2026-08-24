'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, ChevronDown, ChevronUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react'

interface EmailItem {
  id: string
  subject: string
  to: string[]
  from: string
  direction: string
  bodyHtml?: string | null
  bodyText?: string | null
  createdAt: Date | string
}

interface EmailsTramiteProps {
  emails: EmailItem[]
}

export default function EmailsTramite({ emails }: EmailsTramiteProps) {
  const [abierto, setAbierto] = useState<string | null>(null)
  const [seccionAbierta, setSeccionAbierta] = useState(false)

  const formatFecha = (fecha: Date | string) => {
    try {
      return new Date(fecha).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return ''
    }
  }

  return (
    <Card>
      <button
        type="button"
        onClick={() => setSeccionAbierta((v) => !v)}
        className="w-full text-left"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-info-soft">
              <Mail className="h-4 w-4 text-info" />
            </span>
            <span>Emails del Trámite</span>
            <span className="ml-1 font-mono text-label text-ink-2">({emails.length})</span>
            {seccionAbierta ? (
              <ChevronUp className="ml-auto h-5 w-5 text-ink-3" />
            ) : (
              <ChevronDown className="ml-auto h-5 w-5 text-ink-3" />
            )}
          </CardTitle>
          <CardDescription>
            Todos los mails enviados y recibidos vinculados a este trámite. Tocá para {seccionAbierta ? 'ocultar' : 'ver'}.
          </CardDescription>
        </CardHeader>
      </button>
      {seccionAbierta && (
      <CardContent>
        {emails.length === 0 ? (
          <p className="text-body-sm text-ink-2">
            Todavía no hay emails registrados para este trámite. Los mails automáticos que se envíen de ahora en adelante van a aparecer acá.
          </p>
        ) : (
          <div className="space-y-2">
            {emails.map((email) => {
              const esEntrante = email.direction === 'INBOUND'
              const estaAbierto = abierto === email.id
              return (
                <div key={email.id} className="border border-line rounded-control overflow-hidden">
                  <button
                    onClick={() => setAbierto(estaAbierto ? null : email.id)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-2 transition-colors"
                  >
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                        esEntrante
                          ? 'bg-success-soft text-success border border-success-line'
                          : 'bg-info-soft text-info border border-info-line'
                      }`}
                    >
                      {esEntrante ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                      {esEntrante ? 'Recibido' : 'Enviado'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-ink truncate">{email.subject}</p>
                      <p className="text-label text-ink-2 truncate">
                        {esEntrante ? `De: ${email.from}` : `Para: ${email.to?.join(', ')}`} · {formatFecha(email.createdAt)}
                      </p>
                    </div>
                    {estaAbierto ? (
                      <ChevronUp className="h-4 w-4 text-ink-3 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-ink-3 flex-shrink-0" />
                    )}
                  </button>

                  {estaAbierto && (
                    <div className="border-t border-line bg-surface p-3">
                      {email.bodyHtml ? (
                        <div
                          className="text-body-sm text-ink max-w-none overflow-x-auto [&_a]:text-primary [&_a]:underline"
                          dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                        />
                      ) : email.bodyText ? (
                        <pre className="text-body-sm text-ink whitespace-pre-wrap font-sans">{email.bodyText}</pre>
                      ) : (
                        <p className="text-body-sm text-ink-2">Sin contenido guardado.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
      )}
    </Card>
  )
}
