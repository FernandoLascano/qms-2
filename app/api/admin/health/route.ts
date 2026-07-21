import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyEmailConnection } from '@/lib/email'

// Nunca cachear: es un chequeo en vivo.
export const dynamic = 'force-dynamic'
export const maxDuration = 20

type ServiceStatus = 'ok' | 'down' | 'unconfigured'

interface ServiceResult {
  key: string
  label: string
  status: ServiceStatus
  latencyMs: number | null
  detail: string | null
}

const CHECK_TIMEOUT_MS = 6000

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout tras ${ms}ms`)), ms)
  )
}

/**
 * Ejecuta un chequeo con timeout. La función puede devolver `unconfigured`
 * lanzando { unconfigured: true, detail }, o marcar caído lanzando un Error.
 */
async function runCheck(
  key: string,
  label: string,
  fn: () => Promise<{ detail?: string } | void>
): Promise<ServiceResult> {
  const started = Date.now()
  try {
    const res = await Promise.race([fn(), timeout(CHECK_TIMEOUT_MS)])
    return {
      key,
      label,
      status: 'ok',
      latencyMs: Date.now() - started,
      detail: (res && 'detail' in res && res.detail) || null,
    }
  } catch (err: unknown) {
    const e = err as { unconfigured?: boolean; detail?: string; message?: string }
    if (e && e.unconfigured) {
      return { key, label, status: 'unconfigured', latencyMs: null, detail: e.detail || null }
    }
    const message = (e && e.message) || 'Error desconocido'
    return {
      key,
      label,
      status: 'down',
      latencyMs: Date.now() - started,
      detail: message.slice(0, 200),
    }
  }
}

function unconfigured(detail: string): never {
  throw { unconfigured: true, detail }
}

async function fetchOk(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS - 200)
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' })
  } finally {
    clearTimeout(t)
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const checks: Promise<ServiceResult>[] = [
    // Base de datos (Postgres/Supabase) — SELECT 1, sin tocar tablas.
    runCheck('db', 'Base de datos', async () => {
      await prisma.$queryRaw`SELECT 1`
    }),

    // Inteligencia Artificial (Anthropic) — GET /v1/models, valida la key sin gastar tokens.
    runCheck('ia', 'Inteligencia Artificial', async () => {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) unconfigured('Falta ANTHROPIC_API_KEY')
      const res = await fetchOk('https://api.anthropic.com/v1/models?limit=1', {
        headers: { 'x-api-key': apiKey!, 'anthropic-version': '2023-06-01' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return { detail: `Modelo: ${process.env.ANTHROPIC_MODEL || 'claude-sonnet-5 (default)'}` }
    }),

    // MercadoPago — GET /v1/payment_methods, solo lectura, valida el access token.
    runCheck('mercadopago', 'MercadoPago (pagos)', async () => {
      const token = process.env.MERCADOPAGO_ACCESS_TOKEN
      if (!token) unconfigured('Falta MERCADOPAGO_ACCESS_TOKEN')
      const res = await fetchOk('https://api.mercadopago.com/v1/payment_methods', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    }),

    // Emails (SMTP/SES) — verify() abre y autentica la conexión sin enviar nada.
    runCheck('email', 'Emails (SMTP)', async () => {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        unconfigured('Falta SMTP_USER / SMTP_PASSWORD')
      }
      const r = await verifyEmailConnection()
      if (!r.success) throw new Error(r.error || 'Fallo en verify()')
    }),

    // Almacenamiento (Supabase Storage) — listBuckets(), solo lectura.
    runCheck('storage', 'Almacenamiento (Supabase)', async () => {
      const url = process.env.SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_KEY
      if (!url || !serviceKey) unconfigured('Falta SUPABASE_URL / SUPABASE_SERVICE_KEY')
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(url!, serviceKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const { error } = await supabase.storage.listBuckets()
      if (error) throw new Error(error.message)
    }),

    // Rate limiting (Redis/Upstash) — PING, sin escribir claves.
    runCheck('redis', 'Rate limiting (Redis)', async () => {
      const url = process.env.UPSTASH_REDIS_REST_URL
      const token = process.env.UPSTASH_REDIS_REST_TOKEN
      if (!url || !token) unconfigured('Falta UPSTASH_REDIS_REST_URL / TOKEN')
      const { Redis } = await import('@upstash/redis')
      const redis = new Redis({ url, token })
      const pong = await redis.ping()
      if (pong !== 'PONG') throw new Error(`Respuesta inesperada: ${pong}`)
    }),

    // Analytics (GA4) — reporte mínimo que fuerza el refresh del token OAuth.
    runCheck('analytics', 'Analytics (GA4)', async () => {
      const { createGa4DataClient, getGa4PropertyResource } = await import('@/lib/ga4/client')
      const clientRes = createGa4DataClient()
      if (!clientRes.ok) unconfigured(clientRes.error)
      const propRes = getGa4PropertyResource()
      if (!propRes.ok) throw new Error(propRes.error)
      await clientRes.client.runReport({
        property: propRes.property,
        dateRanges: [{ startDate: 'today', endDate: 'today' }],
        metrics: [{ name: 'activeUsers' }],
        limit: 1,
      })
    }),

    // Emails entrantes (AWS S3) — HeadBucket, valida credenciales y acceso al bucket.
    runCheck('s3', 'Emails entrantes (S3)', async () => {
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        unconfigured('Falta AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY')
      }
      const { S3Client, HeadBucketCommand } = await import('@aws-sdk/client-s3')
      const s3 = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      })
      await s3.send(new HeadBucketCommand({ Bucket: 'quieromisas-emails-inbound' }))
    }),
  ]

  const services = await Promise.all(checks)

  const anyDown = services.some((s) => s.status === 'down')
  const overall: 'ok' | 'degraded' = anyDown ? 'degraded' : 'ok'

  return NextResponse.json(
    { overall, checkedAt: new Date().toISOString(), services },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
