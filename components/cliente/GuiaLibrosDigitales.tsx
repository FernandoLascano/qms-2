'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ChevronDown, ChevronUp, CheckCircle2, Circle } from 'lucide-react'

// NOTA: contenido placeholder. Reemplazar cada `contenido` por el texto real del
// instructivo (PDF) que va a pasar el equipo. La estructura interactiva ya está lista.
const PASOS = [
  {
    titulo: '¿Qué son los Libros Digitales?',
    contenido:
      'Los Libros Digitales reemplazan a los libros societarios en papel. Toda sociedad debe llevarlos y mantenerlos al día. [Completar con el texto del instructivo.]'
  },
  {
    titulo: 'Requisito previo: Ciudadano Digital Nivel 2',
    contenido:
      'Para operar los Libros Digitales necesitás tener Ciudadano Digital Nivel 2. [Completar: cómo obtenerlo / verificarlo.]'
  },
  {
    titulo: 'Cómo ingresar al sistema',
    contenido: 'Pasos para acceder a la plataforma de Libros Digitales. [Completar con capturas / pasos del instructivo.]'
  },
  {
    titulo: 'Alta y rúbrica de los libros',
    contenido:
      'Cómo dar de alta y rubricar los libros de tu sociedad. En el plan Premium, QMS realiza el Alta de Libros Digitales por vos. [Completar.]'
  },
  {
    titulo: 'Cómo cargar los registros',
    contenido: 'Cómo registrar asientos y actas en los libros. [Completar con el paso a paso.]'
  },
  {
    titulo: 'Preguntas frecuentes',
    contenido: 'Dudas habituales sobre los Libros Digitales. [Completar.]'
  }
]

export default function GuiaLibrosDigitales() {
  const [abierto, setAbierto] = useState<number | null>(0)
  const [leidos, setLeidos] = useState<Record<number, boolean>>({})

  const toggle = (i: number) => {
    setAbierto((prev) => (prev === i ? null : i))
    setLeidos((prev) => ({ ...prev, [i]: true }))
  }

  const completados = Object.values(leidos).filter(Boolean).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg bg-brand-50 border border-brand-100 p-3">
        <p className="text-sm text-brand-900">Guía paso a paso para usar los Libros Digitales de tu sociedad.</p>
        <span className="text-xs font-medium text-brand-700 whitespace-nowrap">{completados}/{PASOS.length} vistos</span>
      </div>

      <div className="space-y-2">
        {PASOS.map((paso, i) => {
          const estaAbierto = abierto === i
          return (
            <Card key={i} className="overflow-hidden">
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition"
              >
                {leidos[i] ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                )}
                <span className="flex-1 font-medium text-gray-900">
                  <span className="text-brand-700 mr-2">{i + 1}.</span>
                  {paso.titulo}
                </span>
                {estaAbierto ? (
                  <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {estaAbierto && (
                <div className="border-t border-gray-100 p-4 pt-3">
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{paso.contenido}</p>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
