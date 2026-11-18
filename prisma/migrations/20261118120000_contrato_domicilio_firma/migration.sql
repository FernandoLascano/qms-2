-- Firma electrónica del contrato de domicilio dentro de QMS.
-- Aditiva e idempotente: tabla nueva, no toca datos existentes.

CREATE TABLE IF NOT EXISTS "ContratoDomicilioFirma" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "contratoVersionId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "pdfPath" TEXT NOT NULL,
    "pdfHash" TEXT NOT NULL,
    "firmaPrestador" JSONB NOT NULL,
    "firmasCliente" JSONB,
    "anexo" JSONB,
    "eventos" JSONB NOT NULL DEFAULT '[]',
    "codigoHash" TEXT,
    "codigoVence" TIMESTAMP(3),
    "codigoIntentos" INTEGER NOT NULL DEFAULT 0,
    "firmadoId" TEXT,
    "enviadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContratoDomicilioFirma_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ContratoDomicilioFirma" ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS "ContratoDomicilioFirma_firmadoId_key" ON "ContratoDomicilioFirma"("firmadoId");
CREATE INDEX IF NOT EXISTS "ContratoDomicilioFirma_tramiteId_createdAt_idx" ON "ContratoDomicilioFirma"("tramiteId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "ContratoDomicilioFirma" ADD CONSTRAINT "ContratoDomicilioFirma_tramiteId_fkey"
    FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ContratoDomicilioFirma" ADD CONSTRAINT "ContratoDomicilioFirma_contratoVersionId_fkey"
    FOREIGN KEY ("contratoVersionId") REFERENCES "ContratoDomicilioVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ContratoDomicilioFirma" ADD CONSTRAINT "ContratoDomicilioFirma_firmadoId_fkey"
    FOREIGN KEY ("firmadoId") REFERENCES "ContratoDomicilioFirmado"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
