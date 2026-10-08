import { etiquetaPeriodo, moverPeriodo } from '@/lib/comisiones'
import { documentoReporte, indicadores, mensajesClave, notas, seccion } from './diseno'
import { datosGestion, piezasGestion } from './gestion'
import { datosPartes, piezasPartes, type TextosPartes } from './partes'
import { datosWeb, piezasWeb } from './web'

/**
 * Reporte mensual de QuieroMiSAS: un único documento con la gestión del mes
 * (sitio web, comercial, ingresos, operación) y lo que pide la cláusula 5.3
 * del contrato asociativo (distribución, Fondo, costos de MW, novedades).
 */
export async function reporteMensual(periodo: string, textos: TextosPartes, preparadoPor: string) {
  const [gestion, partes, web] = await Promise.all([datosGestion(periodo), datosPartes(periodo), datosWeb(periodo)])
  const mesAnt = etiquetaPeriodo(moverPeriodo(periodo, -1)).split(' ')[0].toLowerCase()

  const g = piezasGestion(gestion)
  const p = piezasPartes(partes, textos)
  const w = piezasWeb(web, periodo, mesAnt)

  const resumen = seccion(
    1,
    'Resumen ejecutivo',
    mensajesClave('Mensajes clave', [...g.claves, ...w.claves, ...p.claves]) + indicadores(g.kpis),
    { bajada: `Lo principal de ${etiquetaPeriodo(periodo).toLowerCase()} en una hoja.` },
  )

  const cuerpo = [
    resumen,
    w.seccion(2),
    g.comercial(3, { nueva: true }),
    g.ingresos(4, p.detalleCobros),
    g.operacion(5),
    p.distribucion(6),
    p.fondo(7),
    p.costosYNovedades(8) +
      notas('Notas metodológicas', [
        ...g.notasMetodo,
        'Las visitas y los clics salen de Google Analytics 4; no cuentan a quien bloquea el seguimiento, así que son un piso.',
        'El bono comercial que MW le paga a Fernando de su propia parte es un acuerdo aparte y no forma parte de este reporte.',
      ]),
  ].join('')

  return documentoReporte({
    titulo: `Reporte mensual · ${etiquetaPeriodo(periodo)}`,
    portada: {
      rotulo: 'Reporte mensual',
      titulo: etiquetaPeriodo(periodo),
      bajada:
        'Sitio web, actividad comercial, ingresos y operación de QuieroMiSAS, con la distribución entre las partes y el Fondo de Desarrollo que pide la cláusula 5.3 del contrato asociativo.',
      datos: [
        ['Preparado por', preparadoPor],
        ['Fecha de emisión', new Date().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'long', year: 'numeric' })],
        ['Destinatarios', 'Partes del contrato asociativo'],
      ],
    },
    cuerpo,
  })
}
