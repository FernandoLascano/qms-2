-- Índices para las consultas más frecuentes (auditoría de rendimiento, 22/10/2026).
-- Sólo agrega índices: no toca datos. Idempotente (IF NOT EXISTS).

-- Polling de notificaciones (cada 60 s por usuario conectado) y FK al trámite.
CREATE INDEX IF NOT EXISTS "Notificacion_userId_leida_createdAt_idx" ON "Notificacion"("userId", "leida", "createdAt");
CREATE INDEX IF NOT EXISTS "Notificacion_tramiteId_idx" ON "Notificacion"("tramiteId");

-- Contador de no leídos de la bandeja (polling admin) y respuestas por hilo.
CREATE INDEX IF NOT EXISTS "Email_direction_status_idx" ON "Email"("direction", "status");
CREATE INDEX IF NOT EXISTS "Email_parentEmailId_idx" ON "Email"("parentEmailId");

-- Calendario (rango de fechas) y FK al trámite.
CREATE INDEX IF NOT EXISTS "Evento_fechaInicio_idx" ON "Evento"("fechaInicio");
CREATE INDEX IF NOT EXISTS "Evento_tramiteId_idx" ON "Evento"("tramiteId");

-- Chat del trámite: mensajes por trámite en orden.
CREATE INDEX IF NOT EXISTS "Mensaje_tramiteId_createdAt_idx" ON "Mensaje"("tramiteId", "createdAt");

-- FKs filtradas sin índice.
CREATE INDEX IF NOT EXISTS "Lead_userId_idx" ON "Lead"("userId");
CREATE INDEX IF NOT EXISTS "MovimientoComision_tramiteId_idx" ON "MovimientoComision"("tramiteId");

-- Ya existe en producción; queda declarado en el schema.
CREATE INDEX IF NOT EXISTS "CuentaBancaria_tramiteId_idx" ON "CuentaBancaria"("tramiteId");
