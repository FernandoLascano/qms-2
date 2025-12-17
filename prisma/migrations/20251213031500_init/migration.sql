-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('CLIENTE', 'ADMIN', 'ABOGADO');

-- CreateEnum
CREATE TYPE "Jurisdiccion" AS ENUM ('CORDOBA', 'CABA');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('BASICO', 'EMPRENDEDOR', 'PREMIUM');

-- CreateEnum
CREATE TYPE "EstadoTramite" AS ENUM ('INICIADO', 'EN_PROCESO', 'ESPERANDO_CLIENTE', 'ESPERANDO_APROBACION', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('DNI_SOCIO', 'CUIT_SOCIO', 'COMPROBANTE_DOMICILIO', 'COMPROBANTE_DEPOSITO', 'ESTATUTO_FIRMADO', 'ACTA_CONSTITUTIVA', 'CERTIFICACION_FIRMA', 'RESOLUCION_FINAL', 'CONSTANCIA_CUIT', 'OTROS');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('PENDIENTE', 'EN_REVISION', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "ConceptoPago" AS ENUM ('HONORARIOS_BASICO', 'HONORARIOS_EMPRENDEDOR', 'HONORARIOS_PREMIUM', 'TASA_RETRIBUTIVA', 'TASA_RESERVA_NOMBRE', 'PUBLICACION_BOLETIN', 'CERTIFICACION_FIRMA', 'OTROS');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('MERCADO_PAGO', 'TRANSFERENCIA', 'EFECTIVO', 'TARJETA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PROCESANDO', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('INFO', 'EXITO', 'ALERTA', 'ERROR', 'ACCION_REQUERIDA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'CLIENTE',
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tramite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jurisdiccion" "Jurisdiccion" NOT NULL,
    "plan" "Plan" NOT NULL,
    "estadoGeneral" "EstadoTramite" NOT NULL DEFAULT 'INICIADO',
    "denominacionSocial1" TEXT NOT NULL,
    "denominacionSocial2" TEXT,
    "denominacionSocial3" TEXT,
    "denominacionAprobada" TEXT,
    "objetoSocial" TEXT NOT NULL,
    "capitalSocial" DOUBLE PRECISION NOT NULL,
    "porcentajeIntegracion" INTEGER NOT NULL DEFAULT 25,
    "domicilioLegal" TEXT NOT NULL,
    "socios" JSONB NOT NULL,
    "administradores" JSONB NOT NULL,
    "formularioCompleto" BOOLEAN NOT NULL DEFAULT false,
    "denominacionReservada" BOOLEAN NOT NULL DEFAULT false,
    "capitalDepositado" BOOLEAN NOT NULL DEFAULT false,
    "tasaPagada" BOOLEAN NOT NULL DEFAULT false,
    "documentosRevisados" BOOLEAN NOT NULL DEFAULT false,
    "documentosFirmados" BOOLEAN NOT NULL DEFAULT false,
    "tramiteIngresado" BOOLEAN NOT NULL DEFAULT false,
    "sociedadInscripta" BOOLEAN NOT NULL DEFAULT false,
    "fechaReservaNombre" TIMESTAMP(3),
    "fechaDepositoCapital" TIMESTAMP(3),
    "fechaPagoTasa" TIMESTAMP(3),
    "fechaIngresoTramite" TIMESTAMP(3),
    "fechaInscripcion" TIMESTAMP(3),
    "cuit" TEXT,
    "matricula" TEXT,
    "numeroResolucion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tramite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "url" TEXT NOT NULL,
    "tamanio" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'PENDIENTE',
    "fechaSubida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAprobacion" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "concepto" "ConceptoPago" NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'ARS',
    "metodoPago" "MetodoPago",
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "paymentId" TEXT,
    "preferenceId" TEXT,
    "fechaPago" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tramiteId" TEXT,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensaje" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "esAdmin" BOOLEAN NOT NULL DEFAULT false,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialEstado" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "estadoAnterior" "EstadoTramite",
    "estadoNuevo" "EstadoTramite" NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialEstado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionSistema" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionSistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanPrecio" (
    "id" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT NOT NULL,
    "caracteristicas" JSONB NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanPrecio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GastoJurisdiccion" (
    "id" TEXT NOT NULL,
    "jurisdiccion" "Jurisdiccion" NOT NULL,
    "tasaRetributiva" DOUBLE PRECISION NOT NULL,
    "tasaReservaNombre" DOUBLE PRECISION,
    "publicacionBoletin" DOUBLE PRECISION,
    "certificacionFirma" DOUBLE PRECISION,
    "observaciones" TEXT,
    "vigenciaDesde" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GastoJurisdiccion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_paymentId_key" ON "Pago"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionSistema_clave_key" ON "ConfiguracionSistema"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "PlanPrecio_plan_key" ON "PlanPrecio"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "GastoJurisdiccion_jurisdiccion_key" ON "GastoJurisdiccion"("jurisdiccion");

-- AddForeignKey
ALTER TABLE "Tramite" ADD CONSTRAINT "Tramite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialEstado" ADD CONSTRAINT "HistorialEstado_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
