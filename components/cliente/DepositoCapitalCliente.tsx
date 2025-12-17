'use client'

import { useState } from 'react'
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

export default function DepositoCapitalCliente({
  tramiteId,
  capitalSocial,
  documentos,
  notificaciones
}: DepositoCapitalClienteProps) {
  const router = useRouter()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)

  // Debug inicial
  console.log('🚀 DepositoCapitalCliente - Inicio:', {
    tramiteId,
    capitalSocial,
    documentosCount: documentos?.length || 0,
    notificacionesCount: notificaciones?.length || 0
  })

  // Buscar la notificación con los datos de depósito
  // El título exacto es "Datos para Depósito del 25% del Capital"
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

  // Si no hay notificación, no mostrar
  if (!notif) {
    console.log('❌ DepositoCapitalCliente: No se encontró notificación de depósito')
    console.log('   Notificaciones disponibles:', notificaciones?.map((n: any) => n.titulo))
    return null
  }

  // Verificar si ya subió comprobante y si está aprobado
  // Buscar SOLO documentos que sean específicamente comprobantes de depósito de capital
  // No cualquier COMPROBANTE_DEPOSITO, sino el que tiene "DEPOSITO_CAPITAL" en el nombre
  const comprobanteSubido = documentos?.find(
    (doc: any) => {
      // Buscar específicamente por nombre que contenga "DEPOSITO_CAPITAL"
      // Esto diferencia entre comprobantes de tasas y comprobantes de depósito de capital
      return doc.nombre && 
             typeof doc.nombre === 'string' && 
             doc.nombre.includes('DEPOSITO_CAPITAL')
    }
  )
  
  // Debug: ver todos los documentos
  console.log('🔍 DepositoCapitalCliente - Todos los documentos:', documentos?.map((doc: any) => ({ 
    tipo: doc.tipo, 
    nombre: doc.nombre, 
    estado: doc.estado,
    id: doc.id 
  })))
  
  // Solo ocultar si el comprobante está aprobado
  const comprobanteAprobado = comprobanteSubido?.estado === 'APROBADO'
  
  if (comprobanteAprobado) {
    console.log('✅ DepositoCapitalCliente: Comprobante ya aprobado, no se muestra')
    return null
  }

  console.log('✅ DepositoCapitalCliente: Se renderizará con notificación:', notif.titulo)
  console.log('   Comprobante subido:', comprobanteSubido ? { 
    estado: comprobanteSubido.estado, 
    id: comprobanteSubido.id,
    tipo: comprobanteSubido.tipo,
    nombre: comprobanteSubido.nombre
  } : 'No')

  const mensaje = typeof notif.mensaje === 'string' ? notif.mensaje : ''

  const parseLine = (label: string) => {
    // Buscar el patrón con o sin símbolo de peso, y capturar hasta el siguiente salto de línea o fin
    const regex = new RegExp(`${label}:\\s*\\$?([^\\n]+)`, 'i')
    const match = mensaje.match(regex)
    return match ? match[1].trim() : ''
  }

  const montoTexto = parseLine('Monto a depositar')
  const banco = parseLine('Banco')
  const cbu = parseLine('CBU')
  const alias = parseLine('Alias')
  const titular = parseLine('Titular')

  // Debug siempre activo para identificar el problema
  console.log('🔍 DepositoCapitalCliente Debug:', {
    notificacionesRecibidas: notificaciones?.map((n: any) => ({ titulo: n.titulo, id: n.id })),
    notifEncontrada: notif ? { titulo: notif.titulo, id: notif.id, mensaje: notif.mensaje } : null,
    mensajeParseado: mensaje,
    montoTexto,
    banco,
    cbu,
    alias,
    titular,
    comprobanteSubido: comprobanteSubido ? { estado: comprobanteSubido.estado, id: comprobanteSubido.id } : null,
    comprobanteAprobado,
    seRenderiza: !comprobanteAprobado && !!notif
  })

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
        `Comprobante de depósito del 25% del capital social${montoTexto ? ` (${montoTexto})` : ''}`
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
    <Card id="deposito-capital" className="scroll-mt-4 border-2 border-green-300 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-900">
          <DollarSign className="h-5 w-5" />
          Depósito del 25% del Capital
        </CardTitle>
        <CardDescription>
          Realizá el depósito del capital inicial y cargá el comprobante desde aquí.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white border border-green-100 rounded-lg p-3 text-xs text-gray-700">
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

        {(banco || cbu || alias || titular) ? (
          <div className="bg-white border border-green-100 rounded-lg p-3 text-xs text-gray-700 space-y-1">
            <p className="font-semibold text-gray-900 mb-1 flex items-center gap-1">
              <Banknote className="h-4 w-4" /> Datos de la cuenta
            </p>
            {banco && (
              <p>
                <strong>Banco:</strong> {banco}
              </p>
            )}
            {cbu && (
              <p>
                <strong>CBU:</strong> {cbu}
              </p>
            )}
            {alias && alias !== '-' && (
              <p>
                <strong>Alias:</strong> {alias}
              </p>
            )}
            {titular && (
              <p>
                <strong>Titular:</strong> {titular}
              </p>
            )}
          </div>
        ) : (
          // Si no se pudieron parsear los datos, mostrar el mensaje completo
          <div className="bg-white border border-green-100 rounded-lg p-3 text-xs text-gray-700">
            <p className="font-semibold text-gray-900 mb-2">Información del depósito:</p>
            <p className="whitespace-pre-line text-sm">{mensaje}</p>
          </div>
        )}

        {comprobanteSubido ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-900">
              {comprobanteSubido.estado === 'APROBADO' ? (
                <>
                  <strong>✅ Comprobante aprobado:</strong> Tu comprobante de depósito fue aprobado.
                </>
              ) : comprobanteSubido.estado === 'PENDIENTE' || comprobanteSubido.estado === 'EN_REVISION' ? (
                <>
                  <strong>⏳ Comprobante en revisión:</strong> Tu comprobante de depósito está siendo revisado por el equipo.
                </>
              ) : (
                <>
                  <strong>📄 Comprobante subido:</strong> Tu comprobante de depósito fue recibido y está siendo procesado.
                </>
              )}
            </p>
            {comprobanteSubido.url && (
              <a 
                href={comprobanteSubido.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline mt-2 inline-block"
              >
                Ver comprobante subido
              </a>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="comprobante-deposito" className="text-sm font-medium">
                Subir Comprobante de Depósito
              </Label>
              <Input
                id="comprobante-deposito"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={subiendo}
                className="text-sm"
              />
              <p className="text-[11px] text-gray-500">
                Formatos aceptados: PDF, JPG o PNG (máx. 10MB)
              </p>
            </div>

            <Button
              onClick={handleSubirComprobante}
              disabled={subiendo || !archivo}
              className="w-full bg-green-600 hover:bg-green-700 gap-2"
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
