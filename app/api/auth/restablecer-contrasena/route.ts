import { NextResponse } from 'next/server'
import { rateLimit, limpiarLoginFallidos } from '@/lib/rate-limit'
import { restablecerPassword } from '@/lib/password-reset'
import { validarPassword } from '@/lib/validaciones'

/** Cambia la contraseña con el token del email de «olvidé mi contraseña». */
export async function POST(request: Request) {
  const limite = await rateLimit(request, 'restablecer-contrasena', 10, '10 m')
  if (limite) return limite

  let token = ''
  let password = ''
  try {
    const body = await request.json()
    token = typeof body?.token === 'string' ? body.token : ''
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return NextResponse.json({ error: 'El link no es válido. Pedí uno nuevo.' }, { status: 400 })
  }
  const errorPassword = validarPassword(password)
  if (errorPassword) return NextResponse.json({ error: errorPassword }, { status: 400 })

  try {
    const resultado = await restablecerPassword(token, password)
    if (!resultado.ok) return NextResponse.json({ error: resultado.error }, { status: 400 })
    // Si estaba bloqueado por intentos fallidos, que pueda entrar ya con la nueva.
    await limpiarLoginFallidos(resultado.email)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[restablecer-contrasena]', error)
    return NextResponse.json({ error: 'No pudimos cambiar la contraseña. Probá de nuevo.' }, { status: 500 })
  }
}
