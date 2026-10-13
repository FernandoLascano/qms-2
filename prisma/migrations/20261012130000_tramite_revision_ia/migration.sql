-- Revisión automática del formulario (lo que marcó la IA cuando el cliente lo
-- envió). Aditiva e idempotente: columna nueva, nullable.

ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "revisionIA" JSONB;
