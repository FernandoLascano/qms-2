-- Marca para sacar un movimiento del reparto sin borrarlo (evita que la
-- sincronización de pagos lo recree). Aditiva e idempotente.
ALTER TABLE "MovimientoComision" ADD COLUMN IF NOT EXISTS "excluido" BOOLEAN NOT NULL DEFAULT false;
