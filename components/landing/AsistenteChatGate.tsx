'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Loader2, MessageCircle } from 'lucide-react'

const claseLanzador =
  'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-700 text-white shadow-pop hover:bg-brand-800 transition-all flex items-center justify-center cursor-pointer'

/**
 * El chat (con next-auth y Turnstile) se descarga recién cuando alguien lo abre:
 * la landing no paga ese JS ni el pedido a /api/auth/session en cada visita.
 * SessionProvider local: el resto del marketing no hidrata next-auth.
 */
const ChatConSesion = dynamic(
  async () => {
    const [{ SessionProvider }, { AsistenteChat }] = await Promise.all([
      import('next-auth/react'),
      import('@/components/landing/AsistenteChat'),
    ])
    return function ChatConSesion() {
      return (
        <SessionProvider>
          <AsistenteChat abiertoInicial />
        </SessionProvider>
      )
    }
  },
  {
    ssr: false,
    loading: () => (
      <button className={claseLanzador} aria-label="Abriendo asistente" disabled>
        <Loader2 className="w-6 h-6 animate-spin" />
      </button>
    ),
  }
)

export function AsistenteChatGate() {
  const [cargar, setCargar] = useState(false)

  if (cargar) return <ChatConSesion />

  return (
    <button onClick={() => setCargar(true)} className={claseLanzador} aria-label="Abrir asistente">
      <MessageCircle className="w-6 h-6" />
    </button>
  )
}
