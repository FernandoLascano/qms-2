import { createGa4DataClient, getGa4PropertyResource } from '@/lib/ga4/client'
import { CUENTA_ANALYTICS } from '@/lib/gcp'
import { etiquetaPeriodo, moverPeriodo } from '@/lib/comisiones'
import { cuadro, dosColumnas, esc, grafico, indicadores, mensajesClave, numero, pct, seccion, variacion } from './diseno'
import { barrasVerticales } from './graficos'

/**
 * Tráfico del sitio desde Google Analytics 4 para el reporte mensual: visitas,
 * usuarios, páginas vistas, eventos (clics en WhatsApp, botones, formularios),
 * canales y páginas más vistas, del mes y del anterior.
 *
 * Si GA4 no responde (credencial vencida, sin acceso), el reporte sale igual
 * con la sección marcada «sin datos» y el motivo.
 */

type Fila = Record<string, string | number>

export type DatosWeb =
  | { ok: false; motivo: string }
  | {
      ok: true
      actual: Resumen
      anterior: Resumen
      porDia: { fecha: string; sesiones: number }[]
      canales: { nombre: string; sesiones: number }[]
      fuentes: { nombre: string; sesiones: number }[]
      paginas: { ruta: string; vistas: number }[]
      eventos: { nombre: string; cantidad: number }[]
    }

type Resumen = {
  sesiones: number
  usuarios: number
  nuevos: number
  vistas: number
  interaccion: number // tasa de interacción, 0 a 1
  duracionMedia: number // segundos por sesión
}

function rango(periodo: string) {
  const [y, m] = periodo.split('-').map(Number)
  const fin = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return { startDate: `${periodo}-01`, endDate: `${periodo}-${String(fin).padStart(2, '0')}` }
}

// Eventos automáticos de GA4 que no dicen nada del negocio.
const EVENTOS_RUIDO = new Set(['page_view', 'session_start', 'first_visit', 'user_engagement', 'scroll'])

const CANAL: Record<string, string> = {
  'Organic Search': 'Búsqueda orgánica',
  Direct: 'Directo',
  'Paid Search': 'Búsqueda paga',
  'Organic Social': 'Redes sociales',
  'Paid Social': 'Redes (pago)',
  Referral: 'Otros sitios',
  Email: 'Email',
  Unassigned: 'Sin asignar',
  'Cross-network': 'Campañas de Google',
}

export async function datosWeb(periodo: string): Promise<DatosWeb> {
  const c = createGa4DataClient()
  if (!c.ok) return { ok: false, motivo: c.error }
  const p = getGa4PropertyResource()
  if (!p.ok) return { ok: false, motivo: p.error }

  const property = p.property
  const mes = [rango(periodo)]
  const metricasResumen = [
    { name: 'sessions' },
    { name: 'activeUsers' },
    { name: 'newUsers' },
    { name: 'screenPageViews' },
    { name: 'engagementRate' },
    { name: 'averageSessionDuration' },
  ]
  const filas = (r: { rows?: { dimensionValues?: { value?: string | null }[] | null; metricValues?: { value?: string | null }[] | null }[] | null }): Fila[] =>
    (r.rows ?? []).map((row) => {
      const o: Fila = {}
      row.dimensionValues?.forEach((d, i) => (o[`d${i}`] = d.value ?? ''))
      row.metricValues?.forEach((m, i) => (o[`m${i}`] = Number(m.value ?? 0) || 0))
      return o
    })
  const resumen = (f: Fila | undefined): Resumen => ({
    sesiones: Number(f?.m0 ?? 0),
    usuarios: Number(f?.m1 ?? 0),
    nuevos: Number(f?.m2 ?? 0),
    vistas: Number(f?.m3 ?? 0),
    interaccion: Number(f?.m4 ?? 0),
    duracionMedia: Number(f?.m5 ?? 0),
  })

  try {
    const [[act], [ant], [dias], [canales], [fuentes], [paginas], [eventos]] = await Promise.all([
      c.client.runReport({ property, dateRanges: mes, metrics: metricasResumen }),
      c.client.runReport({ property, dateRanges: [rango(moverPeriodo(periodo, -1))], metrics: metricasResumen }),
      c.client.runReport({ property, dateRanges: mes, dimensions: [{ name: 'date' }], metrics: [{ name: 'sessions' }], orderBys: [{ dimension: { dimensionName: 'date' } }] }),
      c.client.runReport({ property, dateRanges: mes, dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 8 }),
      c.client.runReport({ property, dateRanges: mes, dimensions: [{ name: 'sessionSourceMedium' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 8 }),
      c.client.runReport({ property, dateRanges: mes, dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 10 }),
      c.client.runReport({ property, dateRanges: mes, dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }], orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }], limit: 30 }),
    ])
    return {
      ok: true,
      actual: resumen(filas(act)[0]),
      anterior: resumen(filas(ant)[0]),
      porDia: filas(dias).map((f) => ({ fecha: String(f.d0), sesiones: Number(f.m0) })),
      canales: filas(canales).map((f) => ({ nombre: CANAL[String(f.d0)] ?? String(f.d0), sesiones: Number(f.m0) })),
      fuentes: filas(fuentes).map((f) => ({ nombre: String(f.d0), sesiones: Number(f.m0) })),
      paginas: filas(paginas).map((f) => ({ ruta: String(f.d0), vistas: Number(f.m0) })),
      eventos: filas(eventos)
        .filter((f) => !EVENTOS_RUIDO.has(String(f.d0)))
        .slice(0, 10)
        .map((f) => ({ nombre: String(f.d0), cantidad: Number(f.m0) })),
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[reporte] Google Analytics no respondió:', msg)
    return {
      ok: false,
      motivo: /invalid_grant/.test(msg)
        ? 'la autorización de Google Analytics venció y hay que renovarla'
        : /PERMISSION_DENIED|permission/i.test(msg)
          ? `falta darle acceso de Lector en Google Analytics a ${CUENTA_ANALYTICS}`
          : 'Google Analytics no respondió',
    }
  }
}

/* ───────────────────────── Sección del reporte ───────────────────────── */

// Nombres de eventos de GA4 en criollo. Los que no están acá se muestran tal cual.
const EVENTO: Record<string, string> = {
  click: 'Clics a sitios externos (incluye WhatsApp)',
  whatsapp_click: 'Clics en WhatsApp',
  click_whatsapp: 'Clics en WhatsApp',
  generate_lead: 'Consultas enviadas',
  form_submit: 'Formularios enviados',
  form_start: 'Formularios empezados',
  sign_up: 'Registros',
  login: 'Inicios de sesión',
  begin_checkout: 'Inicios de pago',
  purchase: 'Pagos',
  file_download: 'Descargas de archivos',
  view_search_results: 'Búsquedas en el sitio',
  video_start: 'Videos reproducidos',
}

const duracion = (seg: number) => {
  if (!seg) return '—'
  const m = Math.floor(seg / 60)
  const s = Math.round(seg % 60)
  return m ? `${m} min ${s} s` : `${s} s`
}

export function piezasWeb(d: DatosWeb, periodo: string, mesAnt: string) {
  if (!d.ok) {
    return {
      claves: [] as string[],
      seccion: (n: number) =>
        seccion(
          n,
          'Sitio web',
          mensajesClave('Sin datos de Google Analytics', [`No se pudieron traer las visitas del mes: ${esc(d.motivo)}.`]),
          { bajada: 'Visitas, clics y de dónde llega la gente al sitio.' },
        ),
    }
  }
  const a = d.actual
  const claves = [
    `El sitio recibió <strong>${numero(a.sesiones)} visitas</strong> de ${numero(a.usuarios)} personas (${numero(a.nuevos)} nuevas)${
      variacion(a.sesiones, d.anterior.sesiones) != null ? `, ${variacion(a.sesiones, d.anterior.sesiones)! >= 0 ? '+' : '−'}${pct(Math.abs(variacion(a.sesiones, d.anterior.sesiones)!))} contra ${mesAnt}` : ''
    }.`,
    d.canales[0] ? `El canal principal fue <strong>${esc(d.canales[0].nombre.toLowerCase())}</strong> (${pct(a.sesiones ? (d.canales[0].sesiones / a.sesiones) * 100 : 0)} de las visitas).` : '',
  ].filter(Boolean)

  const dia = (f: string) => String(Number(f.slice(6, 8)))
  const html = (n: number) =>
    seccion(
      n,
      'Sitio web',
      indicadores([
        { valor: numero(a.sesiones), etiqueta: 'Visitas', delta: variacion(a.sesiones, d.anterior.sesiones), nota: `vs. ${mesAnt}` },
        { valor: numero(a.usuarios), etiqueta: 'Personas', delta: variacion(a.usuarios, d.anterior.usuarios), nota: `${numero(a.nuevos)} nuevas` },
        { valor: numero(a.vistas), etiqueta: 'Páginas vistas', delta: variacion(a.vistas, d.anterior.vistas), nota: `vs. ${mesAnt}` },
        { valor: pct(a.interaccion * 100), etiqueta: 'Visitas con interacción', nota: `${duracion(a.duracionMedia)} por visita` },
      ]) +
        grafico({
          titulo: `Visitas por día, ${etiquetaPeriodo(periodo).toLowerCase()}`,
          svg: barrasVerticales({
            datos: d.porDia.map((x, i) => ({ etiqueta: i % 5 === 0 ? dia(x.fecha) : '', valor: x.sesiones })),
            formato: numero,
            valores: false,
            alto: 170,
          }),
          fuente: 'Fuente: Google Analytics 4. Una visita es una sesión: alguien que entra al sitio, aunque vea varias páginas.',
        }) +
        dosColumnas(
          cuadro({
            titulo: 'De dónde llegan las visitas',
            columnas: [{ titulo: 'Canal' }, { titulo: 'Visitas', num: true, ancho: '24%' }, { titulo: '%', num: true, ancho: '16%' }],
            filas: d.canales.map((c) => [esc(c.nombre), c.sesiones, pct(a.sesiones ? (c.sesiones / a.sesiones) * 100 : 0)]),
            vacio: 'Sin visitas en el mes.',
          }),
          cuadro({
            titulo: 'Clics y acciones en el sitio',
            columnas: [{ titulo: 'Acción' }, { titulo: 'Veces', num: true, ancho: '24%' }],
            filas: d.eventos.map((e) => [esc(EVENTO[e.nombre] ?? e.nombre), e.cantidad]),
            vacio: 'Sin acciones medidas en el mes.',
            fuente: 'Eventos de Google Analytics, sin los automáticos (vistas, scroll, inicio de visita).',
          }),
        ) +
        dosColumnas(
          cuadro({
            titulo: 'Páginas más vistas',
            columnas: [{ titulo: 'Página' }, { titulo: 'Vistas', num: true, ancho: '24%' }],
            filas: d.paginas.map((x) => [esc(x.ruta), x.vistas]),
            vacio: 'Sin páginas vistas en el mes.',
          }),
          cuadro({
            titulo: 'Fuentes principales',
            columnas: [{ titulo: 'Fuente / medio' }, { titulo: 'Visitas', num: true, ancho: '24%' }],
            filas: d.fuentes.map((x) => [esc(x.nombre), x.sesiones]),
            vacio: 'Sin visitas en el mes.',
          }),
        ),
      { nueva: true, bajada: 'Visitas, clics y de dónde llega la gente al sitio.' },
    )
  return { claves, seccion: html }
}
