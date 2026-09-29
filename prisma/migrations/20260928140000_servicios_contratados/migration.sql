-- Servicios que contrató cada cliente después de la inscripción.
-- Aditiva e idempotente: una tabla y un enum nuevos, sin tocar nada existente.

DO $$ BEGIN CREATE TYPE "EstadoServicioCliente" AS ENUM ('INTERESADO', 'ACTIVO', 'FINALIZADO'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ServicioContratado" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "estado" "EstadoServicioCliente" NOT NULL DEFAULT 'ACTIVO',
    "monto" DOUBLE PRECISION,
    "fechaInicio" TIMESTAMP(3),
    "proximoVencimiento" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServicioContratado_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ServicioContratado_tramiteId_idx" ON "ServicioContratado"("tramiteId");
CREATE INDEX IF NOT EXISTS "ServicioContratado_estado_proximoVencimiento_idx" ON "ServicioContratado"("estado", "proximoVencimiento");

DO $$ BEGIN
  ALTER TABLE "ServicioContratado" ADD CONSTRAINT "ServicioContratado_tramiteId_fkey"
    FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ServicioContratado" ADD CONSTRAINT "ServicioContratado_servicioId_fkey"
    FOREIGN KEY ("servicioId") REFERENCES "ServicioCatalogo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS como defensa en profundidad (Supabase Data API), igual que las tablas de
-- comisiones: Prisma usa el rol postgres con BYPASSRLS y sigue funcionando.
ALTER TABLE "ServicioContratado" ENABLE ROW LEVEL SECURITY;
