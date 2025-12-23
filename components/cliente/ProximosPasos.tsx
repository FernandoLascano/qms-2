'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowRight, CheckCircle, Clock, CreditCard, FileText, Upload } from 'lucide-react'
import Link from 'next/link'

interface ProximosPasosProps {
  tramite: any
  pagos: any[]
  enlacesPago: any[]
  documentos?: any[]
  notificaciones?: any[]
}

interface Accion {
  tipo: string
  titulo: string
  descripcion: string
  urgencia: 'alta' | 'media' | 'baja' | 'completado'
  accion: string | null
  link: string | null
}

export default function ProximosPasos({
  tramite,
  pagos,
  enlacesPago,
  documentos = [],
  notificaciones = []
}: ProximosPasosProps) {
  // Función helper para convertir conceptos a texto amigable
  const getConceptoTexto = (concepto: string) => {
    const mapa: Record<string, string> = {
      HONORARIOS_BASICO: 'Honorarios Básico',
      HONORARIOS_EMPRENDEDOR: 'Honorarios Emprendedor',
      HONORARIOS_PREMIUM: 'Honorarios Premium',
      DEPOSITO_CAPITAL: 'Depósito 25% del Capital',
      TASA_RESERVA_NOMBRE: 'Tasa Reserva de Nombre',
      TASA_RETRIBUTIVA: 'Tasa Retributiva (Final)',
      PUBLICACION_BOLETIN: 'Publicación en Boletín',
      CERTIFICACION_FIRMA: 'Certificación de Firma',
      OTROS: 'Otros'
    }
    return mapa[concepto] || concepto
  }

  // Determinar qué debe hacer el cliente ahora (pueden ser varias acciones en paralelo)
  const getAcciones = (): Accion[] => {
    const acciones: Accion[] = []

    // 0. Verificar estado de validación del formulario
    if (tramite.estadoValidacion === 'PENDIENTE_VALIDACION') {
      return [{
        tipo: 'VALIDACION_PENDIENTE',
        titulo: '⏳ Formulario Pendiente de Validación',
        descripcion: 'Hemos recibido tu formulario y lo estamos revisando. Una vez validado, te indicaremos cómo abonar los honorarios para continuar con el trámite.',
        urgencia: 'media',
        accion: null,
        link: null
      }]
    }

    if (tramite.estadoValidacion === 'REQUIERE_CORRECCIONES') {
      return [{
        tipo: 'REQUIERE_CORRECCIONES',
        titulo: '⚠️ Formulario Requiere Correcciones',
        descripcion: tramite.observacionesValidacion || 'El formulario requiere correcciones. Revisa los mensajes del equipo para más detalles.',
        urgencia: 'alta',
        accion: null,
        link: null
      }]
    }

    // 1. Verificar si hay pagos de honorarios pendientes
    const honorariosPendientes = pagos.filter(p => 
      p.concepto.includes('HONORARIOS') && 
      p.estado === 'PENDIENTE' && 
      p.mercadoPagoLink
    )

    if (honorariosPendientes.length > 0) {
      const conceptoTexto = getConceptoTexto(honorariosPendientes[0].concepto)
      acciones.push({
        tipo: 'PAGO_HONORARIOS',
        titulo: '💳 Pagar Honorarios',
        descripcion: `Debes abonar ${conceptoTexto} por $${honorariosPendientes[0].monto.toLocaleString('es-AR')} para continuar con el trámite.`,
        urgencia: 'alta',
        accion: 'Ver forma de pago',
        link: '#pago-honorarios' // Link al apartado de pagos en la misma página
      })
    }

    // 2. Verificar si hay enlaces de pago de tasas pendientes
    const tasasPendientes = enlacesPago.filter(e => 
      e.estado === 'PENDIENTE' && !e.reportadoVencido
    )

    if (tasasPendientes.length > 0) {
      const conceptoTexto = getConceptoTexto(tasasPendientes[0].concepto)
      acciones.push({
        tipo: 'PAGO_TASA',
        titulo: '💰 Pagar Tasa',
        descripcion: `Debes abonar ${conceptoTexto} por $${tasasPendientes[0].monto.toLocaleString('es-AR')}.`,
        urgencia: 'alta',
        accion: 'Ir al pago de la tasa',
        link: '#enlaces-pago'
      })
    }

    // 3. Depósito del 25% del capital: si hay notificación con los datos y aún no subió comprobante
    // Buscar SOLO comprobantes específicos de depósito de capital (no cualquier COMPROBANTE_DEPOSITO)
    const comprobanteDepositoCapital = documentos?.find(
      (doc: any) => {
        // Buscar específicamente por nombre que contenga "DEPOSITO_CAPITAL"
        return doc.nombre && 
               typeof doc.nombre === 'string' && 
               doc.nombre.includes('DEPOSITO_CAPITAL')
      }
    )
    
    // Solo considerar que ya subió comprobante si está aprobado
    const yaSubioComprobanteAprobado = comprobanteDepositoCapital?.estado === 'APROBADO'

    const notifDeposito = notificaciones?.find(
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

    // Debug: log para ver qué notificaciones hay
    console.log('🔍 ProximosPasos - Notificaciones recibidas:', notificaciones?.map((n: any) => ({ titulo: n.titulo, id: n.id })))
    console.log('🔍 ProximosPasos - Notif depósito encontrada:', notifDeposito ? { titulo: notifDeposito.titulo, id: notifDeposito.id } : null)
    console.log('🔍 ProximosPasos - Comprobante depósito capital:', comprobanteDepositoCapital ? { estado: comprobanteDepositoCapital.estado, nombre: comprobanteDepositoCapital.nombre } : 'No encontrado')

    // Mostrar la acción si hay notificación Y (no hay comprobante O el comprobante no está aprobado)
    if (notifDeposito && !yaSubioComprobanteAprobado) {
      acciones.push({
        tipo: 'DEPOSITO_CAPITAL',
        titulo: '💵 Depositar 25% del Capital',
        descripcion: comprobanteDepositoCapital 
          ? 'Tu comprobante de depósito está siendo revisado. Te notificaremos cuando sea aprobado.'
          : 'Debes realizar el depósito del 25% del capital social y subir el comprobante para que podamos avanzar con el trámite.',
        urgencia: 'alta',
        accion: 'Ver datos bancarios',
        link: '#deposito-capital'
      })
    }

    // 4. Si la denominación fue reservada pero aún no se pagó la tasa final
    // Solo mostrar "Esperando Instrucciones" si NO hay enlaces de pago pendientes Y NO hay datos bancarios disponibles
    const hayTasasPendientes = tasasPendientes.length > 0
    const hayDatosBancarios = !!notifDeposito && !yaSubioComprobanteAprobado
    
    if (tramite.denominacionReservada && !tramite.tasaPagada && !hayTasasPendientes && !hayDatosBancarios) {
      acciones.push({
        tipo: 'ESPERA_INSTRUCCIONES',
        titulo: '⏳ Esperando Instrucciones',
        descripcion: 'Tu denominación fue reservada. Pronto recibirás instrucciones para pagar la tasa final y depositar el capital.',
        urgencia: 'media',
        accion: null,
        link: null
      })
    }

    // 5. Si se pagó la tasa y se depositó capital, espera documentos
    if (tramite.tasaPagada && tramite.capitalDepositado && !tramite.documentosRevisados) {
      acciones.push({
        tipo: 'ESPERA_DOCUMENTOS',
        titulo: '📄 Esperando Documentos',
        descripcion: 'Estamos preparando los documentos para que los firmes. Te notificaremos cuando estén listos.',
        urgencia: 'baja',
        accion: null,
        link: null
      })
    }

    // 6. Si hay documentos enviados pero aún no subió firmados
    // Verificar si realmente hay documentos para firmar que necesitan acción del usuario
    const tiposParaFirmar = ['ESTATUTO_PARA_FIRMAR', 'ACTA_PARA_FIRMAR', 'DOCUMENTO_PARA_FIRMAR']
    const docsParaFirmar = documentos.filter(d => tiposParaFirmar.includes(d.tipo || ''))

    // Verificar si hay documentos que aún necesitan ser firmados:
    // - Tienen tipo PARA_FIRMAR
    // - No tienen un documento firmado aprobado o pendiente relacionado
    const hayDocsPendientesFirma = docsParaFirmar.some(docParaFirmar => {
      // Buscar si ya existe un documento firmado relacionado (por la descripción)
      const tieneDocFirmado = documentos.some(docFirmado => {
        if (tiposParaFirmar.includes(docFirmado.tipo || '')) return false // Ignorar otros docs para firmar
        const descripcion = docFirmado.descripcion?.toLowerCase() || ''
        const nombreOriginal = docParaFirmar.nombre.toLowerCase()
        return descripcion.includes('correspondiente a') && descripcion.includes(nombreOriginal)
      })
      return !tieneDocFirmado
    })

    // Solo mostrar "Firmar y Subir" si hay documentos que realmente necesitan firma
    if (tramite.documentosRevisados && !tramite.documentosFirmados && hayDocsPendientesFirma) {
      acciones.push({
        tipo: 'FIRMAR_DOCUMENTOS',
        titulo: '✍️ Firmar y Subir Documentos',
        descripcion: 'Los documentos están listos. Descárgalos, fírmalos y súbelos escaneados.',
        urgencia: 'alta',
        accion: 'Ir a Documentos para Firmar',
        link: '#documentos-para-firmar'
      })
    } else if (tramite.documentosRevisados && !tramite.documentosFirmados && !hayDocsPendientesFirma && docsParaFirmar.length > 0) {
      // Hay documentos para firmar pero todos ya tienen sus versiones firmadas (en validación)
      acciones.push({
        tipo: 'DOCS_EN_VALIDACION',
        titulo: '⏳ Documentos en Validación',
        descripcion: 'Tus documentos firmados están siendo revisados por nuestro equipo.',
        urgencia: 'media',
        accion: null,
        link: null
      })
    }

    // 7. Si firmó documentos, espera ingreso del trámite
    if (tramite.documentosFirmados && !tramite.tramiteIngresado) {
      acciones.push({
        tipo: 'ESPERA_INGRESO',
        titulo: '📋 Esperando Ingreso del Trámite',
        descripcion: 'Tus documentos fueron aprobados. Estamos preparando el expediente para presentarlo en el organismo.',
        urgencia: 'baja',
        accion: null,
        link: null
      })
    }

    // 8. Si el trámite fue ingresado, espera aprobación
    if (tramite.tramiteIngresado && !tramite.sociedadInscripta) {
      acciones.push({
        tipo: 'ESPERA_APROBACION',
        titulo: '🏛️ Trámite en el Organismo',
        descripcion: `Tu trámite fue ingresado en el ${tramite.jurisdiccion === 'CORDOBA' ? 'IPJ' : 'IGJ'}. Esperando aprobación del organismo.`,
        urgencia: 'baja',
        accion: null,
        link: null
      })
    }

    // 9. Si la sociedad está inscripta
    if (tramite.sociedadInscripta) {
      acciones.push({
        tipo: 'COMPLETADO',
        titulo: '🎉 ¡Sociedad Inscripta!',
        descripcion: 'Tu sociedad ya está inscripta. Revisa los datos finales (CUIT, matrícula) más abajo.',
        urgencia: 'completado',
        accion: null,
        link: null
      })
    }

    // Si ya tenemos alguna acción (honorarios, tasas, depósito, etc.), devolverlas
    if (acciones.length > 0) {
      return acciones
    }

    // Default: En proceso
    return [{
      tipo: 'EN_PROCESO',
      titulo: '🔄 Trámite en Proceso',
      descripcion: 'Estamos trabajando en tu trámite. Te notificaremos cuando necesitemos algo de tu parte.',
      urgencia: 'media',
      accion: null,
      link: null
    }]
  }

  const acciones = getAcciones()

  const getColorPorUrgencia = (urgencia: string) => {
    switch (urgencia) {
      case 'alta':
        return 'border-orange-300 bg-orange-50'
      case 'media':
        return 'border-blue-300 bg-blue-50'
      case 'baja':
        return 'border-gray-300 bg-gray-50'
      case 'completado':
        return 'border-green-300 bg-green-50'
      default:
        return 'border-gray-300 bg-gray-50'
    }
  }

  const getIconoPorUrgencia = (urgencia: string) => {
    switch (urgencia) {
      case 'alta':
        return <AlertCircle className="h-6 w-6 text-orange-600" />
      case 'media':
        return <Clock className="h-6 w-6 text-blue-600" />
      case 'completado':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      default:
        return <Clock className="h-6 w-6 text-gray-600" />
    }
  }

  return (
    <div className="space-y-4">
      {acciones.map((accion, index) => (
        <Card key={`${accion.tipo}-${index}`} className={`border-2 ${getColorPorUrgencia(accion.urgencia)}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getIconoPorUrgencia(accion.urgencia)}
              {accion.titulo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              {accion.descripcion}
            </p>
            
            {accion.accion && accion.link && (
              accion.link.startsWith('#') ? (
                <a 
                  href={accion.link}
                  onClick={(e) => {
                    e.preventDefault()
                    const target = document.querySelector(accion.link!)
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                >
                  <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
                    {accion.accion}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              ) : (
                <Link href={accion.link}>
                  <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
                    {accion.accion}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )
            )}

            {accion.urgencia === 'alta' && (
              <div className="mt-3 bg-white border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-900">
                  <strong>⚠️ Acción requerida:</strong> Este paso es necesario para continuar con el trámite.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

