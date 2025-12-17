'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Circle, Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface TimelineProgresoProps {
  tramite: any
}

export default function TimelineProgreso({ tramite }: TimelineProgresoProps) {
  const [expandido, setExpandido] = useState(false)
  
  const etapas = [
    {
      id: 1,
      titulo: 'Formulario Completado',
      descripcion: 'Datos básicos ingresados',
      completado: tramite.formularioCompleto,
      fecha: tramite.createdAt,
      icono: '📝'
    },
    {
      id: 2,
      titulo: 'Denominación Reservada',
      descripcion: 'Nombre aprobado y reservado',
      completado: tramite.denominacionReservada,
      fecha: tramite.fechaReservaNombre,
      icono: '✅'
    },
    {
      id: 3,
      titulo: 'Capital Depositado',
      descripcion: '25% del capital social',
      completado: tramite.capitalDepositado,
      fecha: tramite.fechaDepositoCapital,
      icono: '💰'
    },
    {
      id: 4,
      titulo: 'Tasa Final Pagada',
      descripcion: 'Tasa retributiva abonada',
      completado: tramite.tasaPagada,
      fecha: tramite.fechaPagoTasa,
      icono: '💳'
    },
    {
      id: 5,
      titulo: 'Documentos Firmados',
      descripcion: 'Documentación completa',
      completado: tramite.documentosFirmados,
      fecha: null,
      icono: '📄'
    },
    {
      id: 6,
      titulo: 'Trámite Ingresado',
      descripcion: 'Presentado en el organismo',
      completado: tramite.tramiteIngresado,
      fecha: tramite.fechaIngresoTramite,
      icono: '🏛️'
    },
    {
      id: 7,
      titulo: 'Sociedad Inscripta',
      descripcion: 'CUIT y matrícula asignados',
      completado: tramite.sociedadInscripta,
      fecha: tramite.fechaInscripcion,
      icono: '🎉'
    }
  ]

  const etapasCompletadas = etapas.filter(e => e.completado).length
  const progresoPercentage = Math.round((etapasCompletadas / etapas.length) * 100)
  
  // Encontrar la etapa actual (la primera no completada)
  const etapaActualIndex = etapas.findIndex((e, index) => !e.completado && (index === 0 || etapas[index - 1].completado))
  const etapaActual = etapaActualIndex !== -1 ? etapas[etapaActualIndex] : null
  const siguienteEtapa = etapaActualIndex !== -1 && etapaActualIndex < etapas.length - 1 ? etapas[etapaActualIndex + 1] : null
  
  // Todas las etapas completadas
  const etapasCompletadasList = etapas.filter(e => e.completado)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Progreso del Trámite</CardTitle>
            <CardDescription>
              {etapasCompletadas} de {etapas.length} etapas completadas
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-red-700">{progresoPercentage}%</p>
            <p className="text-xs text-gray-500">Completado</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Barra de Progreso */}
        <div className="mb-4">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-green-500 transition-all duration-500"
              style={{ width: `${progresoPercentage}%` }}
            />
          </div>
        </div>

        {/* Vista Compacta (por defecto) */}
        {!expandido && (
          <div className="space-y-3">
            {/* Todas las etapas completadas */}
            {etapasCompletadasList.length > 0 && (
              <div className="space-y-2">
                {etapasCompletadasList.map((etapa) => (
                  <div key={etapa.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-900">{etapa.titulo}</p>
                      {etapa.fecha && (
                        <p className="text-xs text-green-700">
                          Completado el {new Date(etapa.fecha).toLocaleDateString('es-AR')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Etapa Actual (bien visible) */}
            {etapaActual && (
              <div className="p-4 bg-red-50 border-2 border-red-500 rounded-lg shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
                    <Clock className="h-5 w-5 text-red-700 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-base font-bold text-red-900">{etapaActual.titulo}</h4>
                      <span className="px-2 py-1 text-xs font-semibold bg-red-700 text-white rounded-full whitespace-nowrap">
                        En curso
                      </span>
                    </div>
                    <p className="text-sm text-red-800 mb-2">{etapaActual.descripcion}</p>
                    <p className="text-xs text-red-700 font-medium">
                      ⏳ Trabajando en esta etapa...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Siguiente Etapa (minimizada) */}
            {siguienteEtapa && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg opacity-75">
                <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600 truncate">{siguienteEtapa.titulo}</p>
                  <p className="text-xs text-gray-500">Próximo paso</p>
                </div>
              </div>
            )}

            {/* Botón para expandir */}
            <Button
              variant="outline"
              onClick={() => setExpandido(true)}
              className="w-full mt-4 gap-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-500"
            >
              <ChevronDown className="h-4 w-4" />
              Ver todas las etapas ({etapas.length})
            </Button>
          </div>
        )}

        {/* Vista Expandida (todas las etapas) */}
        {expandido && (
          <div className="space-y-4">
          {etapas.map((etapa, index) => {
            const esActual = !etapa.completado && (index === 0 || etapas[index - 1].completado)
            
            return (
              <div key={etapa.id} className="flex gap-4">
                {/* Icono y línea */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0
                    ${etapa.completado 
                      ? 'bg-green-100 border-2 border-green-500' 
                      : esActual
                      ? 'bg-red-100 border-2 border-red-500 animate-pulse'
                      : 'bg-gray-100 border-2 border-gray-300'
                    }
                  `}>
                    {etapa.completado ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : esActual ? (
                      <Clock className="h-5 w-5 text-red-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  {index < etapas.length - 1 && (
                    <div className={`w-0.5 h-12 flex-shrink-0 ${
                      etapa.completado ? 'bg-green-500' : esActual ? 'bg-red-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 pb-4 min-w-0">
                  <div className={`
                    p-4 rounded-lg border-2 transition-all
                    ${etapa.completado 
                      ? 'bg-green-50 border-green-200' 
                      : esActual
                      ? 'bg-red-50 border-red-500 shadow-md'
                      : 'bg-gray-50 border-gray-200'
                    }
                  `}>
                    <div className="flex items-start justify-between mb-1 gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xl flex-shrink-0">{etapa.icono}</span>
                        <h4 className={`font-semibold text-sm break-words ${
                          etapa.completado ? 'text-green-900' :
                          esActual ? 'text-red-900' : 'text-gray-600'
                        }`}>
                          {etapa.titulo}
                        </h4>
                      </div>
                      {esActual && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-700 text-white rounded-full whitespace-nowrap flex-shrink-0">
                          En curso
                        </span>
                      )}
                    </div>
                    <p className={`text-sm break-words ${
                      etapa.completado ? 'text-green-700' :
                      esActual ? 'text-red-800' : 'text-gray-500'
                    }`}>
                      {etapa.descripcion}
                    </p>
                    {etapa.fecha && (
                      <p className="text-xs text-gray-500 mt-2">
                        ✓ Completado el {new Date(etapa.fecha).toLocaleDateString('es-AR')}
                      </p>
                    )}
                    {esActual && (
                      <p className="text-xs text-red-700 mt-2 font-medium">
                        ⏳ Trabajando en esta etapa...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
            
            {/* Botón para colapsar */}
            <Button
              variant="outline"
              onClick={() => setExpandido(false)}
              className="w-full mt-4 gap-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-500"
            >
              <ChevronUp className="h-4 w-4" />
              Ver resumen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

