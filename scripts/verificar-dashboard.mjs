// Verificación de render de las pantallas del dashboard.
// Crea una cookie de sesión local con la misma librería que usa la app y pide
// cada ruta como cliente y como admin. No toca datos: sólo lee.
import { encode } from 'next-auth/jwt'
import { PrismaClient } from '@prisma/client'

const secret = process.env.NEXTAUTH_SECRET
if (!secret) { console.error('Falta NEXTAUTH_SECRET'); process.exit(1) }

const prisma = new PrismaClient()
const admin = await prisma.user.findFirst({ where: { rol: 'ADMIN' }, select: { id: true, name: true, email: true, rol: true } })
const cliente = await prisma.user.findFirst({
  where: { rol: 'CLIENTE', tramites: { some: {} } },
  select: { id: true, name: true, email: true, rol: true },
})
const tramite = await prisma.tramite.findFirst({ where: { formularioCompleto: true }, select: { id: true, userId: true } })
const tramiteCliente = cliente
  ? await prisma.tramite.findFirst({ where: { userId: cliente.id }, select: { id: true } })
  : null

const cookieDe = async (u) =>
  'next-auth.session-token=' +
  (await encode({ token: { sub: u.id, id: u.id, name: u.name, email: u.email, rol: u.rol }, secret }))

const rutas = {
  admin: [
    '/dashboard/admin', '/dashboard/admin/tramites', '/dashboard/admin/leads',
    '/dashboard/admin/sociedades', '/dashboard/admin/usuarios', '/dashboard/admin/analytics',
    '/dashboard/admin/emails', '/dashboard/admin/blog', '/dashboard/admin/calendario',
    '/dashboard/admin/consultas-chat', '/dashboard/admin/jurisdicciones',
    '/dashboard/admin/partners', '/dashboard/admin/comisiones', '/dashboard/admin/domicilios',
    '/dashboard/admin/configuracion', '/dashboard/admin/configuracion-cuentas',
    '/dashboard/admin/tracking-tiempo', '/dashboard/design-system',
    '/dashboard/admin/tramites?filter=pendientes-validacion',
    ...(tramite ? [
      `/dashboard/admin/tramites/${tramite.id}`,
      `/dashboard/admin/tramites/${tramite.id}?tab=pagos`,
      `/dashboard/admin/tramites/${tramite.id}?tab=documentos`,
      `/dashboard/admin/tramites/${tramite.id}?tab=comunicacion`,
      `/dashboard/admin/tramites/${tramite.id}?tab=datos`,
      `/dashboard/admin/tramites/${tramite.id}?tab=cierre`,
    ] : []),
  ],
  cliente: [
    '/dashboard', '/dashboard/tramites', '/dashboard/mi-sociedad', '/dashboard/libros-digitales',
    '/dashboard/servicios', '/dashboard/documentos', '/dashboard/documentos/subir',
    '/dashboard/notificaciones', '/dashboard/configuracion',
    ...(tramiteCliente ? [`/dashboard/tramites/${tramiteCliente.id}`] : []),
  ],
}

let fallos = 0
for (const [rol, lista] of Object.entries(rutas)) {
  const usuario = rol === 'admin' ? admin : cliente
  if (!usuario) { console.log(`\n(sin usuario ${rol} en la base — omitido)`); continue }
  const cookie = await cookieDe(usuario)
  console.log(`\n═══ ${rol.toUpperCase()} (${usuario.email}) ═══`)
  for (const ruta of lista) {
    const res = await fetch(`http://localhost:3000${ruta}`, { headers: { cookie }, redirect: 'manual' })
    const html = res.status === 200 ? await res.text() : ''
    const roto = html.includes('Application error') || html.includes('digest=')
    const ok = res.status === 200 && !roto
    if (!ok) fallos++
    console.log(`${ok ? '  ok  ' : '  ✗   '} ${String(res.status).padEnd(4)} ${ruta}`)
  }
}

await prisma.$disconnect()
console.log(fallos === 0 ? '\nTodas las pantallas renderizan.' : `\n${fallos} pantallas con problemas.`)
process.exit(fallos === 0 ? 0 : 1)
