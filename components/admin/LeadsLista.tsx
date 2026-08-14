'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Mail, Phone, Calendar, Building2, MessageSquarePlus,
  AlarmClock, History, Users
} from 'lucide-react'
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Seguimiento {
  id: string
  canal: string
  nota: string
  admin: string
  createdAt: string
}

interface Lead {
  id: string
  denominacion: string | null
  nombre: string
  email: string
  telefono: string | null
  jurisdiccion: string
  plan: string
  avance: number
  creado: string
  ultimaActividad: string
  leadEstado: string
  leadUltimoContacto: string | null
  leadProximoContacto: string | null
  seguimientos: Seguimiento[]
}

const ESTADOS: Record<string, { texto: string; clase: string }> = {
  NUEVO: { texto: 'Nuevo', clase: 'bg-warning-soft text-warning border-warning-line' },
  CONTACTADO: { texto: 'Contactado', clase: 'bg-info-soft text-info border-info-line' },
  EN_CONVERSACION: { texto: 'En conversación', clase: 'bg-info-soft text-info border-info-line' },
  CONVERTIDO: { texto: 'Convertido', clase: 'bg-success-soft text-success border-success-line' },
  DESCARTADO: { texto: 'Descartado', clase: 'bg-surface-3 text-ink-2 border-line' },
}

const CANALES = [
  { valor: 'LLAMADA', texto: 'Llamada' },
  { valor: 'WHATSAPP', texto: 'WhatsApp' },
  { valor: 'EMAIL', texto: 'Email' },
  { valor: 'OTRO', texto: 'Otro' },
]

type Filtro = 'PENDIENTES' | 'A_SEGUIR' | 'TODOS' | 'CONVERTIDO' | 'DESCARTADO'

export default function LeadsLista({ leads }: { leads: Lead[] }) {
  const router = useRouter()
  const [filtro, setFiltro] = useState<Filtro>('PENDIENTES')
  const [leadActivo, setLeadActivo] = useState<Lead | null>(null)
  const [historialDe, setHistorialDe] = useState<Lead | null>(null)
  const [canal, setCanal] = useState('LLAMADA')
  const [nota, setNota] = useState('')
  const [proximoContacto, setProximoContacto] = useState('')
  const [guardando, setGuardando] = useState(false)

  const vencido = (lead: Lead) =>
    !!lead.leadProximoContacto &&
    !['CONVERTIDO', 'DESCARTADO'].includes(lead.leadEstado) &&
    (isPast(new Date(lead.leadProximoContacto)) || isToday(new Date(lead.leadProximoContacto)))

  const contadores = useMemo(() => ({
    PENDIENTES: leads.filter((l) => !['CONVERTIDO', 'DESCARTADO'].includes(l.leadEstado)).length,
    A_SEGUIR: leads.filter(vencido).length,
    TODOS: leads.length,
    CONVERTIDO: leads.filter((l) => l.leadEstado === 'CONVERTIDO').length,
    DESCARTADO: leads.filter((l) => l.leadEstado === 'DESCARTADO').length,
  }), [leads])

  const visibles = leads.filter((lead) => {
    switch (filtro) {
      case 'PENDIENTES': return !['CONVERTIDO', 'DESCARTADO'].includes(lead.leadEstado)
      case 'A_SEGUIR': return vencido(lead)
      case 'CONVERTIDO': return lead.leadEstado === 'CONVERTIDO'
      case 'DESCARTADO': return lead.leadEstado === 'DESCARTADO'
      default: return true
    }
  })

  const cambiarEstado = async (leadId: string, leadEstado: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadEstado }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Estado actualizado')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el estado')
    }
  }

  const abrirRegistro = (lead: Lead) => {
    setLeadActivo(lead)
    setCanal('LLAMADA')
    setNota('')
    setProximoContacto('')
  }

  const registrarContacto = async () => {
    if (!leadActivo || !nota.trim()) {
      toast.error('Escribí qué pasó en el contacto')
      return
    }

    setGuardando(true)
    try {
      const res = await fetch(`/api/admin/leads/${leadActivo.id}/seguimiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canal,
          nota: nota.trim(),
          leadProximoContacto: proximoContacto || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Contacto registrado')
      setLeadActivo(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo registrar el contacto')
    } finally {
      setGuardando(false)
    }
  }

  const telefonoWhatsapp = (telefono: string) => telefono.replace(/[^\d]/g, '')

  const filtros: { valor: Filtro; texto: string }[] = [
    { valor: 'PENDIENTES', texto: 'Pendientes' },
    { valor: 'A_SEGUIR', texto: 'A seguir hoy' },
    { valor: 'TODOS', texto: 'Todos' },
    { valor: 'CONVERTIDO', texto: 'Convertidos' },
    { valor: 'DESCARTADO', texto: 'Descartados' },
  ]

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {filtros.map((f) => (
          <button
            key={f.valor}
            onClick={() => setFiltro(f.valor)}
            className={`px-4 py-2 rounded-control text-body-sm font-semibold border transition-colors ${
              filtro === f.valor
                ? 'bg-primary text-on-primary border-primary-line'
                : 'bg-surface text-ink-2 border-line hover:border-primary-line'
            } ${f.valor === 'A_SEGUIR' && contadores.A_SEGUIR > 0 && filtro !== f.valor ? 'text-danger border-danger-line' : ''}`}
          >
            {f.texto} ({contadores[f.valor]})
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-16 w-16 text-ink-3 mx-auto mb-4" />
            <h3 className="text-title font-semibold text-ink mb-2">
              No hay leads con este filtro
            </h3>
            <p className="text-ink-2">Probá con otro filtro para ver más.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {visibles.map((lead) => {
            const estado = ESTADOS[lead.leadEstado] || ESTADOS.NUEVO
            const atrasado = vencido(lead)

            return (
              <Card key={lead.id} className={atrasado ? 'border-danger-line bg-danger-soft/30' : ''}>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-[260px]">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-title font-semibold text-ink">{lead.nombre}</h3>
                        <span className={`px-3 py-1 rounded-full text-label font-medium border ${estado.clase}`}>
                          {estado.texto}
                        </span>
                        {atrasado && (
                          <span className="px-2 py-1 rounded-full text-label font-semibold bg-danger-solid text-on-primary flex items-center gap-1">
                            <AlarmClock className="h-3 w-3" />
                            Seguimiento vencido
                          </span>
                        )}
                      </div>

                      <p className="text-body-sm text-ink-2 mb-2 flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {lead.denominacion || <span className="italic text-ink-3">Sin denominación elegida</span>}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-body-sm text-ink-2">
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-primary">
                          <Mail className="h-4 w-4" />
                          {lead.email}
                        </a>
                        {lead.telefono ? (
                          <a
                            href={`https://wa.me/${telefonoWhatsapp(lead.telefono)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-success"
                          >
                            <Phone className="h-4 w-4" />
                            {lead.telefono}
                          </a>
                        ) : (
                          <span className="flex items-center gap-1 text-ink-3 italic">
                            <Phone className="h-4 w-4" />
                            Sin teléfono
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Empezó {format(new Date(lead.creado), "d 'de' MMM", { locale: es })}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={lead.leadEstado}
                        onChange={(e) => cambiarEstado(lead.id, e.target.value)}
                        className="w-44"
                      >
                        {Object.entries(ESTADOS).map(([valor, { texto }]) => (
                          <option key={valor} value={valor}>{texto}</option>
                        ))}
                      </Select>
                      <Button onClick={() => abrirRegistro(lead)} className="gap-2">
                        <MessageSquarePlus className="h-4 w-4" />
                        Registrar contacto
                      </Button>
                      {lead.seguimientos.length > 0 && (
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label={`Ver ${lead.seguimientos.length} contacto(s) de este lead`}
                          onClick={() => setHistorialDe(lead)}
                          title={`Ver ${lead.seguimientos.length} contacto(s)`}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 text-body-sm">
                    <div className="bg-surface-2 p-3 rounded">
                      <p className="text-ink-2 mb-1">Formulario completado</p>
                      <p className="font-semibold text-ink">{lead.avance}%</p>
                    </div>
                    <div className="bg-surface-2 p-3 rounded">
                      <p className="text-ink-2 mb-1">Última actividad</p>
                      <p className="font-semibold text-ink">
                        hace {formatDistanceToNow(new Date(lead.ultimaActividad), { locale: es })}
                      </p>
                    </div>
                    <div className="bg-surface-2 p-3 rounded">
                      <p className="text-ink-2 mb-1">Último contacto</p>
                      <p className="font-semibold text-ink">
                        {lead.leadUltimoContacto
                          ? format(new Date(lead.leadUltimoContacto), "d 'de' MMM", { locale: es })
                          : 'Nunca'}
                      </p>
                    </div>
                    <div className={`p-3 rounded ${atrasado ? 'bg-danger-soft' : 'bg-surface-2'}`}>
                      <p className="text-ink-2 mb-1">Próximo contacto</p>
                      <p className={`font-semibold ${atrasado ? 'text-danger' : 'text-ink'}`}>
                        {lead.leadProximoContacto
                          ? format(new Date(lead.leadProximoContacto), "d 'de' MMM", { locale: es })
                          : 'Sin agendar'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="w-full bg-n-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${lead.avance}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Registrar contacto */}
      <Dialog open={!!leadActivo} onOpenChange={(open) => !open && setLeadActivo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar contacto</DialogTitle>
            <DialogDescription>
              {leadActivo?.nombre} — queda en el historial del lead.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="canal">Canal</Label>
              <Select id="canal" value={canal} onChange={(e) => setCanal(e.target.value)}>
                {CANALES.map((c) => (
                  <option key={c.valor} value={c.valor}>{c.texto}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nota">¿Qué pasó?</Label>
              <Textarea
                id="nota"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="No atendió, le mandé WhatsApp explicando los planes..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proximo">Próximo contacto (opcional)</Label>
              <Input
                id="proximo"
                type="date"
                value={proximoContacto}
                onChange={(e) => setProximoContacto(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLeadActivo(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={registrarContacto} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Historial */}
      <Dialog open={!!historialDe} onOpenChange={(open) => !open && setHistorialDe(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Historial de contactos</DialogTitle>
            <DialogDescription>{historialDe?.nombre}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {historialDe?.seguimientos.map((s) => (
              <div key={s.id} className="border border-line rounded-control p-3">
                <div className="flex items-center justify-between mb-1 text-label text-ink-2">
                  <span className="font-semibold text-ink-2">
                    {CANALES.find((c) => c.valor === s.canal)?.texto || s.canal}
                  </span>
                  <span>
                    {format(new Date(s.createdAt), "d 'de' MMM yyyy, HH:mm", { locale: es })}
                  </span>
                </div>
                <p className="text-body-sm text-ink whitespace-pre-wrap">{s.nota}</p>
                <p className="text-label text-ink-2 mt-1">por {s.admin}</p>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHistorialDe(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
