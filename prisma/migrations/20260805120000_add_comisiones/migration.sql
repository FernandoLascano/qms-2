-- Módulo de liquidación de comisiones (cláusula 4 del contrato asociativo).
-- Migración aditiva e idempotente: segura para `migrate deploy` sobre datos existentes.

-- 1) Porcentajes del esquema en la Config (valores en %; 30 = 30%)
ALTER TABLE "Config" ADD COLUMN IF NOT EXISTS "comisionMwPct" DOUBLE PRECISION NOT NULL DEFAULT 30;
ALTER TABLE "Config" ADD COLUMN IF NOT EXISTS "comisionOperadorPct" DOUBLE PRECISION NOT NULL DEFAULT 50;
ALTER TABLE "Config" ADD COLUMN IF NOT EXISTS "comisionFondoFernandoPct" DOUBLE PRECISION NOT NULL DEFAULT 12;
ALTER TABLE "Config" ADD COLUMN IF NOT EXISTS "comisionFondoJustinianoPct" DOUBLE PRECISION NOT NULL DEFAULT 8;
ALTER TABLE "Config" ADD COLUMN IF NOT EXISTS "comisionOriginacionPct" DOUBLE PRECISION NOT NULL DEFAULT 30;

-- 2) Enums
DO $$ BEGIN CREATE TYPE "Originador" AS ENUM ('NINGUNO', 'FERNANDO', 'JUSTINIANO', 'MW'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "OrigenMovimiento" AS ENUM ('PAGO', 'MANUAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BeneficiarioComision" AS ENUM ('FERNANDO', 'JUSTINIANO', 'MW'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Movimientos de comisión (cada ingreso = base de reparto)
CREATE TABLE IF NOT EXISTS "MovimientoComision" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "cliente" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "originador" "Originador" NOT NULL DEFAULT 'NINGUNO',
    "origen" "OrigenMovimiento" NOT NULL DEFAULT 'MANUAL',
    "pagoId" TEXT,
    "tramiteId" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MovimientoComision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MovimientoComision_pagoId_key" ON "MovimientoComision"("pagoId");
CREATE INDEX IF NOT EXISTS "MovimientoComision_fecha_idx" ON "MovimientoComision"("fecha");
CREATE INDEX IF NOT EXISTS "MovimientoComision_originador_idx" ON "MovimientoComision"("originador");

DO $$ BEGIN
  ALTER TABLE "MovimientoComision" ADD CONSTRAINT "MovimientoComision_pagoId_fkey"
    FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4) Liquidaciones pagadas (snapshot por período + beneficiario)
CREATE TABLE IF NOT EXISTS "LiquidacionPago" (
    "id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "beneficiario" "BeneficiarioComision" NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fechaPago" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LiquidacionPago_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "LiquidacionPago_periodo_beneficiario_key" ON "LiquidacionPago"("periodo", "beneficiario");

-- 5) Distribuciones efectivas del Fondo de Desarrollo
CREATE TABLE IF NOT EXISTS "DistribucionFondo" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "beneficiario" "BeneficiarioComision" NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DistribucionFondo_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "DistribucionFondo_fecha_idx" ON "DistribucionFondo"("fecha");
