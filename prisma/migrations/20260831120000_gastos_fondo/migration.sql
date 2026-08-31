-- Gastos pagados con plata del Fondo de Desarrollo.
--
-- Hasta ahora el fondo sólo registraba distribuciones —plata que pasa al
-- bolsillo de uno de los dos—, así que un servicio pagado con esa plata no
-- tenía dónde anotarse y el saldo disponible quedaba inflado.
--
-- Aditiva: una tabla nueva, sin tocar nada existente.

CREATE TABLE IF NOT EXISTS "GastoFondo" (
    "id"        TEXT NOT NULL,
    "fecha"     TIMESTAMP(3) NOT NULL,
    "concepto"  TEXT NOT NULL,
    "monto"     DOUBLE PRECISION NOT NULL,
    -- NULL = se reparte entre los dos en la proporción en que se formó el fondo.
    "imputadoA" "BeneficiarioComision",
    "notas"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GastoFondo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "GastoFondo_fecha_idx" ON "GastoFondo"("fecha");
