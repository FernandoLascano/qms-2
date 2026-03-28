import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      rol: string
      phone?: string | null
      emailVerified?: Date | null
      createdAt?: Date
      hasPassword?: boolean
    }
  }

  interface User {
    id: string
    email: string
    name: string
    rol: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    name?: string | null
    email?: string | null
    rol: string
    phone?: string | null
    emailVerified?: Date | null
    createdAt?: Date
    hasPassword?: boolean
  }
}