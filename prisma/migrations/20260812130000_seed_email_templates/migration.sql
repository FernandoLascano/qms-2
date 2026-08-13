-- Plantillas de email editables (Fase E3). Idempotente: no pisa ediciones existentes.
-- Se crean DESACTIVADAS (isActive=false): no cambian ningún email hasta que el admin
-- las active desde el panel. El cuerpo se envuelve en el layout de marca al enviarse.

INSERT INTO "EmailTemplate" ("id", "name", "displayName", "subject", "bodyHtml", "variables", "category", "isSystem", "isActive", "createdAt", "updatedAt")
VALUES
(
  gen_random_uuid()::text, 'emailBienvenida', 'Bienvenida', '¡Bienvenido/a a QuieroMiSAS!',
  $html$<p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.7;">¡Gracias por sumarte a QuieroMiSAS! Desde tu panel ya podés empezar a constituir tu SAS 100% online.</p>
<p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.7;">Ante cualquier duda, estamos para ayudarte.</p>$html$,
  ARRAY['nombre']::text[], 'transaccional', true, false, NOW(), NOW()
),
(
  gen_random_uuid()::text, 'emailTramiteEnviado', 'Trámite recibido', '✅ Trámite recibido - {{denominacion}}',
  $html$<p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.7;">Recibimos el formulario de constitución de <strong>{{denominacion}}</strong>. Nuestro equipo lo va a revisar y te vamos a contactar para coordinar el pago de honorarios y avanzar con la constitución.</p>
<p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.7;">Podés seguir el estado en todo momento desde tu panel.</p>$html$,
  ARRAY['nombre','denominacion','tramiteId']::text[], 'transaccional', true, false, NOW(), NOW()
),
(
  gen_random_uuid()::text, 'emailEtapaCompletada', 'Progreso del trámite', '🎯 Progreso en tu trámite - {{etapa}}',
  $html$<p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.7;">¡Buenas noticias! Avanzamos con tu trámite: se completó la etapa <strong>{{etapa}}</strong>.</p>
<p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.7;">Podés ver el detalle y los próximos pasos desde tu panel.</p>$html$,
  ARRAY['nombre','etapa','tramiteId']::text[], 'transaccional', true, false, NOW(), NOW()
),
(
  gen_random_uuid()::text, 'emailPagoPendiente', 'Pago pendiente', '💳 Pago requerido - {{concepto}}',
  $html$<p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.7;">Tenés un pago pendiente para continuar con tu trámite:</p>
<p style="margin:0 0 16px 0;color:#111827;font-size:16px;line-height:1.7;"><strong>{{concepto}}</strong> — $ {{monto}}</p>
<p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.7;">Podés abonarlo desde tu panel. Cualquier duda, escribinos.</p>$html$,
  ARRAY['nombre','concepto','monto','tramiteId']::text[], 'transaccional', true, false, NOW(), NOW()
),
(
  gen_random_uuid()::text, 'emailNotificacion', 'Notificación genérica', '{{titulo}}',
  $html$<p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.7;">{{mensaje}}</p>$html$,
  ARRAY['nombre','titulo','mensaje','tramiteId']::text[], 'transaccional', true, false, NOW(), NOW()
),
(
  gen_random_uuid()::text, 'emailSociedadInscripta', 'Sociedad inscripta', '🎉 ¡Tu sociedad está inscripta! - {{denominacion}}',
  $html$<p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.7;">¡Felicitaciones! Tu sociedad <strong>{{denominacion}}</strong> ya está inscripta.</p>
<p style="margin:0 0 16px 0;color:#111827;font-size:15px;line-height:1.7;">CUIT: <strong>{{cuit}}</strong> · Matrícula: <strong>{{matricula}}</strong></p>
<p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.7;">Ya podés descargar la documentación oficial desde tu panel. ¡Gracias por confiar en QuieroMiSAS!</p>$html$,
  ARRAY['nombre','denominacion','cuit','matricula','tramiteId']::text[], 'transaccional', true, false, NOW(), NOW()
)
ON CONFLICT ("name") DO NOTHING;
