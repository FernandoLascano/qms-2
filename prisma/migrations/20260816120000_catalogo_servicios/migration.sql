-- Catálogo de servicios post-venta.
--
-- Hasta ahora el catálogo vivía como un arreglo dentro de
-- components/cliente/ServiciosCatalogo.tsx: sin precio y sin forma de
-- contratar, cada tarjeta terminaba en un WhatsApp. Pasa a la base para que
-- los precios se editen desde configuración, igual que los planes.
--
-- El precio es opcional: los trámites societarios se cotizan según el caso y
-- muestran "Consultar" mientras no tengan uno cargado.

CREATE TYPE "ModalidadServicio" AS ENUM ('UNICO', 'MENSUAL', 'ANUAL', 'SIN_COSTO', 'A_CONSULTAR');

CREATE TABLE "ServicioCatalogo" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "icono" TEXT NOT NULL DEFAULT 'FileText',
    "modalidad" "ModalidadServicio" NOT NULL DEFAULT 'A_CONSULTAR',
    "precioDesde" DOUBLE PRECISION,
    "precioTexto" TEXT,
    "comisionReferido" BOOLEAN NOT NULL DEFAULT false,
    "notasInternas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicioCatalogo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServicioCatalogo_slug_key" ON "ServicioCatalogo"("slug");
CREATE INDEX "ServicioCatalogo_activo_orden_idx" ON "ServicioCatalogo"("activo", "orden");

-- Carga inicial: los ocho que ya estaban en el código, más los que faltaban.
-- Idempotente por slug, así que volver a correrla no duplica ni pisa precios
-- que ya se hayan editado desde el panel.
INSERT INTO "ServicioCatalogo"
  ("id", "slug", "nombre", "descripcion", "icono", "modalidad", "precioDesde", "precioTexto", "comisionReferido", "activo", "orden", "createdAt", "updatedAt")
VALUES
  -- Con precio definido
  (gen_random_uuid()::text, 'contable-mensual', 'Asesoría contable mensualizada',
   'Liquidación de impuestos, presentaciones y acompañamiento mes a mes.',
   'Calculator', 'MENSUAL', 300000, NULL, false, true, 10, NOW(), NOW()),

  (gen_random_uuid()::text, 'registro-marca', 'Registro de marca',
   'Búsqueda de antecedentes, presentación y seguimiento ante el INPI.',
   'BadgeCheck', 'UNICO', 300000, '+ tasas por solicitud', false, true, 20, NOW(), NOW()),

  (gen_random_uuid()::text, 'domicilio-sede', 'Domicilio legal en Córdoba',
   'Sede social en nuestras oficinas, con recepción y aviso de correspondencia.',
   'Building2', 'ANUAL', NULL, NULL, false, true, 30, NOW(), NOW()),

  -- Sin costo para el cliente: deja comisión de quien recibe el referido
  (gen_random_uuid()::text, 'cuenta-bancaria', 'Apertura de cuenta bancaria',
   'Te asesoramos para abrir la cuenta de la sociedad y elegir el banco.',
   'Landmark', 'SIN_COSTO', NULL, NULL, true, true, 40, NOW(), NOW()),

  -- Se cotizan según el caso
  (gen_random_uuid()::text, 'acta-estados-contables', 'Acta de aprobación de estados contables',
   'La confeccionamos y presentamos dentro de los 90 días del cierre de ejercicio.',
   'FileCheck', 'A_CONSULTAR', NULL, NULL, false, true, 50, NOW(), NOW()),

  (gen_random_uuid()::text, 'contratos', 'Confección de contratos',
   'Contratos comerciales, de servicios, de confidencialidad y acuerdos de socios.',
   'FileSignature', 'A_CONSULTAR', NULL, NULL, false, true, 60, NOW(), NOW()),

  (gen_random_uuid()::text, 'libros-digitales', 'Alta de libros digitales',
   'Rubricamos y damos de alta los libros societarios y contables.',
   'BookOpen', 'A_CONSULTAR', NULL, NULL, false, true, 70, NOW(), NOW()),

  (gen_random_uuid()::text, 'reformas-estatuto', 'Reformas de estatuto',
   'Modificá el objeto, la denominación u otras cláusulas del estatuto.',
   'FileSignature', 'A_CONSULTAR', NULL, NULL, false, true, 80, NOW(), NOW()),

  (gen_random_uuid()::text, 'actas', 'Confección de actas',
   'Actas de asamblea, de directorio y demás documentación societaria.',
   'FileText', 'A_CONSULTAR', NULL, NULL, false, true, 90, NOW(), NOW()),

  (gen_random_uuid()::text, 'autoridades', 'Designación o renuncia de autoridades',
   'Cambios en el administrador, representante legal y órgano de fiscalización.',
   'UserCog', 'A_CONSULTAR', NULL, NULL, false, true, 100, NOW(), NOW()),

  (gen_random_uuid()::text, 'aumento-capital', 'Aumentos de capital',
   'Aumento del capital social y su inscripción ante el registro.',
   'TrendingUp', 'A_CONSULTAR', NULL, NULL, false, true, 110, NOW(), NOW()),

  (gen_random_uuid()::text, 'cambio-sede', 'Cambio de sede social',
   'Traslado de la sede social y su inscripción.',
   'MapPin', 'A_CONSULTAR', NULL, NULL, false, true, 120, NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;
