-- Agrega el % de descuento por transferencia a la configuración.
-- Columna aditiva con default: segura para `migrate deploy` sobre datos existentes.
ALTER TABLE "Config" ADD COLUMN IF NOT EXISTS "descuentoTransferencia" DOUBLE PRECISION NOT NULL DEFAULT 3;
