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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
            <Mail className="h-4 w-4 text-indigo-700" />
          </span>
          <span>Emails del Trámite</span>
        </CardTitle>
        <CardDescription>
          Todos los mails enviados y recibidos vinculados a este trámite. Tocá uno para ver su contenido.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {emails.length === 0 ? (
          <p className="text-sm text-gray-500">
            Todavía no hay emails registrados para este trámite. Los mails automáticos que se envíen de ahora en adelante van a aparecer acá.
          </p>
        ) : (
          <div className="space-y-2">
            {emails.map((email) => {
              const esEntrante = email.direction === 'INBOUND'
              const estaAbierto = abierto === email.id
              return (
                <div key={email.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setAbierto(estaAbierto ? null : email.id)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                        esEntrante
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      {esEntrante ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                      {esEntrante ? 'Recibido' : 'Enviado'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{email.subject}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {esEntrante ? `De: ${email.from}` : `Para: ${email.to?.join(', ')}`} · {formatFecha(email.createdAt)}
                      </p>
                    </div>
                    {estaAbierto ? (
                      <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                  </button>

                  {estaAbierto && (
                    <div className="border-t border-gray-200 bg-white p-3">
                      {email.bodyHtml ? (
                        <div
                          className="text-sm text-gray-800 max-w-none overflow-x-auto [&_a]:text-brand-700 [&_a]:underline"
                          dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                        />
                      ) : email.bodyText ? (
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">{email.bodyText}</pre>
                      ) : (
                        <p className="text-sm text-gray-500">Sin contenido guardado.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
