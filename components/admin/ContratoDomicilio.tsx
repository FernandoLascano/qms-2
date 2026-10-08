'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { FileSignature, FileText, FileType } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/ui/field'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { DatosContrato, PersonaContrato } from '@/lib/contrato-domicilio'

type Version = {
  version: number
  fecha: string
  generadoPor: string | null
  formato: string
  datos: DatosContrato
}

type Precarga = {
  datosDelTramite: DatosContrato
  versiones: Version[] // de la más nueva a la más vieja
  personas: PersonaContrato[]
  representanteClave: string | null
  pdfDisponible: boolean
}

/** Genera el contrato de domicilio desde la plantilla Word, con los datos del trámite. */
export default function ContratoDomicilio({ tramiteId }: { tramiteId: string }) {
  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [ocupado, setOcupado] = useState<'docx' | 'pdf' | null>(null)
  const [precarga, setPrecarga] = useState<Precarga | null>(null)
  const [datos, setDatos] = useState<DatosContrato | null>(null)
  const [representante, setRepresentante] = useState('')
  const [coobligado, setCoobligado] = useState('')
  // De dónde salen los datos del formulario: una versión guardada o el trámite.
  const [origen, setOrigen] = useState<string>('tramite')

  const fmtFecha = (iso: string) =>
    new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  function cargarDatos(p: Precarga, desde: string) {
    const v = p.versiones.find((x) => String(x.version) === desde)
    const d = v ? v.datos : p.datosDelTramite
    setOrigen(v ? desde : 'tramite')
    setDatos(d)
    // Los selectores quedan en la persona que coincide con lo guardado (si no, a mano).
    const clave = (nombre: string, soloAdm: boolean) =>
      p.personas.find((x) => x.nombre === nombre && (!soloAdm || x.clave.startsWith('adm-')))?.clave ?? ''
    setRepresentante(v ? clave(d.representante_nombre, true) : (p.representanteClave ?? ''))
    setCoobligado(v ? clave(d.coobligado_nombre, false) : (p.representanteClave ?? ''))
  }

  async function traerPrecarga(): Promise<Precarga> {
    const res = await fetch(`/api/admin/tramites/${tramiteId}/contrato-domicilio`)
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudieron cargar los datos')
    return res.json()
  }

  async function abrir() {
    setCargando(true)
    try {
      const p = await traerPrecarga()
      setPrecarga(p)
      // Se abre con la última versión guardada; si no hay, con los datos del trámite.
      cargarDatos(p, p.versiones[0] ? String(p.versiones[0].version) : 'tramite')
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

  async function generar(formato: 'docx' | 'pdf') {
    if (!datos) return
    setOcupado(formato)
    try {
      const res = await fetch(`/api/admin/tramites/${tramiteId}/contrato-domicilio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datos, formato }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo generar el contrato')
      const url = URL.createObjectURL(await res.blob())
      const a = document.createElement('a')
      a.href = url
      a.download = `Contrato de domicilio - ${datos.sociedad_denominacion || 'Sociedad'}.${formato}`
      a.click()
      URL.revokeObjectURL(url)

      // Cada juego de datos distinto queda guardado como una versión.
      const version = res.headers.get('X-Contrato-Version')
      if (version) {
        const anterior = precarga?.versiones[0]?.version ?? 0
        if (Number(version) > anterior) toast.success(`Guardado como versión ${version}`)
        setOrigen(version)
        traerPrecarga().then(setPrecarga).catch(() => {})
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo generar el contrato')
    } finally {
      setOcupado(null)
    }
  }

  const administradores = precarga?.personas.filter((p) => p.clave.startsWith('adm-')) ?? []

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
            Arma el contrato de domicilio en sede desde la plantilla Word, con los datos del trámite, y lo descarga en Word o PDF para firmarlo en Adobe Sign u otra plataforma. No se le manda nada al cliente.
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

          {datos && precarga && (
            <div className="space-y-6">
              {precarga.versiones.length > 0 && (
                <Field
                  label="Datos"
                  htmlFor="cd-origen"
                  hint="Cada descarga con datos distintos queda guardada como una versión nueva."
                >
                  <Select id="cd-origen" value={origen} onChange={(e) => cargarDatos(precarga, e.target.value)}>
                    {precarga.versiones.map((v) => (
                      <option key={v.version} value={String(v.version)}>
                        Versión {v.version} · {fmtFecha(v.fecha)}
                        {v.generadoPor ? ` · ${v.generadoPor}` : ''}
                      </option>
                    ))}
                    <option value="tramite">Empezar de nuevo con los datos del trámite</option>
                  </Select>
                </Field>
              )}

              <section className="space-y-3">
                <h4 className="text-body-sm font-semibold text-ink">Sociedad</h4>
                {texto('domicilio_servicio', 'Domicilio del servicio', { hint: 'La sede donde se fija el domicilio. Sale de la dirección asignada en Domicilios.' })}
                <div className="grid gap-3 sm:grid-cols-2">
                  {texto('sociedad_denominacion', 'Denominación', { hint: 'Sin "S.A.S.": el contrato lo agrega.' })}
                  {texto('sociedad_cuit', 'CUIT')}
                  {texto('sociedad_matricula', 'Matrícula', { hint: 'Con matrícula sale como "Inscripta"; sin ella, "En trámite".' })}
                  {texto('fecha_inicio', 'Fecha de inicio', { placeholder: 'DD/MM/AAAA' })}
                  <Field label="Fecha de firma" htmlFor="cd-fecha_firma" hint="La del cierre del contrato: «a los … días del mes de …».">
                    <Input
                      id="cd-fecha_firma"
                      type="date"
                      value={datos.fecha_firma}
                      onChange={(e) => set('fecha_firma', e.target.value)}
                    />
                  </Field>
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
            {precarga && !precarga.pdfDisponible && (
              <p className="mr-auto self-center text-label text-ink-2">El PDF todavía no está configurado.</p>
            )}
            <Button variant="secondary" onClick={() => generar('docx')} loading={ocupado === 'docx'} disabled={!!ocupado}>
              {ocupado !== 'docx' && <FileText className="h-4 w-4" aria-hidden />}
              Descargar Word
            </Button>
            <Button
              onClick={() => generar('pdf')}
              loading={ocupado === 'pdf'}
              disabled={!!ocupado || !precarga?.pdfDisponible}
            >
              {ocupado !== 'pdf' && <FileType className="h-4 w-4" aria-hidden />}
              Descargar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
