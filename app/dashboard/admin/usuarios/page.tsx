'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users, Search, Trash2, Key, Shield, ShieldCheck,
  AlertTriangle, Loader2, Eye, FileText, Calendar,
  ChevronDown, ChevronUp, X, Check
} from 'lucide-react'
import { toast } from 'sonner'

interface Usuario {
  id: string
  name: string
  email: string
  rol: string
  createdAt: string
  _count: {
    tramites: number
  }
  ultimoTramite?: {
    denominacionSocial1: string
    estadoGeneral: string
    createdAt: string
  }
}

export default function UsuariosAdminPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState<string>('TODOS')

  // Estados para modales de confirmación
  const [modalEliminar, setModalEliminar] = useState<Usuario | null>(null)
  const [modalResetPassword, setModalResetPassword] = useState<Usuario | null>(null)
  const [modalCambiarRol, setModalCambiarRol] = useState<Usuario | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmDelete, setConfirmDelete] = useState('')
  const [procesando, setProcesando] = useState(false)

  // Cargar usuarios
  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/admin/usuarios')
      if (res.ok) {
        const data = await res.json()
        setUsuarios(data)
      }
    } catch (error) {
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(user => {
    const matchBusqueda =
      user.name?.toLowerCase().includes(busqueda.toLowerCase()) ||
      user.email?.toLowerCase().includes(busqueda.toLowerCase())

    const matchRol = filtroRol === 'TODOS' || user.rol === filtroRol

    return matchBusqueda && matchRol
  })

  // Eliminar usuario
  const handleEliminar = async () => {
    if (!modalEliminar || confirmDelete !== modalEliminar.email) {
      toast.error('Debes escribir el email del usuario para confirmar')
      return
    }

    setProcesando(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${modalEliminar.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message)
        setUsuarios(usuarios.filter(u => u.id !== modalEliminar.id))
        setModalEliminar(null)
        setConfirmDelete('')
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Error al eliminar usuario')
    } finally {
      setProcesando(false)
    }
  }

  // Blanquear contraseña
  const handleResetPassword = async () => {
    if (!modalResetPassword || newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setProcesando(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${modalResetPassword.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          newPassword
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message)
        setModalResetPassword(null)
        setNewPassword('')
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Error al actualizar contraseña')
    } finally {
      setProcesando(false)
    }
  }

  // Cambiar rol
  const handleCambiarRol = async (nuevoRol: string) => {
    if (!modalCambiarRol) return

    setProcesando(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${modalCambiarRol.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_rol',
          newRol: nuevoRol
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message)
        setUsuarios(usuarios.map(u =>
          u.id === modalCambiarRol.id ? { ...u, rol: nuevoRol } : u
        ))
        setModalCambiarRol(null)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Error al cambiar rol')
    } finally {
      setProcesando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="inline-block text-red-700 font-semibold text-sm tracking-wider uppercase mb-2">
          Administración
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
          Gestión de <span className="text-red-700">Usuarios</span>
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Administra usuarios, contraseñas y permisos
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
        <Card className="hover:shadow-lg hover:border-gray-300 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Usuarios</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-gray-900">{usuarios.length}</p>
            <p className="text-xs text-gray-500 mt-1">Registrados en el sistema</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg hover:border-blue-200 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Clientes</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-blue-600">
              {usuarios.filter(u => u.rol === 'CLIENTE').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Usuarios cliente</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg hover:border-purple-200 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Administradores</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-purple-600">
              {usuarios.filter(u => u.rol === 'ADMIN').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Con acceso completo</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg hover:border-green-200 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Con Trámites</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-green-600">
              {usuarios.filter(u => u._count.tramites > 0).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Usuarios activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 rounded-xl border-gray-200 focus:ring-2 focus:ring-red-200 focus:border-red-300"
              />
            </div>
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-red-200 focus:border-red-300"
            >
              <option value="TODOS">Todos los roles</option>
              <option value="CLIENTE">Clientes</option>
              <option value="ADMIN">Administradores</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de usuarios */}
      <Card className="shadow-lg">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-xl font-bold text-gray-900">Listado de Usuarios</CardTitle>
          <CardDescription>
            Todos los usuarios registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
        {usuariosFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron usuarios</h3>
            <p className="text-gray-500">Intenta con otros criterios de búsqueda</p>
          </div>
        ) : (
          <div className="space-y-4">
          {usuariosFiltrados.map((usuario) => (
            <div key={usuario.id} className={`p-6 border-2 rounded-2xl transition-all duration-200 ${usuario.rol === 'ADMIN' ? 'border-purple-300 bg-purple-50/30 hover:border-purple-400 hover:shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'}`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Info del usuario */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      usuario.rol === 'ADMIN' ? 'bg-purple-200' : 'bg-red-100'
                    }`}>
                      {usuario.rol === 'ADMIN' ? (
                        <ShieldCheck className="h-6 w-6 text-purple-700" />
                      ) : (
                        <span className="text-red-700 font-bold text-lg">
                          {usuario.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{usuario.name || 'Sin nombre'}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          usuario.rol === 'ADMIN'
                            ? 'bg-purple-200 text-purple-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {usuario.rol}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{usuario.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(usuario.createdAt).toLocaleDateString('es-AR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {usuario._count.tramites} trámite{usuario._count.tramites !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {usuario.ultimoTramite && (
                        <p className="text-xs text-gray-500 mt-1">
                          Último: {usuario.ultimoTramite.denominacionSocial1}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setModalResetPassword(usuario)}
                      className="gap-1"
                    >
                      <Key className="h-4 w-4" />
                      <span className="hidden sm:inline">Cambiar Clave</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setModalCambiarRol(usuario)}
                      className="gap-1"
                    >
                      <Shield className="h-4 w-4" />
                      <span className="hidden sm:inline">Cambiar Rol</span>
                    </Button>

                    {usuario.rol !== 'ADMIN' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setModalEliminar(usuario)}
                        className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
          ))}
          </div>
        )}
        </CardContent>
      </Card>

      {/* Modal Eliminar Usuario */}
      {modalEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md rounded-2xl shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-900">Eliminar Usuario</CardTitle>
                  <CardDescription>Esta acción no se puede deshacer</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Atención:</strong> Se eliminarán permanentemente:
                </p>
                <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                  <li>El usuario y su cuenta</li>
                  <li>Todos sus trámites ({modalEliminar._count.tramites})</li>
                  <li>Documentos, pagos y notificaciones</li>
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Para confirmar, escribe el email del usuario:
                </p>
                <p className="text-sm font-mono bg-gray-100 px-3 py-2 rounded mb-2">
                  {modalEliminar.email}
                </p>
                <Input
                  value={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.value)}
                  placeholder="Escribe el email aquí"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setModalEliminar(null)
                    setConfirmDelete('')
                  }}
                  className="flex-1"
                  disabled={procesando}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleEliminar}
                  disabled={confirmDelete !== modalEliminar.email || procesando}
                  className="flex-1"
                >
                  {procesando ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Reset Password */}
      {modalResetPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md rounded-2xl shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Key className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Cambiar Contraseña</CardTitle>
                  <CardDescription>{modalResetPassword.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Nueva contraseña
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setModalResetPassword(null)
                    setNewPassword('')
                  }}
                  className="flex-1"
                  disabled={procesando}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={newPassword.length < 6 || procesando}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {procesando ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Cambiar Rol */}
      {modalCambiarRol && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md rounded-2xl shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Cambiar Rol</CardTitle>
                  <CardDescription>{modalCambiarRol.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Rol actual: <strong>{modalCambiarRol.rol}</strong>
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={modalCambiarRol.rol === 'CLIENTE' ? 'default' : 'outline'}
                  onClick={() => handleCambiarRol('CLIENTE')}
                  disabled={modalCambiarRol.rol === 'CLIENTE' || procesando}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Cliente
                </Button>
                <Button
                  variant={modalCambiarRol.rol === 'ADMIN' ? 'default' : 'outline'}
                  onClick={() => handleCambiarRol('ADMIN')}
                  disabled={modalCambiarRol.rol === 'ADMIN' || procesando}
                  className="gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Button>
              </div>

              {modalCambiarRol.rol === 'CLIENTE' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Nota:</strong> Al convertir en Admin, el usuario tendrá acceso completo al panel de administración.
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => setModalCambiarRol(null)}
                className="w-full mt-2"
                disabled={procesando}
              >
                Cerrar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
