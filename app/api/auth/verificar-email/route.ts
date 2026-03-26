import { NextResponse } from 'next/server'
import { consumeEmailVerificationToken } from '@/lib/email-verification'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const token = typeof body?.token === 'string' ? body.token : ''

    if (!token) {
      return NextResponse.json({ error: 'Token faltante' }, { status: 400 })
    }

    const result = await consumeEmailVerificationToken({ token })
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

