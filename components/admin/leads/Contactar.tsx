'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Check, Copy, Mail, MessageCircle, PhoneCall, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { plantillasPara, type CanalMensaje } from '@/lib/leads/plantillas'
import { diaMas, diaParaGuardar } from '@/lib/leads/agenda'
import { copiar, pedir, rutaContacto, type LeadCRM } from './tipos'
import { SelectorProximo } from './SelectorProximo'

type Modo = CanalMensaje | 'NOTA'

/**
 * Contactar = elegir qué decir, copiarlo, mandarlo por fuera y dejarlo
 * registrado con la fecha del próximo seguimiento. Antes eran cuatro lugares
 * distintos (botón de WhatsApp, copiar, diálogo de registro, fecha aparte) y
 * el registro casi nunca se hacía: en los datos reales había 10 contactos
 * anotados para 48 leads.
 */
export function Contactar({ lead, firma, onHecho }: { lead: LeadCRM; firma: string | null; onHecho: () => void }) {
  const [modo, setModo] = useState<Modo>(lead.telefono ? 'WHATSAPP' : 'EMAIL')
  const plantillas = useMemo(
    () =>
      plantillasPara({
        nombre: lead.nombre,
        tipo: lead.tipo,
        segmento: lead.segmento,
        denominacion: lead.denominacion,
        contactos: lead.actividad.length,
        firma,
      }),
    [lead, firma],
  )
  const delCanal = plantillas.filter((p) => p.canal === modo)

  const [plantillaId, setPlantillaId] = useState<string>('')
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [notaCanal, setNotaCanal] = useState<'LLAMADA' | 'OTRO'>('LLAMADA')
  const [nota, setNota] = useState('')
  const [proximo, setProximo] = useState<string | null>(diaMas(3))
  const [guardando, setGuardando] = useState(false)
  const [enviando, setEnviando] = useState(false)

  // Al cambiar de lead todo vuelve a empezar.
  useEffect(() => {
    setModo(lead.telefono ? 'WHATSAPP' : 'EMAIL')
    setNota('')
    setProximo(diaMas(3))
  }, [lead.id, lead.telefono])

  // Al cambiar de canal se elige la plantilla sugerida (la primera).
  useEffect(() => {
    if (modo === 'NOTA') return
    const p = delCanal[0]
    if (p) {
      setPlantillaId(p.id)
      setAsunto(p.asunto ?? '')
      setCuerpo(p.cuerpo)
    }
    setCopiado(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, lead.id])

  function elegir(id: string) {
    const p = plantillas.find((x) => x.id === id)
    if (!p) return
    setPlantillaId(id)
    setAsunto(p.asunto ?? '')
    setCuerpo(p.cuerpo)
    setCopiado(false)
  }

  const plantilla = plantillas.find((p) => p.id === plantillaId)

  async function registrar(canal: string, texto: string) {
    setGuardando(true)
    try {
      await pedir(rutaContacto(lead), 'POST', {
        canal,
        nota: texto,
        leadProximoContacto: proximo ? diaParaGuardar(proximo) : undefined,
      })
      toast.success(proximo ? 'Registrado. Próximo seguimiento agendado.' : 'Registrado')
      setCopiado(false)
      setNota('')
      onHecho()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo registrar')
    } finally {
      setGuardando(false)
    }
  }

  // El email sale desde QMS (misma vía que la bandeja: queda guardado ahí y,
  // si es un formulario, en el trámite) y el contacto se registra solo.
  async function enviarEmail() {
    if (!lead.email) return
    if (!asunto.trim() || !cuerpo.trim()) {
      toast.error('Completá el asunto y el texto')
      return
    }
    setEnviando(true)
    try {
      await pedir('/api/admin/emails', 'POST', {
        to: lead.email,
        subject: asunto.trim(),
        text: cuerpo,
        destinatario: lead.nombre,
        tramiteId: lead.tipo === 'BORRADOR' ? lead.id : undefined,
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo enviar el email')
      setEnviando(false)
      return
    }
    setEnviando(false)
    toast.success(`Email enviado a ${lead.email}`)
    // Si el registro falla, el mail ya salió: no hay que reenviarlo, sólo
    // registrarlo con «Lo mandé por fuera».
    await registrarMensaje()
  }

  const registrarMensaje = () =>
    registrar(
      modo,
      (
        `Mensaje «${plantilla?.titulo ?? 'personalizado'}» por ${modo === 'WHATSAPP' ? 'WhatsApp' : 'email'}` +
        (modo === 'EMAIL' && asunto ? `\nAsunto: ${asunto}` : '') +
        `\n\n${cuerpo}`
      ).slice(0, 4000),
    )

  const modos: { id: Modo; texto: string; icono: typeof Mail; deshabilitado?: string }[] = [
    { id: 'WHATSAPP', texto: 'WhatsApp', icono: MessageCircle, deshabilitado: lead.telefono ? undefined : 'Sin teléfono' },
    { id: 'EMAIL', texto: 'Email', icono: Mail, deshabilitado: lead.email ? undefined : 'Sin email' },
    { id: 'NOTA', texto: 'Llamada o nota', icono: PhoneCall },
  ]

  return (
    <section aria-label="Contactar" className="space-y-4">
      <div className="inline-flex rounded-control border border-line bg-surface-2 p-0.5" role="tablist">
        {modos.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={modo === m.id}
            onClick={() => setModo(m.id)}
            title={m.deshabilitado}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-chip px-3 text-body-sm transition-colors',
              modo === m.id ? 'bg-surface font-medium text-ink shadow-card' : 'text-ink-2 hover:text-ink',
              m.deshabilitado && modo !== m.id && 'opacity-60',
            )}
          >
            <m.icono className="h-4 w-4" aria-hidden />
            {m.texto}
          </button>
        ))}
      </div>

      {modo !== 'NOTA' ? (
        <>
          {modos.find((m) => m.id === modo)?.deshabilitado && (
            <p className="rounded-control border border-warning-line bg-warning-soft px-3 py-2 text-body-sm text-ink">
              Este lead no tiene {modo === 'WHATSAPP' ? 'teléfono' : 'email'} cargado. Podés copiar el texto igual.
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {delCanal.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => elegir(p.id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-body-sm transition-colors',
                  plantillaId === p.id
                    ? 'border-primary-line bg-primary-soft font-medium text-primary'
                    : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink',
                )}
              >
                {p.titulo}
                {i === 0 && <span className="ml-1 text-label text-ink-3">· sugerido</span>}
              </button>
            ))}
          </div>
          {plantilla && <p className="-mt-2 text-label text-ink-3">Para cuando: {plantilla.cuando.toLowerCase()}</p>}

          {modo === 'EMAIL' && (
            <div className="flex gap-2">
              <Input value={asunto} onChange={(e) => setAsunto(e.target.value)} aria-label="Asunto" className="font-medium" />
              <Button variant="secondary" onClick={() => copiar(asunto, 'Asunto copiado')} title="Copiar asunto">
                <Copy className="h-4 w-4" aria-hidden />
                Asunto
              </Button>
            </div>
          )}

          <Textarea
            value={cuerpo}
            onChange={(e) => { setCuerpo(e.target.value); setCopiado(false) }}
            rows={modo === 'EMAIL' ? 11 : 6}
            aria-label="Texto del mensaje"
            className="text-body-sm"
          />

          <div className="flex flex-wrap items-center gap-2">
            {modo === 'EMAIL' && lead.email && (
              <Button onClick={enviarEmail} loading={enviando} disabled={guardando}>
                {!enviando && <Send className="h-4 w-4" aria-hidden />}
                Enviar a {lead.email}
              </Button>
            )}
            <Button
              variant={modo === 'EMAIL' && lead.email ? 'ghost' : 'primary'}
              onClick={async () => {
                if (await copiar(cuerpo, modo === 'EMAIL' ? 'Cuerpo del email copiado' : 'Mensaje copiado')) setCopiado(true)
              }}
            >
              <Copy className="h-4 w-4" aria-hidden />
              {modo === 'EMAIL' ? 'Copiar cuerpo' : 'Copiar mensaje'}
            </Button>
            {modo === 'EMAIL' && lead.email && (
              <Button variant="ghost" onClick={() => copiar(lead.email!, 'Email copiado')}>
                Copiar dirección
              </Button>
            )}
            {modo === 'WHATSAPP' && lead.telefono && (
              <Button variant="ghost" asChild>
                <a href={`https://wa.me/${lead.telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                  Abrir chat
                </a>
              </Button>
            )}
          </div>

          <div
            className={cn(
              'space-y-3 rounded-control border p-3 transition-colors',
              copiado ? 'border-primary-line bg-primary-soft' : 'border-line bg-surface-2',
            )}
          >
            <p className="text-body-sm font-medium text-ink">
              {modo === 'EMAIL' && lead.email && !copiado
                ? 'Al enviarlo queda registrado con este próximo seguimiento'
                : copiado ? '¿Ya lo mandaste? Dejalo registrado' : 'Cuando lo mandes, registralo'}
            </p>
            <SelectorProximo valor={proximo} onChange={setProximo} />
            <Button onClick={registrarMensaje} loading={guardando && !enviando} disabled={enviando} variant={copiado ? 'primary' : 'secondary'}>
              {!guardando && <Check className="h-4 w-4" aria-hidden />}
              {modo === 'EMAIL' && lead.email ? 'Lo mandé por fuera' : 'Lo mandé'}
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-1.5">
            {([['LLAMADA', 'Llamada'], ['OTRO', 'Nota']] as const).map(([v, t]) => (
              <button
                key={v}
                type="button"
                onClick={() => setNotaCanal(v)}
                className={cn(
                  'rounded-full border px-3 py-1 text-body-sm',
                  notaCanal === v ? 'border-primary-line bg-primary-soft font-medium text-primary' : 'border-line text-ink-2 hover:text-ink',
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <Textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            rows={4}
            placeholder={notaCanal === 'LLAMADA' ? 'Qué hablaron: dudas, objeciones, qué quedó en pie…' : 'Algo para tener en cuenta con este lead'}
            aria-label="Nota"
          />
          <SelectorProximo valor={proximo} onChange={setProximo} />
          <Button
            onClick={() => (nota.trim() ? registrar(notaCanal, nota.trim()) : toast.error('Escribí qué pasó'))}
            loading={guardando}
          >
            {!guardando && <Check className="h-4 w-4" aria-hidden />}
            Guardar
          </Button>
        </div>
      )}
    </section>
  )
}
