// Constantes compartidas de la aplicación

export const OBJETO_SOCIAL_PREAPROBADO = `La sociedad tiene por objeto realizar por cuenta propia y/o de terceros, o asociadas a terceros en el país o en el extranjero, las siguientes actividades:

1. Construcción de todo tipo de obras, públicas o privadas, edificios, viviendas, locales comerciales y plantas industriales; realizar refacciones, remodelaciones, instalaciones, trabajos de albañilería y/o cualquier trabajo de la construcción.

2. Transporte nacional o internacional de cargas en general, ya sea por vía terrestre, aérea o marítima, con medios de transporte propios o de terceros, pudiendo realizar todo lo inherente a su logística.

3. Compra, venta y permuta, explotación, arrendamientos y administración de bienes inmuebles, urbanos y rurales y la realización de operaciones de propiedad horizontal.

4. Realizar toda clase de operaciones financieras por todos los medios autorizados por la legislación vigente. Se exceptúan las operaciones comprendidas en la Ley de Entidades Financiera.

5. Realizar la explotación directa por sí o por terceros en establecimientos rurales, ganaderos, agrícolas, avícolas, frutícolas, vitivinícolas, forestales, cría, venta y cruza de ganado, explotación de tambos, cultivos, compra, venta y acopio de cereales.

6. Elaboración, producción, transformación y comercialización de productos y subproductos alimenticios de todo tipo, expendio de todo tipo de bebidas, explotación de servicio de catering, de concesiones gastronómicas, bares, restoranes, comedores, organización y logística en eventos sociales.

7. Creación, producción, elaboración, transformación, desarrollo, reparación, implementación, servicio técnico, consultoría, comercialización, distribución, importación y exportación de softwares, equipos informáticos, eléctricos y electrónicos.

8. Producción, organización y explotación de espectáculos públicos y privados, teatrales, musicales, coreográficos, desfiles, exposiciones, ferias, conciertos musicales, recitales, y eventos sociales.

9. Explotación de agencia de viajes y turismo, pudiendo realizar reservas y ventas de pasajes, terrestres, aéreos, marítimos, nacionales o internacionales; organización, reserva y ventas de excursiones, reservas de hotelería, reserva, organización y ventas de charters y traslados, dentro y fuera del país de contingentes.

10. Organización, administración, gerenciamiento y explotación de centros médicos asistenciales, con atención polivalente e integral de medicina, atención clínica, terapéutica y quirúrgica, con o sin internación y demás actividades relacionadas a la salud y servicios de atención médica.

11. Constituir, instalar y comercializar editoriales y gráficas en cualquier soporte.

12. Instalación y explotación de establecimientos destinados a la industrialización, fabricación y elaboración de las materias primas, productos y subproductos relacionados directamente con su objeto social.

13. Importación y exportación de bienes y servicios.

14. Actuar como fiduciante, fiduciaria, beneficiaria, fideicomisaria, por cuenta propia o por cuenta de terceros y/o asociada a terceros, en todo tipo de emprendimientos.`

// Función helper para obtener el texto del objeto social
export function getObjetoSocialTexto(objetoSocial: string | null | undefined): string {
  if (!objetoSocial) return 'No especificado'

  // Si es el valor "PREAPROBADO", devolver el texto completo
  if (objetoSocial === 'PREAPROBADO') {
    return OBJETO_SOCIAL_PREAPROBADO
  }

  // Si ya contiene el texto del objeto social pre-aprobado (de trámites guardados anteriormente)
  if (objetoSocial.includes('La sociedad tiene por objeto realizar')) {
    return objetoSocial
  }

  // Si es personalizado, devolver el texto como está
  return objetoSocial
}
