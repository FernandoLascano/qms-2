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
