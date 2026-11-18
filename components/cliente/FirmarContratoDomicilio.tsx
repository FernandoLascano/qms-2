'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, Download, Eye, FileSignature, Mail } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/ui/field'
import { Aviso } from '@/components/ui/aviso'
import { PadFirma, type FirmaCapturada } from '@/components/firma/PadFirma'

type Firmante = { clave: 'sociedad' | 'coobligado'; nombre: string; dni: string; roles: string[] }
type Estado = {
  estado: 'PENDIENTE' | 'PROCESANDO' | 'FIRMADO'
  firmantes: Firmante[]
  prestador: string
  email: string
  codigoEnviado: boolean
  firmadoEl: string | null
}

const ANEXO_VACIO = {
  actividad: '',
  beneficiarios: '',
  cuentaPropia: true,
  tercero: '',
  pep: false,
  pepDetalle: '',
  uif: false,
  uifDetalle: '',
}

function comoFirma(f: Firmante) {
  if (f.roles.length > 1) return 'Por la sociedad y como coobligado'
  return f.clave === 'sociedad' ? 'Por la sociedad' : 'Como coobligado'
}

/** Sí / No con dos botones de radio. */
function SiNo({ nombre, valor, onChange, primero = 'si' }: { nombre: string; valor: boolean; onChange: (v: boolean) => void; primero?: 'si' | 'no' }) {
  const opciones = primero === 'si' ? [true, false] : [false, true]
  return (
    <div className="flex gap-4 text-body-sm text-ink">
      {opciones.map((v) => (
        <label key={String(v)} className="flex items-center gap-2">
          <input type="radio" name={nombre} checked={valor === v} onChange={() => onChange(v)} />
          {v ? 'Sí' : 'No'}
        </label>
      ))}
    </div>
  )
}

/** El cliente lee, completa el Anexo I y firma el contrato de domicilio. */
export default function FirmarContratoDomicilio({ tramiteId }: { tramiteId: string }) {
  const router = useRouter()
  const [info, setInfo] = useState<Estado | null>(null)
  const [abierto, setAbierto] = useState(false)
  const [anexo, setAnexo] = useState(ANEXO_VACIO)
  const [firmas, setFirmas] = useState<Record<string, FirmaCapturada | null>>({})
  const [acepto, setAcepto] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [codigoEnviado, setCodigoEnviado] = useState(false)
  const [ocupado, setOcupado] = useState<'codigo' | 'firmar' | null>(null)

  const base = `/api/tramites/${tramiteId}/contrato-domicilio`

  const cargar = useCallback(async () => {
    const res = await fetch(base).catch(() => null)
    if (!res?.ok) return
    const { firma } = await res.json()
    setInfo(firma)
    if (firma?.codigoEnviado) setCodigoEnviado(true)
  }, [base])

  useEffect(() => { cargar() }, [cargar])

  // Después de firmar, se arma el PDF final: se vuelve a mirar hasta que esté.
  useEffect(() => {
    if (info?.estado !== 'PROCESANDO') return
    const t = setInterval(cargar, 8_000)
    return () => clearInterval(t)
  }, [info?.estado, cargar])

  if (!info) return null

  const set = <K extends keyof typeof anexo>(k: K, v: (typeof anexo)[K]) => setAnexo((a) => ({ ...a, [k]: v }))

  const anexoCompleto =
    anexo.actividad.trim() &&
    anexo.beneficiarios.trim() &&
    (anexo.cuentaPropia || anexo.tercero.trim()) &&
    (!anexo.pep || anexo.pepDetalle.trim()) &&
    (!anexo.uif || anexo.uifDetalle.trim())
  const firmasCompletas = info.firmantes.every((f) => firmas[f.clave])
  const listo = !!anexoCompleto && firmasCompletas && acepto

  async function pedirCodigo() {
    setOcupado('codigo')
    try {
      const res = await fetch(`${base}/codigo`, { method: 'POST' })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'No pudimos mandar el código')
      setCodigoEnviado(true)
      toast.success(`Te mandamos el código a ${json.email}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos mandar el código')
    } finally {
      setOcupado(null)
    }
  }

  async function firmar() {
    setOcupado('firmar')
    try {
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, consentimiento: acepto, anexo, firmas }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'No se pudo firmar')
      toast.success('¡Listo! Firmaste el contrato')
      setAbierto(false)
      await cargar()
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo firmar')
    } finally {
      setOcupado(null)
    }
  }

  if (info.estado !== 'PENDIENTE') {
    const firmado = info.estado === 'FIRMADO'
    return (
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
            <div className="min-w-0">
              <h3 className="text-heading text-ink">Contrato de domicilio firmado</h3>
              <p className="text-body-sm text-ink-2">
                {!firmado
                  ? 'Ya firmaste. Estamos armando el PDF final con todas las firmas; te avisamos por email.'
                  : info.firmadoEl
                    ? `Firmado por todas las partes el ${new Date(info.firmadoEl).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}.`
                    : 'Firmado por todas las partes.'}
              </p>
            </div>
          </div>
          {firmado && info.firmadoEl && (
            <Button asChild size="sm" variant="secondary">
              <a href={`${base}/pdf?download=1`}>
                <Download className="h-4 w-4" aria-hidden /> Descargar
              </a>
            </Button>
          )}
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="border-primary/40">
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <FileSignature className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <h3 className="text-heading text-ink">Firmá el contrato de domicilio</h3>
              <p className="text-body-sm text-ink-2">
                Ya lo firmó {info.prestador || 'QuieroMiSAS'}. Leelo, completá la declaración jurada del Anexo I y firmalo acá mismo.
              </p>
            </div>
          </div>
          {!abierto && (
            <Button onClick={() => setAbierto(true)}>
              <FileSignature className="h-4 w-4" aria-hidden /> Leer y firmar
            </Button>
          )}
        </div>

        {abierto && (
          <div className="space-y-6 border-t border-line pt-4">
            <section className="space-y-2">
              <h4 className="text-body-sm font-semibold text-ink">1. Leé el contrato</h4>
              <Button asChild variant="secondary" size="sm">
                <a href={`${base}/pdf`} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4" aria-hidden /> Abrir el contrato (PDF)
                </a>
              </Button>
            </section>

            <section className="space-y-3">
              <h4 className="text-body-sm font-semibold text-ink">2. Anexo I · Declaración jurada</h4>
              <Field label="Actividad real de la sociedad" htmlFor="ax-actividad">
                <Input id="ax-actividad" value={anexo.actividad} onChange={(e) => set('actividad', e.target.value)} />
              </Field>
              <Field
                label="Beneficiario/s final/es"
                htmlFor="ax-beneficiarios"
                hint="Nombre, DNI y participación de cada persona que tiene el control o al menos el 10 % de la sociedad."
              >
                <Textarea id="ax-beneficiarios" rows={2} value={anexo.beneficiarios} onChange={(e) => set('beneficiarios', e.target.value)} />
              </Field>
              <Field label="¿La sociedad actúa por cuenta propia?" htmlFor="ax-propia">
                <SiNo nombre="ax-propia" valor={anexo.cuentaPropia} onChange={(v) => set('cuentaPropia', v)} />
              </Field>
              {!anexo.cuentaPropia && (
                <Field label="¿Por cuenta de quién?" htmlFor="ax-tercero">
                  <Input id="ax-tercero" value={anexo.tercero} onChange={(e) => set('tercero', e.target.value)} />
                </Field>
              )}
              <Field label="¿El representante o algún beneficiario final es Persona Expuesta Políticamente?" htmlFor="ax-pep">
                <SiNo nombre="ax-pep" valor={anexo.pep} onChange={(v) => set('pep', v)} primero="no" />
              </Field>
              {anexo.pep && (
                <Field label="¿Quién y qué cargo?" htmlFor="ax-pep-detalle">
                  <Input id="ax-pep-detalle" value={anexo.pepDetalle} onChange={(e) => set('pepDetalle', e.target.value)} />
                </Field>
              )}
              <Field label="¿La sociedad es Sujeto Obligado ante la UIF?" htmlFor="ax-uif">
                <SiNo nombre="ax-uif" valor={anexo.uif} onChange={(v) => set('uif', v)} primero="no" />
              </Field>
              {anexo.uif && (
                <Field label="¿En qué carácter?" htmlFor="ax-uif-detalle">
                  <Input id="ax-uif-detalle" value={anexo.uifDetalle} onChange={(e) => set('uifDetalle', e.target.value)} />
                </Field>
              )}
            </section>

            <section className="space-y-4">
              <h4 className="text-body-sm font-semibold text-ink">3. Firma</h4>
              {info.firmantes.map((f) => (
                <div key={f.clave} className="space-y-2">
                  <p className="text-body-sm text-ink">
                    <span className="font-semibold">{f.nombre}</span>
                    {f.dni ? `, DNI ${f.dni}` : ''} · {comoFirma(f)}
                  </p>
                  <PadFirma
                    id={`firma-${f.clave}`}
                    nombre={f.nombre}
                    onChange={(v) => setFirmas((prev) => ({ ...prev, [f.clave]: v }))}
                  />
                </div>
              ))}
              {info.firmantes.length > 1 && (
                <Aviso>Cada persona tiene que firmar en su recuadro. Si no está con vos, esperá a tenerla al lado para firmar.</Aviso>
              )}
              <label className="flex items-start gap-2 text-body-sm text-ink">
                <input type="checkbox" className="mt-1" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />
                <span>
                  Leí el contrato y acepto firmarlo electrónicamente (Ley N° 25.506). Declaro bajo juramento que los datos del
                  Anexo I son verdaderos y que quienes firman son las personas indicadas.
                </span>
              </label>
            </section>

            <section className="space-y-3">
              <h4 className="text-body-sm font-semibold text-ink">4. Confirmá con el código</h4>
              <p className="text-body-sm text-ink-2">Te mandamos un código de 6 números a {info.email}.</p>
              <div className="flex flex-wrap items-end gap-2">
                <Button variant="secondary" onClick={pedirCodigo} loading={ocupado === 'codigo'} disabled={!!ocupado}>
                  {ocupado !== 'codigo' && <Mail className="h-4 w-4" aria-hidden />}
                  {codigoEnviado ? 'Mandar otro código' : 'Mandarme el código'}
                </Button>
                {codigoEnviado && (
                  <Input
                    aria-label="Código"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    className="w-32 text-center tracking-[0.3em]"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                  />
                )}
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
              {!listo && <p className="mr-auto text-label text-ink-3">Completá el Anexo I, las firmas y la aceptación.</p>}
              <Button variant="ghost" onClick={() => { setAbierto(false); setFirmas({}) }} disabled={!!ocupado}>
                Después
              </Button>
              <Button onClick={firmar} loading={ocupado === 'firmar'} disabled={!listo || codigo.length !== 6 || !!ocupado}>
                {ocupado !== 'firmar' && <FileSignature className="h-4 w-4" aria-hidden />}
                Firmar contrato
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
