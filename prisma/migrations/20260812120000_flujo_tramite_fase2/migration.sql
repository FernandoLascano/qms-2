-- Fase 2 del flujo de trámite: estados granulares adicionales. Migración aditiva e idempotente.

-- Nuevos estados (booleans)
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "honorariosPagados" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "ciudadanoDigitalOk" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "homonimiaAnalizada" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "cuentaBancariaAbierta" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "borradorEnviado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "borradorAprobadoCliente" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "tramiteObservado" BOOLEAN NOT NULL DEFAULT false;

-- Campos de texto
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "observacionesOrganismo" TEXT;
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "instruccionesFirma" TEXT;

-- Fechas de tracking de cada etapa nueva
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "fechaHonorariosPagados" TIMESTAMP(3);
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "fechaCiudadanoDigitalOk" TIMESTAMP(3);
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "fechaHomonimiaAnalizada" TIMESTAMP(3);
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "fechaCuentaBancariaAbierta" TIMESTAMP(3);
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "fechaBorradorEnviado" TIMESTAMP(3);
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "fechaBorradorAprobadoCliente" TIMESTAMP(3);
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "fechaTramiteObservado" TIMESTAMP(3);
