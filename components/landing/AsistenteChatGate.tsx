'use client'

import { SessionProvider } from 'next-auth/react'
import { AsistenteChat } from '@/components/landing/AsistenteChat'

/** SessionProvider local: el resto del marketing no hidrata next-auth. */
export function AsistenteChatGate() {
  return (
    <SessionProvider>
      <AsistenteChat />
    </SessionProvider>
  )
}
