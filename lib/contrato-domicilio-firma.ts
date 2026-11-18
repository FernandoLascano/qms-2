import { createHash, randomInt } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { htmlAPdf } from '@/lib/pdf'
import { deleteFromSupabase, uploadToSupabase } from '@/lib/supabase-storage'
import {
  contratoDomicilioHtml,
  escaparHtml,
  fechaDDMMAAAA,
  PIE_CONTRATO_HTML,
  sinTipoSocietario,
  type DatosContrato,
  type HtmlFirma,
} from '@/lib/contrato-domicilio'

/**
 * Firma electrónica del contrato de domicilio dentro de QMS (Ley 25.506,
 * firma electrónica; idea tomada de SignuDoc, github.com/NYLLON-SOFTWARE/signudoc).
 *
 * 1. El admin arma el contrato, lo firma por EL PRESTADOR y lo envía: se
 *    genera el PDF que va a ver el cliente y se guarda su SHA-256.
 * 2. El cliente, con su sesión, lo lee, completa el Anexo I, pide un código
 *    por email y firma (dibujada o escrita) por LA SOCIEDAD y, si es otra
 *    persona, por EL COOBLIGADO.
 * 3. Se arma el PDF final (firmas, Anexo y certificado con el registro de
 *    auditoría) y se guarda como ContratoDomicilioFirmado: desde ahí el
 *    contrato cuenta como firmado en Domicilios, la ficha y Hoy.
 */

export type EstadoFirma = 'PENDIENTE' | 'PROCESANDO' | 'FIRMADO' | 'ANULADA'
export type RolFirma = 'PRESTADOR' | 'SOCIEDAD' | 'COOBLIGADO'

export type Firma = {
  roles: RolFirma[]
  nombre: string
  dni: string
  imagen: string // PNG en base64 (sin el prefijo data:)
  modo: 'dibujada' | 'escrita'
  fecha: string // ISO
  ip: string
  navegador: string
  verificacion: string // cómo se identificó a quien firmó
}

export type Anexo = {
  actividad: string
  beneficiarios: string
  cuentaPropia: boolean
  tercero: string
  pep: boolean
  pepDetalle: string
  uif: boolean
  uifDetalle: string
}

export type Evento = { fecha: string; accion: string; detalle?: string; ip?: string }

/** Persona que tiene que firmar del lado del cliente. */
export type Firmante = { clave: 'sociedad' | 'coobligado'; roles: RolFirma[]; nombre: string; dni: string; caracter: string }

/** Minutos que dura el código por email y cuántos intentos admite. */
export const CODIGO_MINUTOS = 15
export const CODIGO_INTENTOS = 5

export const sha256 = (datos: Buffer | string) => createHash('sha256').update(datos).digest('hex')

export const generarCodigo = () => String(randomInt(0, 1_000_000)).padStart(6, '0')
export const hashCodigo = (firmaId: string, codigo: string) => sha256(`${firmaId}:${codigo.trim()}`)

export function evento(accion: string, extra: Omit<Evento, 'fecha' | 'accion'> = {}): Evento {
  return { fecha: new Date().toISOString(), accion, ...extra }
}

export const listaEventos = (v: unknown): Evento[] => (Array.isArray(v) ? (v as Evento[]) : [])

const soloDigitos = (s: string) => s.replace(/\D/g, '')

/**
 * Quién firma por el cliente. El representante firma por LA SOCIEDAD; si el
 * coobligado es la misma persona (mismo DNI), una sola firma vale por los dos.
 */
export function firmantesCliente(d: DatosContrato): Firmante[] {
  const sociedad: Firmante = {
    clave: 'sociedad',
    roles: ['SOCIEDAD'],
    nombre: d.representante_nombre.trim(),
    dni: d.representante_dni.trim(),
    caracter: d.representante_caracter.trim(),
  }
  const mismo =
    soloDigitos(d.coobligado_dni) !== ''
      ? soloDigitos(d.coobligado_dni) === soloDigitos(d.representante_dni)
      : d.coobligado_nombre.trim().toLowerCase() === d.representante_nombre.trim().toLowerCase()
  if (mismo) return [{ ...sociedad, roles: ['SOCIEDAD', 'COOBLIGADO'] }]
  return [
    sociedad,
    { clave: 'coobligado', roles: ['COOBLIGADO'], nombre: d.coobligado_nombre.trim(), dni: d.coobligado_dni.trim(), caracter: 'Por derecho propio' },
  ]
}

/** Datos que el contrato necesita sí o sí para mandarse a firmar. */
export function faltantesParaFirmar(d: DatosContrato): string[] {
  const requeridos: [keyof DatosContrato, string][] = [
    ['sociedad_denominacion', 'denominación'],
    ['representante_nombre', 'nombre del representante'],
    ['representante_dni', 'DNI del representante'],
    ['coobligado_nombre', 'nombre del coobligado'],
    ['coobligado_dni', 'DNI del coobligado'],
    ['prestador_representante', 'quién firma por Ancalan'],
  ]
  return requeridos.filter(([k]) => !String(d[k] ?? '').trim()).map(([, nombre]) => nombre)
}

/** PNG en data URL → base64, o null si no es un PNG razonable (hasta 300 KB). */
export function imagenFirma(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const m = valor.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/)
  if (!m || m[1].length > 400_000) return null
  const png = Buffer.from(m[1], 'base64')
  return png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? m[1] : null
}

const texto = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/** Anexo I tal como lo manda el formulario; null si falta lo obligatorio. */
export function anexoValido(v: unknown): Anexo | null {
  const o = (v ?? {}) as Record<string, unknown>
  const anexo: Anexo = {
    actividad: texto(o.actividad),
    beneficiarios: texto(o.beneficiarios, 1000),
    cuentaPropia: o.cuentaPropia !== false,
    tercero: texto(o.tercero),
    pep: o.pep === true,
    pepDetalle: texto(o.pepDetalle),
    uif: o.uif === true,
    uifDetalle: texto(o.uifDetalle),
  }
  if (!anexo.actividad || !anexo.beneficiarios) return null
  if (!anexo.cuentaPropia && !anexo.tercero) return null
  if ((anexo.pep && !anexo.pepDetalle) || (anexo.uif && !anexo.uifDetalle)) return null
  return anexo
}

/** Fecha y hora argentinas para el certificado: «18/11/2026 14:05:09». */
function fechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour12: false })
}

const trazo = (f: Firma | undefined) =>
  f ? `<img class="trazo" src="data:image/png;base64,${f.imagen}" alt="Firma de ${escaparHtml(f.nombre)}">` : ''

const caja = (marcada: boolean) => `<span class="box${marcada ? ' on' : ''}"></span>`
const valor = (s: string) => (s ? escaparHtml(s).replace(/\n/g, '<br>') : '—')

/** Firmas y Anexo dentro del contrato (lo que se pueda, según lo que haya). */
export function htmlDeFirmas(prestador: Firma, cliente: Firma[] = [], anexo?: Anexo | null): HtmlFirma {
  const porRol = (rol: RolFirma) => cliente.find((f) => f.roles.includes(rol))
  const sociedad = porRol('SOCIEDAD')
  const html: HtmlFirma = {
    firma_prestador: trazo(prestador),
    firma_sociedad: trazo(sociedad),
    firma_coobligado: trazo(porRol('COOBLIGADO')),
  }
  if (anexo && sociedad) {
    Object.assign(html, {
      anexo_actividad: valor(anexo.actividad),
      anexo_beneficiarios: valor(anexo.beneficiarios),
      anexo_cuenta_propia: `${caja(anexo.cuentaPropia)} SÍ ${caja(!anexo.cuentaPropia)} NO`,
      anexo_tercero: anexo.cuentaPropia ? 'no corresponde' : valor(anexo.tercero),
      anexo_pep: `${caja(!anexo.pep)} NO ${caja(anexo.pep)} SÍ${anexo.pep ? `: ${valor(anexo.pepDetalle)}` : ''}`,
      anexo_uif: `${caja(!anexo.uif)} NO ${caja(anexo.uif)} SÍ${anexo.uif ? `: ${valor(anexo.uifDetalle)}` : ''}`,
      anexo_firma: trazo(sociedad),
      anexo_aclaracion: `<p class="dato">${escaparHtml(sociedad.nombre)}</p>`,
      anexo_fecha: `<p class="dato">${fechaDDMMAAAA(new Date(sociedad.fecha))}</p>`,
    })
  }
  return html
}

const ROL_LEGIBLE: Record<RolFirma, string> = {
  PRESTADOR: 'Por EL PRESTADOR',
  SOCIEDAD: 'Por LA SOCIEDAD',
  COOBLIGADO: 'EL COOBLIGADO',
}

/** Última hoja del PDF: quién firmó, cuándo, desde dónde y cómo se lo identificó. */
export function certificadoHtml(p: {
  firmaId: string
  version: number
  pdfHash: string
  firmas: Firma[]
  eventos: Evento[]
}): string {
  const fila = (th: string, td: string, mono = false) =>
    `<tr><th>${th}</th><td${mono ? ' class="mono"' : ''}>${td}</td></tr>`
  const firmantes = p.firmas
    .map(
      (f) => `<h3>${f.roles.map((r) => ROL_LEGIBLE[r]).join(' y ')}</h3><table>
        ${fila('Nombre', escaparHtml(f.nombre))}
        ${fila('DNI/CUIT', escaparHtml(f.dni || '—'))}
        ${fila('Fecha y hora', `${fechaHora(f.fecha)} (hora de Argentina)`)}
        ${fila('Firma', f.modo === 'dibujada' ? 'Trazo dibujado en pantalla' : 'Nombre escrito')}
        ${fila('Identificación', escaparHtml(f.verificacion))}
        ${fila('IP', escaparHtml(f.ip || '—'), true)}
        ${fila('Navegador', escaparHtml(f.navegador || '—'), true)}
      </table>`,
    )
    .join('')
  const eventos = p.eventos
    .map((e) => fila(fechaHora(e.fecha), escaparHtml([e.accion, e.detalle, e.ip ? `IP ${e.ip}` : ''].filter(Boolean).join(' · '))))
    .join('')
  return `<section class="certificado">
    <h2><span>CERTIFICADO</span> · FIRMA ELECTRÓNICA</h2>
    <p>Este contrato se firmó electrónicamente en la plataforma QuieroMiSAS (Ley N° 25.506, firma electrónica). Cada firmante aceptó firmar por este medio; del lado de LA SOCIEDAD, la firma se hizo con la cuenta del cliente en QuieroMiSAS y un código de un solo uso enviado a su email.</p>
    <table>
      ${fila('Identificador', escaparHtml(p.firmaId), true)}
      ${fila('Versión del contrato', `v${p.version}`)}
      ${fila('Documento presentado para firmar (SHA-256)', p.pdfHash, true)}
    </table>
    ${firmantes}
    <h3>Registro de auditoría</h3>
    <table>${eventos}</table>
  </section>`
}

/** Hoy en AAAA-MM-DD según el día argentino. */
const diaArgentino = (fecha: Date) => fecha.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

/** JSON con las claves ordenadas, para comparar dos juegos de datos. */
function canonico(d: DatosContrato) {
  return JSON.stringify(Object.fromEntries(Object.entries(d).sort(([a], [b]) => a.localeCompare(b))))
}

/**
 * Guarda los datos del contrato como una versión nueva del trámite. Si son
 * iguales a los de la última (p. ej. se bajó en Word y después en PDF), no
 * crea otra. Devuelve la versión.
 */
export async function guardarVersion(tramiteId: string, datos: DatosContrato, formato: string, generadoPor: string | null) {
  for (let intento = 0; intento < 3; intento++) {
    const ultima = await prisma.contratoDomicilioVersion.findFirst({
      where: { tramiteId },
      orderBy: { version: 'desc' },
    })
    if (ultima && canonico(ultima.datos as DatosContrato) === canonico(datos)) return ultima
    try {
      return await prisma.contratoDomicilioVersion.create({
        data: { tramiteId, version: (ultima?.version ?? 0) + 1, datos, formato, generadoPor },
      })
    } catch (e) {
      // Dos descargas a la vez: la otra se quedó con el número; se reintenta.
      if ((e as { code?: string })?.code !== 'P2002') throw e
    }
  }
  throw new Error('No se pudo guardar la versión del contrato')
}

/** PDF que ve el cliente antes de firmar: el contrato con la firma de EL PRESTADOR. */
export async function pdfParaFirmar(datos: DatosContrato, prestador: Firma): Promise<Buffer> {
  return htmlAPdf(await contratoDomicilioHtml(datos, new Date(), htmlDeFirmas(prestador)), PIE_CONTRATO_HTML)
}

/**
 * Arma el PDF final y lo guarda como contrato firmado. Sólo actúa sobre una
 * firma en PROCESANDO; si falla, queda así y el admin puede reintentar.
 */
export async function finalizarFirma(firmaId: string): Promise<void> {
  const s = await prisma.contratoDomicilioFirma.findUnique({
    where: { id: firmaId },
    include: {
      contratoVersion: true,
      tramite: { select: { id: true, denominacionAprobada: true, denominacionSocial1: true, user: { select: { email: true, name: true } } } },
    },
  })
  if (!s || s.estado !== 'PROCESANDO') return

  const prestador = s.firmaPrestador as unknown as Firma
  const cliente = (s.firmasCliente ?? []) as unknown as Firma[]
  const anexo = s.anexo as unknown as Anexo | null
  const firmadoEl = new Date(cliente[cliente.length - 1]?.fecha ?? Date.now())
  // El contrato se perfecciona con la última firma: esa es la fecha del cierre.
  const datos: DatosContrato = { ...(s.contratoVersion.datos as DatosContrato), fecha_firma: diaArgentino(firmadoEl) }

  const eventos = [...listaEventos(s.eventos), evento('PDF final generado')]
  const html = await contratoDomicilioHtml(datos, firmadoEl, {
    ...htmlDeFirmas(prestador, cliente, anexo),
    certificado: certificadoHtml({
      firmaId: s.id,
      version: s.contratoVersion.version,
      pdfHash: s.pdfHash,
      firmas: [prestador, ...cliente],
      eventos,
    }),
  })
  const pdf = await htmlAPdf(html, PIE_CONTRATO_HTML)
  const hashFinal = sha256(pdf)

  const denominacion = sinTipoSocietario(datos.sociedad_denominacion) || 'Sociedad'
  const nombreArchivo = `Contrato de domicilio firmado - ${denominacion}.pdf`
  const subido = await uploadToSupabase(pdf, `contratos-domicilio/${s.tramiteId}`, 'contrato-firmado-qms.pdf', 'application/pdf')
  if (!subido) throw new Error('No se pudo subir el contrato firmado')

  // Si otro proceso (el reintento del admin) ya la terminó, no se guarda dos veces.
  const guardado = await prisma.$transaction(async (tx) => {
    const { count } = await tx.contratoDomicilioFirma.updateMany({
      where: { id: s.id, estado: 'PROCESANDO' },
      data: { estado: 'FIRMADO' },
    })
    if (count === 0) return false
    const firmado = await tx.contratoDomicilioFirmado.create({
      data: {
        tramiteId: s.tramiteId,
        archivoPath: subido.path,
        nombreArchivo,
        tamanio: pdf.length,
        fechaFirma: new Date(`${diaArgentino(firmadoEl)}T12:00:00Z`),
        cargadoPor: 'Firma electrónica QMS',
        contratoVersionId: s.contratoVersionId,
      },
    })
    await tx.contratoDomicilioFirma.update({
      where: { id: s.id },
      data: {
        firmadoId: firmado.id,
        eventos: [...eventos, evento('Contrato firmado guardado', { detalle: `SHA-256 ${hashFinal}` })] as unknown as Prisma.InputJsonValue,
      },
    })
    return true
  })
  if (!guardado) {
    await deleteFromSupabase(subido.path)
    return
  }

  // Avisos: al cliente (lo baja desde su panel) y a los admins.
  const { enviarEmailNotificacion } = await import('@/lib/emails/send')
  const nombreSociedad = s.tramite.denominacionAprobada || s.tramite.denominacionSocial1 || denominacion
  const admins = await prisma.user.findMany({ where: { rol: 'ADMIN' }, select: { email: true, name: true } })
  await Promise.allSettled([
    enviarEmailNotificacion(
      s.tramite.user.email,
      s.tramite.user.name || '',
      'Tu contrato de domicilio quedó firmado',
      `El contrato de servicio de domicilio de ${nombreSociedad} ya tiene todas las firmas. Podés descargarlo cuando quieras desde tu trámite.`,
      s.tramiteId,
      {
        tono: 'exito',
        datos: [{ etiqueta: 'Huella del PDF (SHA-256)', valor: hashFinal, mono: true }],
        cta: { texto: 'Descargar el contrato', ancla: 'contrato-domicilio' },
      },
    ),
    ...admins.map((a) =>
      enviarEmailNotificacion(
        a.email,
        a.name || '',
        `Contrato de domicilio firmado - ${nombreSociedad}`,
        `El cliente firmó el contrato de domicilio de ${nombreSociedad}. Ya quedó cargado como contrato firmado en la ficha.`,
        s.tramiteId,
        { tono: 'exito', paraAdmin: true, cta: { texto: 'Ver la ficha', tab: 'documentos' } },
      ),
    ),
  ])
}
