'use client'

import type { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'

/** Recibe la sesión del layout: así el cliente no vuelve a pedir /api/auth/session al cargar. */
export function SessionGate({ session, children }: { session: Session | null; children: React.ReactNode }) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  )
}
