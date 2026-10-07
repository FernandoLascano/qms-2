-- Concepto de pago para el abono del domicilio en sede. Hasta ahora se
-- cargaba como OTROS y no llegaba a comisiones; con su propio concepto se
-- importa solo como ingreso de QMS.
-- Aditiva e idempotente.

ALTER TYPE "ConceptoPago" ADD VALUE IF NOT EXISTS 'DOMICILIO_SEDE' BEFORE 'OTROS';
