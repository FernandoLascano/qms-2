import { prisma } from '@/lib/prisma'

/**
 * Marca como ganados los leads de un cliente que acaba de enviar un trámite.
 *
 * Un estado que depende de que alguien se acuerde de tildarlo no sirve para
 * medir nada: por eso `CONVERTIDO` no se pone a mano en ningún lado, se pone
 * acá. El disparador es el envío del formulario, que es el momento exacto en
 * que la persona deja de ser un lead.
 *
 * Se marcan los borradores *anteriores* del mismo usuario, que son los que
 * estuvieron en la lista de leads. El trámite recién enviado ya no es un
 * borrador y por eso no entra.
 *
 * Nunca lanza: es un efecto de registro, y perder la marca no puede hacer
 * fracasar el envío del trámite del cliente.
 */
export async function marcarLeadsGanados(userId: string): Promise<number> {
  try {
    const { count } = await prisma.tramite.updateMany({
      where: {
        userId,
        formularioCompleto: false,
        leadEstado: { notIn: ['CONVERTIDO'] },
      },
      data: {
        leadEstado: 'CONVERTIDO',
        leadGanadoAt: new Date(),
        leadMotivoPerdida: null,
        leadMotivoNota: null,
      },
    })
    return count
  } catch (error) {
    console.error('[leads] no se pudo marcar el lead como ganado:', error)
    return 0
  }
}
