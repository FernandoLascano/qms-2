-- Versiones del contrato de domicilio: los datos con que se generó cada uno.
-- Aditiva e idempotente: tabla nueva.

CREATE TABLE IF NOT EXISTS "ContratoDomicilioVersion" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "datos" JSONB NOT NULL,
    "formato" TEXT NOT NULL,
    "generadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContratoDomicilioVersion_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ContratoDomicilioVersion" ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS "ContratoDomicilioVersion_tramiteId_version_key" ON "ContratoDomicilioVersion"("tramiteId", "version");

DO $$ BEGIN
  ALTER TABLE "ContratoDomicilioVersion" ADD CONSTRAINT "ContratoDomicilioVersion_tramiteId_fkey"
    FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
