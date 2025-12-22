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
    rol: string
    phone?: string | null
    emailVerified?: Date | null
    createdAt?: Date
  }
}