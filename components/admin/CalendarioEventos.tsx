'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Calendar, momentLocalizer, Views, type View, type Formats, type Messages } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '@/styles/calendar-rbc.css'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Clock, MapPin, Link as LinkIcon, FileText, User } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Select } from '@/components/ui/select'

const localizer = momentLocalizer(moment)

// El localizer de moment formatea con el locale que le pasemos en `culture`
// (nombres de meses y días, y la semana arranca el lunes).
const CULTURA = 'es'

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

const FORMATOS: Formats = {
  monthHeaderFormat: (fecha, cultura, loc) => capitalizar(loc!.format(fecha, 'MMMM [de] YYYY', cultura)),
  dayHeaderFormat: (fecha, cultura, loc) => capitalizar(loc!.format(fecha, 'dddd D [de] MMMM [de] YYYY', cultura)),
  dayRangeHeaderFormat: ({ start, end }, cultura, loc) =>
    `${loc!.format(start, 'D [de] MMMM', cultura)} – ${loc!.format(end, 'D [de] MMMM [de] YYYY', cultura)}`,
  agendaHeaderFormat: ({ start, end }, cultura, loc) =>
    `${loc!.format(start, 'D [de] MMMM', cultura)} – ${loc!.format(end, 'D [de] MMMM [de] YYYY', cultura)}`,
  weekdayFormat: (fecha, cultura, loc) => capitalizar(loc!.format(fecha, 'dddd', cultura)),
  dayFormat: (fecha, cultura, loc) => capitalizar(loc!.format(fecha, 'ddd D/M', cultura)),
  agendaDateFormat: (fecha, cultura, loc) => capitalizar(loc!.format(fecha, 'ddd D [de] MMM', cultura)),
  timeGutterFormat: 'HH:mm',
  agendaTimeFormat: 'HH:mm',
  eventTimeRangeFormat: ({ start, end }, cultura, loc) =>
    `${loc!.format(start, 'HH:mm', cultura)} – ${loc!.format(end, 'HH:mm', cultura)}`,
  agendaTimeRangeFormat: ({ start, end }, cultura, loc) =>
    `${loc!.format(start, 'HH:mm', cultura)} – ${loc!.format(end, 'HH:mm', cultura)}`,
}

const MENSAJES: Messages = {
  next: 'Siguiente',
  previous: 'Anterior',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  work_week: 'Semana laboral',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  allDay: 'Todo el día',
  yesterday: 'Ayer',
  tomorrow: 'Mañana',
  noEventsInRange: 'No hay eventos en este rango',
  showMore: (total) => `+${total} más`,
}

// Días que muestra la vista Agenda (el default de react-big-calendar).
const DIAS_AGENDA = 30

// Semana y Día abren en el horario de oficina, no a medianoche.
const INICIO_JORNADA = new Date(1970, 0, 1, 8, 0)

// Rango que se ve en pantalla en cada vista. En Mes incluye los días de los
// meses vecinos que completan la grilla, y el último día entra completo.
function rangoVisible(fecha: Date, vista: View): { desde: Date; hasta: Date } {
  const m = moment(fecha).locale(CULTURA)
  switch (vista) {
    case Views.DAY:
      return { desde: m.clone().startOf('day').toDate(), hasta: m.clone().endOf('day').toDate() }
    case Views.WEEK:
    case Views.WORK_WEEK:
      return { desde: m.clone().startOf('week').toDate(), hasta: m.clone().endOf('week').toDate() }
    case Views.AGENDA:
      return {
        desde: m.clone().startOf('day').toDate(),
        hasta: m.clone().add(DIAS_AGENDA, 'days').endOf('day').toDate()
      }
    default:
      return {
        desde: m.clone().startOf('month').startOf('week').toDate(),
        hasta: m.clone().endOf('month').endOf('week').toDate()
      }
  }
}

const TIPOS_EVENTO: Record<string, string> = {
  REUNION_CLIENTE: 'Reunión con cliente',
  VENCIMIENTO_DENOMINACION: 'Vencimiento de denominación',
  VENCIMIENTO_PAGO: 'Vencimiento de pago',
  FECHA_LIMITE_DOCUMENTO: 'Fecha límite de documento',
  FECHA_LIMITE_TRAMITE: 'Fecha límite de trámite',
  RECORDATORIO: 'Recordatorio',
  OTRO: 'Otro'
}

const FORMATO_DETALLE = "EEEE d 'de' MMMM 'de' yyyy, HH:mm"

interface Evento {
  id: string
  titulo: string
  descripcion?: string
  tipo: string
  fechaInicio: string
  fechaFin?: string
  relacionadoCon?: string
  ubicacion?: string
  linkReunion?: string
  completado: boolean
  tramite?: {
    id: string
    denominacionSocial1: string
    denominacionAprobada?: string
    estadoGeneral?: string
    sociedadInscripta?: boolean
  }
  cliente?: {
    name: string
    email: string
  }
}

interface EventoCalendario {
  id: string
  title: string
  start: Date
  end: Date
  resource: Evento
}

export default function CalendarioEventos() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarDialogo, setMostrarDialogo] = useState(false)
  const [fecha, setFecha] = useState<Date>(() => new Date())
  const [vista, setVista] = useState<View>(Views.MONTH)
  const [incluirCerrados, setIncluirCerrados] = useState(false)
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null)

  // Formulario de nuevo evento
  const [nuevoEvento, setNuevoEvento] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'REUNION_CLIENTE',
    fechaInicio: '',
    fechaFin: '',
    tramiteId: '',
    clienteId: '',
    ubicacion: '',
    linkReunion: ''
  })

  // Si se navega rápido, una respuesta vieja no debe pisar a la del rango actual.
  const ultimaCarga = useRef(0)

  // Pide los eventos del rango que se ve en pantalla.
  const cargarEventos = useCallback(async () => {
    const { desde, hasta } = rangoVisible(fecha, vista)
    const carga = ++ultimaCarga.current
    try {
      setCargando(true)
      const params = new URLSearchParams({
        fechaInicio: desde.toISOString(),
        fechaFin: hasta.toISOString()
      })
      if (incluirCerrados) params.set('incluirCerrados', '1')

      const response = await fetch(`/api/admin/eventos?${params}`)
      const data = await response.json()
      if (carga !== ultimaCarga.current) return

      if (response.ok) {
        setEventos(data.eventos || [])
      } else {
        toast.error(data.error || 'Error al cargar eventos')
      }
    } catch (error) {
      console.error('Error al cargar eventos:', error)
      toast.error('Error al cargar eventos')
    } finally {
      if (carga === ultimaCarga.current) setCargando(false)
    }
  }, [fecha, vista, incluirCerrados])

  useEffect(() => {
    cargarEventos()
  }, [cargarEventos])

  const eventosCalendario: EventoCalendario[] = eventos.map(evento => ({
    id: evento.id,
    title: evento.titulo,
    start: new Date(evento.fechaInicio),
    end: evento.fechaFin ? new Date(evento.fechaFin) : new Date(evento.fechaInicio),
    resource: evento
  }))

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setNuevoEvento(prev => ({
      ...prev,
      fechaInicio: format(start, "yyyy-MM-dd'T'HH:mm")
    }))
    setMostrarDialogo(true)
  }

  const handleCrearEvento = async () => {
    try {
      const response = await fetch('/api/admin/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoEvento)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Evento creado exitosamente')
        setMostrarDialogo(false)
        setNuevoEvento({
          titulo: '',
          descripcion: '',
          tipo: 'REUNION_CLIENTE',
          fechaInicio: '',
          fechaFin: '',
          tramiteId: '',
          clienteId: '',
          ubicacion: '',
          linkReunion: ''
        })
        cargarEventos()
      } else {
        toast.error(data.error || 'Error al crear evento')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear evento')
    }
  }

  const eventStyleGetter = (event: EventoCalendario) => {
    const tipo = event.resource.tipo
    let backgroundColor = '#3b82f6' // Azul por defecto

    switch (tipo) {
      case 'REUNION_CLIENTE':
        backgroundColor = '#ef4444' // Rojo
        break
      case 'VENCIMIENTO_DENOMINACION':
        backgroundColor = '#f59e0b' // Amarillo
        break
      case 'VENCIMIENTO_PAGO':
        backgroundColor = '#ef4444' // Rojo
        break
      case 'FECHA_LIMITE_DOCUMENTO':
        backgroundColor = '#8b5cf6' // Púrpura
        break
      case 'FECHA_LIMITE_TRAMITE':
        backgroundColor = '#ec4899' // Rosa
        break
      default:
        backgroundColor = '#6b7280' // Gris
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: event.resource.completado ? 0.5 : 1,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        {/* El título y la bajada ya los pone el encabezado de la página. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer">
            <input
              type="checkbox"
              checked={incluirCerrados}
              onChange={(e) => setIncluirCerrados(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Mostrar vencimientos de trámites ya cerrados
          </label>
          <Dialog open={mostrarDialogo} onOpenChange={setMostrarDialogo}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary hover:bg-primary">
                <Plus className="h-4 w-4" />
                Nuevo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Evento</DialogTitle>
                <DialogDescription>
                  Agregá una reunión, vencimiento o fecha importante
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Título *</Label>
                  <Input
                    value={nuevoEvento.titulo}
                    onChange={(e) => setNuevoEvento(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Reunión con cliente"
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <textarea
                    value={nuevoEvento.descripcion}
                    onChange={(e) => setNuevoEvento(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full min-h-[100px] px-3 py-2 border border-line rounded-chip"
                    placeholder="Detalles del evento..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo *</Label>
                    <Select
                      value={nuevoEvento.tipo}
                      onChange={(e) => setNuevoEvento(prev => ({ ...prev, tipo: e.target.value }))}
                    >
                      <option value="REUNION_CLIENTE">Reunión con Cliente</option>
                      <option value="VENCIMIENTO_DENOMINACION">Vencimiento de Denominación</option>
                      <option value="VENCIMIENTO_PAGO">Vencimiento de Pago</option>
                      <option value="FECHA_LIMITE_DOCUMENTO">Fecha Límite de Documento</option>
                      <option value="FECHA_LIMITE_TRAMITE">Fecha Límite de Trámite</option>
                      <option value="RECORDATORIO">Recordatorio</option>
                      <option value="OTRO">Otro</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Fecha y Hora Inicio *</Label>
                    <Input
                      type="datetime-local"
                      value={nuevoEvento.fechaInicio}
                      onChange={(e) => setNuevoEvento(prev => ({ ...prev, fechaInicio: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Fecha y Hora Fin (opcional)</Label>
                  <Input
                    type="datetime-local"
                    value={nuevoEvento.fechaFin}
                    onChange={(e) => setNuevoEvento(prev => ({ ...prev, fechaFin: e.target.value }))}
                  />
                </div>
                {nuevoEvento.tipo === 'REUNION_CLIENTE' && (
                  <>
                    <div>
                      <Label>Ubicación</Label>
                      <Input
                        value={nuevoEvento.ubicacion}
                        onChange={(e) => setNuevoEvento(prev => ({ ...prev, ubicacion: e.target.value }))}
                        placeholder="Dirección o lugar de reunión"
                      />
                    </div>
                    <div>
                      <Label>Link de Reunión Virtual</Label>
                      <Input
                        value={nuevoEvento.linkReunion}
                        onChange={(e) => setNuevoEvento(prev => ({ ...prev, linkReunion: e.target.value }))}
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                  </>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setMostrarDialogo(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCrearEvento} className="bg-primary hover:bg-primary">
                    Crear Evento
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height: '600px' }}>
          {cargando && (
            <p className="absolute right-0 -top-6 text-sm text-ink-2">Cargando eventos...</p>
          )}
          <Calendar
            localizer={localizer}
            culture={CULTURA}
            formats={FORMATOS}
            messages={MENSAJES}
            events={eventosCalendario}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            date={fecha}
            view={vista}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            length={DIAS_AGENDA}
            scrollToTime={INICIO_JORNADA}
            onNavigate={setFecha}
            onView={setVista}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={(evento) => setEventoSeleccionado(evento.resource)}
            selectable
            eventPropGetter={eventStyleGetter}
          />
        </div>
      </CardContent>

      <Dialog open={!!eventoSeleccionado} onOpenChange={(abierto) => { if (!abierto) setEventoSeleccionado(null) }}>
        <DialogContent className="max-w-lg">
          {eventoSeleccionado && (
            <>
              <DialogHeader>
                <DialogTitle>{eventoSeleccionado.titulo}</DialogTitle>
                <DialogDescription>
                  {TIPOS_EVENTO[eventoSeleccionado.tipo] || eventoSeleccionado.tipo}
                  {eventoSeleccionado.completado && ' · Completado'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-2 text-sm">
                <p className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 shrink-0 text-ink-2" />
                  <span>
                    {capitalizar(format(new Date(eventoSeleccionado.fechaInicio), FORMATO_DETALLE, { locale: es }))}
                    {eventoSeleccionado.fechaFin &&
                      ` – ${format(new Date(eventoSeleccionado.fechaFin), FORMATO_DETALLE, { locale: es })}`}
                  </span>
                </p>
                {eventoSeleccionado.descripcion && (
                  <p className="whitespace-pre-line text-ink-2">{eventoSeleccionado.descripcion}</p>
                )}
                {eventoSeleccionado.ubicacion && (
                  <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-ink-2" />
                    <span>{eventoSeleccionado.ubicacion}</span>
                  </p>
                )}
                {eventoSeleccionado.linkReunion && (
                  <p className="flex items-start gap-2">
                    <LinkIcon className="h-4 w-4 mt-0.5 shrink-0 text-ink-2" />
                    <a
                      href={eventoSeleccionado.linkReunion}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline break-all"
                    >
                      {eventoSeleccionado.linkReunion}
                    </a>
                  </p>
                )}
                {eventoSeleccionado.cliente && (
                  <p className="flex items-start gap-2">
                    <User className="h-4 w-4 mt-0.5 shrink-0 text-ink-2" />
                    <span>{eventoSeleccionado.cliente.name} ({eventoSeleccionado.cliente.email})</span>
                  </p>
                )}
                {eventoSeleccionado.tramite && (
                  <p className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-0.5 shrink-0 text-ink-2" />
                    <span>
                      {eventoSeleccionado.tramite.denominacionAprobada || eventoSeleccionado.tramite.denominacionSocial1}
                      {eventoSeleccionado.tramite.sociedadInscripta && ' · Sociedad inscripta'}
                    </span>
                  </p>
                )}
              </div>
              {eventoSeleccionado.tramite && (
                <div className="flex justify-end mt-4">
                  <Button asChild className="bg-primary hover:bg-primary">
                    <Link href={`/dashboard/admin/tramites/${eventoSeleccionado.tramite.id}`}>
                      Ver trámite
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
