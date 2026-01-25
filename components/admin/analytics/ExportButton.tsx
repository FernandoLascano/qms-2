'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ExportButtonProps {
  data: any
  filename?: string
}

export function ExportButton({ data, filename = 'reporte' }: ExportButtonProps) {
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)

  const exportToPDF = async () => {
    setExporting('pdf')
    try {
      // Usar la librería de generación de PDFs existente
      const { generarReporteProfesional } = await import('@/lib/analytics/reportGenerator')
      // Extraer periodo y jurisdiccion del filename si están disponibles
      const partes = filename.split('-')
      const periodo = partes.length > 1 ? partes[1] : 'mes'
      const jurisdiccion = partes.length > 2 ? partes[2] : 'todas'
      generarReporteProfesional(data, periodo, jurisdiccion)
      toast.success('Reporte PDF generado exitosamente')
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      toast.error('Error al generar el reporte PDF')
    } finally {
      setExporting(null)
    }
  }

  const exportToExcel = async () => {
    setExporting('excel')
    try {
      // Crear CSV (formato compatible con Excel)
      const csv = generateCSV(data)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Reporte Excel generado exitosamente')
    } catch (error) {
      console.error('Error al exportar Excel:', error)
      toast.error('Error al generar el reporte Excel')
    } finally {
      setExporting(null)
    }
  }

  const generateCSV = (data: any): string => {
    const lines: string[] = []
    
    // Encabezado
    lines.push('Reporte de Analytics - QuieroMiSAS')
    lines.push(`Fecha: ${new Date().toLocaleDateString('es-AR')}`)
    lines.push('')

    // Trámites
    lines.push('TRÁMITES')
    lines.push('Total,En Curso,Completados,Cancelados,Tasa Completitud')
    lines.push([
      data.tramites?.totales || 0,
      data.tramites?.enCurso || 0,
      data.tramites?.completados || 0,
      data.tramites?.cancelados || 0,
      `${data.tramites?.tasaCompletitud || 0}%`
    ].join(','))
    lines.push('')

    // Ingresos
    lines.push('INGRESOS')
    lines.push('Periodo,Pendientes,Cantidad Pagos,Promedio por Trámite')
    lines.push([
      `$${data.ingresos?.periodo?.toLocaleString('es-AR') || 0}`,
      `$${data.ingresos?.pendientes?.toLocaleString('es-AR') || 0}`,
      data.ingresos?.cantidadPagos || 0,
      `$${data.ingresos?.promedioPorTramite?.toLocaleString('es-AR') || 0}`
    ].join(','))
    lines.push('')

    // Tiempos Promedio
    lines.push('TIEMPOS PROMEDIO')
    lines.push('Total (días),Desde Validación (días),Reserva Denominación,Depósito Capital,Firma Estatuto,Inscripción')
    lines.push([
      data.tiemposPromedio?.total?.toFixed(1) || 0,
      data.tiemposPromedio?.desdeValidacion?.toFixed(1) || 0,
      data.tiemposPromedio?.porEtapa?.reservaDenominacion?.toFixed(1) || 0,
      data.tiemposPromedio?.porEtapa?.depositoCapital?.toFixed(1) || 0,
      data.tiemposPromedio?.porEtapa?.firmaEstatuto?.toFixed(1) || 0,
      data.tiemposPromedio?.porEtapa?.inscripcion?.toFixed(1) || 0
    ].join(','))
    lines.push('')

    // Clientes
    lines.push('CLIENTES')
    lines.push('Registrados,Activos,Nuevos,Tasa Registro a Trámite,Tasa Trámite a Completado')
    lines.push([
      data.clientes?.registrados || 0,
      data.clientes?.activos || 0,
      data.clientes?.nuevos || 0,
      data.clientes?.tasaRegistroATramite || '0%',
      data.clientes?.tasaTramiteACompletado || '0%'
    ].join(','))

    return lines.join('\n')
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportToPDF}
        disabled={!!exporting}
        className="gap-2"
      >
        {exporting === 'pdf' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Exportar PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportToExcel}
        disabled={!!exporting}
        className="gap-2"
      >
        {exporting === 'excel' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        Exportar Excel
      </Button>
    </div>
  )
}

