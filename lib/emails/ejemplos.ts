import { SITE_URL } from '@/lib/seo/site'

/**
 * Los mails automáticos con datos de ejemplo: los usan la vista previa de
 * plantillas y el «Enviar email de prueba» de Configuración, así los dos
 * muestran lo mismo que hoy sale de lib/emails/send.ts.
 *
 * El asunto es el que pone send.ts con estos mismos datos.
 */
export interface EjemploEmail {
  /** Nombre de la función en lib/emails/templates.tsx. */
  template: string
  etiqueta: string
  asunto: string
  datos: Record<string, unknown>
}

export const EJEMPLOS_EMAIL: EjemploEmail[] = [
  {
    template: 'emailBienvenida',
    etiqueta: 'Bienvenida (registro)',
    asunto: '¡Bienvenido a QuieroMiSAS! Tu cuenta ha sido creada',
    datos: { nombre: 'Fernando' },
  },
  {
    template: 'emailVerificarCuenta',
    etiqueta: 'Verificar cuenta',
    asunto: 'Confirmá tu email para activar tu cuenta',
    datos: { nombre: 'Fernando', verifyUrl: `${SITE_URL}/verificar-email?token=ejemplo` },
  },
  {
    template: 'emailRecuperarPassword',
    etiqueta: 'Recuperar contraseña',
    asunto: 'Cambiá tu contraseña de QuieroMiSAS',
    datos: { nombre: 'Fernando', resetUrl: `${SITE_URL}/restablecer-contrasena?token=ejemplo` },
  },
  {
    template: 'emailTramiteEnviado',
    etiqueta: 'Trámite recibido',
    asunto: '✅ Trámite recibido - Mi Empresa S.A.S.',
    datos: { nombre: 'Fernando', tramiteId: 'cltx123', denominacion: 'Mi Empresa S.A.S.' },
  },
  {
    template: 'emailValidacionTramite',
    etiqueta: 'Trámite validado',
    asunto: '✅ Trámite validado - Mi Empresa S.A.S.',
    datos: { nombre: 'Fernando', denominacion: 'Mi Empresa S.A.S.', validado: true, observaciones: undefined, tramiteId: 'cltx123' },
  },
  {
    template: 'emailPagoPendiente',
    etiqueta: 'Pago requerido',
    asunto: '💳 Pago requerido - Plan Emprendedor',
    datos: { nombre: 'Fernando', concepto: 'Plan Emprendedor', monto: 320000, tramiteId: 'cltx123' },
  },
  {
    template: 'emailDocumentoRechazado',
    etiqueta: 'Documento a corregir',
    asunto: '📄 Documento requiere corrección - DNI',
    datos: { nombre: 'Fernando', nombreDocumento: 'DNI', observaciones: 'La imagen está borrosa. Por favor subí una foto más nítida.', tramiteId: 'cltx123' },
  },
  {
    template: 'emailEtapaCompletada',
    etiqueta: 'Etapa completada',
    asunto: '🎯 Progreso en tu trámite - Reserva de denominación aprobada',
    datos: { nombre: 'Fernando', etapa: 'Reserva de denominación aprobada', tramiteId: 'cltx123' },
  },
  {
    template: 'emailSociedadInscripta',
    etiqueta: 'Sociedad inscripta',
    asunto: '¡Felicitaciones! Tu sociedad está inscripta - Mi Empresa S.A.S.',
    datos: { nombre: 'Fernando', plan: 'BASICO', denominacion: 'Mi Empresa S.A.S.', cuit: '30-71234567-8', matricula: '12345', tramiteId: 'cltx123' },
  },
  {
    template: 'emailNotificacion',
    etiqueta: 'Notificación general',
    asunto: 'Novedad en tu trámite',
    datos: { nombre: 'Fernando', titulo: 'Novedad en tu trámite', mensaje: 'Hemos actualizado el estado de tu solicitud. Ingresá al panel para ver los detalles.', tramiteId: 'cltx123' },
  },
  {
    template: 'emailRecordatorioPago',
    etiqueta: 'Recordatorio de pago',
    asunto: '⏰ Recordatorio: Pago pendiente - Plan Emprendedor',
    datos: { nombre: 'Fernando', concepto: 'Plan Emprendedor', monto: 320000, diasPendientes: 3, tramiteId: 'cltx123' },
  },
  {
    template: 'emailRecordatorioDocumento',
    etiqueta: 'Recordatorio de documento',
    asunto: '⏰ Recordatorio: Documento pendiente - DNI',
    datos: { nombre: 'Fernando', nombreDocumento: 'DNI', observaciones: 'Subir documento de identidad', diasPendientes: 2, tramiteId: 'cltx123' },
  },
  {
    template: 'emailRecordatorioTramiteEstancado',
    etiqueta: 'Trámite frenado',
    asunto: '👋 ¿Necesitas ayuda con tu trámite?',
    datos: { nombre: 'Fernando', etapaActual: 'Pago pendiente', diasEstancado: 7, tramiteId: 'cltx123' },
  },
  {
    template: 'emailLeadSecuencia',
    etiqueta: 'Secuencia de leads',
    asunto: 'Tu S.A.S. puede tener sede en Córdoba aunque no vivas ahí',
    datos: {
      nombre: 'Fernando',
      cuerpo:
        'Tu formulario quedó guardado en el paso del domicilio. Es la duda más común, así que te la aclaramos:\n\n' +
        '· La sede social tiene que estar en Córdoba.\n' +
        '· No hace falta que vivas ahí ni que alquiles una oficina.\n' +
        '· Si no tenés una dirección para usar, te ofrecemos la nuestra con el servicio de domicilio, que tiene un costo aparte.\n\n' +
        'Una vez inscripta, tu sociedad puede trabajar en todo el país.',
      tramiteId: 'cltx123',
      ultimo: false,
    },
  },
  {
    template: 'emailAlertaBcra',
    etiqueta: 'Alerta BCRA (domicilio)',
    asunto: 'BCRA: Mi Empresa S.A.S. empeoró su situación',
    datos: {
      nombre: 'Fernando',
      alertas: [
        {
          denominacion: 'Mi Empresa S.A.S.',
          tramiteId: 'cltx123',
          personas: [
            { nombre: 'Juan Pérez', rol: 'SOCIO_ADMINISTRADOR', nivel: 'RIESGO', situacion: 'Situación 3 · Riesgo medio', chequesNuevos: 0 },
            { nombre: 'Mi Empresa S.A.S.', rol: 'SOCIEDAD', nivel: 'ATENCION', situacion: '', chequesNuevos: 1 },
          ],
        },
      ],
    },
  },
  {
    template: 'emailAlertaDenominacion',
    etiqueta: 'Denominación por vencer',
    asunto: '⚠️ Alerta: Denominación próxima a vencer - Mi Empresa S.A.S.',
    datos: { nombre: 'Fernando', denominacion: 'Mi Empresa S.A.S.', diasParaVencer: 5, tramiteId: 'cltx123' },
  },
]

export const ejemploDe = (template: string) => EJEMPLOS_EMAIL.find((e) => e.template === template)
