import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email y contraseña requeridos")
          }

          // Normalizar email: trim y lowercase
          const normalizedEmail = credentials.email.trim().toLowerCase()

          // Asegurar conexión a la base de datos
          try {
            await prisma.$connect()
          } catch (connectError: any) {
            console.error('[AUTH] Error de conexión a la base de datos:', connectError.message)
            throw new Error("Error de conexión. Por favor intenta nuevamente.")
          }

          const user = await prisma.user.findUnique({
            where: {
              email: normalizedEmail
            }
          })

          if (!user) {
            console.error(`[AUTH] Usuario no encontrado: ${normalizedEmail}`)
            throw new Error("Email o contraseña incorrectos")
          }

          if (!user.password) {
            console.error(`[AUTH] Usuario sin contraseña: ${normalizedEmail}`)
            throw new Error("Email o contraseña incorrectos")
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isCorrectPassword) {
            console.error(`[AUTH] Contraseña incorrecta para: ${normalizedEmail}`)
            throw new Error("Email o contraseña incorrectos")
          }

          console.log(`[AUTH] Login exitoso: ${normalizedEmail}`)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            rol: user.rol,
          }
        } catch (error: any) {
          console.error('[AUTH] Error en authorize:', error.message)
          throw error
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.rol = user.rol
      }

      // Cuando se llama update() desde el cliente, refrescar datos del usuario
      if (trigger === 'update') {
        const updatedUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            rol: true,
            emailVerified: true,
            createdAt: true
          }
        })

        if (updatedUser) {
          token.name = updatedUser.name
          token.email = updatedUser.email
          token.phone = updatedUser.phone
          token.emailVerified = updatedUser.emailVerified
          token.createdAt = updatedUser.createdAt
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.rol = token.rol as string
        session.user.phone = token.phone as string
        session.user.emailVerified = token.emailVerified as Date
        session.user.createdAt = token.createdAt as Date
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}