import { encode } from 'next-auth/jwt'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const admin = await prisma.user.findFirst({ where: { rol: 'ADMIN' }, select: { id: true, name: true, email: true, rol: true } })
const cliente = await prisma.user.findFirst({ where: { rol: 'CLIENTE', tramites: { some: {} } }, select: { id: true, name: true, email: true, rol: true } })
const tAdmin = await prisma.tramite.findFirst({ where: { formularioCompleto: true }, select: { id: true } })
const tCli = await prisma.tramite.findFirst({ where: { userId: cliente.id }, select: { id: true } })
const tok = async (u) => await encode({ token: { sub: u.id, id: u.id, name: u.name, email: u.email, rol: u.rol }, secret: process.env.NEXTAUTH_SECRET })
console.log(JSON.stringify({ admin: await tok(admin), cliente: await tok(cliente), tramiteAdmin: tAdmin?.id, tramiteCliente: tCli?.id }))
await prisma.$disconnect()
