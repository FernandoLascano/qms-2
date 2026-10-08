-- Contratos de domicilio firmados (subidos por el admin) y su historial.
-- Aditiva e idempotente: tabla nueva, no toca datos existentes.

CREATE TABLE IF NOT EXISTS "ContratoDomicilioFirmado" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "archivoPath" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "tamanio" INTEGER NOT NULL,
    "fechaFirma" TIMESTAMP(3) NOT NULL,
    "cargadoPor" TEXT,
    "contratoVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContratoDomicilioFirmado_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ContratoDomicilioFirmado" ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS "ContratoDomicilioFirmado_tramiteId_createdAt_idx" ON "ContratoDomicilioFirmado"("tramiteId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "ContratoDomicilioFirmado" ADD CONSTRAINT "ContratoDomicilioFirmado_tramiteId_fkey"
    FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ContratoDomicilioFirmado" ADD CONSTRAINT "ContratoDomicilioFirmado_contratoVersionId_fkey"
    FOREIGN KEY ("contratoVersionId") REFERENCES "ContratoDomicilioVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
