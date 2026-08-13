-- Agrega el tipo de documento BORRADOR (para enviar el borrador al cliente). Idempotente.
ALTER TYPE "TipoDocumento" ADD VALUE IF NOT EXISTS 'BORRADOR';
