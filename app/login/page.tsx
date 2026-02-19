'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, Mail, Lock, ArrowLeft, LogIn, Loader2 } from 'lucide-react'

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
      // Normalizar email antes de enviar
      const normalizedEmail = email.trim().toLowerCase()

      const result = await signIn('credentials', {
        email: normalizedEmail,
        password,
        redirect: false,
      })

      if (result?.error) {
        console.error('Error de login:', result.error)
        setError('Email o contraseña incorrectos')
        setLoading(false)
        return
      }

      if (result?.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('Error al iniciar sesión. Intenta nuevamente.')
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Error en login:', error)
      setError('Ocurrió un error. Intenta nuevamente.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isFromRegistration && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-sm font-medium flex items-center gap-3"
        >
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-4 w-4" />
          </div>
          <span>Cuenta creada exitosamente. Ya podés iniciar sesión.</span>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-50 border border-brand-200 text-brand-700 p-4 rounded-xl text-sm font-medium"
        >
          {error}
        </motion.div>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold text-gray-700">
          Email
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <Mail className="w-5 h-5 text-gray-400" />
          </div>
          <input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full h-12 pl-12 pr-4 text-base text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-semibold text-gray-700">
          Contraseña
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <Lock className="w-5 h-5 text-gray-400" />
          </div>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full h-12 pl-12 pr-4 text-base text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-brand-700 hover:bg-brand-800 text-white font-semibold text-base rounded-xl shadow-lg shadow-brand-200 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Ingresando...
          </>
        ) : (
          <>
            <LogIn className="w-5 h-5" />
            Ingresar
          </>
        )}
      </button>

      <div className="text-center pt-5 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          ¿No tenés cuenta?{' '}
          <Link href="/registro" className="text-brand-700 hover:text-brand-800 font-semibold transition">
            Registrate aquí
          </Link>
        </p>
      </div>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="inline-block mb-4">
            <img
              src="/assets/img/qms-logo-reg.png"
              alt="QuieroMiSAS Logo"
              className="h-16 w-auto mx-auto"
            />
          </Link>
          <span className="block text-brand-700 font-semibold text-sm tracking-wider uppercase mb-4">
            Acceso
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
            Bienvenido de <span className="text-brand-700">vuelta</span>
          </h1>
          <p className="text-gray-500">
            Ingresá a tu cuenta de QuieroMiSAS
          </p>
        </motion.div>

        {/* Card de Login */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8"
        >
          <Suspense fallback={
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-700 mx-auto"></div>
              <p className="text-gray-500 mt-3 text-sm">Cargando...</p>
            </div>
          }>
            <LoginForm />
          </Suspense>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-700 transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
