import { NextRequest, NextResponse } from 'next/server'
import * as templates from '@/lib/emails/templates'

// Datos de ejemplo por template
const sampleData: Record<string, Record<string, unknown>> = {
  emailBienvenida: { nombre: 'Fernando' },
  emailTramiteEnviado: { nombre: 'Fernando', tramiteId: 'cltx123', denominacion: 'Mi Empresa S.A.S.' },
  emailPagoPendiente: { nombre: 'Fernando', concepto: 'Plan Emprendedor', monto: 320000, tramiteId: 'cltx123' },
  emailDocumentoRechazado: { nombre: 'Fernando', nombreDocumento: 'DNI', observaciones: 'La imagen está borrosa. Por favor subí una foto más nítida.', tramiteId: 'cltx123' },
  emailEtapaCompletada: { nombre: 'Fernando', etapa: 'Reserva de denominación aprobada', tramiteId: 'cltx123' },
  emailSociedadInscripta: { nombre: 'Fernando', denominacion: 'Mi Empresa S.A.S.', cuit: '30-71234567-8', matricula: '12345', tramiteId: 'cltx123' },
  emailNotificacion: { nombre: 'Fernando', titulo: 'Novedad en tu trámite', mensaje: 'Hemos actualizado el estado de tu solicitud. Ingresá al panel para ver los detalles.', tramiteId: 'cltx123' },
  emailRecordatorioPago: { nombre: 'Fernando', concepto: 'Plan Emprendedor', monto: 320000, diasPendientes: 3, tramiteId: 'cltx123' },
  emailRecordatorioDocumento: { nombre: 'Fernando', nombreDocumento: 'DNI', observaciones: 'Subir documento de identidad', diasPendientes: 2, tramiteId: 'cltx123' },
  emailRecordatorioTramiteEstancado: { nombre: 'Fernando', etapaActual: 'Pago pendiente', diasEstancado: 7, tramiteId: 'cltx123' },
  emailAlertaDenominacion: { nombre: 'Fernando', denominacion: 'Mi Empresa S.A.S.', diasParaVencer: 5, tramiteId: 'cltx123' },
  emailValidacionTramite: { nombre: 'Fernando', denominacion: 'Mi Empresa S.A.S.', validado: true, observaciones: undefined, tramiteId: 'cltx123' },
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const template = searchParams.get('template') || 'emailBienvenida'

  const templateFn = (templates as Record<string, (data: any) => string>)[template]
  if (!templateFn) {
    return NextResponse.json({ error: `Template "${template}" no encontrado` }, { status: 404 })
  }

  const data = { ...(sampleData[template] || sampleData.emailBienvenida) }
  const nombreParam = searchParams.get('nombre')
  if (nombreParam) data.nombre = nombreParam
  const html = templateFn(data)

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
