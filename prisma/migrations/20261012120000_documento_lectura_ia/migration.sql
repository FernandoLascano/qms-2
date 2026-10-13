-- Lectura automática de los comprobantes de pago (lo que leyó la IA y cómo
-- da contra el pago esperado). Aditiva e idempotente: columna nueva, nullable.

ALTER TABLE "Documento" ADD COLUMN IF NOT EXISTS "lecturaIA" JSONB;
