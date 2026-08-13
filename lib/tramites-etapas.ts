import { prisma } from '@/lib/prisma'
import { enviarEmailEtapaCompletada, enviarEmailNotificacion } from '@/lib/emails/send'

const BASE_URL = process.env.NEXTAUTH_URL || 'https://www.quieromisas.com'

// Etapas del trámite que se completan automáticamente al aprobarse un pago,
// con las fechas de tracking que hay que setear y el mensaje al cliente.
type EtapaPago = 'honorariosPagados' | 'capitalDepositado' | 'tasaPagada'

const ETAPAS_PAGO: Record<EtapaPago, { fechas: string[]; nombre: string; mensaje: string }> = {
  honorariosPagados: {
    fechas: ['fechaHonorariosPagados'],
    nombre: 'Honorarios Pagados',
    mensaje: 'Confirmamos el pago de los honorarios. ¡Seguimos avanzando con tu trámite!'
  },
  capitalDepositado: {
    fechas: ['fechaCapitalDepositado', 'fechaDepositoCapital'],
    nombre: 'Capital Depositado',
    mensaje: 'Se ha confirmado el depósito del 25% del capital social.'
  },
  tasaPagada: {
    fechas: ['fechaTasaPagada', 'fechaPagoTasa'],
    nombre: 'Tasa Pagada',
    mensaje: 'El pago de la tasa retributiva ha sido confirmado.'
  }
}

// Mapea el concepto de un pago/enlace a la etapa del trámite que corresponde marcar.
// La tasa de reserva de nombre (TASA_RESERVA_NOMBRE) NO marca etapa.
export function etapaPorConcepto(concepto?: string | null): EtapaPago | null {
  if (!concepto) return null
  if (concepto.includes('HONORARIOS')) return 'honorariosPagados'
  if (concepto === 'DEPOSITO_CAPITAL') return 'capitalDepositado'
  if (concepto === 'TASA_RETRIBUTIVA') return 'tasaPagada'
  return null
}

/**
 * Marca una etapa de pago como completada si todavía no lo estaba.
 * Si la marca, notifica al cliente y le envía el email de etapa (uno solo).
 * Devuelve true si la etapa quedó marcada (ya sea ahora o de antes), para que
 * quien la llama pueda evitar mandar una confirmación genérica duplicada.
 */
export async function marcarEtapaPagada(tramiteId: string, etapa: EtapaPago): Promise<boolean> {
  const cfg = ETAPAS_PAGO[etapa]

  const tramite = await prisma.tramite.findUnique({
    where: { id: tramiteId },
    include: { user: true }
  })
  if (!tramite) return false

  // Ya estaba marcada: se considera "manejada" para no reenviar el email.
  if ((tramite as unknown as Record<string, boolean>)[etapa]) return true

  const data: Record<string, unknown> = { [etapa]: true }
  for (const f of cfg.fechas) data[f] = new Date()

  await prisma.tramite.update({ where: { id: tramiteId }, data })

  try {
    await prisma.notificacion.create({
      data: {
        userId: tramite.userId,
        tramiteId,
        tipo: 'INFO',
        titulo: `Etapa completada: ${cfg.nombre}`,
        mensaje: cfg.mensaje,
        link: `/dashboard/tramites/${tramiteId}`
      }
    })
  } catch {
    // Notificación no crítica
  }

  try {
    await enviarEmailEtapaCompletada(tramite.user.email, tramite.user.name || 'Usuario', cfg.nombre, tramiteId)
  } catch {
    // Email no crítico
  }

  // Al confirmar los honorarios, avisamos el requisito de Ciudadano Digital Nivel 2
  if (etapa === 'honorariosPagados') {
    try {
      await enviarEmailNotificacion(
        tramite.user.email,
        tramite.user.name || 'Usuario',
        'Requisito: Ciudadano Digital Nivel 2',
        `Para avanzar con el trámite necesitamos que todas las personas que integren la Sociedad (como socias o administradoras) tengan Ciudadano Digital Nivel 2. Es un requisito del sistema.\n\nPodés ver el instructivo para obtenerlo acá: ${BASE_URL}/assets/img/CiudadanoDigital.jpeg\n\nCuando lo tengas listo, confirmalo desde tu panel. Ante cualquier duda, escribinos por WhatsApp.`,
        tramiteId
      )
    } catch {
      // Email no crítico
    }
  }

  return true
}
