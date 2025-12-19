import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AnalyticsData {
  tramites: {
    totales: number
    enCurso: number
    completados: number
    cancelados: number
    periodo: number
    porMes: Array<{ mes: string; cantidad: number }>
    porJurisdiccion: Array<{ jurisdiccion: string; _count: number }>
    tasaCompletitud: string
  }
  ingresos: {
    periodo: number
    pendientes: number
    cantidadPagos: number
    promedioPorTramite: number
    porMes: Array<{ mes: string; ingresos: number }>
  }
  comparativas: {
    tramites: { actual: number; anterior: number; cambio: number; esPositivo: boolean }
    ingresos: { actual: number; anterior: number; cambio: number; esPositivo: boolean }
    clientes: { actual: number; anterior: number; cambio: number; esPositivo: boolean }
  }
  tiemposPromedio: {
    total: number
    porEtapa: {
      reservaDenominacion: number
      depositoCapital: number
      firmaEstatuto: number
      inscripcion: number
    }
  }
  clientes: {
    registrados: number
    activos: number
    nuevos: number
    tasaRegistroATramite: string
    tasaTramiteACompletado: string
  }
  documentos: {
    totales: number
    aprobados: number
    rechazados: number
    pendientes: number
    tasaAprobacion: string
  }
  alertas: Array<{ tipo: 'warning' | 'info' | 'success'; mensaje: string; valor?: number }>
  ultimosTramites: Array<any>
}

// Colores exactos del dashboard (Tailwind)
const C = {
  primary: [220, 38, 38],
  success: [34, 197, 94],
  blue: [59, 130, 246],
  purple: [168, 85, 247],
  orange: [249, 115, 22],
  yellow: [234, 179, 8],
  gray: [75, 85, 99],
  grayMedium: [107, 114, 128],
  grayLight: [229, 231, 235],
  grayVeryLight: [249, 250, 251],
  white: [255, 255, 255],
  dark: [17, 24, 39]
}

// Sombra estilo shadow-md del dashboard
const drawShadow = (doc: jsPDF, x: number, y: number, w: number, h: number, r: number = 3) => {
  doc.setFillColor(0, 0, 0)
  // @ts-ignore - jsPDF GState types are not fully compatible
  doc.setGState(new (doc as any).GState({ opacity: 0.03 }))
  doc.roundedRect(x + 1, y + 2, w, h, r, r, 'F')
  // @ts-ignore - jsPDF GState types are not fully compatible
  doc.setGState(new (doc as any).GState({ opacity: 0.05 }))
  doc.roundedRect(x + 0.5, y + 1, w, h, r, r, 'F')
  // @ts-ignore - jsPDF GState types are not fully compatible
  doc.setGState(new (doc as any).GState({ opacity: 1 }))
}

// Dibuja icono usando formas geometricas
const drawIcon = (doc: jsPDF, x: number, y: number, size: number, type: string, color: number[]) => {
  doc.setDrawColor(color[0], color[1], color[2])
  doc.setFillColor(color[0], color[1], color[2])
  doc.setLineWidth(0.5)

  switch (type) {
    case 'file':
      doc.roundedRect(x, y, size, size * 1.2, 1, 1, 'S')
      doc.line(x + size * 0.2, y + size * 0.3, x + size * 0.8, y + size * 0.3)
      doc.line(x + size * 0.2, y + size * 0.5, x + size * 0.8, y + size * 0.5)
      doc.line(x + size * 0.2, y + size * 0.7, x + size * 0.6, y + size * 0.7)
      break
    case 'users':
      doc.circle(x + size * 0.35, y + size * 0.3, size * 0.2, 'S')
      doc.circle(x + size * 0.65, y + size * 0.3, size * 0.2, 'S')
      doc.ellipse(x + size * 0.35, y + size * 0.7, size * 0.25, size * 0.2, 'S')
      doc.ellipse(x + size * 0.65, y + size * 0.7, size * 0.25, size * 0.2, 'S')
      break
    case 'dollar':
      doc.setLineWidth(0.8)
      doc.line(x + size * 0.5, y, x + size * 0.5, y + size)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(size * 1.5)
      doc.text('$', x + size * 0.25, y + size * 0.7)
      break
    case 'check':
      doc.circle(x + size * 0.5, y + size * 0.5, size * 0.4, 'S')
      doc.setLineWidth(0.7)
      doc.line(x + size * 0.25, y + size * 0.5, x + size * 0.4, y + size * 0.65)
      doc.line(x + size * 0.4, y + size * 0.65, x + size * 0.75, y + size * 0.35)
      break
    case 'clock':
      doc.circle(x + size * 0.5, y + size * 0.5, size * 0.4, 'S')
      doc.line(x + size * 0.5, y + size * 0.5, x + size * 0.5, y + size * 0.25)
      doc.line(x + size * 0.5, y + size * 0.5, x + size * 0.7, y + size * 0.5)
      break
    case 'trending':
      doc.setLineWidth(0.6)
      doc.line(x, y + size * 0.8, x + size * 0.3, y + size * 0.5)
      doc.line(x + size * 0.3, y + size * 0.5, x + size * 0.6, y + size * 0.6)
      doc.line(x + size * 0.6, y + size * 0.6, x + size, y + size * 0.2)
      doc.line(x + size, y + size * 0.2, x + size * 0.85, y + size * 0.2)
      doc.line(x + size, y + size * 0.2, x + size, y + size * 0.35)
      break
  }
}

// Card de metrica estilo dashboard
const drawCard = (
  doc: jsPDF, x: number, y: number, w: number, h: number,
  value: string, title: string, subtitle: string, icon: string, color: number[]
) => {
  drawShadow(doc, x, y, w, h)
  doc.setFillColor(...C.white)
  doc.roundedRect(x, y, w, h, 3, 3, 'F')
  doc.setDrawColor(...C.grayLight)
  doc.setLineWidth(0.2)
  doc.roundedRect(x, y, w, h, 3, 3, 'S')

  // Icono con fondo de color
  doc.setFillColor(...color)
  doc.setGState(new doc.GState({ opacity: 0.1 }))
  doc.circle(x + 11, y + 13, 5, 'F')
  doc.setGState(new doc.GState({ opacity: 1 }))
  drawIcon(doc, x + 8, y + 10, 6, icon, color)

  // Titulo
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...C.grayMedium)
  doc.text(title, x + 6, y + 24)

  // Valor
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...C.dark)
  doc.text(value, x + 6, y + 34)

  // Subtitulo
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...C.grayMedium)
  doc.text(subtitle, x + 6, y + h - 5)
}

// Grafico de lineas
const drawLineChart = (
  doc: jsPDF, x: number, y: number, w: number, h: number,
  data: number[], labels: string[], color: number[], title: string
) => {
  drawShadow(doc, x, y, w, h)
  doc.setFillColor(...C.white)
  doc.roundedRect(x, y, w, h, 3, 3, 'F')
  doc.setDrawColor(...C.grayLight)
  doc.setLineWidth(0.2)
  doc.roundedRect(x, y, w, h, 3, 3, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...C.dark)
  doc.text(title, x + 6, y + 8)

  if (data.length === 0) return

  const cx = x + 12, cy = y + 18, cw = w - 22, ch = h - 30
  const max = Math.max(...data)

  // Grid
  doc.setDrawColor(...C.grayLight)
  doc.setLineWidth(0.2)
  for (let i = 0; i <= 4; i++) {
    const gy = cy + (ch / 4) * i
    doc.line(cx, gy, cx + cw, gy)
    doc.setFontSize(7)
    doc.setTextColor(...C.grayMedium)
    const val = max - (max / 4) * i
    doc.text(Math.round(val).toString(), cx - 5, gy + 1, { align: 'right' })
  }

  // Linea
  doc.setLineWidth(2)
  doc.setDrawColor(...color)
  const points: Array<[number, number]> = data.map((val, i) => [
    cx + (cw / (data.length - 1)) * i,
    cy + ch - (val / max) * ch
  ])
  for (let i = 0; i < points.length - 1; i++) {
    doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1])
  }

  // Puntos
  points.forEach(([px, py], i) => {
    doc.setFillColor(...color)
    doc.circle(px, py, 2, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...C.dark)
    doc.text(data[i].toString(), px, py - 3, { align: 'center' })
  })

  // Labels
  labels.forEach((label, i) => {
    const px = cx + (cw / (data.length - 1)) * i
    doc.setFontSize(7)
    doc.setTextColor(...C.grayMedium)
    doc.text(label, px, cy + ch + 5, { align: 'center' })
  })
}

// Grafico de torta (pie)
const drawPieChart = (
  doc: jsPDF, x: number, y: number, w: number, h: number,
  data: Array<{ label: string; value: number; color: number[] }>, title: string
) => {
  drawShadow(doc, x, y, w, h)
  doc.setFillColor(...C.white)
  doc.roundedRect(x, y, w, h, 3, 3, 'F')
  doc.setDrawColor(...C.grayLight)
  doc.setLineWidth(0.2)
  doc.roundedRect(x, y, w, h, 3, 3, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...C.dark)
  doc.text(title, x + 6, y + 8)

  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return

  const cx = x + w / 2, cy = y + h / 2 + 5, r = Math.min(w, h) / 3.5
  let angle = -Math.PI / 2

  data.forEach((item) => {
    const a = (item.value / total) * Math.PI * 2
    doc.setFillColor(...item.color)
    for (let i = 0; i < 30; i++) {
      const a1 = angle + (a * i) / 30
      const a2 = angle + (a * (i + 1)) / 30
      doc.triangle(cx, cy, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r,
        cx + Math.cos(a2) * r, cy + Math.sin(a2) * r, 'F')
    }
    doc.setDrawColor(...C.white)
    doc.setLineWidth(1)
    doc.line(cx, cy, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
    angle += a
  })

  doc.setDrawColor(...C.grayLight)
  doc.setLineWidth(0.3)
  doc.circle(cx, cy, r, 'S')

  // Leyenda
  let ly = y + h - data.length * 5.5
  data.forEach((item) => {
    const pct = ((item.value / total) * 100).toFixed(0)
    doc.setFillColor(...item.color)
    doc.roundedRect(x + 6, ly - 2.5, 3, 3, 0.5, 0.5, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.grayMedium)
    doc.text(item.label, x + 11, ly)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.dark)
    doc.text(`${pct}%`, x + w - 12, ly)
    ly += 5
  })
}

// Grafico de dona (donut)
const drawDonutChart = (
  doc: jsPDF, x: number, y: number, w: number, h: number,
  data: Array<{ label: string; value: number; color: number[] }>, title: string
) => {
  drawShadow(doc, x, y, w, h)
  doc.setFillColor(...C.white)
  doc.roundedRect(x, y, w, h, 3, 3, 'F')
  doc.setDrawColor(...C.grayLight)
  doc.setLineWidth(0.2)
  doc.roundedRect(x, y, w, h, 3, 3, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...C.dark)
  doc.text(title, x + 6, y + 8)

  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return

  const cx = x + w / 2, cy = y + h / 2 + 3, r = Math.min(w, h) / 3.5, ir = r * 0.65
  let angle = -Math.PI / 2

  data.forEach((item) => {
    const a = (item.value / total) * Math.PI * 2
    doc.setFillColor(...item.color)
    for (let i = 0; i < 30; i++) {
      const a1 = angle + (a * i) / 30
      const a2 = angle + (a * (i + 1)) / 30
      const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r
      const x2 = cx + Math.cos(a2) * r, y2 = cy + Math.sin(a2) * r
      const x3 = cx + Math.cos(a2) * ir, y3 = cy + Math.sin(a2) * ir
      const x4 = cx + Math.cos(a1) * ir, y4 = cy + Math.sin(a1) * ir
      doc.triangle(x1, y1, x2, y2, x3, y3, 'F')
      doc.triangle(x1, y1, x3, y3, x4, y4, 'F')
    }
    angle += a
  })

  doc.setFillColor(...C.white)
  doc.circle(cx, cy, ir, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...C.dark)
  doc.text(total.toString(), cx, cy + 1, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(...C.grayMedium)
  doc.text('Total', cx, cy + 6, { align: 'center' })

  // Leyenda
  let ly = y + h - data.length * 5.5
  data.forEach((item) => {
    const pct = ((item.value / total) * 100).toFixed(0)
    doc.setFillColor(...item.color)
    doc.roundedRect(x + 6, ly - 2.5, 3, 3, 0.5, 0.5, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.grayMedium)
    doc.text(item.label, x + 11, ly)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.dark)
    doc.text(`${pct}%`, x + w - 12, ly)
    ly += 5
  })
}

// Grafico de barras horizontales
const drawBarChart = (
  doc: jsPDF, x: number, y: number, w: number, h: number,
  data: Array<{ label: string; value: number; max: number; color: number[] }>, title: string
) => {
  drawShadow(doc, x, y, w, h)
  doc.setFillColor(...C.white)
  doc.roundedRect(x, y, w, h, 3, 3, 'F')
  doc.setDrawColor(...C.grayLight)
  doc.setLineWidth(0.2)
  doc.roundedRect(x, y, w, h, 3, 3, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...C.dark)
  doc.text(title, x + 6, y + 8)

  let cy = y + 18
  const bh = 7, lw = 45, bw = w - lw - 25

  data.forEach((item) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...C.grayMedium)
    doc.text(item.label, x + 6, cy)

    doc.setFillColor(...C.grayVeryLight)
    doc.roundedRect(x + lw, cy - 4, bw, bh, 2, 2, 'F')

    const barW = (bw * item.value) / item.max
    doc.setFillColor(...item.color)
    doc.roundedRect(x + lw, cy - 4, barW, bh, 2, 2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...C.dark)
    doc.text(`${item.value}d`, x + lw + bw + 3, cy)

    cy += 12
  })
}

// Grafico de Gantt
const drawGanttChart = (
  doc: jsPDF, x: number, y: number, w: number, h: number, title: string, data: AnalyticsData
) => {
  drawShadow(doc, x, y, w, h)
  doc.setFillColor(...C.white)
  doc.roundedRect(x, y, w, h, 3, 3, 'F')
  doc.setDrawColor(...C.grayLight)
  doc.setLineWidth(0.2)
  doc.roundedRect(x, y, w, h, 3, 3, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...C.dark)
  doc.text(title, x + 6, y + 8)

  const etapas = [
    { nombre: 'Reserva', duracion: data.tiemposPromedio.porEtapa.reservaDenominacion, color: C.blue },
    { nombre: 'Deposito', duracion: data.tiemposPromedio.porEtapa.depositoCapital, color: C.purple },
    { nombre: 'Firma', duracion: data.tiemposPromedio.porEtapa.firmaEstatuto, color: C.orange },
    { nombre: 'Inscripcion', duracion: data.tiemposPromedio.porEtapa.inscripcion, color: C.success }
  ]

  const total = etapas.reduce((sum, e) => sum + e.duracion, 0)
  const cx = x + 6, cy = y + 18, cw = w - 12, rh = 11

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...C.grayMedium)
  doc.text('Dia 0', cx, cy - 3)
  doc.text(`Dia ${total}`, cx + cw - 10, cy - 3)

  doc.setDrawColor(...C.grayLight)
  doc.setLineWidth(0.2)
  for (let i = 0; i <= 4; i++) {
    doc.line(cx + (cw * i) / 4, cy, cx + (cw * i) / 4, cy + etapas.length * rh)
  }

  let currentY = cy + 2, acum = 0
  etapas.forEach((etapa) => {
    const start = cx + (cw * acum) / total
    const width = (cw * etapa.duracion) / total

    doc.setFillColor(...etapa.color)
    doc.roundedRect(start, currentY, width, 6, 1.5, 1.5, 'F')

    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.text(`${etapa.nombre} (${etapa.duracion}d)`, start + 2, currentY + 4)

    acum += etapa.duracion
    currentY += rh
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C.dark)
  doc.text(`Total: ${total} dias promedio`, cx, currentY + 8)
}

export const generarReporteProfesional = (data: AnalyticsData, periodo: string, jurisdiccion: string) => {
  const doc = new jsPDF()

  // ==================== PORTADA ====================
  doc.setFillColor(...C.grayVeryLight)
  doc.rect(0, 0, 210, 297, 'F')

  doc.setTextColor(...C.dark)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(38)
  doc.text('Analytics Dashboard', 105, 60, { align: 'center' })

  doc.setFontSize(16)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.grayMedium)
  doc.text('Reporte Profesional de Metricas', 105, 73, { align: 'center' })

  // Card info
  drawShadow(doc, 40, 90, 130, 40, 4)
  doc.setFillColor(...C.white)
  doc.roundedRect(40, 90, 130, 40, 4, 4, 'F')

  const fecha = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...C.dark)
  doc.text('QuieroMiSAS', 105, 102, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C.grayMedium)
  doc.text(fecha, 105, 110, { align: 'center' })
  doc.text(`Periodo: ${periodo.toUpperCase()}`, 105, 117, { align: 'center' })
  doc.text(`Jurisdiccion: ${jurisdiccion.toUpperCase()}`, 105, 124, { align: 'center' })

  // Grid metricas portada (2x2)
  const cw = 45, ch = 38, sp = 5, sx = 15, sy = 150

  drawCard(doc, sx, sy, cw, ch,
    data.tramites.totales.toString(), 'Tramites Totales',
    `${data.tramites.enCurso} en curso`, 'file', C.primary)

  drawCard(doc, sx + cw + sp, sy, cw, ch,
    data.tramites.completados.toString(), 'Completados',
    `${data.tramites.tasaCompletitud}% tasa`, 'check', C.success)

  drawCard(doc, sx + (cw + sp) * 2, sy, cw, ch,
    `$${(data.ingresos.periodo / 1000).toFixed(0)}K`, 'Ingresos',
    `${data.ingresos.cantidadPagos} pagos`, 'dollar', C.blue)

  drawCard(doc, sx + (cw + sp) * 3, sy, cw, ch,
    data.clientes.registrados.toString(), 'Usuarios',
    `${data.clientes.nuevos} nuevos`, 'users', C.purple)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...C.grayMedium)
  doc.text('Reporte generado automaticamente', 105, 280, { align: 'center' })
  doc.text(`QuieroMiSAS © ${new Date().getFullYear()}`, 105, 285, { align: 'center' })

  // ==================== PAGINA 2: METRICAS Y COMPARATIVAS ====================
  doc.addPage()
  doc.setFillColor(...C.grayVeryLight)
  doc.rect(0, 0, 210, 297, 'F')

  let y = 15

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...C.dark)
  doc.text('Metricas Clave', 15, y)

  y += 3
  doc.setDrawColor(...C.grayLight)
  doc.setLineWidth(0.5)
  doc.line(15, y, 195, y)

  y += 10

  // Grid 2x4 de metricas secundarias
  drawCard(doc, 15, y, 45, 38,
    data.tramites.periodo.toString(), 'Tramites Periodo',
    'Nuevos iniciados', 'trending', C.yellow)

  drawCard(doc, 65, y, 45, 38,
    `$${(data.ingresos.promedioPorTramite / 1000).toFixed(0)}K`, 'Valor Promedio',
    'Por tramite', 'dollar', C.success)

  drawCard(doc, 115, y, 45, 38,
    data.documentos.pendientes.toString(), 'Documentos',
    `${data.documentos.tasaAprobacion}% aprobados`, 'file', C.yellow)

  drawCard(doc, 165, y, 45, 38,
    `$${(data.ingresos.pendientes / 1000).toFixed(0)}K`, 'Pendientes',
    'Por cobrar', 'clock', C.primary)

  y += 45

  drawCard(doc, 15, y, 45, 38,
    data.clientes.activos.toString(), 'Clientes Activos',
    'Con tramites', 'users', C.blue)

  drawCard(doc, 65, y, 45, 38,
    `${data.clientes.tasaRegistroATramite}%`, 'Conversion',
    'Registro a Tramite', 'trending', C.purple)

  drawCard(doc, 115, y, 45, 38,
    `${data.clientes.tasaTramiteACompletado}%`, 'Completitud',
    'Tramite a Fin', 'check', C.success)

  drawCard(doc, 165, y, 45, 38,
    `${data.tiemposPromedio.total}d`, 'Tiempo Promedio',
    'Total proceso', 'clock', C.orange)

  y += 50

  // Titulo comparativas
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...C.dark)
  doc.text('Comparativa Mensual', 15, y)

  y += 8

  // Tabla comparativa
  autoTable(doc, {
    startY: y,
    head: [['Metrica', 'Actual', 'Anterior', 'Cambio']],
    body: [
      [
        'Tramites',
        data.comparativas.tramites.actual.toString(),
        data.comparativas.tramites.anterior.toString(),
        {
          content: `${data.comparativas.tramites.cambio > 0 ? '+' : ''}${data.comparativas.tramites.cambio.toFixed(1)}%`,
          styles: { textColor: data.comparativas.tramites.esPositivo ? C.success : C.primary, fontStyle: 'bold' }
        }
      ],
      [
        'Ingresos',
        `$${(data.comparativas.ingresos.actual / 1000).toFixed(0)}K`,
        `$${(data.comparativas.ingresos.anterior / 1000).toFixed(0)}K`,
        {
          content: `${data.comparativas.ingresos.cambio > 0 ? '+' : ''}${data.comparativas.ingresos.cambio.toFixed(1)}%`,
          styles: { textColor: data.comparativas.ingresos.esPositivo ? C.success : C.primary, fontStyle: 'bold' }
        }
      ],
      [
        'Clientes',
        data.comparativas.clientes.actual.toString(),
        data.comparativas.clientes.anterior.toString(),
        {
          content: `${data.comparativas.clientes.cambio > 0 ? '+' : ''}${data.comparativas.clientes.cambio.toFixed(1)}%`,
          styles: { textColor: data.comparativas.clientes.esPositivo ? C.success : C.primary, fontStyle: 'bold' }
        }
      ]
    ],
    theme: 'striped',
    headStyles: { fillColor: C.dark, textColor: C.white, fontStyle: 'bold', fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 4 },
    alternateRowStyles: { fillColor: C.grayVeryLight }
  })

  // ==================== PAGINA 3: GRAFICOS ====================
  doc.addPage()
  doc.setFillColor(...C.grayVeryLight)
  doc.rect(0, 0, 210, 297, 'F')

  y = 15

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...C.dark)
  doc.text('Analisis Visual', 15, y)

  y += 3
  doc.setDrawColor(...C.grayLight)
  doc.setLineWidth(0.5)
  doc.line(15, y, 195, y)

  y += 10

  // Graficos de linea (2 en fila)
  const tramitesData = data.tramites.porMes.slice(-6).map(m => m.cantidad)
  const tramitesLabels = data.tramites.porMes.slice(-6).map(m => m.mes.substring(0, 3))
  drawLineChart(doc, 15, y, 90, 60, tramitesData, tramitesLabels, C.primary, 'Tramites por Mes')

  const ingresosData = data.ingresos.porMes.slice(-6).map(m => Math.round(m.ingresos / 1000))
  const ingresosLabels = data.ingresos.porMes.slice(-6).map(m => m.mes.substring(0, 3))
  drawLineChart(doc, 110, y, 90, 60, ingresosData, ingresosLabels, C.blue, 'Ingresos por Mes ($K)')

  y += 70

  // Graficos de torta y dona (2 en fila)
  const estadosData = [
    { label: 'En Curso', value: data.tramites.enCurso, color: C.blue },
    { label: 'Completados', value: data.tramites.completados, color: C.success },
    { label: 'Cancelados', value: data.tramites.cancelados, color: C.primary }
  ]
  drawPieChart(doc, 15, y, 90, 70, estadosData, 'Estados de Tramites')

  const docsData = [
    { label: 'Aprobados', value: data.documentos.aprobados, color: C.success },
    { label: 'Pendientes', value: data.documentos.pendientes, color: C.yellow },
    { label: 'Rechazados', value: data.documentos.rechazados, color: C.primary }
  ]
  drawDonutChart(doc, 110, y, 90, 70, docsData, 'Estado de Documentos')

  y += 80

  // Grafico de barras de tiempos
  const tiemposData = [
    {
      label: 'Reserva',
      value: data.tiemposPromedio.porEtapa.reservaDenominacion,
      max: 10,
      color: data.tiemposPromedio.porEtapa.reservaDenominacion <= 5 ? C.success : C.orange
    },
    {
      label: 'Deposito',
      value: data.tiemposPromedio.porEtapa.depositoCapital,
      max: 7,
      color: data.tiemposPromedio.porEtapa.depositoCapital <= 3 ? C.success : C.orange
    },
    {
      label: 'Firma',
      value: data.tiemposPromedio.porEtapa.firmaEstatuto,
      max: 10,
      color: data.tiemposPromedio.porEtapa.firmaEstatuto <= 7 ? C.success : C.orange
    },
    {
      label: 'Inscripcion',
      value: data.tiemposPromedio.porEtapa.inscripcion,
      max: 15,
      color: data.tiemposPromedio.porEtapa.inscripcion <= 10 ? C.success : C.orange
    }
  ]
  drawBarChart(doc, 15, y, 90, 60, tiemposData, 'Tiempos por Etapa')

  // Grafico Gantt
  drawGanttChart(doc, 110, y, 90, 60, 'Timeline del Proceso', data)

  // ==================== PAGINA 4: RESUMEN Y RECOMENDACIONES ====================
  doc.addPage()
  doc.setFillColor(...C.grayVeryLight)
  doc.rect(0, 0, 210, 297, 'F')

  y = 15

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...C.dark)
  doc.text('Resumen Ejecutivo', 15, y)

  y += 3
  doc.setDrawColor(...C.grayLight)
  doc.setLineWidth(0.5)
  doc.line(15, y, 195, y)

  y += 15

  // Card de resumen principal
  drawShadow(doc, 15, y, 180, 50, 4)
  doc.setFillColor(...C.white)
  doc.roundedRect(15, y, 180, 50, 4, 4, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...C.dark)
  doc.text('Resumen del Periodo', 25, y + 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C.grayMedium)
  const resumen = `Durante este periodo se procesaron ${data.tramites.totales} tramites en total, de los cuales ${data.tramites.completados} fueron completados exitosamente (${data.tramites.tasaCompletitud}% de tasa de completitud). Se generaron ingresos por $${(data.ingresos.periodo / 1000).toFixed(0)}K a traves de ${data.ingresos.cantidadPagos} pagos procesados. El tiempo promedio del proceso completo fue de ${data.tiemposPromedio.total} dias.`

  const lines = doc.splitTextToSize(resumen, 160)
  lines.forEach((line: string, i: number) => {
    doc.text(line, 25, y + 20 + (i * 6))
  })

  y += 60

  // Recomendaciones
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...C.dark)
  doc.text('Recomendaciones Estrategicas', 15, y)

  y += 10

  const tasaReg = parseFloat(data.clientes.tasaRegistroATramite)
  const tasaComp = parseFloat(data.clientes.tasaTramiteACompletado)

  const recs: string[] = []
  if (tasaReg < 40) recs.push(`Mejorar conversion: Solo ${tasaReg.toFixed(1)}% de usuarios inician tramites`)
  if (tasaComp < 60) recs.push(`Reducir abandono: ${(100 - tasaComp).toFixed(1)}% no completan el proceso`)
  if (data.tiemposPromedio.total > 45) recs.push(`Optimizar tiempos: ${data.tiemposPromedio.total} dias excede el objetivo`)
  if (data.comparativas.tramites.esPositivo) recs.push('Aprovechar tendencia positiva con campanas de marketing')
  if (recs.length === 0) recs.push('Performance optima - Mantener estrategia actual')

  recs.forEach((rec, i) => {
    drawShadow(doc, 20, y, 170, 15, 3)
    doc.setFillColor(...C.white)
    doc.roundedRect(20, y, 170, 15, 3, 3, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...C.dark)
    doc.text(`${i + 1}. ${rec}`, 27, y + 9)

    y += 20
  })

  // Footer
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...C.grayMedium)
  doc.text('QuieroMiSAS Analytics Engine - Reporte Generado Automaticamente', 105, 285, { align: 'center' })
  doc.text(`© ${new Date().getFullYear()} QuieroMiSAS - Datos en tiempo real`, 105, 290, { align: 'center' })

  const fileName = `QuieroMiSAS_Analytics_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`
  doc.save(fileName)
}
