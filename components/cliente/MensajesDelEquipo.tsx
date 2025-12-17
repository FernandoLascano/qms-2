'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Notificacion {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  createdAt: Date
  leida: boolean
}

interface MensajesDelEquipoProps {
  notificaciones: Notificacion[]
}

export default function MensajesDelEquipo({ notificaciones }: MensajesDelEquipoProps) {
  if (!notificaciones || notificaciones.length === 0) {
    return null
  }

  const getIconoPorTipo = (tipo: string) => {
    switch (tipo) {
      case 'ACCION_REQUERIDA':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      case 'EXITO':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'ALERTA':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getColorPorTipo = (tipo: string) => {
    switch (tipo) {
      case 'ACCION_REQUERIDA':
        return 'border-orange-200 bg-orange-50'
      case 'EXITO':
        return 'border-green-200 bg-green-50'
      case 'ALERTA':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  return (
    <Card className="border-2 border-blue-300 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <MessageCircle className="h-6 w-6" />
          💬 Mensajes del Equipo
        </CardTitle>
        <CardDescription className="text-blue-700">
          Comunicaciones importantes sobre tu trámite
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notificaciones.slice(0, 5).map((notif) => {
          const esDepositoCapital =
            notif.titulo &&
            typeof notif.titulo === 'string' &&
            notif.titulo.includes('Depósito del 25% del Capital')

          return (
            <div
              key={notif.id}
              className={`p-4 border-2 rounded-lg ${getColorPorTipo(notif.tipo)}`}
            >
              <div className="flex items-start gap-3 mb-2">
                {getIconoPorTipo(notif.tipo)}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {notif.titulo}
                  </h4>
                  {esDepositoCapital ? (
                    <p className="text-sm text-gray-700">
                      Debés realizar el depósito del 25% del capital social y subir el
                      comprobante.{' '}
                      <a 
                        href="#deposito-capital" 
                        className="text-red-700 font-semibold underline cursor-pointer hover:text-red-800"
                        onClick={(e) => {
                          e.preventDefault()
                          const target = document.querySelector('#deposito-capital')
                          if (target) {
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                        }}
                      >
                        Ver detalles y cargar comprobante
                      </a>
                      .
                    </p>
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {notif.mensaje}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(notif.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}

        {notificaciones.length > 5 && (
          <p className="text-sm text-center text-gray-600">
            Mostrando los 5 mensajes más recientes
          </p>
        )}
      </CardContent>
    </Card>
  )
}

