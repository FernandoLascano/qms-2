type TurnstileVerifyResponse = {
  success: boolean
  challenge_ts?: string
  hostname?: string
  'error-codes'?: string[]
  action?: string
  cdata?: string
}

export type TurnstileVerifyResult =
  | { ok: true }
  | { ok: false; error: string; codes?: string[] }

export async function verifyTurnstileToken(params: {
  token: string | undefined
  remoteip?: string | null
}): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY

  // En local/dev suele no estar configurado: no bloqueamos el flujo.
  if (process.env.NODE_ENV !== 'production') {
    return { ok: true }
  }

  if (!secret) {
    return { ok: false, error: 'Falta TURNSTILE_SECRET_KEY en el entorno' }
  }

  if (!params.token) {
    return { ok: false, error: 'Verificación anti-spam requerida (token faltante)' }
  }

  const form = new URLSearchParams()
  form.set('secret', secret)
  form.set('response', params.token)
  if (params.remoteip) form.set('remoteip', params.remoteip)

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
    // evita cache accidental en runtimes serverless
    cache: 'no-store',
  })

  if (!res.ok) {
    return { ok: false, error: `Turnstile verify falló (${res.status})` }
  }

  const data = (await res.json()) as TurnstileVerifyResponse
  if (!data.success) {
    return {
      ok: false,
      error: 'No se pudo verificar que seas humano',
      codes: data['error-codes'],
    }
  }

  return { ok: true }
}

