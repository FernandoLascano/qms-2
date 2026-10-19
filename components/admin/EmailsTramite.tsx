'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, ChevronDown, ChevronUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { EmailHtml } from '@/components/admin/EmailHtml'

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
  /** Email de la cuenta del cliente: separa lo que le llegó a él de los avisos internos. */
  emailCliente?: string | null
}

type Filtro = 'todos' | 'cliente' | 'equipo'

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'cliente', label: 'Enviados al cliente' },
  { id: 'equipo', label: 'Recibidos y avisos para vos' },
]

export default function EmailsTramite({ emails: todos, emailCliente }: EmailsTramiteProps) {
  const [abierto, setAbierto] = useState<string | null>(null)
  const [seccionAbierta, setSeccionAbierta] = useState(false)
  const [filtro, setFiltro] = useState<Filtro>('todos')

  // Al cliente: lo que salió hacia su dirección. El resto son los mails que
  // escribió él y los avisos automáticos que la plataforma le manda al equipo.
  const cliente = (emailCliente ?? '').trim().toLowerCase()
  const alCliente = (e: EmailItem) =>
    e.direction !== 'INBOUND' && (e.to ?? []).some((d) => d.trim().toLowerCase() === cliente)
  const cuenta = { todos: todos.length, cliente: todos.filter(alCliente).length, equipo: 0 }
  cuenta.equipo = cuenta.todos - cuenta.cliente
  const emails = filtro === 'todos' ? todos : todos.filter((e) => (filtro === 'cliente') === alCliente(e))

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
            <span className="ml-1 font-mono text-label text-ink-2">({todos.length})</span>
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
        {todos.length > 0 && cliente && (
          <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar emails">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filtro === f.id}
                onClick={() => setFiltro(f.id)}
                className={`rounded-full border px-3 py-1 text-label font-medium transition ${
                  filtro === f.id
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-line text-ink-2 hover:bg-surface-2'
                }`}
              >
                {f.label} <span className="font-mono opacity-80">({cuenta[f.id]})</span>
              </button>
            ))}
          </div>
        )}
        {todos.length > 0 && emails.length === 0 ? (
          <p className="text-body-sm text-ink-2">No hay emails en este grupo.</p>
        ) : emails.length === 0 ? (
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
                        <EmailHtml html={email.bodyHtml} />
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
