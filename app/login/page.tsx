'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Verificar si viene de registro exitoso
  const isFromRegistration = searchParams.get('registered') === 'true'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email o contraseña incorrectos')
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      setError('Ocurrió un error. Intenta nuevamente.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isFromRegistration && (
        <div className="bg-green-50 border-2 border-green-200 text-green-700 p-4 rounded-lg text-sm font-medium flex items-center gap-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span>Cuenta creada exitosamente. Ya puedes iniciar sesion.</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold text-red-900">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-semibold text-red-900">
          Contraseña
        </label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          className="h-12 text-base"
        />
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-red-700 hover:bg-red-800 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            Ingresando...
          </span>
        ) : (
          'Ingresar'
        )}
      </Button>

      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          ¿No tenés cuenta?{' '}
          <Link href="/registro" className="text-red-700 hover:text-red-900 font-semibold underline-offset-2 hover:underline transition">
            Registrate aquí
          </Link>
        </p>
      </div>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <img
              src="/assets/img/logo4.png"
              alt="QuieroMiSAS Logo"
              className="h-16 w-auto mx-auto"
            />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-red-900 mb-2">Bienvenido</h1>
          <p className="text-gray-600">
            Ingresá a tu cuenta de QuieroMiSAS
          </p>
        </div>

        {/* Card de Login */}
        <Card className="shadow-xl border-2 border-gray-200">
          <CardContent className="p-8">
            <Suspense fallback={<div className="text-center py-4">Cargando...</div>}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-red-700 transition">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
