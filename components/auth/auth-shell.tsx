import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/**
 * Marco de las pantallas de cuenta chicas (recuperar y cambiar la contraseña):
 * la misma cabecera que el login y una tarjeta centrada.
 */
export function AuthShell({ titulo, bajada, children }: { titulo: ReactNode; bajada?: string; children: ReactNode }) {
  return (
    <div className="canvas-landing min-h-screen flex flex-col">
      <header className="border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Ir al inicio" className="inline-flex min-h-10 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- ver Navbar */}
            <img src="/assets/img/qms-logo-reg.png" alt="QuieroMiSAS" width={96} height={36} className="h-9 w-auto" />
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center gap-2 text-body-sm font-medium text-ink-2 hover:text-primary transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a ingresar
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="rise mx-auto w-full max-w-md px-4 sm:px-6 py-10">
          <div className="text-center mb-6">
            <h1 className="text-title font-semibold text-ink">{titulo}</h1>
            {bajada && <p className="mt-1 text-body-sm text-ink-2">{bajada}</p>}
          </div>
          <div className="bg-surface rounded-card border border-line shadow-pop p-6 sm:p-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
