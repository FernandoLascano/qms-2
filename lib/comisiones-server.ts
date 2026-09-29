import { prisma } from '@/lib/prisma'
import {
  CONCEPTOS_HONORARIOS,
  diaArgentino,
  montoCobrado,
  PORCENTAJES_DEFAULT,
  type Porcentajes,
} from './comisiones'

// Lee los porcentajes del esquema desde la Config (con fallback a los del contrato).
export async function getPorcentajes(): Promise<Porcentajes> {
  const c = await prisma.config.findFirst()
  if (!c) return PORCENTAJES_DEFAULT
  return {
    mw: c.comisionMwPct,
    operador: c.comisionOperadorPct,
    fondoFernando: c.comisionFondoFernandoPct,
    fondoJustiniano: c.comisionFondoJustinianoPct,
    originacion: c.comisionOriginacionPct,
  }
}

// Importa los pagos de honorarios APROBADOS que todavía no tienen un movimiento
// de comisión asociado. Idempotente: el link se hace por pagoId (único).
//
// Corre sola cada vez que se abre el módulo, así que dos pestañas pueden
// importar el mismo pago a la vez: el índice único frena al segundo y acá se
// ignora ese choque en lugar de romper la carga.
export async function sincronizarMovimientos(): Promise<{ creados: number }> {
  const pagos = await prisma.pago.findMany({
    where: {
      estado: 'APROBADO',
      concepto: { in: [...CONCEPTOS_HONORARIOS] as any },
      movimientoComision: { is: null },
    },
    include: {
      tramite: { include: { user: { select: { name: true } } } },
    },
  })

  let creados = 0
  for (const pago of pagos) {
    const cliente = pago.tramite?.user?.name?.trim() || 'Cliente'
    try {
      await prisma.movimientoComision.create({
        data: {
          // Día calendario argentino: un pago de las 22 h del 31 es de ese
          // mes, no del siguiente (en UTC ya sería el día 1).
          fecha: diaArgentino(pago.fechaPago ?? pago.updatedAt),
          cliente,
          asunto: 'Constitución SAS (honorarios)',
          monto: montoCobrado(pago),
          originador: 'NINGUNO',
          origen: 'PAGO',
          pagoId: pago.id,
          tramiteId: pago.tramiteId,
        },
      })
      creados++
    } catch (e) {
      if ((e as { code?: string })?.code !== 'P2002') throw e
    }
  }
  return { creados }
}
