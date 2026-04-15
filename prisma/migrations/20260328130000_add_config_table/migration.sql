-- Modelo `Config` y otras tablas estaban en schema.prisma pero sin CREATE en migraciones anteriores;
-- `enable_row_level_security` hace ALTER sobre ellas y el shadow DB fallaba (P1014).
-- IF NOT EXISTS: si la tabla ya existía (p. ej. db push), `migrate deploy` no rompe.
--
-- Nota: todo este SQL debe vivir en esta migración **ya aplicada antes de RLS** (20260328140000):
-- Prisma no aplica en el shadow las migraciones pendientes con timestamp intermedio, solo las
-- que constan como aplicadas en `_prisma_migrations` con replay desde disco.

CREATE TABLE IF NOT EXISTS "Config" (
    "id" TEXT NOT NULL,
    "notificacionesAutomaticas" BOOLEAN NOT NULL DEFAULT true,
    "diasAlertaDenominacion" INTEGER NOT NULL DEFAULT 7,
    "diasAlertaEstancamiento" INTEGER NOT NULL DEFAULT 15,
    "emailRemitente" TEXT NOT NULL DEFAULT 'noreply@quieromisas.com',
    "emailNombreRemitente" TEXT NOT NULL DEFAULT 'QuieroMiSAS',
    "diasVencimientoReserva" INTEGER NOT NULL DEFAULT 30,
    "horasLimiteRespuesta" INTEGER NOT NULL DEFAULT 48,
    "mercadoPagoEnabled" BOOLEAN NOT NULL DEFAULT true,
    "precioBaseSAS" DOUBLE PRECISION NOT NULL DEFAULT 50000,
    "precioPlanEsencial" DOUBLE PRECISION NOT NULL DEFAULT 85000,
    "precioPlanProfesional" DOUBLE PRECISION NOT NULL DEFAULT 120000,
    "precioPlanBasico" DOUBLE PRECISION NOT NULL DEFAULT 285000,
    "precioPlanEmprendedor" DOUBLE PRECISION NOT NULL DEFAULT 320000,
    "precioPlanPremium" DOUBLE PRECISION NOT NULL DEFAULT 390000,
    "smvm" DOUBLE PRECISION NOT NULL DEFAULT 317800,
    "mantenimientoMode" BOOLEAN NOT NULL DEFAULT false,
    "emailForwardingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailForwardingAddress" TEXT NOT NULL DEFAULT 'fernandolascano@martinezwehbe.com',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN CREATE TYPE "EmailDirection" AS ENUM ('INBOUND', 'OUTBOUND'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EmailStatus" AS ENUM ('UNREAD', 'READ', 'REPLIED', 'ARCHIVED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EstadoEnlacePago" AS ENUM ('PENDIENTE', 'PROCESANDO', 'PAGADO', 'VENCIDO', 'CANCELADO'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TipoEvento" AS ENUM ('REUNION_CLIENTE', 'VENCIMIENTO_DENOMINACION', 'VENCIMIENTO_PAGO', 'FECHA_LIMITE_DOCUMENTO', 'FECHA_LIMITE_TRAMITE', 'RECORDATORIO', 'OTRO'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "CuentaBancaria" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "cbu" TEXT NOT NULL,
    "alias" TEXT,
    "titular" TEXT NOT NULL,
    "montoEsperado" DOUBLE PRECISION NOT NULL,
    "fechaInformacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaDeposito" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CuentaBancaria_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EnlacePago" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "enlace" TEXT NOT NULL,
    "estado" "EstadoEnlacePago" NOT NULL DEFAULT 'PENDIENTE',
    "reportadoVencido" BOOLEAN NOT NULL DEFAULT false,
    "fechaEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "fechaPago" TIMESTAMP(3),
    "recordatorio3Dias" BOOLEAN NOT NULL DEFAULT false,
    "recordatorio7Dias" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EnlacePago_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Evento" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoEvento" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "relacionadoCon" TEXT,
    "clienteId" TEXT,
    "adminId" TEXT,
    "ubicacion" TEXT,
    "linkReunion" TEXT,
    "recordatorioEnviado" BOOLEAN NOT NULL DEFAULT false,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Post" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "contenido" JSONB NOT NULL,
    "categoria" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL,
    "autor" TEXT,
    "lectura" TEXT NOT NULL DEFAULT '5 min',
    "imagenHero" TEXT,
    "imagenAlt" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" TEXT[] NOT NULL,
    "canonical" TEXT,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "fechaPublicacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vistas" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Email" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "fromName" TEXT,
    "to" TEXT[] NOT NULL,
    "cc" TEXT[] NOT NULL,
    "replyTo" TEXT,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "s3Key" TEXT,
    "direction" "EmailDirection" NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'UNREAD',
    "spamVerdict" TEXT,
    "virusVerdict" TEXT,
    "isForwarded" BOOLEAN NOT NULL DEFAULT false,
    "parentEmailId" TEXT,
    "tramiteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmailAttachment" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "s3Key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "variables" TEXT[] NOT NULL,
    "category" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ConsultaChat" (
    "id" TEXT NOT NULL,
    "pregunta" TEXT NOT NULL,
    "respuesta" TEXT NOT NULL,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsultaChat_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "CuentaBancaria" ADD CONSTRAINT "CuentaBancaria_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "EnlacePago" ADD CONSTRAINT "EnlacePago_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Evento" ADD CONSTRAINT "Evento_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Evento" ADD CONSTRAINT "Evento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Evento" ADD CONSTRAINT "Evento_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Email" ADD CONSTRAINT "Email_parentEmailId_fkey" FOREIGN KEY ("parentEmailId") REFERENCES "Email"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Email" ADD CONSTRAINT "Email_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "EmailAttachment" ADD CONSTRAINT "EmailAttachment_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Email_messageId_key" ON "Email"("messageId");
CREATE UNIQUE INDEX IF NOT EXISTS "Post_slug_key" ON "Post"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "EmailTemplate_name_key" ON "EmailTemplate"("name");

CREATE INDEX IF NOT EXISTS "CuentaBancaria_tramiteId_idx" ON "CuentaBancaria"("tramiteId");
CREATE INDEX IF NOT EXISTS "EnlacePago_tramiteId_idx" ON "EnlacePago"("tramiteId");
CREATE INDEX IF NOT EXISTS "EnlacePago_estado_idx" ON "EnlacePago"("estado");
CREATE INDEX IF NOT EXISTS "Email_direction_idx" ON "Email"("direction");
CREATE INDEX IF NOT EXISTS "Email_status_idx" ON "Email"("status");
CREATE INDEX IF NOT EXISTS "Email_from_idx" ON "Email"("from");
CREATE INDEX IF NOT EXISTS "Email_createdAt_idx" ON "Email"("createdAt");
CREATE INDEX IF NOT EXISTS "Email_tramiteId_idx" ON "Email"("tramiteId");
CREATE INDEX IF NOT EXISTS "EmailAttachment_emailId_idx" ON "EmailAttachment"("emailId");
CREATE INDEX IF NOT EXISTS "EmailTemplate_category_idx" ON "EmailTemplate"("category");
CREATE INDEX IF NOT EXISTS "ConsultaChat_createdAt_idx" ON "ConsultaChat"("createdAt");
CREATE INDEX IF NOT EXISTS "Post_slug_idx" ON "Post"("slug");
CREATE INDEX IF NOT EXISTS "Post_publicado_idx" ON "Post"("publicado");
CREATE INDEX IF NOT EXISTS "Post_categoria_idx" ON "Post"("categoria");
