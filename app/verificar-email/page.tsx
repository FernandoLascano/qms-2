import { Suspense } from 'react'
import { VerifyEmailClient } from './VerifyEmailClient'

export default function VerificarEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-brand-50 to-white">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
            <div className="text-gray-700">Cargando verificación…</div>
          </div>
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  )
}

