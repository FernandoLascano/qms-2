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
        return <AlertCircle className="h-5 w-5 text-warning" />
      case 'EXITO':
        return <CheckCircle className="h-5 w-5 text-success" />
      case 'ALERTA':
        return <AlertCircle className="h-5 w-5 text-primary" />
      default:
        return <Info className="h-5 w-5 text-info" />
    }
  }

  const getColorPorTipo = (tipo: string) => {
    switch (tipo) {
      case 'ACCION_REQUERIDA':
        return 'border-warning-line bg-warning-soft'
      case 'EXITO':
        return 'border-success-line bg-success-soft'
      case 'ALERTA':
        return 'border-primary-line bg-primary-soft'
      default:
        return 'border-info-line bg-info-soft'
    }
  }

  return (
    <Card className="border-2 border-info-line bg-info-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-info">
          <MessageCircle className="h-6 w-6" />
          Mensajes del Equipo
        </CardTitle>
        <CardDescription className="text-info">
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
              className={`p-4 border-2 rounded-control ${getColorPorTipo(notif.tipo)}`}
            >
              <div className="flex items-start gap-3 mb-2">
                {getIconoPorTipo(notif.tipo)}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-ink mb-1">
                    {notif.titulo}
                  </h4>
                  {esDepositoCapital ? (
                    <p className="text-body-sm text-ink-2">
                      Debés realizar el depósito del 25% del capital social y subir el
                      comprobante.{' '}
                      <a 
                        href="#deposito-capital" 
                        className="text-primary font-semibold underline cursor-pointer hover:text-primary"
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
                    <p className="text-body-sm text-ink-2 whitespace-pre-line">
                      {notif.mensaje}
                    </p>
                  )}
                  <p className="text-label text-ink-2 mt-2">
                    {format(new Date(notif.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}

        {notificaciones.length > 5 && (
          <p className="text-body-sm text-center text-ink-2">
            Mostrando los 5 mensajes más recientes
          </p>
        )}
      </CardContent>
    </Card>
  )
}

