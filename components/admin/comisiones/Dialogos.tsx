'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Info } from 'lucide-react'
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
import {
  BENEFICIARIO_LABEL,
  ORIGINADOR_LABEL,
  calcularReparto,
  hoyInput,
  type Beneficiario,
  type Originador,
  type Porcentajes,
} from '@/lib/comisiones'
import { ORIGINADORES, fmt, pedir, type Movimiento } from './tipos'

/* Los formularios vivían abiertos en la página, en grillas de seis columnas,
   y empujaban el contenido cada vez que se abrían. Ahora cada alta es un
   diálogo: la pantalla queda para leer y el diálogo para cargar. */

/* ───────────────────────────── Movimiento ───────────────────────────── */

export function MovimientoDialog({
  open,
  onOpenChange,
  movimiento,
  porcentajes,
  onGuardado,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Si viene, se edita; si no, se crea uno manual. */
  movimiento?: Movimiento | null
  porcentajes: Porcentajes
  onGuardado: () => void
}) {
  const vacio = { fecha: hoyInput(), cliente: '', asunto: '', monto: '', originador: 'NINGUNO' as Originador, notas: '' }
  const [f, setF] = useState(vacio)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrores({})
    setF(
      movimiento
        ? {
            fecha: movimiento.fecha.slice(0, 10),
            cliente: movimiento.cliente,
            asunto: movimiento.asunto,
            monto: String(movimiento.monto),
            originador: movimiento.originador,
            notas: movimiento.notas ?? '',
          }
        : vacio,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, movimiento])

  const delSistema = movimiento?.origen === 'PAGO'
  const monto = Number(f.monto)
  const vista = monto > 0 ? calcularReparto(monto, f.originador, porcentajes) : null

  async function guardar() {
    const e: Record<string, string> = {}
    if (!delSistema) {
      if (!f.cliente.trim()) e.cliente = 'Falta el cliente'
      if (!f.asunto.trim()) e.asunto = 'Falta el asunto'
      if (!(monto > 0)) e.monto = 'Poné un monto mayor a 0'
    }
    setErrores(e)
    if (Object.keys(e).length) return

    setGuardando(true)
    try {
      const datos = delSistema
        ? { originador: f.originador, notas: f.notas }
        : { ...f, monto }
      await pedir(movimiento ? `/api/admin/comisiones/${movimiento.id}` : '/api/admin/comisiones', {
        method: movimiento ? 'PUT' : 'POST',
        json: datos,
      })
      toast.success(movimiento ? 'Movimiento actualizado' : 'Movimiento agregado')
      onOpenChange(false)
      onGuardado()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{movimiento ? 'Editar movimiento' : 'Nuevo movimiento'}</DialogTitle>
          <DialogDescription>
            {movimiento
              ? 'El reparto se recalcula al guardar.'
              : 'Un honorario cobrado por fuera del sistema de pagos (mensualización, consulta, etc.).'}
          </DialogDescription>
        </DialogHeader>

        {delSistema && (
          <p className="flex gap-2 rounded-control border border-info-line bg-info-soft p-3 text-body-sm text-ink">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
            Viene de un pago del sistema: fecha, cliente y monto salen del pago. Acá sólo se
            cambia quién lo originó y las notas.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente" htmlFor="mov-cliente" required={!delSistema} error={errores.cliente} className="sm:col-span-2">
            <Input id="mov-cliente" value={f.cliente} disabled={delSistema} invalid={!!errores.cliente}
              onChange={(e) => setF({ ...f, cliente: e.target.value })} placeholder="Nombre del cliente" />
          </Field>
          <Field label="Asunto" htmlFor="mov-asunto" required={!delSistema} error={errores.asunto} className="sm:col-span-2">
            <Input id="mov-asunto" value={f.asunto} disabled={delSistema} invalid={!!errores.asunto}
              onChange={(e) => setF({ ...f, asunto: e.target.value })} placeholder="Mensualización, consulta…" />
          </Field>
          <Field label="Fecha de cobro" htmlFor="mov-fecha">
            <Input id="mov-fecha" type="date" value={f.fecha} disabled={delSistema}
              onChange={(e) => setF({ ...f, fecha: e.target.value })} />
          </Field>
          <Field label="Honorario cobrado" htmlFor="mov-monto" required={!delSistema} error={errores.monto} hint="Sin gastos ni tasas">
            <Input id="mov-monto" type="number" inputMode="decimal" min={0} value={f.monto} disabled={delSistema}
              invalid={!!errores.monto} onChange={(e) => setF({ ...f, monto: e.target.value })} placeholder="0" />
          </Field>
          <Field label="Originado por" htmlFor="mov-orig" className="sm:col-span-2"
            hint={`Si alguien trajo al cliente, se lleva el ${porcentajes.originacion}% antes del reparto. Sólo cuenta si se registró antes del cobro (contrato, 4.2 b).`}>
            <Select id="mov-orig" value={f.originador} onChange={(e) => setF({ ...f, originador: e.target.value as Originador })}>
              {ORIGINADORES.map((o) => <option key={o} value={o}>{ORIGINADOR_LABEL[o]}</option>)}
            </Select>
          </Field>
          <Field label="Notas" htmlFor="mov-notas" className="sm:col-span-2">
            <Textarea id="mov-notas" rows={2} value={f.notas} onChange={(e) => setF({ ...f, notas: e.target.value })} />
          </Field>
        </div>

        {vista && (
          <div className="rounded-control bg-surface-2 p-3 text-body-sm">
            <p className="mb-1.5 font-medium text-ink">Así se reparte</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
              <Fila label="Fernando" valor={vista.aPagarFernando} />
              <Fila label="Justiniano" valor={vista.aPagarJustiniano} />
              <Fila label="MW" valor={vista.aPagarMw} />
              <Fila label="Al fondo" valor={vista.fondoFernando + vista.fondoJustiniano} />
            </dl>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={guardando}>Cancelar</Button>
          <Button onClick={guardar} loading={guardando}>{movimiento ? 'Guardar cambios' : 'Agregar movimiento'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Fila({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-ink-2">{label}</dt>
      <dd className="font-medium text-ink tnum">{fmt(valor)}</dd>
    </div>
  )
}

/* ─────────────────────────── Movimiento del fondo ───────────────────────────
   Distribución (plata que cobra uno de los dos) y gasto (plata que se consume)
   bajan el saldo igual, pero son cosas distintas y se registran por separado. */

export function MovimientoFondoDialog({
  tipo,
  onOpenChange,
  saldos,
  parteFernando,
  onGuardado,
}: {
  tipo: 'distribucion' | 'gasto' | null
  onOpenChange: (open: boolean) => void
  saldos: { FERNANDO: number; JUSTINIANO: number }
  parteFernando: number
  onGuardado: () => void
}) {
  const open = tipo !== null
  const [f, setF] = useState({ fecha: hoyInput(), concepto: '', beneficiario: 'FERNANDO' as Beneficiario | '', monto: '', notas: '' })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrores({})
    setF({ fecha: hoyInput(), concepto: '', beneficiario: tipo === 'gasto' ? '' : 'FERNANDO', monto: '', notas: '' })
  }, [open, tipo])

  const esGasto = tipo === 'gasto'
  const monto = Number(f.monto)
  const pF = Math.round(parteFernando * 100)

  // Cuánto le baja a cada uno: para avisar si alguno queda en negativo.
  const impacto = {
    FERNANDO: f.beneficiario === 'FERNANDO' ? monto : f.beneficiario === '' ? monto * parteFernando : 0,
    JUSTINIANO: f.beneficiario === 'JUSTINIANO' ? monto : f.beneficiario === '' ? monto * (1 - parteFernando) : 0,
  }
  const quedaNegativo = (['FERNANDO', 'JUSTINIANO'] as const).filter(
    (b) => monto > 0 && saldos[b] - impacto[b] < -0.005,
  )

  async function guardar() {
    const e: Record<string, string> = {}
    if (esGasto && !f.concepto.trim()) e.concepto = 'Escribí en qué se gastó'
    if (!(monto > 0)) e.monto = 'Poné un monto mayor a 0'
    setErrores(e)
    if (Object.keys(e).length) return

    setGuardando(true)
    try {
      if (esGasto) {
        await pedir('/api/admin/comisiones/gastos', {
          method: 'POST',
          json: { fecha: f.fecha, concepto: f.concepto.trim(), monto, imputadoA: f.beneficiario || null, notas: f.notas.trim() || null },
        })
      } else {
        await pedir('/api/admin/comisiones/fondo', {
          method: 'POST',
          json: { fecha: f.fecha, beneficiario: f.beneficiario, monto, notas: f.notas.trim() || null },
        })
      }
      toast.success(esGasto ? 'Gasto registrado' : 'Distribución registrada')
      onOpenChange(false)
      onGuardado()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo registrar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{esGasto ? 'Registrar gasto del fondo' : 'Registrar distribución'}</DialogTitle>
          <DialogDescription>
            {esGasto
              ? 'Algo que se pagó con plata del fondo: una suscripción, un servicio, una herramienta. Nadie lo cobra: se consume.'
              : 'Plata del fondo que pasa al bolsillo de uno de los dos, según lo acordado por escrito.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {esGasto && (
            <Field label="¿En qué se gastó?" htmlFor="fd-concepto" required error={errores.concepto} className="sm:col-span-2">
              <Input id="fd-concepto" value={f.concepto} invalid={!!errores.concepto}
                onChange={(e) => setF({ ...f, concepto: e.target.value })} placeholder="Suscripción, dominio, herramienta…" />
            </Field>
          )}
          <Field label={esGasto ? 'Se le imputa a' : 'Para'} htmlFor="fd-benef" className="sm:col-span-2"
            hint={esGasto && f.beneficiario === '' ? `Se reparte ${pF}/${100 - pF}, igual que se forma el fondo.` : undefined}>
            <Select id="fd-benef" value={f.beneficiario} onChange={(e) => setF({ ...f, beneficiario: e.target.value as Beneficiario | '' })}>
              {esGasto && <option value="">Los dos ({pF}/{100 - pF})</option>}
              <option value="FERNANDO">{esGasto ? 'Sólo Fernando' : 'Fernando'} · saldo {fmt(saldos.FERNANDO)}</option>
              <option value="JUSTINIANO">{esGasto ? 'Sólo Justiniano' : 'Justiniano'} · saldo {fmt(saldos.JUSTINIANO)}</option>
            </Select>
          </Field>
          <Field label="Fecha" htmlFor="fd-fecha">
            <Input id="fd-fecha" type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} />
          </Field>
          <Field label="Monto" htmlFor="fd-monto" required error={errores.monto}>
            <Input id="fd-monto" type="number" inputMode="decimal" min={0} value={f.monto} invalid={!!errores.monto}
              onChange={(e) => setF({ ...f, monto: e.target.value })} placeholder="0" />
          </Field>
          <Field label="Nota" htmlFor="fd-notas" className="sm:col-span-2">
            <Input id="fd-notas" value={f.notas} onChange={(e) => setF({ ...f, notas: e.target.value })}
              placeholder={esGasto ? 'Opcional' : 'Acuerdo del…'} />
          </Field>
        </div>

        {quedaNegativo.length > 0 && (
          <p className="rounded-control border border-warning-line bg-warning-soft p-3 text-body-sm text-ink">
            Con esto el saldo de {quedaNegativo.map((b) => BENEFICIARIO_LABEL[b]).join(' y ')} queda en negativo.
            Se puede registrar igual si así se acordó.
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={guardando}>Cancelar</Button>
          <Button onClick={guardar} loading={guardando}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
