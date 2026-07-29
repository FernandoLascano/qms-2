/**
 * Backfill de teléfonos: completa User.phone a partir del teléfono cargado
 * en el formulario del trámite (Tramite.datosUsuario.telefono).
 *
 * El teléfono es obligatorio al crear un trámite pero opcional en el registro,
 * así que los usuarios que se registraron sin cargarlo quedaron con phone vacío.
 *
 * Uso:
 *   node --env-file=.env.local scripts/backfill-telefonos.mjs           (simulación)
 *   node --env-file=.env.local scripts/backfill-telefonos.mjs --apply   (aplica cambios)
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const APLICAR = process.argv.includes('--apply')

async function main() {
  const usuarios = await prisma.user.findMany({
    where: { OR: [{ phone: null }, { phone: '' }] },
    select: {
      id: true,
      name: true,
      email: true,
      tramites: {
        select: { id: true, datosUsuario: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  const aActualizar = []

  for (const usuario of usuarios) {
    // Tomamos el teléfono del trámite más reciente que tenga uno cargado
    const tramiteConTelefono = usuario.tramites.find((t) => {
      const telefono = t.datosUsuario?.telefono
      return typeof telefono === 'string' && telefono.trim().length > 0
    })

    if (!tramiteConTelefono) continue

    aActualizar.push({
      id: usuario.id,
      email: usuario.email,
      name: usuario.name,
      telefono: tramiteConTelefono.datosUsuario.telefono.trim(),
      tramiteId: tramiteConTelefono.id,
    })
  }

  console.log(`Usuarios sin teléfono: ${usuarios.length}`)
  console.log(`Recuperables desde trámites: ${aActualizar.length}\n`)

  for (const u of aActualizar) {
    console.log(`${u.email.padEnd(35)} ${u.telefono}   (trámite ${u.tramiteId})`)
  }

  if (!APLICAR) {
    console.log('\nSimulación. Volvé a correrlo con --apply para guardar los cambios.')
    return
  }

  let actualizados = 0
  for (const u of aActualizar) {
    await prisma.user.update({ where: { id: u.id }, data: { phone: u.telefono } })
    actualizados++
  }

  console.log(`\nListo: ${actualizados} usuarios actualizados.`)
}

main()
  .catch((error) => {
    console.error('Error en el backfill:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
