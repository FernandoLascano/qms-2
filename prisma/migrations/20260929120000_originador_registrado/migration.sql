-- Originador registrado antes del primer cobro (cláusula 4.2 b del contrato
-- asociativo): se guarda en el trámite y en el lead, con la fecha de registro.
-- Aditiva e idempotente: columnas nuevas con valor por defecto.

ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "originador" "Originador" NOT NULL DEFAULT 'NINGUNO';
ALTER TABLE "Tramite" ADD COLUMN IF NOT EXISTS "originadorRegistradoEn" TIMESTAMP(3);

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "originador" "Originador" NOT NULL DEFAULT 'NINGUNO';
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "originadorRegistradoEn" TIMESTAMP(3);

-- Bono comercial de Fernando por mes (acuerdo aparte con MW, fuera del
-- contrato QMS). Sólo se usa para cargar la liquidación en el sistema de MW.
CREATE TABLE IF NOT EXISTS "BonoComercialMes" (
    "periodo" TEXT NOT NULL,
    "porcentaje" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BonoComercialMes_pkey" PRIMARY KEY ("periodo")
);
ALTER TABLE "BonoComercialMes" ENABLE ROW LEVEL SECURITY;
