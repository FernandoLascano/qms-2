// Fuente única del objeto social pre-aprobado (el estándar de 14 actividades).
// Se usa para mostrar el texto completo y real cuando un trámite eligió el
// objeto pre-aprobado (el valor guardado puede venir vacío, como "PREAPROBADO"
// o resumido).

export const OBJETO_SOCIAL_PREAPROBADO =
  'La sociedad tiene por objeto realizar por cuenta propia y/o de terceros, o asociadas a terceros en el país o en el extranjero, las siguientes actividades: 1) Construcción de todo tipo de obras, públicas o privadas, edificios, viviendas, locales comerciales y plantas industriales; realizar refacciones, remodelaciones, instalaciones, trabajos de albañilería y/o cualquier trabajo de la construcción. 2) Transporte nacional o internacional de cargas en general, ya sea por vía terrestre, aérea o marítima, con medios de transporte propios o de terceros, pudiendo realizar todo lo inherente a su logística. 3) Compra, venta y permuta, explotación, arrendamientos y administración de bienes inmuebles, urbanos y rurales y la realización de operaciones de propiedad horizontal. 4) Realizar toda clase de operaciones financieras por todos los medios autorizados por la legislación vigente. Se exceptúan las operaciones comprendidas en la Ley de Entidades Financiera. 5) Realizar la explotación directa por sí o por terceros en establecimientos rurales, ganaderos, agrícolas, avícolas, frutícolas, vitivinícolas, forestales, cría, venta y cruza de ganado, explotación de tambos, cultivos, compra, venta y acopio de cereales. 6) Elaboración, producción, transformación y comercialización de productos y subproductos alimenticios de todo tipo, expendio de todo tipo de bebidas, explotación de servicio de catering, de concesiones gastronómicas, bares, restoranes, comedores, organización y logística en eventos sociales. 7) Creación, producción, elaboración, transformación, desarrollo, reparación, implementación, servicio técnico, consultoría, comercialización, distribución, importación y exportación de softwares, equipos informáticos, eléctricos y electrónicos. 8) Producción, organización y explotación de espectáculos públicos y privados, teatrales, musicales, coreográficos, desfiles, exposiciones, ferias, conciertos musicales, recitales, y eventos sociales. 9) Explotación de agencia de viajes y turismo, pudiendo realizar reservas y ventas de pasajes, terrestres, aéreos, marítimos, nacionales o internacionales; organización, reserva y ventas de excursiones, reservas de hotelería, reserva, organización y ventas de charters y traslados, dentro y fuera del país de contingentes. 10) Organización, administración, gerenciamiento y explotación de centros médicos asistenciales, con atención polivalente e integral de medicina, atención clínica, terapéutica y quirúrgica, con o sin internación y demás actividades relacionadas a la salud y servicios de atención médica. 11) Constituir, instalar y comercializar editoriales y gráficas en cualquier soporte. 12) Instalación y explotación de establecimientos destinados a la industrialización, fabricación y elaboración de las materias primas, productos y subproductos relacionados directamente con su objeto social. 13) Importación y exportación de bienes y servicios. 14) Actuar como fiduciante, fiduciaria, beneficiaria, fideicomisaria, por cuenta propia o por cuenta de terceros y/o asociada a terceros, en todo tipo de emprendimientos.'

export function esObjetoPreAprobado(objetoSocial?: string | null): boolean {
  const t = (objetoSocial || '').trim()
  if (!t) return false
  return (
    t === 'PREAPROBADO' ||
    t.includes('La sociedad tiene por objeto realizar por cuenta propia y/o de terceros') ||
    t.includes('Construcción de todo tipo de obras')
  )
}

// Devuelve el objeto social a mostrar: el texto completo pre-aprobado si
// corresponde, o el texto personalizado tal cual lo cargó el cliente.
export function objetoSocialParaMostrar(objetoSocial?: string | null): string {
  return esObjetoPreAprobado(objetoSocial) ? OBJETO_SOCIAL_PREAPROBADO : (objetoSocial || '')
}
