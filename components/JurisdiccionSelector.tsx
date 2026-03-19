'use client'

import { useState, useEffect } from 'react'
import { Check, AlertCircle } from 'lucide-react'

interface Jurisdiccion {
  id: string
  jurisdiccion: string
  nombre: string
  habilitada: boolean
}

interface Props {
  value: string
  onChange: (id: string, provincia: string) => void
}

const provinciaMap: Record<string, string> = {
  CORDOBA: 'Córdoba',
  CABA: 'Ciudad Autónoma de Buenos Aires',
}

export default function JurisdiccionSelector({ value, onChange }: Props) {
  const [jurisdicciones, setJurisdicciones] = useState<Jurisdiccion[]>([])

  useEffect(() => {
    fetch('/api/jurisdicciones')
      .then(res => res.json())
      .then(setJurisdicciones)
      .catch(() => {})
  }, [])

  // Fallback si la API no carga
  if (jurisdicciones.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => onChange('CORDOBA', 'Córdoba')}
          className={`border-2 rounded-lg p-4 cursor-pointer transition ${
            value === 'CORDOBA' ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">Córdoba (IPJ)</span>
            {value === 'CORDOBA' && <Check className="h-5 w-5 text-brand-600" />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {jurisdicciones.map(j => (
        <div
          key={j.id}
          onClick={() => {
            if (j.habilitada) {
              onChange(j.jurisdiccion, provinciaMap[j.jurisdiccion] || j.nombre)
            }
          }}
          className={`border-2 rounded-lg p-4 transition ${
            !j.habilitada
              ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-70'
              : value === j.jurisdiccion
                ? 'border-brand-600 bg-brand-50 cursor-pointer'
                : 'border-gray-200 hover:border-gray-300 bg-white cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className={`font-medium ${j.habilitada ? 'text-gray-900' : 'text-gray-400'}`}>
                {j.nombre}
              </span>
              {!j.habilitada && (
                <div className="flex items-center gap-1.5 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs text-amber-600 font-medium">No disponible actualmente</span>
                </div>
              )}
            </div>
            {value === j.jurisdiccion && j.habilitada && (
              <Check className="h-5 w-5 text-brand-600" />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
