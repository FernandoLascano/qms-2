'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowRight, CheckCircle, Clock, User, Building2 } from 'lucide-react'
import Link from 'next/link'

interface ProximosPasosProps {
  tramite: any
  pagos: any[]
  enlacesPago: any[]
  documentos?: any[]
  notificaciones?: any[]
}

type Responsable = 'cliente' | 'qms' | 'ninguno'

interface Accion {
  tipo: string
  titulo: string
  descripcion: string
  urgencia: 'alta' | 'media' | 'baja' | 'completado'
  responsable: Responsable
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
        titulo: '⏳ Estamos revisando tu formulario',
        descripcion: 'Recibimos tu formulario. En breve nos vamos a contactar por teléfono o WhatsApp para despejar dudas y coordinar el pago de los honorarios. No necesitás hacer nada por ahora.',
        urgencia: 'media',
        responsable: 'qms',
        accion: null,
        link: null
      }]
    }

    if (tramite.estadoValidacion === 'REQUIERE_CORRECCIONES') {
      return [{
        tipo: 'REQUIERE_CORRECCIONES',
        titulo: '⚠️ Tu formulario requiere correcciones',
        descripcion: tramite.observacionesValidacion || 'El formulario requiere correcciones. Revisá los mensajes del equipo para más detalles.',
        urgencia: 'alta',
        responsable: 'cliente',
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
        descripcion: `Debés abonar ${conceptoTexto} por $${honorariosPendientes[0].monto.toLocaleString('es-AR')} para continuar con el trámite.`,
        urgencia: 'alta',
        responsable: 'cliente',
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
        descripcion: `Debés abonar ${conceptoTexto} por $${tasasPendientes[0].monto.toLocaleString('es-AR')}.`,
        urgencia: 'alta',
        responsable: 'cliente',
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

    // Mostrar la acción si hay notificación Y (no hay comprobante O el comprobante no está aprobado)
    if (notifDeposito && !yaSubioComprobanteAprobado) {
      // Si ya subió un comprobante (aunque no esté aprobado), la pelota la tiene QMS revisándolo
      const enRevision = !!comprobanteDepositoCapital
      acciones.push({
        tipo: 'DEPOSITO_CAPITAL',
        titulo: '💵 Depositar 25% del Capital',
        descripcion: enRevision
          ? 'Tu comprobante de depósito está siendo revisado. Te notificaremos cuando sea aprobado.'
          : 'Debés realizar el depósito del 25% del capital social y subir el comprobante para que podamos avanzar con el trámite.',
        urgencia: enRevision ? 'media' : 'alta',
        responsable: enRevision ? 'qms' : 'cliente',
        accion: enRevision ? null : 'Ver datos bancarios',
        link: enRevision ? null : '#deposito-capital'
      })
    }

    // 4. Si la denominación fue reservada pero aún no se pagó la tasa final
    // Solo mostrar "Esperando Instrucciones" si NO hay enlaces de pago pendientes Y NO hay datos bancarios disponibles
    const hayTasasPendientes = tasasPendientes.length > 0
    const hayDatosBancarios = !!notifDeposito && !yaSubioComprobanteAprobado

    if (tramite.denominacionReservada && !tramite.tasaPagada && !hayTasasPendientes && !hayDatosBancarios) {
      acciones.push({
        tipo: 'ESPERA_INSTRUCCIONES',
        titulo: '⏳ Preparando el próximo paso',
        descripcion: 'Tu denominación fue reservada. Pronto recibirás las instrucciones para pagar la tasa final y depositar el capital.',
        urgencia: 'media',
        responsable: 'qms',
        accion: null,
        link: null
      })
    }

    // 5. Si se pagó la tasa y se depositó capital, espera documentos
    if (tramite.tasaPagada && tramite.capitalDepositado && !tramite.documentosRevisados) {
      acciones.push({
        tipo: 'ESPERA_DOCUMENTOS',
        titulo: '📄 Preparando tus documentos',
        descripcion: 'Estamos preparando los documentos para que los firmes. Te notificaremos cuando estén listos.',
        urgencia: 'baja',
        responsable: 'qms',
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
        descripcion: 'Los documentos están listos. Descargalos, firmalos y subilos escaneados.',
        urgencia: 'alta',
        responsable: 'cliente',
        accion: 'Ir a Documentos para Firmar',
        link: '#documentos-para-firmar'
      })
    } else if (tramite.documentosRevisados && !tramite.documentosFirmados && !hayDocsPendientesFirma && docsParaFirmar.length > 0) {
      // Hay documentos para firmar pero todos ya tienen sus versiones firmadas (en validación)
      acciones.push({
        tipo: 'DOCS_EN_VALIDACION',
        titulo: '⏳ Revisando tus documentos firmados',
        descripcion: 'Tus documentos firmados están siendo revisados por nuestro equipo.',
        urgencia: 'media',
        responsable: 'qms',
        accion: null,
        link: null
      })
    }

    // 7. Si firmó documentos, espera ingreso del trámite
    if (tramite.documentosFirmados && !tramite.tramiteIngresado) {
      acciones.push({
        tipo: 'ESPERA_INGRESO',
        titulo: '📋 Preparando el ingreso del trámite',
        descripcion: 'Tus documentos fueron aprobados. Estamos preparando el expediente para presentarlo en el organismo.',
        urgencia: 'baja',
        responsable: 'qms',
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
        responsable: 'qms',
        accion: null,
        link: null
      })
    }

    // 9. Si la sociedad está inscripta
    if (tramite.sociedadInscripta) {
      acciones.push({
        tipo: 'COMPLETADO',
        titulo: '🎉 ¡Sociedad Inscripta!',
        descripcion: 'Tu sociedad ya está inscripta. Revisá los datos finales (CUIT, matrícula) más abajo.',
        urgencia: 'completado',
        responsable: 'ninguno',
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
      responsable: 'qms',
      accion: null,
      link: null
    }]
  }

  const acciones = getAcciones()

  // ¿Hay algo pendiente del cliente? Define el banner-resumen de arriba.
  const hayPendienteCliente = acciones.some(a => a.responsable === 'cliente')
  const todoCompletado = acciones.length > 0 && acciones.every(a => a.responsable === 'ninguno')

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

  // Badge "Pendiente de vos" / "Pendiente de QMS" según quién tiene la pelota
  const renderBadgeResponsable = (responsable: Responsable) => {
    if (responsable === 'cliente') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300 whitespace-nowrap">
          <User className="h-3.5 w-3.5" />
          Pendiente de vos
        </span>
      )
    }
    if (responsable === 'qms') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 whitespace-nowrap">
          <Building2 className="h-3.5 w-3.5" />
          Pendiente de QMS
        </span>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Banner resumen: ¿quién tiene la pelota? */}
      {todoCompletado ? (
        <div className="flex items-center gap-3 rounded-lg border-2 border-green-300 bg-green-50 p-4">
          <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-900">¡Trámite completado! Ya no tenés nada pendiente.</p>
        </div>
      ) : hayPendienteCliente ? (
        <div className="flex items-center gap-3 rounded-lg border-2 border-orange-300 bg-orange-50 p-4">
          <User className="h-6 w-6 text-orange-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-orange-900">Necesitamos algo de vos</p>
            <p className="text-xs text-orange-800">Hay uno o más pasos que dependen de vos para poder avanzar. Los marcamos abajo con «Pendiente de vos».</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
          <Building2 className="h-6 w-6 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-900">Estamos trabajando en tu trámite</p>
            <p className="text-xs text-blue-800">Por ahora no tenés nada pendiente. Te avisamos cuando necesitemos algo de tu parte.</p>
          </div>
        </div>
      )}

      {acciones.map((accion, index) => (
        <Card key={`${accion.tipo}-${index}`} className={`border-2 ${getColorPorUrgencia(accion.urgencia)}`}>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="flex items-center gap-3">
                {getIconoPorUrgencia(accion.urgencia)}
                {accion.titulo}
              </CardTitle>
              {renderBadgeResponsable(accion.responsable)}
            </div>
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

            {accion.responsable === 'cliente' && (
              <div className="mt-3 bg-white border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-900">
                  <strong>⚠️ Acción requerida:</strong> Este paso depende de vos para poder continuar con el trámite.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
