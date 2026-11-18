-- Rastro de IP y navegador en altas de cuenta y de trámite (pedido tras el
-- pentest no autorizado del 18/11/2026: Vercel no da la IP en el plan Hobby).
-- Aditiva: tabla nueva, sin claves foráneas para que el rastro sobreviva
-- aunque se borre el usuario o el trámite.

CREATE TABLE IF NOT EXISTS "EventoSeguridad" (
    "id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "userId" TEXT,
    "tramiteId" TEXT,
    "email" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "pais" TEXT,
    "ciudad" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventoSeguridad_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "EventoSeguridad" ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS "EventoSeguridad_createdAt_idx" ON "EventoSeguridad"("createdAt");
CREATE INDEX IF NOT EXISTS "EventoSeguridad_userId_idx" ON "EventoSeguridad"("userId");
CREATE INDEX IF NOT EXISTS "EventoSeguridad_ip_idx" ON "EventoSeguridad"("ip");
