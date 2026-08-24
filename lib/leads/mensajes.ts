/**
 * Qué se le dice a un lead según dónde se frenó.
 *
 * El contenido no es genérico a propósito. Medido sobre los borradores reales,
 * hay dos grupos que no se parecen en nada: los que abrieron el formulario y no
 * escribieron ni el nombre, y los que cargaron sus datos y se trabaron cuando
 * el formulario les pidió una dirección en Córdoba o CABA. Mandarles lo mismo a
 * los dos desperdicia el único contacto que se va a leer.
 *
 * El tono sale de lo que funciona en los contactos que sí cierran: ofrecer
 * ayuda y despejar dudas, no vender ni apurar.
 */

import type { SegmentoLead } from '@/lib/leads/avance'

export interface Mensaje {
  asunto: string
  /** Para WhatsApp: texto plano, listo para pegar. */
  texto: string
}

const FIRMA = 'Justiniano · QuieroMiSAS'

export function mensajeWhatsapp(segmento: SegmentoLead, nombre: string): string {
  const hola = `Hola${nombre ? ` ${nombre.split(' ')[0]}` : ''}!`

  switch (segmento) {
    case 'NO_ARRANCO':
      return (
        `${hola} Soy ${FIRMA}. Vi que empezaste a armar tu S.A.S. y quedó a mitad de camino. ` +
        `Te escribo por si te quedó alguna duda: te puedo explicar en dos minutos qué incluye, ` +
        `cuánto tarda y qué necesitás tener a mano. ¿Te sirve que lo veamos?`
      )
    case 'TRABADO_DOMICILIO':
      return (
        `${hola} Soy ${FIRMA}. Vi que te frenaste en el paso del domicilio, que es donde se traba ` +
        `casi todo el mundo, así que te lo aclaro: la sede social tiene que estar en Córdoba o en ` +
        `CABA, pero no hace falta que vivas ahí ni que tengas una oficina. Si no tenés dónde ` +
        `fijarla, te la resolvemos nosotros. ¿Querés que lo veamos?`
      )
    case 'CASI_LISTO':
      return (
        `${hola} Soy ${FIRMA}. Tenés el formulario casi terminado, te falta muy poco. ` +
        `¿Querés que lo repasemos juntos y lo dejamos listo hoy?`
      )
  }
}

/**
 * Los cuatro toques de la secuencia automática. El día es días desde la última
 * actividad; después del cuarto no se manda nada más y el lead queda para
 * trabajar a mano.
 */
export const TOQUES = [1, 3, 7, 14] as const

export function mensajeEmail(
  segmento: SegmentoLead,
  toque: number,
  nombre: string,
): Mensaje {
  const primerNombre = nombre ? nombre.split(' ')[0] : ''

  if (segmento === 'TRABADO_DOMICILIO') {
    if (toque <= 1)
      return {
        asunto: 'Lo del domicilio para tu S.A.S. es más fácil de lo que parece',
        texto:
          `Te frenaste justo en el paso del domicilio, que es donde se traba casi todo el mundo.\n\n` +
          `La sede social de tu S.A.S. tiene que estar en Córdoba o en CABA, pero eso no significa ` +
          `que tengas que vivir ahí ni alquilar una oficina. Si no tenés dónde fijarla, te la ` +
          `damos nosotros y queda resuelto.\n\n` +
          `Tu empresa después puede operar en todo el país, sin importar dónde se constituyó.`,
      }
    if (toque <= 3)
      return {
        asunto: '¿Te ayudo con el domicilio de tu sociedad?',
        texto:
          `Te escribo por si quedó dando vueltas lo de la sede social.\n\n` +
          `Es el punto que más consultas genera y se resuelve en una conversación corta. ` +
          `Contame en qué provincia estás y te digo exactamente cómo se hace en tu caso.`,
      }
    if (toque <= 7)
      return {
        asunto: 'Tu S.A.S. quedó a mitad de camino',
        texto:
          `Tenés tus datos cargados y falta poco para terminar.\n\n` +
          `Si el domicilio es lo que te está frenando, decímelo y lo resolvemos: es lo más ` +
          `común y siempre hay salida.`,
      }
    return {
      asunto: 'Última por acá',
      texto:
        `No te escribo más para no ser pesado.\n\n` +
        `Tu formulario queda guardado, así que podés retomarlo cuando quieras. Y si preferís ` +
        `que lo veamos juntos, respondeme este mail y coordinamos.`,
    }
  }

  if (segmento === 'CASI_LISTO') {
    if (toque <= 1)
      return {
        asunto: 'Te falta muy poco para tener tu S.A.S.',
        texto:
          `Tenés el formulario casi terminado. Falta un paso y queda listo para que arranquemos.\n\n` +
          `Si algo no te cerró, respondeme y lo vemos.`,
      }
    if (toque <= 3)
      return {
        asunto: '¿Lo dejamos listo?',
        texto:
          `Tu formulario quedó a un paso de estar completo.\n\n` +
          `Si querés lo repasamos juntos y lo cerramos hoy mismo.`,
      }
    if (toque <= 7)
      return {
        asunto: 'Tu formulario sigue guardado',
        texto:
          `Nada se perdió: todo lo que cargaste está donde lo dejaste.\n\n` +
          `¿Seguimos?`,
      }
    return {
      asunto: 'Última por acá',
      texto:
        `No te escribo más para no ser pesado.\n\n` +
        `El formulario queda guardado y podés retomarlo cuando te venga bien.`,
    }
  }

  // NO_ARRANCO
  if (toque <= 1)
    return {
      asunto: '¿Te ayudo a armar tu S.A.S.?',
      texto:
        `Abriste el formulario para constituir tu sociedad y quedó ahí.\n\n` +
        `Si te quedaron dudas sobre qué incluye, cuánto tarda o qué necesitás tener a mano, ` +
        `respondeme este mail y te lo explico. Sin compromiso.`,
    }
  if (toque <= 3)
    return {
      asunto: 'Tres cosas que conviene saber antes de constituir',
      texto:
        `Por si te sirve para decidir:\n\n` +
        `· Una S.A.S. se puede constituir con un solo socio.\n` +
        `· El trámite es 100% online, no hace falta escribanía.\n` +
        `· La sede tiene que estar en Córdoba o CABA, pero si no tenés dónde fijarla, ` +
        `te la damos nosotros.\n\n` +
        `Cualquier duda, respondeme.`,
    }
  if (toque <= 7)
    return {
      asunto: '¿Seguís pensando en constituir tu empresa?',
      texto:
        `Si todavía le estás dando vueltas, contame en qué estás y te digo si te conviene ` +
        `una S.A.S. o alguna otra figura. Prefiero decirte que no te sirve, a venderte algo ` +
        `que no necesitás.`,
    }
  return {
    asunto: 'Última por acá',
    texto:
      `No te escribo más para no ser pesado.\n\n` +
      `Si en algún momento retomás la idea, el formulario queda guardado y acá estamos.`,
  }
}
