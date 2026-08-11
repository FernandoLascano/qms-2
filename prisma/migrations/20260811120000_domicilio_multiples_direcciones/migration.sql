-- Múltiples direcciones de sede + dirección elegida por cliente. Aditiva e idempotente.
ALTER TABLE "Config" ADD COLUMN IF NOT EXISTS "domicilioSedeDirecciones" TEXT[] NOT NULL DEFAULT ARRAY['Ituzaingó 87','Ituzaingó 87, 5to Piso','Pasaje Chagas 6043']::TEXT[];
ALTER TABLE "DomicilioSede" ADD COLUMN IF NOT EXISTS "direccion" TEXT;
