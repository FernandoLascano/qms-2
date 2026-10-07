-- Valores por defecto del contrato de domicilio y firmante del prestador.
-- Aditiva e idempotente: columnas de texto con valor por defecto vacío.

ALTER TABLE "Config" ADD COLUMN IF NOT EXISTS "contratoDomicilioMultaDiaria" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Config" ADD COLUMN IF NOT EXISTS "contratoDomicilioFianzaMaxima" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Config" ADD COLUMN IF NOT EXISTS "prestadorRepresentante" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Config" ADD COLUMN IF NOT EXISTS "prestadorDni" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Config" ADD COLUMN IF NOT EXISTS "prestadorCaracter" TEXT NOT NULL DEFAULT '';
