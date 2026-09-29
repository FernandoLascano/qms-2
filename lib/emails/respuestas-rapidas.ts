/**
 * Respuestas y plantillas para escribir a mano desde la bandeja.
 *
 * Vivían dentro de la pantalla de redactar; ahora también se usan al
 * responder un mail, que es donde más hacen falta.
 */

export interface Template {
  key: string
  name: string
  subject: string
  body: string
}

/** Plantilla guardada en la base (Emails → Plantillas). */
export interface DbTemplate {
  id: string
  name: string
  displayName: string
  subject: string
  bodyHtml: string
  category: string
}

/**
 * HTML de una plantilla → texto para el editor, respetando párrafos y saltos.
 * La versión anterior colapsaba todo el espacio en blanco y la plantilla
 * quedaba en un solo renglón.
 */
export function textoDePlantilla(html: string): string {
  const conSaltos = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '- ')
  let texto: string
  if (typeof document === 'undefined') {
    texto = conSaltos.replace(/<[^>]+>/g, '')
  } else {
    const d = document.createElement('div')
    d.innerHTML = conSaltos
    texto = d.textContent || ''
  }
  return texto
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Pone el nombre en el saludo genérico «¡Hola!» de las plantillas. */
export function personalizar(texto: string, nombre?: string | null): string {
  const pila = nombre?.trim().split(/\s+/)[0]
  return pila ? texto.replace(/^¡Hola!/, `¡Hola ${pila}!`) : texto
}

export const TEMPLATES: Template[] = [
  {
    key: 'bienvenida',
    name: 'Bienvenida',
    subject: 'Bienvenido a QuieroMiSAS',
    body: `¡Hola!\n\nGracias por registrarte en QuieroMiSAS. Estamos listos para ayudarte a constituir tu S.A.S. de manera rápida y segura.\n\nSi tenés alguna duda, no dudes en escribirnos.\n\nSaludos,\nEquipo QuieroMiSAS`
  },
  {
    key: 'documentacion',
    name: 'Solicitud de documentación',
    subject: 'Documentación pendiente para tu trámite',
    body: `¡Hola!\n\nPara poder avanzar con tu trámite de constitución, necesitamos que subas la siguiente documentación a tu panel:\n\n- DNI frente y dorso de todos los socios\n- Constancia de CUIT/CUIL de cada socio\n- Comprobante de domicilio\n\nPodés hacerlo desde tu panel en www.quieromisas.com/dashboard/documentos\n\nQuedamos atentos.\n\nSaludos,\nEquipo QuieroMiSAS`
  },
  {
    key: 'pago-pendiente',
    name: 'Recordatorio de pago',
    subject: 'Recordatorio: Pago pendiente para tu trámite',
    body: `¡Hola!\n\nTe recordamos que tenés un pago pendiente para continuar con tu trámite de constitución de S.A.S.\n\nPodés realizar el pago desde tu panel en la sección de trámites.\n\nSi ya realizaste el pago, por favor ignorá este mensaje.\n\nSaludos,\nEquipo QuieroMiSAS`
  },
  {
    key: 'estado-tramite',
    name: 'Actualización de trámite',
    subject: 'Novedades sobre tu trámite',
    body: `¡Hola!\n\nTe escribimos para informarte sobre el estado de tu trámite.\n\n[Completar con la novedad]\n\nSi tenés alguna consulta, no dudes en escribirnos.\n\nSaludos,\nEquipo QuieroMiSAS`
  },
  {
    key: 'tramite-completado',
    name: 'Trámite completado',
    subject: '¡Felicitaciones! Tu S.A.S. ya está inscripta',
    body: `¡Felicitaciones!\n\nNos alegra informarte que tu Sociedad por Acciones Simplificada ya fue inscripta exitosamente.\n\nDesde tu panel podés descargar toda la documentación:\n- Estatuto inscripto\n- CUIT de la sociedad\n- Matrícula\n\nPróximos pasos recomendados:\n1. Habilitar punto de venta en ARCA\n2. Abrir cuenta bancaria empresarial\n3. Registrar actividad comercial\n\n¡Muchos éxitos con tu nuevo emprendimiento!\n\nSaludos,\nEquipo QuieroMiSAS`
  },
  {
    key: 'consulta-general',
    name: 'Respuesta a consulta',
    subject: 'Re: Tu consulta en QuieroMiSAS',
    body: `¡Hola!\n\nGracias por tu consulta.\n\n[Completar con la respuesta]\n\nQuedamos a disposición por cualquier otra duda.\n\nSaludos,\nEquipo QuieroMiSAS`
  },
]
