'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcularProgreso } from '@/lib/tramites-helpers'

type FiltroTipo = 'TODOS' | 'INICIADOS' | 'EN_PROCESO' | 'ESPERANDO_CLIENTE' | 'COMPLETADOS' | 'PENDIENTE_VALIDACION'

interface TramitesFiltrosProps {
  tramites: any[]
  onFiltroChange: (filtro: FiltroTipo) => void
}

export default function TramitesFiltros({ tramites, onFiltroChange }: TramitesFiltrosProps) {
  const [filtroActivo, setFiltroActivo] = useState<FiltroTipo>('TODOS')

  const handleFiltroClick = (filtro: FiltroTipo) => {
    setFiltroActivo(filtro)
    onFiltroChange(filtro)
  }

  const contadores = {
    todos: tramites.length,
    iniciados: tramites.filter(t => t.estadoGeneral === 'INICIADO').length,
    enProceso: tramites.filter(t => {
      const progreso = calcularProgreso(t)
      return t.formularioCompleto && progreso < 100
    }).length,
    esperandoCliente: tramites.filter(t => t.estadoGeneral === 'ESPERANDO_CLIENTE').length,
    completados: tramites.filter(t => {
      const progreso = calcularProgreso(t)
      return progreso === 100 || t.sociedadInscripta
    }).length,
    pendientesValidacion: tramites.filter(t => t.estadoValidacion === 'PENDIENTE_VALIDACION').length
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros Rápidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFiltroClick('TODOS')}
            className={`cursor-pointer ${filtroActivo === 'TODOS' ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}`}
          >
            Todos ({contadores.todos})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFiltroClick('INICIADOS')}
            className={`cursor-pointer ${filtroActivo === 'INICIADOS' ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}`}
          >
            Iniciados ({contadores.iniciados})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFiltroClick('EN_PROCESO')}
            className={`cursor-pointer ${filtroActivo === 'EN_PROCESO' ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}`}
          >
            En Proceso ({contadores.enProceso})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFiltroClick('ESPERANDO_CLIENTE')}
            className={`cursor-pointer ${filtroActivo === 'ESPERANDO_CLIENTE' ? 'bg-orange-100 text-orange-700 border-orange-300' : ''}`}
          >
            Esperando Cliente ({contadores.esperandoCliente})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFiltroClick('COMPLETADOS')}
            className={`cursor-pointer ${filtroActivo === 'COMPLETADOS' ? 'bg-green-100 text-green-700 border-green-300' : ''}`}
          >
            Completados ({contadores.completados})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFiltroClick('PENDIENTE_VALIDACION')}
            className={`cursor-pointer ${filtroActivo === 'PENDIENTE_VALIDACION' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-yellow-50 border-yellow-300 text-yellow-900 hover:bg-yellow-100'}`}
          >
            Pendientes Validación ({contadores.pendientesValidacion})
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
