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
  AlarmClock, History, Users, MessageCircle, Copy, Flame
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

interface Senal {
  texto: string
  puntos: number
}

interface Lead {
  id: string
  // De dónde sale este lead. Un BORRADOR es un formulario empezado y sin
  // enviar; una CONSULTA es alguien que escribió o se registró y todavía no
  // abrió ningún trámite. Conviven en la misma lista porque para trabajarlos
  // son lo mismo: gente interesada a la que hay que contactar.
  tipo: 'BORRADOR' | 'CONSULTA'
  denominacion: string | null
  nombre: string
  email: string
  telefono: string | null
  jurisdiccion: string
  plan: string
  mensaje?: string | null
  partner?: string | null
  avance: number | null
  segmento: string
  segmentoTexto: string
  puntaje: number
  franja: string
  senales: Senal[]
  mensajeSugerido: string
  creado: string
  ultimaActividad: string
  leadEstado: string
  leadMotivoPerdida: string | null
  leadUltimoContacto: string | null
  leadProximoContacto: string | null
  leadToquesEnviados: number
  seguimientos: Seguimiento[]
}

const ESTADOS: Record<string, { texto: string; clase: string }> = {
  NUEVO: { texto: 'Nuevo', clase: 'bg-warning-soft text-warning border-warning-line' },
  CONTACTADO: { texto: 'Contactado', clase: 'bg-info-soft text-info border-info-line' },
  EN_CONVERSACION: { texto: 'En conversación', clase: 'bg-info-soft text-info border-info-line' },
  ESPERANDO_CLIENTE: { texto: 'Esperando al cliente', clase: 'bg-info-soft text-info border-info-line' },
  CONVERTIDO: { texto: 'Ganado', clase: 'bg-success-soft text-success border-success-line' },
  DESCARTADO: { texto: 'Perdido', clase: 'bg-surface-3 text-ink-2 border-line' },
}

// Los motivos son los que se escuchan en los contactos reales. Los dos primeros
// son, además, los únicos dos que se pueden atacar desde el producto.
const MOTIVOS_PERDIDA = [
  { valor: 'NO_ENTENDIO', texto: 'No entendió el proceso' },
  { valor: 'SIN_DOMICILIO', texto: 'No tiene domicilio en Córdoba o CABA' },
  { valor: 'NO_DEFINIO', texto: 'Todavía no sabe qué necesita' },
  { valor: 'PRECIO', texto: 'Precio' },
  { valor: 'LO_HIZO_OTRO', texto: 'Lo hizo con otro' },
  { valor: 'NO_CONTESTA', texto: 'No contesta' },
  { valor: 'OTRO', texto: 'Otro' },
]

const FRANJAS: Record<string, { texto: string; clase: string }> = {
  ALTA: { texto: 'Prioridad alta', clase: 'bg-danger-soft text-danger border-danger-line' },
  MEDIA: { texto: 'Prioridad media', clase: 'bg-warning-soft text-warning border-warning-line' },
  BAJA: { texto: 'Prioridad baja', clase: 'bg-surface-3 text-ink-3 border-line' },
}

const CANALES = [
  { valor: 'LLAMADA', texto: 'Llamada' },
  { valor: 'WHATSAPP', texto: 'WhatsApp' },
  { valor: 'EMAIL', texto: 'Email' },
  { valor: 'OTRO', texto: 'Otro' },
]

type Filtro = 'COLA' | 'PENDIENTES' | 'A_SEGUIR' | 'TODOS' | 'CONVERTIDO' | 'DESCARTADO'

export default function LeadsLista({ leads }: { leads: Lead[] }) {
  const router = useRouter()
  const [filtro, setFiltro] = useState<Filtro>('COLA')
  const [leadActivo, setLeadActivo] = useState<Lead | null>(null)
  const [historialDe, setHistorialDe] = useState<Lead | null>(null)
  const [canal, setCanal] = useState('LLAMADA')
  const [nota, setNota] = useState('')
  const [proximoContacto, setProximoContacto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [perdiendo, setPerdiendo] = useState<Lead | null>(null)
  const [motivo, setMotivo] = useState('NO_ENTENDIO')
  const [motivoNota, setMotivoNota] = useState('')

  const vencido = (lead: Lead) =>
    !!lead.leadProximoContacto &&
    !['CONVERTIDO', 'DESCARTADO'].includes(lead.leadEstado) &&
    (isPast(new Date(lead.leadProximoContacto)) || isToday(new Date(lead.leadProximoContacto)))

  // La cola del día: a quién hay que escribirle por WhatsApp ahora. Son los que
  // siguen abiertos, tienen teléfono y todavía no se contactaron hoy. Es la
  // vista por defecto porque el problema medido no es convencer sino que el
  // contacto ocurra: con 8 seguimientos sobre 25 leads, a la mayoría nunca se
  // los tocó.
  const enCola = (lead: Lead) =>
    !['CONVERTIDO', 'DESCARTADO'].includes(lead.leadEstado) &&
    !!lead.telefono &&
    (!lead.leadUltimoContacto || !isToday(new Date(lead.leadUltimoContacto)))

  const contadores = useMemo(() => ({
    COLA: leads.filter(enCola).length,
    PENDIENTES: leads.filter((l) => !['CONVERTIDO', 'DESCARTADO'].includes(l.leadEstado)).length,
    A_SEGUIR: leads.filter(vencido).length,
    TODOS: leads.length,
    CONVERTIDO: leads.filter((l) => l.leadEstado === 'CONVERTIDO').length,
    DESCARTADO: leads.filter((l) => l.leadEstado === 'DESCARTADO').length,
  }), [leads])

  const visibles = leads
    .filter((lead) => {
      switch (filtro) {
        case 'COLA': return enCola(lead)
        case 'PENDIENTES': return !['CONVERTIDO', 'DESCARTADO'].includes(lead.leadEstado)
        case 'A_SEGUIR': return vencido(lead)
        case 'CONVERTIDO': return lead.leadEstado === 'CONVERTIDO'
        case 'DESCARTADO': return lead.leadEstado === 'DESCARTADO'
        default: return true
      }
    })
    // Por puntaje, no por fecha: el que está por cerrar va primero aunque haya
    // entrado hace más tiempo.
    .sort((a, b) => b.puntaje - a.puntaje)

  // Las dos fuentes viven en tablas distintas, así que cada una tiene su ruta.
  const rutaDe = (lead: Lead) =>
    lead.tipo === 'CONSULTA'
      ? `/api/admin/leads/consulta/${lead.id}`
      : `/api/admin/leads/${lead.id}`

  const cambiarEstado = async (
    lead: Lead,
    leadEstado: string,
    extra?: { leadMotivoPerdida?: string; leadMotivoNota?: string },
  ) => {
    try {
      const res = await fetch(rutaDe(lead), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadEstado, ...extra }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Estado actualizado')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el estado')
    }
  }

  // Perder un lead sin dejar el motivo es perderlo dos veces: no queda nada que
  // mirar después para saber qué arreglar. Por eso el motivo se pide siempre.
  const alCambiarEstado = (lead: Lead, valor: string) => {
    if (valor === 'DESCARTADO') {
      setPerdiendo(lead)
      setMotivo('NO_ENTENDIO')
      setMotivoNota('')
      return
    }
    cambiarEstado(lead, valor)
  }

  const confirmarPerdida = async () => {
    if (!perdiendo) return
    setGuardando(true)
    await cambiarEstado(perdiendo, 'DESCARTADO', {
      leadMotivoPerdida: motivo,
      leadMotivoNota: motivoNota.trim() || undefined,
    })
    setGuardando(false)
    setPerdiendo(null)
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
      const res = await fetch(
        leadActivo.tipo === 'CONSULTA'
          ? `/api/admin/leads/consulta/${leadActivo.id}`
          : `/api/admin/leads/${leadActivo.id}/seguimiento`,
        {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canal,
          nota: nota.trim(),
          leadProximoContacto: proximoContacto || undefined,
        }),
      },
      )
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

  const copiarMensaje = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto)
      toast.success('Mensaje copiado')
    } catch {
      toast.error('No se pudo copiar. Abrí WhatsApp y el mensaje va incluido en el enlace.')
    }
  }

  const filtros: { valor: Filtro; texto: string }[] = [
    { valor: 'COLA', texto: 'Cola de hoy' },
    { valor: 'PENDIENTES', texto: 'Pendientes' },
    { valor: 'A_SEGUIR', texto: 'A seguir hoy' },
    { valor: 'TODOS', texto: 'Todos' },
    { valor: 'CONVERTIDO', texto: 'Ganados' },
    { valor: 'DESCARTADO', texto: 'Perdidos' },
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
            const franja = FRANJAS[lead.franja] || FRANJAS.BAJA
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
                        <span
                          className={`px-3 py-1 rounded-full text-label font-medium border ${franja.clase}`}
                          title={lead.senales.map((s) => `${s.puntos > 0 ? '+' : ''}${s.puntos} ${s.texto}`).join(' · ') || 'Sin señales'}
                        >
                          {lead.franja === 'ALTA' && <Flame className="h-3 w-3 inline mr-1 -mt-px" />}
                          {franja.texto}
                        </span>
                        <span className="px-3 py-1 rounded-full text-label font-medium border bg-surface-3 text-ink-2 border-line">
                          {lead.segmentoTexto}
                        </span>
                        {atrasado && (
                          <span className="px-2 py-1 rounded-full text-label font-semibold bg-danger-solid text-on-primary flex items-center gap-1">
                            <AlarmClock className="h-3 w-3" />
                            Seguimiento vencido
                          </span>
                        )}
                      </div>

                      {lead.tipo === 'BORRADOR' ? (
                        <p className="text-body-sm text-ink-2 mb-2 flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {lead.denominacion || <span className="italic text-ink-3">Sin denominación elegida</span>}
                        </p>
                      ) : lead.mensaje ? (
                        <p className="text-body-sm text-ink-2 mb-2 line-clamp-3 whitespace-pre-wrap border-l-2 border-line pl-3">
                          {lead.mensaje}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-4 text-body-sm text-ink-2">
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-primary">
                          <Mail className="h-4 w-4" />
                          {lead.email}
                        </a>
                        {lead.telefono ? (
                          <a
                            href={`https://wa.me/${telefonoWhatsapp(lead.telefono)}?text=${encodeURIComponent(lead.mensajeSugerido)}`}
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
                        onChange={(e) => alCambiarEstado(lead, e.target.value)}
                        className="w-52"
                      >
                        {Object.entries(ESTADOS).map(([valor, { texto }]) => (
                          <option key={valor} value={valor}>{texto}</option>
                        ))}
                      </Select>
                      {lead.telefono && (
                        <>
                          <Button asChild variant="secondary" className="gap-2">
                            <a
                              href={`https://wa.me/${telefonoWhatsapp(lead.telefono)}?text=${encodeURIComponent(lead.mensajeSugerido)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="h-4 w-4" />
                              WhatsApp
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Copiar el mensaje sugerido"
                            title="Copiar el mensaje sugerido"
                            onClick={() => copiarMensaje(lead.mensajeSugerido)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </>
                      )}
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
                      <p className="text-ink-2 mb-1">
                        {lead.avance === null ? 'Origen' : 'Formulario completado'}
                      </p>
                      <p className="font-semibold text-ink">
                        {lead.avance === null ? lead.segmentoTexto : `${lead.avance}%`}
                      </p>
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

      {/* Marcar perdido pide el motivo. Es el único dato que después dice qué
          arreglar: si la mayoría se pierde por el domicilio, el problema está en
          el formulario y no en el seguimiento. */}
      <Dialog open={!!perdiendo} onOpenChange={(abierto) => !abierto && setPerdiendo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Por qué se perdió?</DialogTitle>
            <DialogDescription>
              {perdiendo?.nombre} · queda en la lista, en «Perdidos»
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivo-perdida">Motivo</Label>
              <Select
                id="motivo-perdida"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              >
                {MOTIVOS_PERDIDA.map((m) => (
                  <option key={m.valor} value={m.valor}>{m.texto}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo-nota">Detalle (opcional)</Label>
              <Textarea
                id="motivo-nota"
                value={motivoNota}
                onChange={(e) => setMotivoNota(e.target.value)}
                placeholder="Lo que te dijo, con sus palabras"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPerdiendo(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmarPerdida} loading={guardando}>
              Marcar como perdido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
