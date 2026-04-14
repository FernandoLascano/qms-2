-- Row Level Security (Supabase PostgREST / Data API)
--
-- Con RLS activado y sin políticas, los roles `anon` y `authenticated` de Supabase
-- no ven ni modifican filas vía REST. Eso elimina el estado "UNRESTRICTED" en el
-- dashboard para el acceso público por API.
--
-- Prisma usa DATABASE_URL (conexión directa Postgres, rol `postgres`), que en
-- Supabase tiene BYPASSRLS: las rutas de servidor siguen funcionando igual.
--
-- Si algún cliente usara supabase-js con anon key contra estas tablas, dejaría
-- de funcionar hasta definir políticas explícitas (este proyecto no lo hace).

ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConfiguracionSistema" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConsultaChat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CuentaBancaria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Documento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Email" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailAttachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailVerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EnlacePago" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Evento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GastoJurisdiccion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HistorialEstado" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Mensaje" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notificacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pago" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlanPrecio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tramite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
