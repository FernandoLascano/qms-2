-- Un lead cargado a mano tras un WhatsApp o una llamada puede no tener email.
-- El índice único sigue: en Postgres varios NULL no chocan entre sí.
-- Aditiva e idempotente: sólo relaja una restricción.
ALTER TABLE "Lead" ALTER COLUMN "email" DROP NOT NULL;
