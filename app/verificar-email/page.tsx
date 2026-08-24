import { Suspense } from 'react'
import { VerifyEmailClient } from './VerifyEmailClient'

export default function VerificarEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="canvas-landing min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-surface border border-line rounded-card shadow-pop p-8">
            <div className="text-ink-2">Cargando verificación…</div>
          </div>
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  )
}

