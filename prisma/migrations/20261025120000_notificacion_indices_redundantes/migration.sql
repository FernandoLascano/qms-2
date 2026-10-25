-- Redundantes: los cubre "Notificacion_userId_leida_createdAt_idx" (mismo prefijo).
DROP INDEX IF EXISTS "Notificacion_userId_idx";
DROP INDEX IF EXISTS "Notificacion_userId_leida_idx";
