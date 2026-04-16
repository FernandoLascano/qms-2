-- CreateEnum
CREATE TYPE "PartnerDiscountType" AS ENUM ('MONTO', 'PORCENTAJE');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "partnerId" TEXT,
ADD COLUMN "referredAt" TIMESTAMP(3),
ADD COLUMN "referralSource" TEXT;

-- CreateTable
CREATE TABLE "Partner" (
  "id" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "logoUrl" TEXT,
  "beneficios" JSONB,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "aplicaDescuento" BOOLEAN NOT NULL DEFAULT false,
  "descuentoTipo" "PartnerDiscountType",
  "descuentoValor" DOUBLE PRECISION,
  "aplicaComision" BOOLEAN NOT NULL DEFAULT false,
  "comisionPorcentaje" DOUBLE PRECISION,
  "condicionesNotas" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralClick" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "ip" TEXT,
  "userAgent" TEXT,
  "referrer" TEXT,
  "landingPath" TEXT,
  "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerConversion" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "pagoId" TEXT,
  "montoCobrado" DOUBLE PRECISION NOT NULL,
  "metodoPago" TEXT,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "descuentoAplicado" BOOLEAN NOT NULL DEFAULT false,
  "descuentoTipoSnapshot" "PartnerDiscountType",
  "descuentoValorSnapshot" DOUBLE PRECISION,
  "comisionAplicada" BOOLEAN NOT NULL DEFAULT false,
  "comisionPorcentajeSnapshot" DOUBLE PRECISION,
  "comisionEstimada" DOUBLE PRECISION,
  "convertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PartnerConversion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");

-- CreateIndex
CREATE INDEX "Partner_activo_idx" ON "Partner"("activo");

-- CreateIndex
CREATE INDEX "ReferralClick_partnerId_clickedAt_idx" ON "ReferralClick"("partnerId", "clickedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerConversion_userId_key" ON "PartnerConversion"("userId");

-- CreateIndex
CREATE INDEX "PartnerConversion_partnerId_convertedAt_idx" ON "PartnerConversion"("partnerId", "convertedAt");

-- CreateIndex
CREATE INDEX "PartnerConversion_sourceType_sourceId_idx" ON "PartnerConversion"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "User_partnerId_idx" ON "User"("partnerId");

-- AddForeignKey
ALTER TABLE "User"
ADD CONSTRAINT "User_partnerId_fkey"
FOREIGN KEY ("partnerId")
REFERENCES "Partner"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralClick"
ADD CONSTRAINT "ReferralClick_partnerId_fkey"
FOREIGN KEY ("partnerId")
REFERENCES "Partner"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerConversion"
ADD CONSTRAINT "PartnerConversion_partnerId_fkey"
FOREIGN KEY ("partnerId")
REFERENCES "Partner"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerConversion"
ADD CONSTRAINT "PartnerConversion_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
