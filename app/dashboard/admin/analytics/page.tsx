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
import { ExportButton } from '@/components/admin/analytics/ExportButton'
import { TendenciasChart } from '@/components/admin/analytics/TendenciasChart'
import { Ga4WebPanel, type Ga4DashboardData } from '@/components/admin/analytics/Ga4WebPanel'
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
  leads?: {
    consultas: number
    borradores: number
    perdidosPorMotivo: { motivo: string | null; cantidad: number }[]
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
  const [ga4Data, setGa4Data] = useState<Ga4DashboardData | null>(null)
  const [ga4Loading, setGa4Loading] = useState(true)
  const [ga4Error, setGa4Error] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [periodo, jurisdiccion])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setGa4Loading(true)
      setGa4Error(null)
      try {
        const res = await fetch(`/api/admin/ga4?periodo=${periodo}`, {
          credentials: 'same-origin',
        })
        const json = await res.json()
        if (!res.ok) {
          if (!cancelled) {
            setGa4Data(null)
            setGa4Error(json.mensaje || json.error || 'No se pudo cargar Google Analytics')
          }
          return
        }
        if (!cancelled) {
          setGa4Data(json as Ga4DashboardData)
          setGa4Error(null)
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setGa4Data(null)
          setGa4Error(e instanceof Error ? e.message : 'Error de red')
        }
      } finally {
        if (!cancelled) setGa4Loading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [periodo])

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

  const prismaReady = Boolean(data?.tramites && !loading && !error)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-display text-ink">
            Dashboard de Analytics
          </h1>
          <p className="mt-1 text-body text-ink-2">
            Última actualización: {format(new Date(), "d 'de' MMMM, HH:mm", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <ExportButton 
              data={data} 
              filename={`analytics-${periodo}-${jurisdiccion || 'todas'}`}
            />
          )}
          <button
            onClick={() => data && generarReporteProfesional(data, periodo, jurisdiccion)}
            className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-control hover:bg-primary-hover transition cursor-pointer shadow-raise font-semibold"
          >
            <Download className="w-5 h-5" />
            Exportar PDF Completo
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-surface p-6 rounded-card shadow-raise border border-line">
          <div className="flex-1">
            <label className="block text-body-sm font-medium text-ink-2 mb-1">Período</label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full border border-line rounded-control px-4 py-2 text-ink focus:ring-2 focus:ring-ring focus:border-primary-line transition-all"
            >
              <option value="dia">Hoy</option>
              <option value="semana">Última semana</option>
              <option value="mes">Este mes</option>
              <option value="año">Este año</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-body-sm font-medium text-ink-2 mb-1">Jurisdicción</label>
            <select
              value={jurisdiccion}
              onChange={(e) => setJurisdiccion(e.target.value)}
              className="w-full border border-line rounded-control px-4 py-2 text-ink focus:ring-2 focus:ring-ring focus:border-primary-line transition-all"
            >
              <option value="todas">Todas</option>
              <option value="cordoba">Córdoba</option>
              <option value="caba">CABA</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full sm:w-auto bg-surface-3 hover:bg-n-200 px-5 py-2 rounded-control text-ink-2 font-semibold transition-all"
            >
              Actualizar
            </button>
          </div>
        </div>

      <Ga4WebPanel data={ga4Data} loading={ga4Loading} error={ga4Error} />

      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-16 bg-surface rounded-card border border-line">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-line mb-4" />
          <p className="text-ink-2 text-body-sm">Cargando métricas del negocio (trámites, pagos)…</p>
          <p className="text-ink-3 text-label mt-2">El bloque de tráfico web (arriba) puede mostrarse antes.</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-primary-soft border-2 border-primary-line rounded-control p-6">
          <h2 className="text-title font-semibold text-primary mb-4">Error al cargar métricas del negocio</h2>
          <p className="text-primary mb-2"><strong>Error:</strong> {error.error}</p>
          {error.mensaje && (
            <p className="text-primary mb-2"><strong>Mensaje:</strong> {error.mensaje}</p>
          )}
          {error.detalles && (
            <details className="mt-4">
              <summary className="cursor-pointer text-primary font-semibold">Ver detalles técnicos</summary>
              <pre className="mt-2 p-4 bg-primary-soft rounded text-label overflow-auto max-h-64">
                {error.detalles}
              </pre>
            </details>
          )}
          <button
            type="button"
            onClick={fetchData}
            className="mt-4 bg-primary text-on-primary px-6 py-2 rounded-control hover:bg-primary-hover transition"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && !data && (
        <div className="text-center py-12 bg-surface rounded-card border border-line">
          <p className="text-ink-2">No hay datos del negocio disponibles</p>
          <button
            type="button"
            onClick={fetchData}
            className="mt-4 bg-primary text-on-primary px-4 py-2 rounded-control hover:bg-primary-hover"
          >
            Cargar datos
          </button>
        </div>
      )}

      {prismaReady && data && (
        <>
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
            <h2 className="text-title font-semibold text-ink mb-1">Comparativa vs Mes Anterior</h2>
            <p className="text-ink-2 text-body-sm">Evolución de métricas clave</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ComparativaCard
              titulo="Trámites Este Mes"
              valorActual={data.comparativas.tramites.actual}
              valorAnterior={data.comparativas.tramites.anterior}
              cambio={data.comparativas.tramites.cambio}
              esPositivo={data.comparativas.tramites.esPositivo}
              formato="numero"
              icono={<FileText className="w-6 h-6 text-ink-2" />}
            />
            <ComparativaCard
              titulo="Ingresos Este Mes"
              valorActual={data.comparativas.ingresos.actual}
              valorAnterior={data.comparativas.ingresos.anterior}
              cambio={data.comparativas.ingresos.cambio}
              esPositivo={data.comparativas.ingresos.esPositivo}
              formato="dinero"
              icono={<DollarSign className="w-6 h-6 text-ink-2" />}
            />
            <ComparativaCard
              titulo="Clientes Nuevos"
              valorActual={data.comparativas.clientes.actual}
              valorAnterior={data.comparativas.clientes.anterior}
              cambio={data.comparativas.clientes.cambio}
              esPositivo={data.comparativas.clientes.esPositivo}
              formato="numero"
              icono={<Users className="w-6 h-6 text-ink-2" />}
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

      {/* Tendencias */}
      {data.tramites?.porMes && data.ingresos?.porMes && (
        <TendenciasChart 
          tramites={data.tramites}
          ingresos={data.ingresos}
        />
      )}

      {/* Embudo de conversión y alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConversionFunnel
          leads={(data.leads?.consultas || 0) + (data.leads?.borradores || 0)}
          registrados={data.clientes?.registrados || 0}
          conTramite={Math.round((data.clientes?.registrados || 0) * (parseFloat(data.clientes?.tasaRegistroATramite || '0') / 100))}
          completados={data.tramites?.completados || 0}
        />
        <AlertasPanel alertas={data.alertas || []} />
      </div>

      {/* Tabla de últimos trámites */}
      <div className="bg-surface rounded-card shadow-raise border border-line p-6">
        <h3 className="text-heading font-semibold text-ink mb-4">Últimos Trámites</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className="px-4 py-3 text-left text-label font-medium text-ink-2">Cliente</th>
                <th className="px-4 py-3 text-left text-label font-medium text-ink-2">Denominación</th>
                <th className="px-4 py-3 text-left text-label font-medium text-ink-2">Estado</th>
                <th className="px-4 py-3 text-left text-label font-medium text-ink-2">Jurisdicción</th>
                <th className="px-4 py-3 text-left text-label font-medium text-ink-2">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(data.ultimosTramites || []).map((tramite) => (
                <tr key={tramite.id} className="hover:bg-surface-2">
                  <td className="px-4 py-3 text-body-sm text-ink">{tramite.user.name}</td>
                  <td className="px-4 py-3 text-body-sm text-ink-2">{tramite.denominacionSocial1}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-label font-semibold rounded-full ${
                      tramite.estadoGeneral === 'COMPLETADO' ? 'bg-success-soft text-success' :
                      tramite.estadoGeneral === 'EN_PROCESO' ? 'bg-info-soft text-info' :
                      tramite.estadoGeneral === 'ESPERANDO_CLIENTE' ? 'bg-warning-soft text-warning' :
                      tramite.estadoGeneral === 'ESPERANDO_APROBACION' ? 'bg-warning-soft text-warning' :
                      tramite.estadoGeneral === 'INICIADO' ? 'bg-info-soft text-info' :
                      'bg-surface-3 text-ink'
                    }`}>
                      {tramite.estadoGeneral.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-ink-2">{tramite.jurisdiccion}</td>
                  <td className="px-4 py-3 text-body-sm text-ink-2">
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
        <div className="bg-surface rounded-card shadow-raise border border-line p-6">
          <h3 className="text-heading font-semibold text-ink mb-4">Por Jurisdicción</h3>
          <div className="space-y-3">
            {(data.tramites?.porJurisdiccion || []).map((item) => {
              const total = data.tramites?.totales || 0
              const porcentaje = total > 0 ? (item._count / total) * 100 : 0
              return (
                <div key={item.jurisdiccion}>
                  <div className="flex justify-between text-body-sm mb-1">
                    <span className="font-medium text-ink-2">{item.jurisdiccion}</span>
                    <span className="text-ink-2">
                      {item._count} ({porcentaje.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-n-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-surface rounded-card shadow-raise border border-line p-6">
          <h3 className="text-heading font-semibold text-ink mb-4">Estadísticas de Conversión</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-line">
              <span className="text-ink-2">Registro → Trámite:</span>
              <span className="text-title font-semibold text-primary">{data.clientes?.tasaRegistroATramite || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-line">
              <span className="text-ink-2">Trámite → Completado:</span>
              <span className="text-title font-semibold text-success">{data.clientes?.tasaTramiteACompletado || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-line">
              <span className="text-ink-2">Documentos Aprobados:</span>
              <span className="text-title font-semibold text-info">{data.documentos?.tasaAprobacion || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-ink-2">Tasa Completitud:</span>
              <span className="text-title font-semibold text-info">{data.tramites?.tasaCompletitud || 0}%</span>
            </div>
          </div>
        </div>
      </div>
        </>
      )}

    </div>
  )
}

