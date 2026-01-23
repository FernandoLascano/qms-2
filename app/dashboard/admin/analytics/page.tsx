'use client'

import { useEffect, useState } from 'react'
import { 
  FileText, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  FileCheck,
  Download
} from 'lucide-react'
import { MetricCard } from '@/components/admin/analytics/MetricCard'
import { TramitesPorMesChart } from '@/components/admin/analytics/TramitesPorMesChart'
import { EstadosTramitesChart } from '@/components/admin/analytics/EstadosTramitesChart'
import { ConversionFunnel } from '@/components/admin/analytics/ConversionFunnel'
import { AlertasPanel } from '@/components/admin/analytics/AlertasPanel'
import { IngresosPorMesChart } from '@/components/admin/analytics/IngresosPorMesChart'
import { ComparativaCard } from '@/components/admin/analytics/ComparativaCard'
import { TiemposPromedioPanel } from '@/components/admin/analytics/TiemposPromedioPanel'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { generarReporteProfesional } from '@/lib/analytics/reportGenerator'

interface ErrorData {
  error: string
  mensaje?: string
  detalles?: string
}

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
    tramites: {
      actual: number
      anterior: number
      cambio: number
      esPositivo: boolean
    }
    ingresos: {
      actual: number
      anterior: number
      cambio: number
      esPositivo: boolean
    }
    clientes: {
      actual: number
      anterior: number
      cambio: number
      esPositivo: boolean
    }
  }
  tiemposPromedio: {
    total: number
    desdeValidacion?: number
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
  alertas: Array<{
    tipo: 'warning' | 'info' | 'success'
    mensaje: string
    valor?: number
  }>
  ultimosTramites: Array<any>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ErrorData | null>(null)
  const [periodo, setPeriodo] = useState('mes')
  const [jurisdiccion, setJurisdiccion] = useState('todas')

  useEffect(() => {
    fetchData()
  }, [periodo, jurisdiccion])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/analytics?periodo=${periodo}&jurisdiccion=${jurisdiccion}`)
      
      const result = await response.json()
      
      if (!response.ok || result.error) {
        setError(result)
        setData(null)
        console.error('Error del API:', result)
        return
      }
      
      setData(result)
      setError(null)
    } catch (err: any) {
      console.error('Error al cargar analytics:', err)
      setError({ error: 'Error de conexión', mensaje: err.message })
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando métricas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-red-900 mb-4">❌ Error al cargar Analytics</h2>
          <p className="text-red-700 mb-2"><strong>Error:</strong> {error.error}</p>
          {error.mensaje && (
            <p className="text-red-600 mb-2"><strong>Mensaje:</strong> {error.mensaje}</p>
          )}
          {error.detalles && (
            <details className="mt-4">
              <summary className="cursor-pointer text-red-700 font-semibold">Ver detalles técnicos</summary>
              <pre className="mt-2 p-4 bg-red-100 rounded text-xs overflow-auto max-h-64">
                {error.detalles}
              </pre>
            </details>
          )}
          <button
            onClick={fetchData}
            className="mt-4 bg-red-700 text-white px-6 py-2 rounded-lg hover:bg-red-800 transition"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!data || !data.tramites) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No hay datos disponibles</p>
        <button
          onClick={fetchData}
          className="mt-4 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800"
        >
          Cargar datos
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <span className="inline-block text-red-700 font-semibold text-sm tracking-wider uppercase mb-2">
            Métricas
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
            Dashboard de <span className="text-red-700">Analytics</span>
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            Última actualización: {format(new Date(), "d 'de' MMMM, HH:mm", { locale: es })}
          </p>
        </div>
        <button
          onClick={() => data && generarReporteProfesional(data, periodo, jurisdiccion)}
          className="flex items-center gap-2 bg-red-700 text-white px-6 py-3 rounded-xl hover:bg-red-800 transition cursor-pointer shadow-lg shadow-red-200 font-semibold"
        >
          <Download className="w-5 h-5" />
          Exportar Reporte
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all"
            >
              <option value="dia">Hoy</option>
              <option value="semana">Última semana</option>
              <option value="mes">Este mes</option>
              <option value="año">Este año</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdicción</label>
            <select
              value={jurisdiccion}
              onChange={(e) => setJurisdiccion(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all"
            >
              <option value="todas">Todas</option>
              <option value="cordoba">Córdoba</option>
              <option value="caba">CABA</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-xl text-gray-700 font-semibold transition-all"
            >
              Actualizar
            </button>
          </div>
        </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Trámites Totales"
          value={data.tramites?.totales || 0}
          icon={FileText}
          subtitle={`${data.tramites?.enCurso || 0} en curso`}
          color="red"
        />
        
        <MetricCard
          title="Trámites Completados"
          value={data.tramites?.completados || 0}
          icon={CheckCircle2}
          subtitle={`Tasa: ${data.tramites?.tasaCompletitud || 0}%`}
          color="green"
        />
        
        <MetricCard
          title="Ingresos Período"
          value={`$${((data.ingresos?.periodo || 0) / 1000).toFixed(0)}K`}
          icon={DollarSign}
          subtitle={`${data.ingresos?.cantidadPagos || 0} pagos`}
          color="blue"
        />
        
        <MetricCard
          title="Usuarios Registrados"
          value={data.clientes?.registrados || 0}
          icon={Users}
          subtitle={`${data.clientes?.activos || 0} activos`}
          color="purple"
        />
      </div>

      {/* Segunda fila de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Trámites Este Período"
          value={data.tramites?.periodo || 0}
          icon={TrendingUp}
          subtitle="Nuevos iniciados"
          color="yellow"
        />
        
        <MetricCard
          title="Valor Promedio"
          value={`$${((data.ingresos?.promedioPorTramite || 0) / 1000).toFixed(0)}K`}
          icon={DollarSign}
          subtitle="Por trámite completado"
          color="green"
        />
        
        <MetricCard
          title="Documentos Pendientes"
          value={data.documentos?.pendientes || 0}
          icon={FileCheck}
          subtitle={`${data.documentos?.tasaAprobacion || 0}% aprobados`}
          color="yellow"
        />
        
        <MetricCard
          title="Pagos Pendientes"
          value={`$${((data.ingresos?.pendientes || 0) / 1000).toFixed(0)}K`}
          icon={Clock}
          subtitle="Por cobrar"
          color="red"
        />
      </div>

      {/* Comparativas vs Mes Anterior */}
      {data.comparativas && (
        <>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Comparativa vs Mes Anterior</h2>
            <p className="text-gray-500 text-sm">Evolución de métricas clave</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ComparativaCard
              titulo="Trámites Este Mes"
              valorActual={data.comparativas.tramites.actual}
              valorAnterior={data.comparativas.tramites.anterior}
              cambio={data.comparativas.tramites.cambio}
              esPositivo={data.comparativas.tramites.esPositivo}
              formato="numero"
              icono={<FileText className="w-6 h-6 text-gray-600" />}
            />
            <ComparativaCard
              titulo="Ingresos Este Mes"
              valorActual={data.comparativas.ingresos.actual}
              valorAnterior={data.comparativas.ingresos.anterior}
              cambio={data.comparativas.ingresos.cambio}
              esPositivo={data.comparativas.ingresos.esPositivo}
              formato="dinero"
              icono={<DollarSign className="w-6 h-6 text-gray-600" />}
            />
            <ComparativaCard
              titulo="Clientes Nuevos"
              valorActual={data.comparativas.clientes.actual}
              valorAnterior={data.comparativas.clientes.anterior}
              cambio={data.comparativas.clientes.cambio}
              esPositivo={data.comparativas.clientes.esPositivo}
              formato="numero"
              icono={<Users className="w-6 h-6 text-gray-600" />}
            />
          </div>
        </>
      )}

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TramitesPorMesChart data={data.tramites?.porMes || []} />
        <IngresosPorMesChart data={data.ingresos?.porMes || []} />
      </div>

      {/* Segunda fila de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EstadosTramitesChart 
          enCurso={data.tramites?.enCurso || 0}
          completados={data.tramites?.completados || 0}
          cancelados={data.tramites?.cancelados || 0}
        />
        {data.tiemposPromedio && (
          <TiemposPromedioPanel
            total={data.tiemposPromedio.total}
            desdeValidacion={data.tiemposPromedio.desdeValidacion}
            porEtapa={data.tiemposPromedio.porEtapa}
          />
        )}
      </div>

      {/* Embudo de conversión y alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConversionFunnel
          registrados={data.clientes?.registrados || 0}
          conTramite={Math.round((data.clientes?.registrados || 0) * (parseFloat(data.clientes?.tasaRegistroATramite || '0') / 100))}
          completados={data.tramites?.completados || 0}
        />
        <AlertasPanel alertas={data.alertas || []} />
      </div>

      {/* Tabla de últimos trámites */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Últimos Trámites</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Denominación</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jurisdicción</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(data.ultimosTramites || []).map((tramite) => (
                <tr key={tramite.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{tramite.user.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tramite.denominacionSocial1}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      tramite.estadoGeneral === 'COMPLETADO' ? 'bg-green-100 text-green-800' :
                      tramite.estadoGeneral === 'EN_PROCESO' ? 'bg-blue-100 text-blue-800' :
                      tramite.estadoGeneral === 'ESPERANDO_CLIENTE' ? 'bg-yellow-100 text-yellow-800' :
                      tramite.estadoGeneral === 'ESPERANDO_APROBACION' ? 'bg-orange-100 text-orange-800' :
                      tramite.estadoGeneral === 'INICIADO' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {tramite.estadoGeneral.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tramite.jurisdiccion}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {format(new Date(tramite.createdAt), 'dd/MM/yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de jurisdicciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Por Jurisdicción</h3>
          <div className="space-y-3">
            {(data.tramites?.porJurisdiccion || []).map((item) => {
              const total = data.tramites?.totales || 0
              const porcentaje = total > 0 ? (item._count / total) * 100 : 0
              return (
                <div key={item.jurisdiccion}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{item.jurisdiccion}</span>
                    <span className="text-gray-600">
                      {item._count} ({porcentaje.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-700 h-2 rounded-full transition-all"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Estadísticas de Conversión</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">Registro → Trámite:</span>
              <span className="text-xl font-bold text-red-700">{data.clientes?.tasaRegistroATramite || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">Trámite → Completado:</span>
              <span className="text-xl font-bold text-green-700">{data.clientes?.tasaTramiteACompletado || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">Documentos Aprobados:</span>
              <span className="text-xl font-bold text-blue-700">{data.documentos?.tasaAprobacion || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700">Tasa Completitud:</span>
              <span className="text-xl font-bold text-purple-700">{data.tramites?.tasaCompletitud || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

