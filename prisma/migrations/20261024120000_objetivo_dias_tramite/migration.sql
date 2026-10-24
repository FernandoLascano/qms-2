-- Objetivo interno del trámite (días corridos reserva → inscripción). 0 = sin objetivo.
ALTER TABLE "Config" ADD COLUMN IF NOT EXISTS "objetivoDiasTramite" INTEGER NOT NULL DEFAULT 0;
