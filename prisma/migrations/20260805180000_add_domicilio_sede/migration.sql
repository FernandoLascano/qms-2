-- Servicio de domicilio en sede. Migración aditiva e idempotente.

-- Config: dirección de la sede, precio anual y días de alerta
ALTER TABLE "Config" ADD COLUMN IF NOT EXISTS "domicilioSedeDireccion" TEXT NOT NULL DEFAULT 'Ituzaingó 87, 5to Piso, Córdoba';
ALTER TABLE "Config" ADD COLUMN IF NOT EXISTS "domicilioSedePrecioAnual" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Config" ADD COLUMN IF NOT EXISTS "domicilioSedeDiasAlerta" INTEGER NOT NULL DEFAULT 30;

-- Enum de estado
DO $$ BEGIN CREATE TYPE "EstadoDomicilioSede" AS ENUM ('PENDIENTE_CONTACTO', 'ACTIVO', 'CANCELADO'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabla del servicio
CREATE TABLE IF NOT EXISTS "DomicilioSede" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "estado" "EstadoDomicilioSede" NOT NULL DEFAULT 'PENDIENTE_CONTACTO',
    "montoAnual" DOUBLE PRECISION,
    "fechaInicio" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "ultimoCobro" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DomicilioSede_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DomicilioSede_tramiteId_key" ON "DomicilioSede"("tramiteId");
CREATE INDEX IF NOT EXISTS "DomicilioSede_estado_idx" ON "DomicilioSede"("estado");
CREATE INDEX IF NOT EXISTS "DomicilioSede_fechaVencimiento_idx" ON "DomicilioSede"("fechaVencimiento");

DO $$ BEGIN
  ALTER TABLE "DomicilioSede" ADD CONSTRAINT "DomicilioSede_tramiteId_fkey"
    FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
