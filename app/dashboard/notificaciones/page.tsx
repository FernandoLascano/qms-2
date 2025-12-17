import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

async function NotificacionesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const notificaciones = await prisma.notificacion.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      tramite: {
        select: {
          denominacionSocial1: true,
          denominacionAprobada: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  })

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'EXITO':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'ALERTA':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      case 'ERROR':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'ACCION_REQUERIDA':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'EXITO':
        return 'bg-green-50 border-green-200'
      case 'ALERTA':
        return 'bg-orange-50 border-orange-200'
      case 'ERROR':
        return 'bg-red-50 border-red-200'
      case 'ACCION_REQUERIDA':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-red-900">Notificaciones</h2>
        <p className="text-gray-600 mt-1">
          Mantente al día con el estado de tus trámites
        </p>
      </div>

      {/* Notificaciones */}
      {notificaciones.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay notificaciones
              </h3>
              <p className="text-gray-500">
                Aquí aparecerán las actualizaciones de tus trámites
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notificaciones.map((notif) => (
            <Card key={notif.id} className={`border ${getTipoColor(notif.tipo)}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getTipoIcon(notif.tipo)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {notif.titulo}
                    </h3>
                    <p className="text-sm text-gray-700 mb-2">
                      {notif.mensaje}
                    </p>
                    {notif.tramite && (
                      <p className="text-xs text-gray-500 mb-2">
                        Trámite: {notif.tramite.denominacionAprobada || notif.tramite.denominacionSocial1}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {format(new Date(notif.createdAt), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                      </p>
                      {notif.link && (
                        <Link href={notif.link}>
                          <Button size="sm" variant="outline">
                            Ver detalles
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificacionesPage

