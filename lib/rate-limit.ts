import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

// Lazy Redis instance
let _redis: Redis | null = null

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return _redis
}

// Cache de rate limiters por nombre
const limiters = new Map<string, Ratelimit>()

type Duration = Parameters<typeof Ratelimit.slidingWindow>[1]

function getLimiter(name: string, requests: number, window: Duration): Ratelimit {
  const key = `${name}:${requests}:${window}`
  if (!limiters.has(key)) {
    limiters.set(key, new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `rl:${name}`,
    }))
  }
  return limiters.get(key)!
}

function getIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return '127.0.0.1'
}

/**
 * Aplica rate limiting a un request.
 * Retorna null si el request es permitido, o un NextResponse 429 si fue limitado.
 */
function hasRedisEnv(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

function rateLimitUnavailableResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Servicio temporalmente no disponible (rate limit).' },
    { status: 503 }
  )
}

export async function rateLimit(
  request: Request,
  name: string,
  requests: number = 10,
  window: Duration = '1 m',
  /** Sufijo opcional (ej. userId) para no compartir cuota solo por IP */
  keySuffix?: string
): Promise<NextResponse | null> {
  if (!hasRedisEnv()) {
    if (process.env.NODE_ENV === 'production') {
      return rateLimitUnavailableResponse()
    }
    return null
  }

  try {
    const limiter = getLimiter(name, requests, window)
    const ip = getIp(request)
    const id = keySuffix ? `${ip}:${keySuffix}` : ip
    const { success, limit, remaining, reset } = await limiter.limit(id)

    if (!success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      )
    }

    return null
  } catch {
    if (process.env.NODE_ENV === 'production') {
      return rateLimitUnavailableResponse()
    }
    return null
  }
}

/** Límite adicional por ventana larga (ej. presupuesto diario de IA). */
export async function rateLimitLong(
  request: Request,
  name: string,
  requests: number,
  window: Duration,
  keySuffix?: string
): Promise<NextResponse | null> {
  return rateLimit(request, name, requests, window, keySuffix)
}

// ─── Intentos de login ──────────────────────────────────────────────────────
// El login con contraseña cuenta sólo los intentos FALLIDOS, por email
// normalizado y por IP. Un login correcto limpia el contador del email.
// Si Redis no está configurado o falla, el login sigue andando (fail-open con
// log): preferimos no dejar a nadie afuera por una caída de Upstash.

const LOGIN_FALLIDOS_POR_EMAIL = 5
const LOGIN_FALLIDOS_POR_IP = 20
const LOGIN_VENTANA: Duration = '15 m'

function limitersLogin() {
  return {
    porEmail: getLimiter('login-email', LOGIN_FALLIDOS_POR_EMAIL, LOGIN_VENTANA),
    porIp: getLimiter('login-ip', LOGIN_FALLIDOS_POR_IP, LOGIN_VENTANA),
  }
}

/** IP del cliente a partir de los headers (sirve para un Headers o para el objeto plano que pasa NextAuth). */
export function ipDesdeHeaders(headers: Headers | Record<string, unknown> | undefined): string {
  const leer = (nombre: string): string | null => {
    if (!headers) return null
    if (typeof (headers as Headers).get === 'function') return (headers as Headers).get(nombre)
    const valor = (headers as Record<string, unknown>)[nombre]
    if (Array.isArray(valor)) return typeof valor[0] === 'string' ? valor[0] : null
    return typeof valor === 'string' ? valor : null
  }
  const forwarded = leer('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return leer('x-real-ip') || '127.0.0.1'
}

/** true si el email o la IP ya agotaron los intentos fallidos de la ventana. */
export async function loginBloqueado(email: string, ip: string): Promise<boolean> {
  if (!hasRedisEnv()) {
    console.warn('[rate-limit] Upstash no configurado: el login no tiene límite de intentos')
    return false
  }
  try {
    const { porEmail, porIp } = limitersLogin()
    const [restanEmail, restanIp] = await Promise.all([
      porEmail.getRemaining(email),
      porIp.getRemaining(ip),
    ])
    return restanEmail.remaining <= 0 || restanIp.remaining <= 0
  } catch (error) {
    console.error('[rate-limit] No se pudo consultar el límite de login:', error)
    return false
  }
}

/** Suma un intento fallido al email y a la IP. */
export async function registrarLoginFallido(email: string, ip: string): Promise<void> {
  if (!hasRedisEnv()) return
  try {
    const { porEmail, porIp } = limitersLogin()
    await Promise.all([porEmail.limit(email), porIp.limit(ip)])
  } catch (error) {
    console.error('[rate-limit] No se pudo registrar el login fallido:', error)
  }
}

/** Después de un login correcto, el email arranca de cero. */
export async function limpiarLoginFallidos(email: string): Promise<void> {
  if (!hasRedisEnv()) return
  try {
    await limitersLogin().porEmail.resetUsedTokens(email)
  } catch (error) {
    console.error('[rate-limit] No se pudo limpiar el contador de login:', error)
  }
}
