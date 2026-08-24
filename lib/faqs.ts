/**
 * Preguntas frecuentes de la portada.
 *
 * Vive acá, y no dentro de FAQ.tsx, porque tiene DOS consumidores: la sección
 * que las muestra y el JSON-LD de `FAQPage` del layout raíz. Google pide que el
 * marcado refleje lo que el visitante ve; cuando eran dos listas escritas por
 * separado, ninguna de las 8 preguntas marcadas coincidía con las 15 visibles.
 * Con una sola fuente no pueden volver a divergir.
 */

export interface FAQItem {
  pregunta: string
  respuesta: string
  link?: { text: string; href: string }
}

export const faqs: FAQItem[] = [
  {
    pregunta: '¿Qué es una S.A.S. y por qué elegirla?',
    respuesta: 'La Sociedad por Acciones Simplificada (S.A.S.) es un tipo societario moderno en Argentina que combina la flexibilidad de una S.R.L. con las ventajas de una S.A., pero con costos menores y trámites más simples. Es ideal para startups, PyMEs y emprendedores que buscan formalizar su negocio rápidamente.'
  },
  {
    pregunta: '¿Qué diferencias hay entre una S.A.S., S.A. y S.R.L.?',
    respuesta: 'Si bien los tres tipos societarios son plenamente útiles y eficaces para desarrollar un negocio o actividad, la S.A.S. permite una mayor flexibilidad y simpleza en su constitución y posterior desenvolvimiento. Menor cantidad de socios requeridos, tiempos de constitución más breves y costos más accesibles son algunas de sus ventajas frente a la S.A. y la S.R.L.'
  },
  {
    pregunta: '¿Cuánto tiempo tarda el proceso completo?',
    respuesta: 'El proceso completo toma aproximadamente 5 días hábiles desde que completás el formulario y aportás toda la documentación. Esto incluye la reserva de denominación, depósito de capital, firma digital y la inscripción ante IPJ (Córdoba) o IGJ (CABA).'
  },
  {
    pregunta: '¿Cuánto cuesta constituir una S.A.S.?',
    respuesta: 'Los costos varían según la jurisdicción, plan escogido y el capital social. Todos los costos son informados con transparencia antes de comenzar.'
  },
  {
    pregunta: '¿Cuál es el capital mínimo requerido para constituir una S.A.S.?',
    respuesta: 'El capital social no podrá ser inferior al importe equivalente a dos (2) veces el salario mínimo vital y móvil que se establezca al momento de su constitución. Solo necesitás integrar el 25% al momento de la constitución, el resto puede aportarse en hasta 2 años.'
  },
  {
    pregunta: '¿Puedo constituir una S.A.S. unipersonal?',
    respuesta: 'Sí. Una S.A.S. puede ser constituida con una sola persona como socia. De todas maneras, necesitarás de una segunda persona para llenar los cargos del órgano de administración de la sociedad, sin necesidad que esa persona sea además socia de la Sociedad.'
  },
  {
    pregunta: '¿No soy de Córdoba ni de CABA, igual puedo constituir una S.A.S. en Córdoba o CABA?',
    respuesta: 'Sí. La única salvedad que deberás tener en cuenta es que la sede social de tu S.A.S. deberá estar fijada dentro de la provincia de Córdoba o la Ciudad Autónoma de Buenos Aires. Si no dispones de un domicilio donde fijarla, contáctate con nosotros para que podamos ayudarte.'
  },
  {
    pregunta: '¿En qué jurisdicciones trabajan?',
    respuesta: 'Actualmente trabajamos en Córdoba (IPJ) y Ciudad Autónoma de Buenos Aires (IGJ). Tu empresa, una vez inscripta, puede operar en todo el territorio argentino sin restricciones.'
  },
  {
    pregunta: '¿Puedo ser accionista o administrador de una S.A.S. siendo extranjero?',
    respuesta: 'Sí. De todas maneras, atento a tratarse de un supuesto de excepción, el procedimiento y los requisitos a cumplimentar pueden variar del trámite regular. En caso de que seas extranjero y desees formar parte de una S.A.S. te invitamos a contactarte con nosotros para darte una atención personalizada y evaluar tu caso.'
  },
  {
    pregunta: '¿Qué tipo de actividad o negocios puedo realizar con una S.A.S.?',
    respuesta: 'La S.A.S. tiene la posibilidad de prever múltiples actividades posibles para desarrollar. Se puede optar entre un objeto múltiple pre-aprobado por el órgano de contralor o diseñar uno en concreto para la Sociedad. No podrán ser objeto de una S.A.S.: a) operaciones de capitalización, ahorro o en cualquier forma requieran dinero o valores al público con promesas de prestaciones o beneficios futuros; b) explotación de concesión o servicios públicos.'
  },
  {
    pregunta: '¿Es posible redactar mis propias previsiones estatutarias?',
    respuesta: 'Sí. En caso que desees un estatuto confeccionado de acuerdo a necesidades específicas, te pedimos nos contactes para poder evaluar el asunto e informarte los pasos a seguir.'
  },
  {
    pregunta: '¿Cómo funcionan los Libros Digitales?',
    respuesta: 'Las S.A.S. llevan obligatoriamente Libros Digitales donde deberán asentarse todos los actos de la Sociedad. Su acceso se realiza a través de un Portal dispuesto por la autoridad de contralor y desde allí se pueden visualizar y cargar todas las actas y documentos pertinentes, permaneciendo los mismos inalterables en una nube de acceso único para los administradores de la Sociedad y/o quienes ellos designen a tales efectos. Si deseas mayor asesoramiento respecto a libros digitales, te solicitamos te comuniques con nosotros para poder ayudarte.'
  },
  {
    pregunta: '¿Puedo hacer seguimiento del trámite?',
    respuesta: 'Sí, nuestra plataforma te permite hacer seguimiento en tiempo real de cada etapa: desde la reserva de denominación hasta la inscripción final. Recibís notificaciones automáticas por email y podés chatear directamente con nuestro equipo desde tu panel.'
  },
  {
    pregunta: '¿Qué pasa si rechazan mi documentación?',
    respuesta: 'Si algún documento es rechazado, te notificamos inmediatamente con las observaciones específicas. Podés corregir y reenviar el documento desde tu panel. No cobramos extra por correcciones, está incluido en el servicio.'
  },
  {
    pregunta: '¿La S.A.S. es reconocida por ARCA y bancos?',
    respuesta: 'Sí, absolutamente. La S.A.S. es un tipo societario oficial regulado por la Ley 27.349. Obtenés CUIT automáticamente al inscribirte y podés operar con bancos, facturar, contratar empleados y realizar cualquier actividad comercial legal.'
  }
]
