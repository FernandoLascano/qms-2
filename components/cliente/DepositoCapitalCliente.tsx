'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DollarSign, Upload, Banknote } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface DepositoCapitalClienteProps {
  tramiteId: string
  capitalSocial: number
  documentos: any[]
  notificaciones: any[]
}

interface CuentaBancaria {
  banco: string
  cbu: string
  alias: string | null
  titular: string
  montoEsperado: number
  fechaInformacion: Date
  fechaActivacion?: string | null
}

export default function DepositoCapitalCliente({
  tramiteId,
  capitalSocial,
  documentos,
  notificaciones
}: DepositoCapitalClienteProps) {
  const router = useRouter()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [cuenta, setCuenta] = useState<CuentaBancaria | null>(null)
  const [cargando, setCargando] = useState(true)

  // Cargar datos de la cuenta bancaria desde el API
  useEffect(() => {
    const fetchCuenta = async () => {
      try {
        const response = await fetch(`/api/tramites/${tramiteId}/cuenta-capital`)
        if (response.ok) {
          const data = await response.json()
          if (data.cuenta) {
            setCuenta(data.cuenta)
          }
        }
      } catch (error) {
        console.error('Error al cargar cuenta bancaria:', error)
      } finally {
        setCargando(false)
      }
    }
    fetchCuenta()
  }, [tramiteId])

  // Verificar si hay notificación de depósito (para mostrar el componente)
  const notif = notificaciones?.find(
    (n: any) => {
      if (!n.titulo || typeof n.titulo !== 'string') return false
      const tituloLower = n.titulo.toLowerCase()
      return (
        tituloLower.includes('depósito del 25% del capital') ||
        tituloLower.includes('depósito del 25%') ||
        tituloLower.includes('deposito del 25%') ||
        tituloLower.includes('datos para depósito')
      )
    }
  )

  // Si no hay notificación ni cuenta, no mostrar
  if (!cargando && !notif && !cuenta) {
    return null
  }

  // Verificar si ya subió comprobante y si está aprobado
  const comprobanteSubido = documentos?.find(
    (doc: any) => {
      return doc.nombre && 
             typeof doc.nombre === 'string' && 
             doc.nombre.includes('DEPOSITO_CAPITAL')
    }
  )
  
  const comprobanteAprobado = comprobanteSubido?.estado === 'APROBADO'

  // Usar datos de la cuenta bancaria si están disponibles, sino parsear del mensaje
  const banco = cuenta?.banco || ''
  const cbu = cuenta?.cbu || ''
  const alias = cuenta?.alias || null
  const titular = cuenta?.titular || ''
  const montoEsperado = cuenta?.montoEsperado || 0
  const montoTexto = montoEsperado > 0 ? `$${montoEsperado.toLocaleString('es-AR')}` : ''
  const fechaActivacion = cuenta?.fechaActivacion || null
  
  // Verificar si la cuenta aún no está activa
  const cuentaNoActiva = fechaActivacion && new Date(fechaActivacion) > new Date()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede superar los 10MB')
      return
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos PDF, JPG o PNG')
      return
    }

    setArchivo(file)
  }

  const handleSubirComprobante = async () => {
    if (!archivo) {
      toast.error('Debes seleccionar un archivo')
      return
    }

    setSubiendo(true)

    try {
      const data = new FormData()
      data.append('file', archivo)
      data.append('tramiteId', tramiteId)
      data.append('tipo', 'COMPROBANTE_DEPOSITO')
      // Nombre estructurado para poder identificar el concepto del pago
      data.append('nombre', 'Comprobante - DEPOSITO_CAPITAL')
      data.append(
        'descripcion',
        `Comprobante de depósito del 25% del capital social${montoEsperado > 0 ? ` ($${montoEsperado.toLocaleString('es-AR')})` : ''}`
      )

      const response = await fetch('/api/documentos/upload', {
        method: 'POST',
        body: data
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Comprobante subido correctamente')
        setArchivo(null)
        router.refresh()
      } else {
        toast.error(result.error || 'Error al subir el comprobante')
      }
    } catch (error) {
      console.error('Error al subir comprobante:', error)
      toast.error('Error al subir el comprobante')
    } finally {
      setSubiendo(false)
    }
  }

  console.log('🎨 DepositoCapitalCliente: RENDERIZANDO COMPONENTE')

  return (
    <Card id="deposito-capital" className="scroll-mt-4 border-2 border-success-line bg-success-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-success">
          <DollarSign className="h-5 w-5" />
          Depósito del 25% del Capital
        </CardTitle>
        <CardDescription>
          Realizá el depósito del capital inicial y cargá el comprobante desde aquí.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-surface border border-success-line rounded-control p-3 text-label text-ink-2">
          <p>
            Capital social informado:{' '}
            <strong>${capitalSocial.toLocaleString('es-AR')}</strong>
          </p>
          {montoTexto && (
            <p>
              Monto a depositar: <strong>{montoTexto}</strong>
            </p>
          )}
        </div>

        {(banco || cbu || titular) ? (
          <div className="bg-surface border border-success-line rounded-control p-4 text-body-sm text-ink-2 space-y-2">
            <p className="font-semibold text-ink mb-2 flex items-center gap-2">
              <Banknote className="h-5 w-5 text-success" /> Datos de la cuenta bancaria
            </p>
            {cuentaNoActiva && (
              <div className="bg-warning-soft border-2 border-warning-line rounded-control p-3 mb-3">
                <p className="text-body-sm font-semibold text-warning mb-1">Importante: Cuenta aún no activa</p>
                <p className="text-label text-warning">
                  Esta cuenta estará operativa recién a partir del{' '}
                  <strong>{new Date(fechaActivacion!).toLocaleDateString('es-AR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</strong>.
                </p>
                <p className="text-label text-warning mt-1 font-semibold">
                  No realices la transferencia antes de esa fecha, ya que no será procesada.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-2">
              {banco && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-ink-2 min-w-[80px]">Banco:</span>
                  <span className="text-ink">{banco}</span>
                </div>
              )}
              {cbu && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-ink-2 min-w-[80px]">CBU:</span>
                  <span className="text-ink font-mono">{cbu}</span>
                </div>
              )}
              {alias && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-ink-2 min-w-[80px]">Alias:</span>
                  <span className="text-ink">{alias}</span>
                </div>
              )}
              {titular && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-ink-2 min-w-[80px]">Titular:</span>
                  <span className="text-ink">{titular}</span>
                </div>
              )}
            </div>
          </div>
        ) : cargando ? (
          <div className="bg-surface border border-success-line rounded-control p-4 text-body-sm text-ink-2">
            Cargando datos de la cuenta...
          </div>
        ) : (
          <div className="bg-warning-soft border border-warning-line rounded-control p-3 text-label text-warning">
            <p className="font-semibold mb-1">Datos no disponibles</p>
            <p>Los datos de la cuenta bancaria aún no han sido proporcionados. Contacta al equipo si necesitas esta información.</p>
          </div>
        )}

        {comprobanteSubido ? (
          <div className="bg-warning-soft border border-warning-line rounded-control p-3">
            <p className="text-body-sm text-warning">
              {comprobanteSubido.estado === 'APROBADO' ? (
                <>
                  <strong>Comprobante aprobado:</strong> Tu comprobante de depósito fue aprobado.
                </>
              ) : comprobanteSubido.estado === 'PENDIENTE' || comprobanteSubido.estado === 'EN_REVISION' ? (
                <>
                  <strong>Comprobante en revisión:</strong> Tu comprobante de depósito está siendo revisado por el equipo.
                </>
              ) : (
                <>
                  <strong>Comprobante subido:</strong> Tu comprobante de depósito fue recibido y está siendo procesado.
                </>
              )}
            </p>
            {comprobanteSubido.url && (
              <a 
                href={comprobanteSubido.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-body-sm text-info hover:underline mt-2 inline-block"
              >
                Ver comprobante subido
              </a>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="comprobante-deposito" className="text-body-sm font-medium">
                Subir Comprobante de Depósito
              </Label>
              <Input
                id="comprobante-deposito"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={subiendo}
                className="text-body-sm"
              />
              <p className="text-[11px] text-ink-2">
                Formatos aceptados: PDF, JPG o PNG (máx. 10MB)
              </p>
            </div>

            <Button
              onClick={handleSubirComprobante}
              disabled={subiendo || !archivo}
              className="w-full bg-success-solid hover:bg-success-solid gap-2"
            >
              <Upload className="h-4 w-4" />
              {subiendo ? 'Subiendo...' : 'Subir Comprobante y Confirmar Pago'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
