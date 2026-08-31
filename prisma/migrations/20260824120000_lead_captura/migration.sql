-- Fase 3: capturar el interés que hoy no deja rastro.
--
-- El formulario de contacto sólo mandaba un email, así que no existe forma de
-- saber cuánta gente escribió: ese número se perdió y no se recupera. Desde
-- ahora queda registrado.
--
-- Aditiva: dos tablas nuevas, un enum nuevo y una FK opcional. No se toca
-- ninguna tabla existente, así que volver el código atrás no rompe nada.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadOrigen') THEN
    CREATE TYPE "LeadOrigen" AS ENUM (
      'FORMULARIO_CONTACTO',
      'CHAT',
      'REGISTRO_SIN_TRAMITE',
      'PARTNER',
      'MANUAL'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "Lead" (
    "id"              TEXT NOT NULL,
    "email"           TEXT NOT NULL,
    "nombre"          TEXT,
    "telefono"        TEXT,
    "origen"          "LeadOrigen" NOT NULL,
    "mensaje"         TEXT,
    "utmSource"       TEXT,
    "utmMedium"       TEXT,
    "utmCampaign"     TEXT,
    "referrer"        TEXT,
    "landingPath"     TEXT,
    "partnerId"       TEXT,
    "estado"          "LeadEstado" NOT NULL DEFAULT 'NUEVO',
    "motivoPerdida"   "LeadMotivoPerdida",
    "motivoNota"      TEXT,
    "ultimoContacto"  TIMESTAMP(3),
    "proximoContacto" TIMESTAMP(3),
    "ganadoAt"        TIMESTAMP(3),
    "userId"          TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Lead_email_key" ON "Lead"("email");
CREATE INDEX IF NOT EXISTS "Lead_estado_createdAt_idx" ON "Lead"("estado", "createdAt");
CREATE INDEX IF NOT EXISTS "Lead_origen_idx" ON "Lead"("origen");

CREATE TABLE IF NOT EXISTS "LeadContacto" (
    "id"        TEXT NOT NULL,
    "leadId"    TEXT NOT NULL,
    "adminId"   TEXT NOT NULL,
    "canal"     "LeadCanal" NOT NULL,
    "nota"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadContacto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LeadContacto_leadId_idx" ON "LeadContacto"("leadId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Lead_partnerId_fkey') THEN
    ALTER TABLE "Lead" ADD CONSTRAINT "Lead_partnerId_fkey"
      FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Lead_userId_fkey') THEN
    ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeadContacto_leadId_fkey') THEN
    ALTER TABLE "LeadContacto" ADD CONSTRAINT "LeadContacto_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeadContacto_adminId_fkey') THEN
    ALTER TABLE "LeadContacto" ADD CONSTRAINT "LeadContacto_adminId_fkey"
      FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;

-- Backfill: los 11 usuarios registrados que nunca abrieron un trámite existen
-- hoy sólo como User y no aparecen en ningún lado del panel comercial.
INSERT INTO "Lead" ("id", "email", "nombre", "telefono", "origen", "userId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  u."email",
  u."name",
  u."phone",
  'REGISTRO_SIN_TRAMITE',
  u."id",
  u."createdAt",
  NOW()
FROM "User" u
WHERE u."rol" = 'CLIENTE'
  AND u."email" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Tramite" t WHERE t."userId" = u."id")
ON CONFLICT ("email") DO NOTHING;
