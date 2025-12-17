'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { toast } from 'sonner'

interface TiempoEtapa {
  dias: number
  horas: number
  minutos: number
}

interface TrackingData {
  promedios: Record<string, number>
  tiempoPromedioTotal: number
  totalTramites: number
}

export default function TrackingTiempo() {
  const [data, setData] = useState<TrackingData | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setCargando(true)
      const response = await fetch('/api/admin/tracking-tiempo')
      const result = await response.json()

      if (response.ok) {
        setData(result)
      } else {
        toast.error('Error al cargar datos de tracking')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos de tracking')
    } finally {
      setCargando(false)
    }
  }

  if (cargando) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="flex items-center justify-center">
            <p className="text-gray-500">Cargando métricas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const nombresEtapas: Record<string, string> = {
    formularioCompleto: 'Formulario Completo',
    denominacionReservada: 'Denominación Reservada',
    capitalDepositado: 'Capital Depositado',
    tasaPagada: 'Tasa Pagada',
    documentosRevisados: 'Documentos Revisados',
    documentosFirmados: 'Documentos Firmados',
    tramiteIngresado: 'Trámite Ingresado',
    sociedadInscripta: 'Sociedad Inscripta'
  }

  const datosGrafico = Object.entries(data.promedios)
    .filter(([_, valor]) => valor > 0)
    .map(([etapa, dias]) => ({
      etapa: nombresEtapas[etapa] || etapa,
      dias: Math.round(dias * 10) / 10
    }))

  // Identificar cuellos de botella (etapas que toman más tiempo)
  const cuellosDeBotella = Object.entries(data.promedios)
    .filter(([_, valor]) => valor > 0)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 3)
    .map(([etapa, dias]) => ({
      etapa: nombresEtapas[etapa] || etapa,
      dias: Math.round(dias * 10) / 10
    }))

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tiempo Promedio Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {Math.round(data.tiempoPromedioTotal * 10) / 10} días
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Desde inicio hasta inscripción
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Trámites Analizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {data.totalTramites}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Trámites con formulario completo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Etapas con Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {Object.values(data.promedios).filter(v => v > 0).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Etapas con información disponible
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Tiempos por Etapa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tiempo Promedio por Etapa
          </CardTitle>
          <CardDescription>
            Días promedio que toma cada etapa del proceso
          </CardDescription>
        </CardHeader>
        <CardContent>
          {datosGrafico.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={datosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="etapa" 
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'Días', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number) => `${value} días`}
                />
                <Legend />
                <Bar dataKey="dias" fill="#DB1414" name="Días promedio" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-500">No hay datos suficientes para mostrar el gráfico</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cuellos de Botella */}
      {cuellosDeBotella.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Cuellos de Botella
            </CardTitle>
            <CardDescription>
              Etapas que requieren más tiempo (top 3)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cuellosDeBotella.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.etapa}</p>
                      <p className="text-sm text-gray-600">{item.dias} días promedio</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">{item.dias}</p>
                    <p className="text-xs text-gray-500">días</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla Detallada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Desglose Detallado por Etapa
          </CardTitle>
          <CardDescription>
            Tiempo promedio en cada etapa del proceso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Etapa</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Días Promedio</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.promedios).map(([etapa, dias]) => (
                  <tr key={etapa} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">
                      {nombresEtapas[etapa] || etapa}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {dias > 0 ? `${Math.round(dias * 10) / 10} días` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

