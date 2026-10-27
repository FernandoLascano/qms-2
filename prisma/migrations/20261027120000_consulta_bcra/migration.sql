-- Historial de consultas a la Central de Deudores del BCRA (clientes con domicilio en sede).
CREATE TABLE "ConsultaBcra" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "periodo" TEXT,
    "peorSituacion" INTEGER NOT NULL DEFAULT 0,
    "deudaTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "entidades" JSONB NOT NULL,
    "historial" JSONB NOT NULL,
    "chequesRechazados" INTEGER NOT NULL DEFAULT 0,
    "chequesSinPagar" INTEGER NOT NULL DEFAULT 0,
    "cheques" JSONB NOT NULL,
    "error" TEXT,
    "consultadoEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultaBcra_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConsultaBcra_tramiteId_consultadoEl_idx" ON "ConsultaBcra"("tramiteId", "consultadoEl");
CREATE INDEX "ConsultaBcra_cuit_consultadoEl_idx" ON "ConsultaBcra"("cuit", "consultadoEl");

ALTER TABLE "ConsultaBcra" ADD CONSTRAINT "ConsultaBcra_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConsultaBcra" ENABLE ROW LEVEL SECURITY;
