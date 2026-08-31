-- Sistema comercial de leads, fase 1.
--
-- Todo aditivo: se agregan valores de enum, un enum nuevo y columnas con
-- default. No hay ALTER destructivo ni DROP, así que volver el código atrás no
-- deja la base inconsistente: las columnas quedan sin leerse.

-- Estado nuevo: la pelota está del lado del cliente.
ALTER TYPE "LeadEstado" ADD VALUE IF NOT EXISTS 'ESPERANDO_CLIENTE';

-- Por qué se pierde un lead. Sin motivo, un lead perdido no enseña nada.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadMotivoPerdida') THEN
    CREATE TYPE "LeadMotivoPerdida" AS ENUM (
      'NO_ENTENDIO',
      'SIN_DOMICILIO',
      'NO_DEFINIO',
      'PRECIO',
      'LO_HIZO_OTRO',
      'NO_CONTESTA',
      'OTRO'
    );
  END IF;
END
$$;

ALTER TABLE "Tramite"
  ADD COLUMN IF NOT EXISTS "leadGanadoAt"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "leadMotivoPerdida"  "LeadMotivoPerdida",
  ADD COLUMN IF NOT EXISTS "leadMotivoNota"     TEXT,
  ADD COLUMN IF NOT EXISTS "leadToquesEnviados" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "leadUltimoToque"    TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Tramite_formularioCompleto_leadToquesEnviados_updatedAt_idx"
  ON "Tramite" ("formularioCompleto", "leadToquesEnviados", "updatedAt");

-- Marca como ganados los borradores de clientes que después sí enviaron un
-- trámite. Hoy la pantalla los esconde, así que esas conversiones nunca se
-- vieron: son 4 al momento de escribir esto.
UPDATE "Tramite" t
SET "leadEstado" = 'CONVERTIDO',
    "leadGanadoAt" = COALESCE(t."leadGanadoAt", NOW())
WHERE t."formularioCompleto" = false
  AND t."leadEstado" <> 'CONVERTIDO'
  AND EXISTS (
    SELECT 1 FROM "Tramite" otro
    WHERE otro."userId" = t."userId"
      AND otro."formularioCompleto" = true
  );
