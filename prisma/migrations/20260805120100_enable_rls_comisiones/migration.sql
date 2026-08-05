-- RLS defensa en profundidad para tablas de comisiones (PostgREST / Supabase Data API).
-- Prisma con rol postgres mantiene BYPASSRLS, así que las queries de la app siguen funcionando.

ALTER TABLE "MovimientoComision" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LiquidacionPago" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DistribucionFondo" ENABLE ROW LEVEL SECURITY;
