'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/ui/field'
import { diaMas, diaParaGuardar } from '@/lib/leads/agenda'
import { MOTIVOS_PERDIDA, pedir, rutaLead, type LeadCRM } from './tipos'
import { SelectorProximo } from './SelectorProximo'

/* ─────────────────────────────── Nuevo lead ─────────────────────────────── */

export function NuevoLeadDialog({
  open,
  onOpenChange,
  onCreado,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onCreado: (id: string) => void
}) {
  const [f, setF] = useState({ nombre: '', telefono: '', email: '', mensaje: '' })
  const [proximo, setProximo] = useState<string | null>(diaMas(0))
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!open) return
    setF({ nombre: '', telefono: '', email: '', mensaje: '' })
    setProximo(diaMas(0))
    setErrores({})
  }, [open])

  async function guardar() {
    const e: Record<string, string> = {}
    if (!f.nombre.trim()) e.nombre = 'Poné el nombre'
    if (!f.telefono.trim() && !f.email.trim()) e.telefono = 'Hace falta un teléfono o un email'
    setErrores(e)
    if (Object.keys(e).length) return

    setGuardando(true)
    try {
      const { id } = await pedir('/api/admin/leads', 'POST', {
        ...f,
        proximoContacto: proximo ? diaParaGuardar(proximo) : null,
      })
      toast.success('Lead cargado')
      onOpenChange(false)
      onCreado(id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cargar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo lead</DialogTitle>
          <DialogDescription>Alguien que te escribió por WhatsApp, te llamó o te pasaron el contacto.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="nl-nombre" required error={errores.nombre} className="sm:col-span-2">
            <Input id="nl-nombre" value={f.nombre} invalid={!!errores.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
          </Field>
          <Field label="Teléfono" htmlFor="nl-tel" error={errores.telefono}>
            <Input id="nl-tel" type="tel" value={f.telefono} invalid={!!errores.telefono} placeholder="+54 9 351…"
              onChange={(e) => setF({ ...f, telefono: e.target.value })} />
          </Field>
          <Field label="Email" htmlFor="nl-email">
            <Input id="nl-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </Field>
          <Field label="¿Qué necesita?" htmlFor="nl-msj" className="sm:col-span-2">
            <Textarea id="nl-msj" rows={3} value={f.mensaje} placeholder="Lo que te consultó, con sus palabras"
              onChange={(e) => setF({ ...f, mensaje: e.target.value })} />
          </Field>
        </div>
        <SelectorProximo valor={proximo} onChange={setProximo} etiqueta="¿Cuándo lo contactás?" />
        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={guardando}>Cancelar</Button>
          <Button onClick={guardar} loading={guardando}>Cargar lead</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ──────────────────────────────── Perdido ────────────────────────────────
   Perder un lead sin dejar el motivo es perderlo dos veces: no queda nada
   que mirar después para saber qué arreglar. */

export function PerdidoDialog({
  lead,
  onOpenChange,
  onHecho,
}: {
  lead: LeadCRM | null
  onOpenChange: (o: boolean) => void
  onHecho: () => void
}) {
  const [motivo, setMotivo] = useState('NO_CONTESTA')
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (lead) { setMotivo('NO_CONTESTA'); setNota('') }
  }, [lead])

  async function guardar() {
    if (!lead) return
    setGuardando(true)
    try {
      await pedir(rutaLead(lead), 'PATCH', {
        leadEstado: 'DESCARTADO',
        leadMotivoPerdida: motivo,
        leadMotivoNota: nota.trim() || undefined,
        leadProximoContacto: null,
      })
      toast.success('Marcado como perdido')
      onOpenChange(false)
      onHecho()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={!!lead} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Por qué se perdió?</DialogTitle>
          <DialogDescription>{lead?.nombre} · sale de la agenda y queda en «Perdidos».</DialogDescription>
        </DialogHeader>
        <Field label="Motivo" htmlFor="perd-motivo">
          <Select id="perd-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            {MOTIVOS_PERDIDA.map((m) => <option key={m.valor} value={m.valor}>{m.texto}</option>)}
          </Select>
        </Field>
        <Field label="Detalle" htmlFor="perd-nota" hint="Opcional. Lo que te dijo, con sus palabras.">
          <Textarea id="perd-nota" rows={3} value={nota} onChange={(e) => setNota(e.target.value)} />
        </Field>
        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={guardando}>Cancelar</Button>
          <Button variant="danger" onClick={guardar} loading={guardando}>Marcar perdido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ────────────────────────── Datos de contacto ──────────────────────────
   Sólo para consultas: en un formulario sin terminar los datos son los que
   cargó la persona y se corrigen en su formulario. */

export function EditarContactoDialog({
  lead,
  onOpenChange,
  onHecho,
}: {
  lead: LeadCRM | null
  onOpenChange: (o: boolean) => void
  onHecho: () => void
}) {
  const [f, setF] = useState({ nombre: '', telefono: '', email: '' })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (lead) setF({ nombre: lead.nombre, telefono: lead.telefono ?? '', email: lead.email ?? '' })
  }, [lead])

  async function guardar() {
    if (!lead) return
    if (!f.telefono.trim() && !f.email.trim()) return toast.error('Dejá al menos un teléfono o un email')
    setGuardando(true)
    try {
      await pedir(rutaLead(lead), 'PATCH', f)
      toast.success('Datos actualizados')
      onOpenChange(false)
      onHecho()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={!!lead} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Datos de contacto</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="Nombre" htmlFor="ec-nombre">
            <Input id="ec-nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
          </Field>
          <Field label="Teléfono" htmlFor="ec-tel">
            <Input id="ec-tel" type="tel" value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} />
          </Field>
          <Field label="Email" htmlFor="ec-email">
            <Input id="ec-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </Field>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={guardando}>Cancelar</Button>
          <Button onClick={guardar} loading={guardando}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
