import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { soloDigitos, validarCbu } from '@/lib/validaciones'

interface CuentaBancaria {
  id: string
  nombre: string
  banco: string
  cbu: string
  alias?: string
  titular: string
}

const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/**
 * Valida la lista que se va a guardar. Devuelve el error o la lista limpia.
 *
 * El CBU se valida (22 dígitos y verificadores) en las cuentas nuevas y en las
 * que cambiaron de CBU. Una cuenta vieja que ya estaba guardada con un CBU
 * inválido se deja pasar tal cual: no tocamos datos existentes sin que el
 * admin los corrija, y la pantalla la muestra marcada con una advertencia.
 */
function validarCuentas(entrada: unknown, guardadas: CuentaBancaria[]): { error: string } | { cuentas: CuentaBancaria[] } {
  if (!Array.isArray(entrada)) return { error: 'Formato de cuentas inválido' }
  const cbuGuardado = new Map(guardadas.map((c) => [c.id, c.cbu]))
  const cuentas: CuentaBancaria[] = []
  for (const c of entrada as Record<string, unknown>[]) {
    const id = texto(c?.id)
    const nombre = texto(c?.nombre)
    const banco = texto(c?.banco)
    const titular = texto(c?.titular)
    const alias = texto(c?.alias)
    const cbuOriginal = typeof c?.cbu === 'string' ? c.cbu : ''
    if (!id || !nombre || !banco || !titular || !cbuOriginal.trim()) {
      return { error: 'Completá nombre, banco, CBU y titular de cada cuenta' }
    }
    const sinCambios = cbuGuardado.get(id) === cbuOriginal
    let cbu = cbuOriginal
    if (!sinCambios) {
      const errorCbu = validarCbu(cbuOriginal)
      if (errorCbu) return { error: `${nombre}: ${errorCbu}` }
      cbu = soloDigitos(cbuOriginal)
    }
    cuentas.push({ id, nombre, banco, cbu, titular, ...(alias ? { alias } : {}) })
  }
  return { cuentas }
}

// Obtener todas las cuentas bancarias pre-configuradas
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener cuentas bancarias desde ConfiguracionSistema
    const configuracion = await prisma.configuracionSistema.findUnique({
      where: { clave: 'CUENTAS_BANCARIAS' }
    })

    if (!configuracion) {
      return NextResponse.json({ cuentas: [] })
    }

    const cuentas = JSON.parse(configuracion.valor || '[]')
    return NextResponse.json({ cuentas })

  } catch {
    return NextResponse.json(
      { error: 'Error al obtener cuentas bancarias' },
      { status: 500 }
    )
  }
}

// Guardar o actualizar cuentas bancarias pre-configuradas
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const actual = await prisma.configuracionSistema.findUnique({
      where: { clave: 'CUENTAS_BANCARIAS' }
    })
    let guardadas: CuentaBancaria[] = []
    try {
      const parseadas = JSON.parse(actual?.valor || '[]')
      guardadas = Array.isArray(parseadas) ? parseadas : []
    } catch {
      guardadas = []
    }

    const resultado = validarCuentas(body?.cuentas, guardadas)
    if ('error' in resultado) {
      return NextResponse.json({ error: resultado.error }, { status: 400 })
    }
    const { cuentas } = resultado

    // Guardar en ConfiguracionSistema
    await prisma.configuracionSistema.upsert({
      where: { clave: 'CUENTAS_BANCARIAS' },
      update: {
        valor: JSON.stringify(cuentas),
        descripcion: 'Cuentas bancarias pre-configuradas para transferencias'
      },
      create: {
        clave: 'CUENTAS_BANCARIAS',
        valor: JSON.stringify(cuentas),
        descripcion: 'Cuentas bancarias pre-configuradas para transferencias'
      }
    })

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json(
      { error: 'Error al guardar cuentas bancarias' },
      { status: 500 }
    )
  }
}

