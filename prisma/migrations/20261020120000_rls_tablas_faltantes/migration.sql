-- Activa Row-Level Security en las tablas que se crearon sin ella (aviso de
-- Supabase rls_disabled_in_public, 17/10/2026). Sin políticas, la API pública
-- de Supabase (anon/authenticated) no puede leer ni escribir; la plataforma
-- entra como postgres, que la saltea, así que no cambia nada para ella.
-- Idempotente: activarla dos veces no hace nada.

ALTER TABLE IF EXISTS "ContratoDomicilioAceptacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "GastoFondo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "LeadContacto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ObligacionSociedad" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "OfertaServicio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "PagoServicioDomicilio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ProductoServicio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ServicioCatalogo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ServicioDomicilio" ENABLE ROW LEVEL SECURITY;
