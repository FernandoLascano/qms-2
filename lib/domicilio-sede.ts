import { prisma } from '@/lib/prisma'

/**
 * Un pago de domicilio en sede deja el servicio activo por un año:
 *  · si no estaba cargado, o estaba pendiente o cancelado, se activa desde
 *    el día del cobro;
 *  · si ya estaba activo, se renueva un año desde el vencimiento (o desde hoy
 *    si ya venció).
 * El abono es el monto cobrado: el precio se acuerda con cada cliente.
 */
export async function registrarCobroDomicilio(tramiteId: string, monto: number, cobradoEl: Date) {
  const actual = await prisma.domicilioSede.findUnique({ where: { tramiteId } })
  const masUnAnio = (desde: Date) => {
    const d = new Date(desde)
    d.setFullYear(d.getFullYear() + 1)
    return d
  }

  if (actual?.estado === 'ACTIVO') {
    const base = actual.fechaVencimiento && actual.fechaVencimiento > cobradoEl ? actual.fechaVencimiento : cobradoEl
    await prisma.domicilioSede.update({
      where: { id: actual.id },
      data: { fechaVencimiento: masUnAnio(base), ultimoCobro: cobradoEl, montoAnual: monto },
    })
    return
  }

  const config = await prisma.config.findFirst()
  const direccion = actual?.direccion || config?.domicilioSedeDirecciones?.[0] || null
  const data = {
    estado: 'ACTIVO' as const,
    direccion,
    montoAnual: monto,
    fechaInicio: cobradoEl,
    fechaVencimiento: masUnAnio(cobradoEl),
    ultimoCobro: cobradoEl,
  }
  if (actual) {
    await prisma.domicilioSede.update({ where: { id: actual.id }, data })
  } else {
    await prisma.domicilioSede.create({ data: { tramiteId, ...data } })
  }

  // Igual que al activarlo a mano: el domicilio legal del trámite pasa a ser la sede.
  if (direccion) {
    await prisma.tramite.update({ where: { id: tramiteId }, data: { domicilioLegal: direccion } }).catch(() => {})
  }
}
