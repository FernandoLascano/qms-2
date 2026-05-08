-- RLS defensa en profundidad para tablas de partners (PostgREST / Supabase Data API).
-- Prisma con rol postgres mantiene BYPASSRLS.

ALTER TABLE "Partner" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReferralClick" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PartnerConversion" ENABLE ROW LEVEL SECURITY;
