import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

/** Login Google: GOOGLE_CLIENT_ID/SECRET o los mismos valores que GA4 (GOOGLE_OAUTH_*). */
const googleClientId =
  process.env.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_OAUTH_CLIENT_ID
const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET ?? process.env.GOOGLE_OAUTH_CLIENT_SECRET

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
          // No allowDangerousEmailAccountLinking: evita que un Gmail ya usado (p. ej. admin)
          // abra sesión en esa cuenta al “registrarse” otra vez con Google.
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
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

          const user = await prisma.user.findUnique({
            where: {
              email: normalizedEmail
            }
          })

          if (!user) {
            throw new Error("Email o contraseña incorrectos")
          }

          if (!user.password) {
            throw new Error("Email o contraseña incorrectos")
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password as string
          )

          if (!isCorrectPassword) {
            throw new Error("Email o contraseña incorrectos")
          }

          if (!user.emailVerified) {
            // Este string viaja hasta el cliente como result.error.
            throw new Error("EMAIL_NOT_VERIFIED")
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            rol: user.rol,
          }
        } catch (error) {
          throw error
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 horas
  },
  pages: {
    signIn: "/login",
  },
  // Después de que el adaptador creó/vinculó el usuario (no usar callbacks.signIn: corre antes y falla con usuarios nuevos).
  events: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user?.id) return
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        })
      } catch {
        // no bloquear el login si ya estaba verificado o hubo condición de carrera
      }
    },
  },
  callbacks: {
    /**
     * OAuth: `signIn` corre ANTES de crear el usuario (next-auth/core/routes/callback).
     * Si `user` viene de getUserByAccount, `user.id` es nuestro id en DB; si no, suele ser
     * perfil OAuth donde `id` puede ser el sub de Google — no validar por id hasta tener fila.
     *
     * Si ya existe fila con user.id y el email de Google no coincide → bloqueo (evita entrar
     * como admin con otro correo en el picker cuando el sub seguía ligado al admin).
     */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true

      const profileEmail =
        typeof profile?.email === "string"
          ? profile.email.trim().toLowerCase()
          : ""
      if (!profileEmail) return "/login?error=GoogleProfileEmail"

      if (!user?.id) return true

      const row = await prisma.user.findUnique({
        where: { id: String(user.id) },
        select: { email: true },
      })
      // Sin fila en DB con ese id → perfil nuevo (id aún puede ser sub de Google); sigue el flujo estándar
      if (!row) return true

      if (row.email.trim().toLowerCase() !== profileEmail) {
        return "/login?error=GoogleEmailMismatch"
      }

      return true
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            rol: true,
            name: true,
            email: true,
            phone: true,
            emailVerified: true,
            createdAt: true,
            password: true,
          },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.rol = dbUser.rol
          token.name = dbUser.name
          token.email = dbUser.email
          token.phone = dbUser.phone
          token.emailVerified = dbUser.emailVerified
          token.createdAt = dbUser.createdAt
          token.hasPassword = !!dbUser.password
        } else {
          token.id = user.id
          token.rol = (user as { rol?: string }).rol ?? "CLIENTE"
        }
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
            createdAt: true,
            password: true,
          }
        })

        if (updatedUser) {
          token.name = updatedUser.name
          token.email = updatedUser.email
          token.phone = updatedUser.phone
          token.rol = updatedUser.rol
          token.emailVerified = updatedUser.emailVerified
          token.createdAt = updatedUser.createdAt
          token.hasPassword = !!updatedUser.password
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.rol = token.rol as string
        session.user.phone = token.phone as string
        session.user.emailVerified = token.emailVerified as Date
        session.user.createdAt = token.createdAt as Date
        session.user.hasPassword = token.hasPassword as boolean
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}