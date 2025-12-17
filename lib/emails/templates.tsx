// Plantillas de emails HTML profesionales

interface EmailTemplateProps {
  nombre: string
  [key: string]: any
}

// Template base con estilos
const EmailLayout = ({ children, nombre }: { children: React.ReactNode; nombre: string }) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QuieroMiSAS</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #7c2d12 0%, #991b1b 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">QuieroMiSAS</h1>
                    <p style="margin: 10px 0 0 0; color: #fecaca; font-size: 14px;">Tu plataforma de constitución de sociedades</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
                    ${children}
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                      Este es un email automático, por favor no respondas a este mensaje.
                    </p>
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                      Para consultas, contacta a: <a href="mailto:info@quieromisas.com" style="color: #991b1b; text-decoration: none;">info@quieromisas.com</a>
                    </p>
                    <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} QuieroMiSAS. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

// 1. Email de Bienvenida al Registrarse
export const emailBienvenida = ({ nombre }: EmailTemplateProps) => {
  const content = `
    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af; font-size: 18px; font-weight: bold;">¡Bienvenido a QuieroMiSAS! 🎉</p>
    </div>
    
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      ¡Gracias por confiar en nosotros para la constitución de tu sociedad!
    </p>
    
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Estamos aquí para acompañarte en cada paso del proceso. Nuestra plataforma te permitirá:
    </p>
    
    <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
      <li>Completar tu trámite en línea de forma sencilla</li>
      <li>Hacer seguimiento en tiempo real del progreso</li>
      <li>Subir documentos de manera segura</li>
      <li>Realizar pagos de forma simple</li>
      <li>Comunicarte directamente con nuestro equipo</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/tramite/nuevo" style="display: inline-block; background-color: #991b1b; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Iniciar mi Trámite
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Si tienes alguna pregunta, no dudes en contactarnos. ¡Estamos para ayudarte!
    </p>
  `
  
  return EmailLayout({ children: content, nombre })
}

// 2. Email cuando se envía un trámite
export const emailTramiteEnviado = ({ nombre, tramiteId, denominacion }: EmailTemplateProps) => {
  const content = `
    <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #065f46; font-size: 18px; font-weight: bold;">¡Trámite Recibido! ✅</p>
    </div>
    
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Hemos recibido correctamente tu solicitud de constitución de sociedad.
    </p>
    
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Denominación Social</p>
      <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: bold;">${denominacion}</p>
    </div>
    
    <p style="margin: 20px 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      <strong>Próximos pasos:</strong>
    </p>
    
    <ol style="margin: 0 0 20px 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
      <li>Nuestro equipo revisará tu solicitud en las próximas horas</li>
      <li>Te notificaremos sobre los pagos necesarios</li>
      <li>Te guiaremos en la carga de documentos</li>
      <li>Haremos seguimiento continuo hasta la inscripción final</li>
    </ol>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tramites/${tramiteId}" style="display: inline-block; background-color: #991b1b; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Ver Estado del Trámite
      </a>
    </div>
  `
  
  return EmailLayout({ children: content, nombre })
}

// 3. Email cuando hay un pago pendiente
export const emailPagoPendiente = ({ nombre, concepto, monto, tramiteId }: EmailTemplateProps) => {
  const content = `
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 18px; font-weight: bold;">💳 Pago Requerido</p>
    </div>
    
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Para continuar con tu trámite, necesitamos que realices el siguiente pago:
    </p>
    
    <div style="background-color: #fffbeb; border: 2px solid #fbbf24; border-radius: 6px; padding: 25px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #78350f; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Concepto</p>
      <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; font-weight: bold;">${concepto}</p>
      <p style="margin: 0; color: #f59e0b; font-size: 36px; font-weight: bold;">$${Number(monto).toLocaleString('es-AR')}</p>
    </div>
    
    <p style="margin: 20px 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Una vez realizado el pago, no olvides adjuntar tu comprobante en la plataforma para que podamos verificarlo rápidamente.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tramites/${tramiteId}" style="display: inline-block; background-color: #991b1b; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Realizar Pago
      </a>
    </div>
  `
  
  return EmailLayout({ children: content, nombre })
}

// 4. Email cuando un documento fue rechazado
export const emailDocumentoRechazado = ({ nombre, nombreDocumento, observaciones, tramiteId }: EmailTemplateProps) => {
  const content = `
    <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #991b1b; font-size: 18px; font-weight: bold;">📄 Documento Requiere Corrección</p>
    </div>
    
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Hemos revisado el documento <strong>"${nombreDocumento}"</strong> y necesita algunas correcciones.
    </p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #991b1b; font-size: 14px; font-weight: bold;">Observaciones:</p>
      <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.6;">${observaciones}</p>
    </div>
    
    <p style="margin: 20px 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Por favor, corrige el documento según las indicaciones y súbelo nuevamente.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tramites/${tramiteId}" style="display: inline-block; background-color: #991b1b; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Subir Documento Corregido
      </a>
    </div>
  `
  
  return EmailLayout({ children: content, nombre })
}

// 5. Email cuando una etapa se completa
export const emailEtapaCompletada = ({ nombre, etapa, tramiteId }: EmailTemplateProps) => {
  const content = `
    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af; font-size: 18px; font-weight: bold;">🎯 ¡Progreso en tu Trámite!</p>
    </div>
    
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      ¡Buenas noticias! Hemos completado una etapa importante de tu trámite:
    </p>
    
    <div style="background-color: #eff6ff; border: 1px solid #93c5fd; border-radius: 6px; padding: 25px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: #1e40af; font-size: 20px; font-weight: bold;">✅ ${etapa}</p>
    </div>
    
    <p style="margin: 20px 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Seguimos trabajando en tu trámite. Te mantendremos informado de cada avance.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tramites/${tramiteId}" style="display: inline-block; background-color: #991b1b; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Ver Progreso Completo
      </a>
    </div>
  `
  
  return EmailLayout({ children: content, nombre })
}

// 6. Email cuando la sociedad está inscripta (¡Trámite completo!)
export const emailSociedadInscripta = ({ nombre, denominacion, cuit, matricula, tramiteId }: EmailTemplateProps) => {
  const content = `
    <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #065f46; font-size: 22px; font-weight: bold;">🎉 ¡Felicitaciones! Tu Sociedad Está Inscripta</p>
    </div>
    
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      ¡Excelentes noticias! Tu sociedad ha sido inscripta exitosamente y ya está oficialmente constituida.
    </p>
    
    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 25px; margin: 20px 0;">
      <p style="margin: 0 0 15px 0; color: #065f46; font-size: 16px; font-weight: bold;">Datos Oficiales de tu Sociedad:</p>
      
      <div style="margin: 15px 0;">
        <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px;">Denominación Social</p>
        <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: bold;">${denominacion}</p>
      </div>
      
      ${cuit ? `
      <div style="margin: 15px 0;">
        <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px;">CUIT</p>
        <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: bold;">${cuit}</p>
      </div>
      ` : ''}
      
      ${matricula ? `
      <div style="margin: 15px 0;">
        <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px;">Matrícula</p>
        <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: bold;">${matricula}</p>
      </div>
      ` : ''}
    </div>
    
    <p style="margin: 20px 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      ¡Gracias por confiar en QuieroMiSAS para la constitución de tu sociedad! Estamos orgullosos de haber sido parte de este importante paso.
    </p>
    
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Recuerda que puedes descargar todos los documentos oficiales desde tu panel.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tramites/${tramiteId}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Ver Documentos Oficiales
      </a>
    </div>
    
    <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; font-style: italic;">
      ¡Éxitos en tu nueva empresa! 🚀
    </p>
  `
  
  return EmailLayout({ children: content, nombre })
}

// 7. Email genérico para notificaciones
export const emailNotificacion = ({ nombre, titulo, mensaje, tramiteId }: EmailTemplateProps) => {
  const content = `
    <div style="background-color: #e0e7ff; border-left: 4px solid: #6366f1; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #3730a3; font-size: 18px; font-weight: bold;">${titulo}</p>
    </div>
    
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      ${mensaje}
    </p>
    
    ${tramiteId ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tramites/${tramiteId}" style="display: inline-block; background-color: #991b1b; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Ver Trámite
      </a>
    </div>
    ` : ''}
  `
  
  return EmailLayout({ children: content, nombre })
}

// 8. Recordatorio de pago pendiente
export const emailRecordatorioPago = ({ nombre, concepto, monto, diasPendientes, tramiteId }: EmailTemplateProps) => {
  const content = `
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 18px; font-weight: bold;">⏰ Recordatorio: Pago Pendiente</p>
    </div>
    
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Este es un recordatorio amigable: tienes un pago pendiente hace <strong>${diasPendientes} días</strong>.
    </p>
    
    <div style="background-color: #fffbeb; border: 2px solid #fbbf24; border-radius: 6px; padding: 25px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #78350f; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Concepto</p>
      <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; font-weight: bold;">${concepto}</p>
      <p style="margin: 0; color: #f59e0b; font-size: 36px; font-weight: bold;">$${Number(monto).toLocaleString('es-AR')}</p>
    </div>
    
    <p style="margin: 20px 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Para continuar con tu trámite, por favor realiza este pago a la brevedad. Si ya lo realizaste, no olvides subir el comprobante.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tramites/${tramiteId}" style="display: inline-block; background-color: #991b1b; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Realizar Pago Ahora
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
      Si tienes alguna duda sobre este pago, no dudes en contactarnos.
    </p>
  `
  
  return EmailLayout({ children: content, nombre })
}

// 9. Recordatorio de documento rechazado sin resubir
export const emailRecordatorioDocumento = ({ nombre, nombreDocumento, observaciones, diasPendientes, tramiteId }: EmailTemplateProps) => {
  const content = `
    <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #991b1b; font-size: 18px; font-weight: bold;">⏰ Recordatorio: Documento Pendiente de Corrección</p>
    </div>
    
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Hace <strong>${diasPendientes} días</strong> te solicitamos correcciones en el documento <strong>"${nombreDocumento}"</strong> y aún no lo hemos recibido.
    </p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #991b1b; font-size: 14px; font-weight: bold;">Observaciones originales:</p>
      <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.6;">${observaciones}</p>
    </div>
    
    <p style="margin: 20px 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Para que podamos avanzar con tu trámite, necesitamos que subas el documento corregido lo antes posible.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tramites/${tramiteId}" style="display: inline-block; background-color: #991b1b; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Subir Documento Ahora
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
      Si necesitas ayuda con las correcciones, no dudes en contactarnos.
    </p>
  `
  
  return EmailLayout({ children: content, nombre })
}

// 10. Recordatorio de trámite estancado
export const emailRecordatorioTramiteEstancado = ({ nombre, etapaActual, diasEstancado, tramiteId }: EmailTemplateProps) => {
  const content = `
    <div style="background-color: #e0e7ff; border-left: 4px solid #6366f1; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #3730a3; font-size: 18px; font-weight: bold;">👋 ¿Necesitas ayuda con tu trámite?</p>
    </div>
    
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Notamos que tu trámite lleva <strong>${diasEstancado} días</strong> en la etapa <strong>"${etapaActual}"</strong>.
    </p>
    
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      ¿Hay algo en lo que podamos ayudarte? Estamos aquí para asegurarnos de que tu trámite avance sin problemas.
    </p>
    
    <div style="background-color: #eff6ff; border: 1px solid #93c5fd; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #1e40af; font-size: 14px; font-weight: bold;">Posibles acciones pendientes:</p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
        <li>Verificar si hay pagos pendientes</li>
        <li>Revisar si hay documentos por subir</li>
        <li>Consultar el estado en tu panel</li>
        <li>Contactar a nuestro equipo si tienes dudas</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tramites/${tramiteId}" style="display: inline-block; background-color: #991b1b; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Ver Estado del Trámite
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Estamos para ayudarte. No dudes en escribirnos por el chat de la plataforma o respondiendo este email.
    </p>
  `
  
  return EmailLayout({ children: content, nombre })
}

// 11. Alerta de denominación próxima a vencer (para admin)
export const emailAlertaDenominacion = ({ nombre, denominacion, diasParaVencer, tramiteId }: EmailTemplateProps) => {
  const content = `
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 18px; font-weight: bold;">⚠️ Alerta: Denominación Próxima a Vencer</p>
    </div>
    
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      La reserva de denominación está próxima a vencer en <strong>${diasParaVencer} días</strong>.
    </p>
    
    <div style="background-color: #fffbeb; border: 2px solid #fbbf24; border-radius: 6px; padding: 25px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #78350f; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Denominación</p>
      <p style="margin: 0; color: #1f2937; font-size: 20px; font-weight: bold;">${denominacion}</p>
    </div>
    
    <p style="margin: 20px 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
      <strong>Acción requerida:</strong> Es necesario completar las etapas pendientes antes del vencimiento o renovar la reserva.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/tramites/${tramiteId}" style="display: inline-block; background-color: #991b1b; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Ver Trámite
      </a>
    </div>
  `
  
  return EmailLayout({ children: content, nombre })
}

// 12. Email de validación de trámite
export const emailValidacionTramite = ({ nombre, denominacion, validado, observaciones, tramiteId }: EmailTemplateProps) => {
  const content = `
    ${validado 
      ? `<div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
          <p style="margin: 0; color: #065f46; font-size: 18px; font-weight: bold;">✅ Trámite Validado Exitosamente</p>
        </div>
        
        <p style="margin: 0 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
          Tu trámite de constitución de <strong>${denominacion}</strong> ha sido revisado y validado por nuestro equipo.
        </p>
        
        <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.6;">
          Procederemos con el siguiente paso del proceso. Te mantendremos informado sobre el avance.
        </p>`
      : `<div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
          <p style="margin: 0; color: #991b1b; font-size: 18px; font-weight: bold;">⚠️ Trámite Requiere Correcciones</p>
        </div>
        
        <p style="margin: 0 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
          Hemos revisado tu trámite de constitución de <strong>${denominacion}</strong> y encontramos algunos puntos que requieren atención.
        </p>
        
        ${observaciones 
          ? `<div style="background-color: #fef2f2; border: 2px solid #fca5a5; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #991b1b; font-size: 14px; font-weight: bold; text-transform: uppercase;">Observaciones:</p>
              <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${observaciones}</p>
            </div>`
          : ''
        }
        
        <p style="margin: 20px 0 15px 0; color: #374151; font-size: 15px; line-height: 1.6;">
          Por favor, revisa la información y realiza las correcciones necesarias. Una vez corregido, podrás continuar con el proceso.
        </p>`
    }
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tramites/${tramiteId || ''}" style="display: inline-block; background-color: #991b1b; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Ver Trámite
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Si tienes dudas sobre las correcciones requeridas, no dudes en contactarnos a través del chat de la plataforma.
    </p>
  `
  
  return EmailLayout({ children: content, nombre })
}
