-- Seguimiento comercial de los borradores que el cliente nunca terminó (leads).
-- Todo aditivo con defaults: seguro para `migrate deploy` sobre datos existentes.

DO $$ BEGIN
  CREATE TYPE "LeadEstado" AS ENUM ('NUEVO', 'CONTACTADO', 'EN_CONVERSACION', 'CONVERTIDO', 'DESCARTADO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LeadCanal" AS ENUM ('LLAMADA', 'WHATSAPP', 'EMAIL', 'OTRO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "leadEstado" "LeadEstado" NOT NULL DEFAULT 'NUEVO';
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "leadProximoContacto" TIMESTAMP(3);
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "leadUltimoContacto" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "LeadSeguimiento" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "canal" "LeadCanal" NOT NULL,
    "nota" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadSeguimiento_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LeadSeguimiento_tramiteId_idx" ON "LeadSeguimiento"("tramiteId");
CREATE INDEX IF NOT EXISTS "LeadSeguimiento_createdAt_idx" ON "LeadSeguimiento"("createdAt");
CREATE INDEX IF NOT EXISTS "Tramite_formularioCompleto_leadEstado_idx" ON "Tramite"("formularioCompleto", "leadEstado");

DO $$ BEGIN
  ALTER TABLE "LeadSeguimiento" ADD CONSTRAINT "LeadSeguimiento_tramiteId_fkey"
    FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LeadSeguimiento" ADD CONSTRAINT "LeadSeguimiento_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- RLS defensa en profundidad (PostgREST / Supabase Data API).
-- Prisma con rol postgres mantiene BYPASSRLS.
ALTER TABLE "LeadSeguimiento" ENABLE ROW LEVEL SECURITY;
