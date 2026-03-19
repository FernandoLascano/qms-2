import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar jurisdicciones (público, para landing y formulario)
export async function GET() {
  try {
    const jurisdicciones = await prisma.gastoJurisdiccion.findMany({
      orderBy: { orden: 'asc' },
    })

    return NextResponse.json(jurisdicciones)
  } catch {
    return NextResponse.json({ error: 'Error al obtener jurisdicciones' }, { status: 500 })
  }
}
