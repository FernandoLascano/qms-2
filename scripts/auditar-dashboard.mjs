import { encode } from 'next-auth/jwt'
import { PrismaClient } from '@prisma/client'

const secret = process.env.NEXTAUTH_SECRET
const prisma = new PrismaClient()
const admin = await prisma.user.findFirst({ where: { rol: 'ADMIN' }, select: { id: true, name: true, email: true, rol: true } })
const cliente = await prisma.user.findFirst({ where: { rol: 'CLIENTE', tramites: { some: {} } }, select: { id: true, name: true, email: true, rol: true } })
const tramite = await prisma.tramite.findFirst({ where: { formularioCompleto: true }, select: { id: true } })
const tramiteCli = await prisma.tramite.findFirst({ where: { userId: cliente.id }, select: { id: true } })

const cookieDe = async (u) => 'next-auth.session-token=' + (await encode({ token: { sub: u.id, id: u.id, name: u.name, email: u.email, rol: u.rol }, secret }))
const cookieAdmin = await cookieDe(admin)
const cookieCli = await cookieDe(cliente)

const rutas = [
  ['/dashboard', cookieCli], ['/dashboard/tramites', cookieCli],
  [`/dashboard/tramites/${tramiteCli.id}`, cookieCli],
  ['/dashboard/documentos', cookieCli], ['/dashboard/notificaciones', cookieCli],
  ['/dashboard/configuracion', cookieCli], ['/dashboard/mi-sociedad', cookieCli],
  ['/dashboard/admin', cookieAdmin], ['/dashboard/admin/tramites', cookieAdmin],
  [`/dashboard/admin/tramites/${tramite.id}`, cookieAdmin],
  ['/dashboard/admin/usuarios', cookieAdmin], ['/dashboard/admin/sociedades', cookieAdmin],
  ['/dashboard/admin/leads', cookieAdmin], ['/dashboard/admin/analytics', cookieAdmin],
  ['/dashboard/admin/configuracion', cookieAdmin], ['/dashboard/admin/emails', cookieAdmin],
  ['/dashboard/admin/blog', cookieAdmin], ['/dashboard/admin/partners', cookieAdmin],
  ['/dashboard/admin/comisiones', cookieAdmin], ['/dashboard/admin/domicilios', cookieAdmin],
  ['/dashboard/admin/jurisdicciones', cookieAdmin], ['/dashboard/admin/consultas-chat', cookieAdmin],
  ['/dashboard/admin/calendario', cookieAdmin], ['/dashboard/admin/tracking-tiempo', cookieAdmin],
  ['/dashboard/admin/configuracion-cuentas', cookieAdmin],
]

const VIEJAS = /class="[^"]*\b(text-gray-\d|bg-gray-\d|border-gray-\d|text-(red|orange|amber|yellow|green|blue|purple|indigo|pink|rose|cyan|teal|emerald|violet)-\d|bg-(red|orange|amber|yellow|green|blue|purple|indigo|pink|rose|cyan|teal|emerald|violet)-\d|rounded-(xl|2xl|lg|md)\b|font-black|shadow-(sm|md|lg|xl|2xl)\b|text-(xs|sm|base|lg|xl|2xl|3xl|4xl)\b)/

console.log('ruta                                          h1  clases-viejas  emojis  botón-en-link')
console.log('─'.repeat(88))
let problemas = 0
for (const [ruta, cookie] of rutas) {
  const html = await (await fetch(`http://localhost:3000${ruta}`, { headers: { cookie } })).text()
  const cuerpo = html.split('<body')[1] ?? html
  const h1 = (cuerpo.match(/<h1[\s>]/g) || []).length
  const viejas = [...cuerpo.matchAll(/class="([^"]*)"/g)].filter(m => VIEJAS.test(`class="${m[1]}"`)).length
  const emojis = (cuerpo.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length
  const botonEnLink = (cuerpo.match(/<a[ >][^>]*>(?:(?!<\/a>)[\s\S]){0,900}?<button/g) || []).length
  const mal = h1 !== 1 || viejas > 0 || emojis > 0 || botonEnLink > 0
  if (mal) problemas++
  console.log(
    `${mal ? '✗' : ' '} ${ruta.padEnd(43)} ${String(h1).padStart(2)}  ${String(viejas).padStart(11)}  ${String(emojis).padStart(6)}  ${String(botonEnLink).padStart(12)}`
  )
}
await prisma.$disconnect()
console.log(problemas === 0 ? '\nSin regresiones.' : `\n${problemas} pantallas con detalles a revisar.`)
