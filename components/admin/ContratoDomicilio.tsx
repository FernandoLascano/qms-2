'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangle, Download, FileSignature, Send } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/ui/field'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { DatosContrato, PersonaContrato } from '@/lib/contrato-domicilio'

type Precarga = {
  datos: DatosContrato
  personas: PersonaContrato[]
  representanteClave: string | null
  direccionDomicilio: string | null
}

// La dirección del servicio está escrita en la plantilla del contrato.
const DIRECCION_PLANTILLA = 'Pasaje Chagas 6043'

/** Genera el contrato de domicilio desde la plantilla Word, con los datos del trámite. */
export default function ContratoDomicilio({ tramiteId }: { tramiteId: string }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [ocupado, setOcupado] = useState<'descargar' | 'enviar' | null>(null)
  const [precarga, setPrecarga] = useState<Precarga | null>(null)
  const [datos, setDatos] = useState<DatosContrato | null>(null)
  const [representante, setRepresentante] = useState('')
  const [coobligado, setCoobligado] = useState('')

  async function abrir() {
    setCargando(true)
    try {
      const res = await fetch(`/api/admin/tramites/${tramiteId}/contrato-domicilio`)
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudieron cargar los datos')
      const p: Precarga = await res.json()
      setPrecarga(p)
      setDatos(p.datos)
      setRepresentante(p.representanteClave ?? '')
      setCoobligado(p.representanteClave ?? '')
      setAbierto(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudieron cargar los datos')
    } finally {
      setCargando(false)
    }
  }

  const set = <K extends keyof DatosContrato>(k: K, v: DatosContrato[K]) =>
    setDatos((d) => (d ? { ...d, [k]: v } : d))

  function elegirRepresentante(clave: string) {
    setRepresentante(clave)
    const p = precarga?.personas.find((x) => x.clave === clave)
    if (p) setDatos((d) => (d ? { ...d, representante_nombre: p.nombre, representante_dni: p.dni } : d))
  }

  function elegirCoobligado(clave: string) {
    setCoobligado(clave)
    const p = precarga?.personas.find((x) => x.clave === clave)
    if (p) {
      setDatos((d) =>
        d ? { ...d, coobligado_nombre: p.nombre, coobligado_dni: p.dni, coobligado_domicilio: p.domicilio } : d,
      )
    }
  }

  async function generar(enviar: boolean) {
    if (!datos) return
    setOcupado(enviar ? 'enviar' : 'descargar')
    try {
      const res = await fetch(`/api/admin/tramites/${tramiteId}/contrato-domicilio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datos, enviar }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo generar el contrato')
      if (enviar) {
        toast.success('Contrato enviado al cliente para firmar')
        setAbierto(false)
        router.refresh()
      } else {
        const url = URL.createObjectURL(await res.blob())
        const a = document.createElement('a')
        a.href = url
        a.download = `Contrato de domicilio - ${datos.sociedad_denominacion || 'Sociedad'}.docx`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo generar el contrato')
    } finally {
      setOcupado(null)
    }
  }

  const administradores = precarga?.personas.filter((p) => p.clave.startsWith('adm-')) ?? []
  const direccionDistinta =
    !!precarga?.direccionDomicilio && !precarga.direccionDomicilio.includes(DIRECCION_PLANTILLA)

  const texto = (k: keyof DatosContrato, label: string, extra?: { hint?: string; placeholder?: string }) => (
    <Field label={label} htmlFor={`cd-${k}`} hint={extra?.hint}>
      <Input
        id={`cd-${k}`}
        value={String(datos?.[k] ?? '')}
        placeholder={extra?.placeholder}
        onChange={(e) => set(k, e.target.value as never)}
      />
    </Field>
  )

  return (
    <Card>
      <CardBody className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-heading text-ink">Contrato de domicilio</h3>
          <p className="text-body-sm text-ink-2">
            Arma el contrato de domicilio en sede desde la plantilla Word, con los datos del trámite. Lo podés descargar para revisarlo o mandárselo al cliente para firmar.
          </p>
        </div>
        <Button onClick={abrir} loading={cargando}>
          {!cargando && <FileSignature className="h-4 w-4" aria-hidden />}
          Generar contrato de domicilio
        </Button>
      </CardBody>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-title">Contrato de domicilio</DialogTitle>
            <DialogDescription>
              Revisá y completá los datos. Lo que quede vacío sale como una línea para completar a mano.
            </DialogDescription>
          </DialogHeader>

          {datos && (
            <div className="space-y-6">
              {direccionDistinta && (
                <div className="flex gap-2 rounded-control border border-warning-line bg-warning-soft px-3 py-2.5 text-body-sm text-ink">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning" aria-hidden />
                  <span>
                    Este cliente tiene el domicilio en <strong>{precarga?.direccionDomicilio}</strong>, pero la plantilla del contrato dice <strong>{DIRECCION_PLANTILLA}</strong>.
                  </span>
                </div>
              )}

              <section className="space-y-3">
                <h4 className="text-body-sm font-semibold text-ink">Sociedad</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {texto('sociedad_denominacion', 'Denominación', { hint: 'Sin "S.A.S.": el contrato lo agrega.' })}
                  {texto('sociedad_cuit', 'CUIT')}
                  {texto('sociedad_matricula', 'Matrícula', { hint: 'Con matrícula sale como "Inscripta"; sin ella, "En trámite".' })}
                  {texto('fecha_inicio', 'Fecha de inicio', { placeholder: 'DD/MM/AAAA' })}
                </div>
                <Field label="Administración real" htmlFor="cd-administracion_real" hint="Dónde funciona de verdad la administración (no es el domicilio en sede).">
                  <Input
                    id="cd-administracion_real"
                    value={datos.administracion_real}
                    onChange={(e) => set('administracion_real', e.target.value)}
                  />
                </Field>
              </section>

              <section className="space-y-3">
                <h4 className="text-body-sm font-semibold text-ink">Representante de la sociedad</h4>
                {administradores.length > 0 && (
                  <Field label="Administrador que firma" htmlFor="cd-rep">
                    <Select id="cd-rep" value={representante} onChange={(e) => elegirRepresentante(e.target.value)}>
                      {administradores.map((p) => (
                        <option key={p.clave} value={p.clave}>{p.nombre} · {p.rol}</option>
                      ))}
                    </Select>
                  </Field>
                )}
                <div className="grid gap-3 sm:grid-cols-3">
                  {texto('representante_nombre', 'Nombre')}
                  {texto('representante_dni', 'DNI')}
                  {texto('representante_caracter', 'Carácter')}
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-body-sm font-semibold text-ink">Coobligado solidario</h4>
                {(precarga?.personas.length ?? 0) > 0 && (
                  <Field label="Persona" htmlFor="cd-coob">
                    <Select id="cd-coob" value={coobligado} onChange={(e) => elegirCoobligado(e.target.value)}>
                      {precarga!.personas.map((p) => (
                        <option key={p.clave} value={p.clave}>{p.nombre} · {p.rol}</option>
                      ))}
                    </Select>
                  </Field>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  {texto('coobligado_nombre', 'Nombre')}
                  {texto('coobligado_dni', 'DNI')}
                </div>
                {texto('coobligado_domicilio', 'Domicilio real')}
              </section>

              <section className="space-y-3">
                <h4 className="text-body-sm font-semibold text-ink">Canales y usos</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  {texto('email', 'Email')}
                  {texto('email_alternativo', 'Email alternativo')}
                  {texto('whatsapp', 'WhatsApp')}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-body-sm text-ink">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={datos.fiscal_arca} onChange={(e) => set('fiscal_arca', e.target.checked)} />
                    Domicilio fiscal ARCA
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={datos.fiscal_rentas} onChange={(e) => set('fiscal_rentas', e.target.checked)} />
                    Domicilio fiscal Rentas Córdoba
                  </label>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-body-sm font-semibold text-ink">Precio y garantías</h4>
                <Field label="Precio y condiciones de pago" htmlFor="cd-precio">
                  <Textarea
                    id="cd-precio"
                    rows={2}
                    value={datos.precio_y_condiciones}
                    onChange={(e) => set('precio_y_condiciones', e.target.value)}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  {texto('multa_diaria', 'Multa diaria')}
                  {texto('fianza_monto_maximo', 'Monto máximo de la fianza')}
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-body-sm font-semibold text-ink">Firma por Ancalan Consulting S.A.</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  {texto('prestador_representante', 'Nombre')}
                  {texto('prestador_dni', 'DNI')}
                  {texto('prestador_caracter', 'Carácter')}
                </div>
              </section>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => generar(false)} loading={ocupado === 'descargar'} disabled={!!ocupado}>
              {ocupado !== 'descargar' && <Download className="h-4 w-4" aria-hidden />}
              Descargar para revisar
            </Button>
            <Button onClick={() => generar(true)} loading={ocupado === 'enviar'} disabled={!!ocupado}>
              {ocupado !== 'enviar' && <Send className="h-4 w-4" aria-hidden />}
              Enviar al cliente para firmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
