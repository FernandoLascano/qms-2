import { prisma } from '@/lib/prisma'
import {
  interpolarConocidas,
  mensajeDePendientes,
  pendientesDeCompletar,
  primerNombre,
  variablesDe,
  type DatosDestinatario,
} from './redaccion'

/**
 * Quién está detrás de una dirección, para saludarlo por su nombre y rellenar
 * las variables de las plantillas ({{nombre}}, {{denominacion}}…).
 *
 * Busca primero un usuario (con su trámite más reciente, prefiriendo uno ya
 * enviado) y si no, un lead. Si no aparece nada, devuelve los campos vacíos:
 * el mail sale con un saludo genérico, nunca con la dirección como nombre.
 */
export async function datosDelDestinatario(direccion: string): Promise<DatosDestinatario> {
  const email = direccion.trim().toLowerCase()
  const vacio: DatosDestinatario = {
    email,
    nombre: '',
    nombreCompleto: '',
    denominacion: '',
    cuit: '',
    matricula: '',
    tramiteId: '',
  }
  if (!email) return vacio

  try {
    const usuario = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: {
        name: true,
        tramites: {
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            denominacionSocial1: true,
            denominacionAprobada: true,
            formularioCompleto: true,
            cuit: true,
            matricula: true,
          },
        },
      },
    })

    let nombreCompleto = usuario?.name?.trim() || ''
    if (!nombreCompleto) {
      const lead = await prisma.lead.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
        select: { nombre: true },
      })
      nombreCompleto = lead?.nombre?.trim() || ''
    }
    if (nombreCompleto.includes('@')) nombreCompleto = ''

    const tramite = usuario?.tramites.find((t) => t.formularioCompleto) ?? usuario?.tramites[0]

    return {
      ...vacio,
      nombre: primerNombre(nombreCompleto),
      nombreCompleto,
      denominacion: tramite ? tramite.denominacionAprobada || tramite.denominacionSocial1 || '' : '',
      cuit: tramite?.cuit || '',
      matricula: tramite?.matricula || '',
      tramiteId: tramite?.id || '',
    }
  } catch {
    // Sin datos se saluda en genérico; no es motivo para no enviar.
    return vacio
  }
}

type MailManualPreparado =
  | { ok: true; texto: string; asunto: string; nombre: string; datos: DatosDestinatario | null }
  | { ok: false; error: string }

/**
 * Último paso antes de enviar un mail escrito a mano: rellena las variables
 * que hayan quedado con los datos del destinatario, decide con qué nombre se
 * saluda y frena el envío si todavía hay indicaciones tipo «[Completar…]» o
 * variables sin resolver. El navegador ya avisa, esto es la red de seguridad.
 *
 * Con más de un destinatario no se personaliza: no hay un único nombre.
 */
export async function prepararMailManual({
  texto,
  asunto,
  para,
  nombreSugerido,
}: {
  texto: string
  asunto: string
  para: string[]
  nombreSugerido?: string | null
}): Promise<MailManualPreparado> {
  const datos = para.length === 1 ? await datosDelDestinatario(para[0]) : null
  const nombre = datos?.nombre || (para.length === 1 ? primerNombre(nombreSugerido) : '')
  const variables = { ...(nombre ? { nombre } : {}), ...variablesDe(datos) }
  const textoFinal = interpolarConocidas(texto, variables)
  const asuntoFinal = interpolarConocidas(asunto, variables)

  const error = mensajeDePendientes(pendientesDeCompletar(asuntoFinal, textoFinal))
  if (error) return { ok: false, error }

  return {
    ok: true,
    texto: textoFinal,
    asunto: asuntoFinal,
    nombre,
    datos,
  }
}
