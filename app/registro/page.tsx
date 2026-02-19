'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Lock, ArrowLeft, UserPlus, Loader2 } from 'lucide-react'

export default function RegistroPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.details
          ? `${data.error}: ${data.details}`
          : data.error || 'Error al crear la cuenta'
        setError(errorMessage)
        setLoading(false)
        console.error('Error en registro:', data)
        return
      }

      // Registro exitoso, redirigir al login
      router.push('/login?registered=true')
    } catch (error) {
      setError('Ocurrió un error. Intenta nuevamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4 py-12">
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
            Registro
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
            Crear <span className="text-brand-700">cuenta</span>
          </h1>
          <p className="text-gray-500">
            Registrate para comenzar tu trámite
          </p>
        </motion.div>

        {/* Card de Registro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
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
              <label htmlFor="name" className="text-sm font-semibold text-gray-700">
                Nombre completo
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 text-base text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

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
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 text-base text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+54 9 351 123 4567"
                  value={formData.phone}
                  onChange={handleChange}
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
                  name="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 text-base text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-400 pl-1">Debe tener al menos 6 caracteres</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                Confirmar contraseña
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 text-base text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-brand-700 hover:bg-brand-800 text-white font-semibold text-base rounded-xl shadow-lg shadow-brand-200 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Crear cuenta
                </>
              )}
            </button>

            <div className="text-center pt-5 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                ¿Ya tenés cuenta?{' '}
                <Link href="/login" className="text-brand-700 hover:text-brand-800 font-semibold transition">
                  Ingresá aquí
                </Link>
              </p>
            </div>
          </form>
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
