/**
 * Mensajes listos para copiar y mandar a mano desde WhatsApp o el mail.
 *
 * La plataforma no envía nada: arma el texto con el nombre y la situación de
 * cada lead, y la persona lo pega donde lo manda. Por eso cada plantilla dice
 * CUÁNDO usarla: con una lista de títulos sueltos había que adivinar cuál
 * correspondía.
 *
 * El tono es el de `mensajes.ts` (el de los emails automáticos): ofrecer ayuda
 * y despejar dudas, no vender ni apurar.
 */

import type { SegmentoLead } from '@/lib/leads/avance'
import { mensajeWhatsapp } from '@/lib/leads/mensajes'

export type CanalMensaje = 'WHATSAPP' | 'EMAIL'

export interface ContextoMensaje {
  nombre: string
  /** Formulario sin terminar o consulta sin trámite. */
  tipo: 'BORRADOR' | 'CONSULTA'
  segmento: SegmentoLead | null
  denominacion: string | null
  /** Cuántos contactos ya se registraron: decide qué plantilla sugerir. */
  contactos: number
}

export interface Plantilla {
  id: string
  canal: CanalMensaje
  titulo: string
  /** Cuándo conviene usarla: se muestra al lado del título. */
  cuando: string
  asunto?: string
  cuerpo: string
}

const FIRMA_WA = 'Justiniano · QuieroMiSAS'
const FIRMA_EMAIL = 'Justiniano\nQuieroMiSAS · quieromisas.com'

const primerNombre = (nombre: string) => (nombre.trim() ? nombre.trim().split(/\s+/)[0] : '')
const hola = (nombre: string, signo = '!') => `Hola${primerNombre(nombre) ? ` ${primerNombre(nombre)}` : ''}${signo}`

/** Cómo nombrar su sociedad en el texto: la denominación si la eligió. */
const suSociedad = (c: ContextoMensaje) => (c.denominacion ? c.denominacion : 'tu S.A.S.')

function primerContactoWhatsapp(c: ContextoMensaje): string {
  if (c.tipo === 'BORRADOR' && c.segmento) return mensajeWhatsapp(c.segmento, c.nombre)
  return (
    `${hola(c.nombre)} Soy ${FIRMA_WA}. Te escribo por la consulta que nos dejaste. ` +
    `Estoy para ayudarte con la constitución de tu empresa o para despejarte cualquier duda: ` +
    `contame en qué estás y te digo cómo seguimos.`
  )
}

function primerContactoEmail(c: ContextoMensaje): { asunto: string; cuerpo: string } {
  const saludo = `${hola(c.nombre, ',')}\n\n`
  const cierre = `\n\nSaludos,\n${FIRMA_EMAIL}`

  if (c.tipo === 'CONSULTA') {
    return {
      asunto: 'Tu consulta en QuieroMiSAS',
      cuerpo:
        saludo +
        `Te escribo por la consulta que nos dejaste en QuieroMiSAS.\n\n` +
        `Si estás pensando en constituir tu empresa, te puedo explicar en pocos minutos qué ` +
        `incluye el trámite, cuánto tarda y qué necesitás tener a mano. Y si todavía no sabés ` +
        `si una S.A.S. es lo que te conviene, también lo vemos.\n\n` +
        `Respondeme este mail o pasame un teléfono y te llamo.` +
        cierre,
    }
  }

  switch (c.segmento) {
    case 'TRABADO_DOMICILIO':
      return {
        asunto: `Lo del domicilio de ${suSociedad(c)} tiene solución`,
        cuerpo:
          saludo +
          `Vi que el formulario de ${suSociedad(c)} quedó frenado en el paso del domicilio, que es ` +
          `donde se traba casi todo el mundo.\n\n` +
          `La sede social tiene que estar en Córdoba o en CABA, pero no hace falta que vivas ahí ` +
          `ni que alquiles una oficina. Si no tenés dónde fijarla, te la damos nosotros y queda ` +
          `resuelto. Después la empresa puede operar en todo el país.\n\n` +
          `¿Lo vemos juntos? Respondeme y coordinamos.` +
          cierre,
      }
    case 'CASI_LISTO':
      return {
        asunto: `Te falta muy poco para ${suSociedad(c)}`,
        cuerpo:
          saludo +
          `Tenés el formulario de ${suSociedad(c)} casi terminado: falta muy poco para que ` +
          `arranquemos con la constitución.\n\n` +
          `Si algo no te cerró o tenés alguna duda antes de enviarlo, respondeme y lo repasamos ` +
          `juntos. Lo podemos dejar listo hoy.` +
          cierre,
      }
    default:
      return {
        asunto: '¿Te ayudo a armar tu S.A.S.?',
        cuerpo:
          saludo +
          `Vi que empezaste el formulario para constituir tu sociedad y quedó a mitad de camino.\n\n` +
          `Por si te sirve para decidir:\n` +
          `· Una S.A.S. se puede constituir con un solo socio.\n` +
          `· El trámite es 100% online, no hace falta escribanía.\n` +
          `· La sede tiene que estar en Córdoba o CABA, pero si no tenés dónde fijarla, te la ` +
          `damos nosotros.\n\n` +
          `Si te quedó alguna duda, respondeme este mail y te la resuelvo.` +
          cierre,
      }
  }
}

/** Todas las plantillas para un lead, la sugerida primero en cada canal. */
export function plantillasPara(c: ContextoMensaje): Plantilla[] {
  const n = hola(c.nombre)
  const ctx = c.tipo === 'BORRADOR' ? `lo de ${suSociedad(c)}` : 'tu consulta'
  const email1 = primerContactoEmail(c)

  const whatsapp: Plantilla[] = [
    {
      id: 'wa-primer',
      canal: 'WHATSAPP',
      titulo: 'Primer contacto',
      cuando: 'Todavía no le escribiste',
      cuerpo: primerContactoWhatsapp(c),
    },
    {
      id: 'wa-seguimiento',
      canal: 'WHATSAPP',
      titulo: 'Seguimiento',
      cuando: 'Le escribiste y no contestó',
      cuerpo:
        `${n} ¿Cómo va? Te escribo de nuevo por ${ctx}${ctx.endsWith('.') ? '' : '.'} ` +
        `Si te quedó alguna duda, decime y te la resuelvo en un minuto. Si preferís, te llamo.`,
    },
    {
      id: 'wa-domicilio',
      canal: 'WHATSAPP',
      titulo: 'Explicar el domicilio',
      cuando: 'La duda es dónde fijar la sede',
      cuerpo:
        `${n} Te cuento cómo funciona lo del domicilio: la sede social tiene que estar en Córdoba ` +
        `o en CABA, pero no hace falta que vivas ahí ni que tengas oficina. Si no tenés dónde ` +
        `fijarla, te damos una nosotros y queda resuelto. La empresa después opera en todo el país.`,
    },
    {
      id: 'wa-recordatorio',
      canal: 'WHATSAPP',
      titulo: 'Retomar',
      cuando: 'Estaban hablando y quedó en pausa',
      cuerpo:
        `${n} Retomo lo que veníamos hablando. ¿Pudiste pensarlo? ` +
        `Si querés, avanzamos y te voy guiando en cada paso.`,
    },
    {
      id: 'wa-cierre',
      canal: 'WHATSAPP',
      titulo: 'Último mensaje',
      cuando: 'Varios intentos sin respuesta',
      cuerpo:
        `${n} No te escribo más para no molestarte. ` +
        (c.tipo === 'BORRADOR' ? 'Tu formulario queda guardado, así que lo podés retomar cuando quieras. ' : '') +
        `Si en algún momento necesitás una mano con tu empresa, escribime por acá. ¡Éxitos!`,
    },
  ]

  const saludo = `${hola(c.nombre, ',')}\n\n`
  const cierre = `\n\nSaludos,\n${FIRMA_EMAIL}`

  const email: Plantilla[] = [
    {
      id: 'em-primer',
      canal: 'EMAIL',
      titulo: 'Primer contacto',
      cuando: 'Todavía no le escribiste',
      asunto: email1.asunto,
      cuerpo: email1.cuerpo,
    },
    {
      id: 'em-seguimiento',
      canal: 'EMAIL',
      titulo: 'Seguimiento',
      cuando: 'Le escribiste y no contestó',
      asunto: c.tipo === 'BORRADOR' ? `¿Seguimos con ${suSociedad(c)}?` : '¿Pudiste ver lo de tu empresa?',
      cuerpo:
        saludo +
        `Te escribo de nuevo por ${ctx}, por si mi mail anterior se perdió.\n\n` +
        `Si te quedó alguna duda, respondeme y te la resuelvo. Si preferís hablarlo, pasame un ` +
        `teléfono y te llamo.` +
        cierre,
    },
    {
      id: 'em-cierre',
      canal: 'EMAIL',
      titulo: 'Último mensaje',
      cuando: 'Varios intentos sin respuesta',
      asunto: 'Última por acá',
      cuerpo:
        saludo +
        `No te escribo más para no ser pesado.\n\n` +
        (c.tipo === 'BORRADOR'
          ? `Tu formulario queda guardado, así que podés retomarlo cuando quieras. `
          : '') +
        `Si en algún momento necesitás una mano con tu empresa, respondeme este mail y lo vemos.` +
        cierre,
    },
  ]

  // Con contactos previos, lo que corresponde es el seguimiento, no presentarse.
  if (c.contactos > 0) {
    whatsapp.unshift(...whatsapp.splice(1, 1))
    email.unshift(...email.splice(1, 1))
  }

  return [...whatsapp, ...email]
}
