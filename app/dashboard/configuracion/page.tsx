'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Phone, Lock, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ConfiguracionPage() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: session.user.phone || ''
      })
    }
  }, [session])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al actualizar perfil')
      }

      await update()
      toast.success('Perfil actualizado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al actualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const needsCurrentPassword = session?.user?.hasPassword !== false

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (needsCurrentPassword && !passwordData.currentPassword) {
      toast.error('Ingresá tu contraseña actual')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: needsCurrentPassword ? passwordData.currentPassword : '',
          newPassword: passwordData.newPassword
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al cambiar contraseña')
      }

      toast.success('Contraseña actualizada correctamente')
      await update()
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-display text-ink">
          Configuración
        </h1>
        <p className="mt-1 text-body text-ink-2">Administrá tu perfil y preferencias</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información Personal */}
        <Card className="shadow-raise">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-control bg-primary-soft flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-heading font-semibold text-ink">Información Personal</CardTitle>
            </div>
            <CardDescription>
              Actualizá tus datos personales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-ink-3" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-ink-3" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-9"
                    placeholder="+54 9 11 1234-5678"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover rounded-control shadow-raise"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Cambiar Contraseña */}
        <Card className="shadow-raise">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-control bg-primary-soft flex items-center justify-center">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-heading font-semibold text-ink">Seguridad</CardTitle>
            </div>
            <CardDescription>
              {needsCurrentPassword
                ? 'Cambiá tu contraseña'
                : 'Creá una contraseña para poder iniciar sesión también con email y contraseña.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {needsCurrentPassword && (
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover rounded-control shadow-raise"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Cambiar contraseña
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Información de la Cuenta */}
      <Card className="shadow-raise">
        <CardHeader>
          <CardTitle className="text-heading font-semibold text-ink">Información de la cuenta</CardTitle>
          <CardDescription>
            Detalles sobre tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-body-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-ink-2">Tipo de cuenta:</span>
              <span className="font-semibold">
                {session?.user?.rol === 'ADMIN' ? 'Administrador' :
                 session?.user?.rol === 'ABOGADO' ? 'Abogado' : 'Cliente'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-ink-2">Email verificado:</span>
              <span className="font-semibold">
                {session?.user?.emailVerified ? 'Sí' : 'No'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-ink-2">Miembro desde:</span>
              <span className="font-semibold">
                {session?.user?.createdAt ?
                  new Date(session.user.createdAt).toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
