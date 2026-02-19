'use client'

import { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Link as LinkIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const localizer = momentLocalizer(moment)

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
  }
  cliente?: {
    name: string
    email: string
  }
}

export default function CalendarioEventos() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarDialogo, setMostrarDialogo] = useState(false)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null)

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

  useEffect(() => {
    cargarEventos()
  }, [])

  const cargarEventos = async () => {
    try {
      setCargando(true)
      const hoy = new Date()
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)

      const response = await fetch(
        `/api/admin/eventos?fechaInicio=${inicioMes.toISOString()}&fechaFin=${finMes.toISOString()}`
      )
      const data = await response.json()

      if (response.ok) {
        setEventos(data.eventos || [])
      }
    } catch (error) {
      console.error('Error al cargar eventos:', error)
      toast.error('Error al cargar eventos')
    } finally {
      setCargando(false)
    }
  }

  const eventosCalendario = eventos.map(evento => ({
    id: evento.id,
    title: evento.titulo,
    start: new Date(evento.fechaInicio),
    end: evento.fechaFin ? new Date(evento.fechaFin) : new Date(evento.fechaInicio),
    resource: evento
  }))

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setFechaSeleccionada(start)
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

  const eventStyleGetter = (event: any) => {
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendario de Eventos
            </CardTitle>
            <CardDescription>
              Reuniones, vencimientos y fechas importantes
            </CardDescription>
          </div>
          <Dialog open={mostrarDialogo} onOpenChange={setMostrarDialogo}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-brand-600 hover:bg-brand-700">
                <Plus className="h-4 w-4" />
                Nuevo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Evento</DialogTitle>
                <DialogDescription>
                  Agrega una reunión, vencimiento o fecha importante
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
                    className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                    placeholder="Detalles del evento..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo *</Label>
                    <select
                      value={nuevoEvento.tipo}
                      onChange={(e) => setNuevoEvento(prev => ({ ...prev, tipo: e.target.value }))}
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                    >
                      <option value="REUNION_CLIENTE">Reunión con Cliente</option>
                      <option value="VENCIMIENTO_DENOMINACION">Vencimiento de Denominación</option>
                      <option value="VENCIMIENTO_PAGO">Vencimiento de Pago</option>
                      <option value="FECHA_LIMITE_DOCUMENTO">Fecha Límite de Documento</option>
                      <option value="FECHA_LIMITE_TRAMITE">Fecha Límite de Trámite</option>
                      <option value="RECORDATORIO">Recordatorio</option>
                      <option value="OTRO">Otro</option>
                    </select>
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
                  <Button onClick={handleCrearEvento} className="bg-brand-600 hover:bg-brand-700">
                    Crear Evento
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {cargando ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">Cargando eventos...</p>
          </div>
        ) : (
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={eventosCalendario}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              messages={{
                next: 'Siguiente',
                previous: 'Anterior',
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día',
                agenda: 'Agenda',
                date: 'Fecha',
                time: 'Hora',
                event: 'Evento',
                noEventsInRange: 'No hay eventos en este rango'
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

