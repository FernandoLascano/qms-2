'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Settings,
  Mail,
  Bell,
  DollarSign,
  Clock,
  Save,
  Loader2,
  AlertCircle,
  Shield,
  Database,
  Send,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface ConfigData {
  // Notificaciones
  notificacionesAutomaticas: boolean
  diasAlertaDenominacion: number
  diasAlertaEstancamiento: number

  // Email
  emailRemitente: string
  emailNombreRemitente: string

  // Sistema
  diasVencimientoReserva: number
  horasLimiteRespuesta: number

  // Pagos
  mercadoPagoEnabled: boolean
  precioBaseSAS: number

  // Planes y Precios
  precioPlanBasico: number
  precioPlanEmprendedor: number
  precioPlanPremium: number
  smvm: number

  // General
  mantenimientoMode: boolean
}

export default function ConfiguracionAdminPage() {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState<'notificaciones' | 'email' | 'sistema' | 'pagos' | 'general'>('notificaciones')

  // Estados para test de email
  const [testEmail, setTestEmail] = useState('')
  const [testEmailType, setTestEmailType] = useState('welcome')
  const [testingEmail, setTestingEmail] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [smtpStatus, setSmtpStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const [config, setConfig] = useState<ConfigData>({
    notificacionesAutomaticas: true,
    diasAlertaDenominacion: 7,
    diasAlertaEstancamiento: 15,
    emailRemitente: 'noreply@quieromisas.com',
    emailNombreRemitente: 'QuieroMiSAS',
    diasVencimientoReserva: 30,
    horasLimiteRespuesta: 48,
    mercadoPagoEnabled: true,
    precioBaseSAS: 50000,
    precioPlanBasico: 285000,
    precioPlanEmprendedor: 320000,
    precioPlanPremium: 390000,
    smvm: 317800,
    mantenimientoMode: false
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/configuracion')
      if (!res.ok) throw new Error('Error al cargar configuración')
      const data = await res.json()

      if (data) {
        setConfig(data)
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Error al cargar configuración')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/admin/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al guardar configuración')
      }

      toast.success('Configuración guardada correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al guardar configuración')
    } finally {
      setLoading(false)
    }
  }

  const verifySmtpConnection = async () => {
    setTestingConnection(true)
    setSmtpStatus('idle')

    try {
      const res = await fetch('/api/test-email')
      const data = await res.json()

      if (res.ok && data.success) {
        setSmtpStatus('success')
        toast.success('Conexión SMTP verificada correctamente')
      } else {
        setSmtpStatus('error')
        toast.error(data.error || 'Error al verificar conexión SMTP')
      }
    } catch (error: any) {
      setSmtpStatus('error')
      toast.error('Error al verificar conexión SMTP')
    } finally {
      setTestingConnection(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Ingresá un email de destino')
      return
    }

    setTestingEmail(true)

    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, tipo: testEmailType })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success('Email de prueba enviado correctamente')
      } else {
        toast.error(data.error || 'Error al enviar email de prueba')
      }
    } catch (error: any) {
      toast.error('Error al enviar email de prueba')
    } finally {
      setTestingEmail(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-700" />
      </div>
    )
  }

  const tabs = [
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'sistema', label: 'Sistema', icon: Clock },
    { id: 'pagos', label: 'Pagos', icon: DollarSign },
    { id: 'general', label: 'General', icon: Settings }
  ] as const

  return (
    <div className="space-y-8">
      <div>
        <span className="inline-block text-brand-700 font-semibold text-sm tracking-wider uppercase mb-2">
          Sistema
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
          Configuración del <span className="text-brand-700">Sistema</span>
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Administrá las configuraciones globales de la plataforma
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
        <nav className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap font-medium ${
                activeTab === tab.id
                  ? 'bg-brand-700 text-white shadow-lg shadow-brand-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Notificaciones Tab */}
      {activeTab === 'notificaciones' && (
        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-brand-700" />
              Configuración de Notificaciones
            </CardTitle>
            <CardDescription>
              Configurá las alertas y recordatorios automáticos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Notificaciones automáticas</Label>
                <p className="text-sm text-gray-500">
                  Enviar notificaciones automáticas a clientes
                </p>
              </div>
              <Switch
                checked={config.notificacionesAutomaticas}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, notificacionesAutomaticas: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diasAlertaDenominacion">Días para alerta de denominación pendiente</Label>
              <Input
                id="diasAlertaDenominacion"
                type="number"
                value={config.diasAlertaDenominacion}
                onChange={(e) => setConfig({ ...config, diasAlertaDenominacion: parseInt(e.target.value) })}
                min={1}
                max={30}
              />
              <p className="text-sm text-gray-500">
                Días después del envío antes de enviar recordatorio de denominación
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diasAlertaEstancamiento">Días para alerta de trámite estancado</Label>
              <Input
                id="diasAlertaEstancamiento"
                type="number"
                value={config.diasAlertaEstancamiento}
                onChange={(e) => setConfig({ ...config, diasAlertaEstancamiento: parseInt(e.target.value) })}
                min={1}
                max={60}
              />
              <p className="text-sm text-gray-500">
                Días sin actividad antes de marcar un trámite como estancado
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand-700" />
              Configuración de Email
            </CardTitle>
            <CardDescription>
              Configurá los parámetros de envío de correos electrónicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailRemitente">Email remitente</Label>
              <Input
                id="emailRemitente"
                type="email"
                value={config.emailRemitente}
                onChange={(e) => setConfig({ ...config, emailRemitente: e.target.value })}
                placeholder="noreply@quieromisas.com"
              />
              <p className="text-sm text-gray-500">
                Dirección de email que aparecerá como remitente
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailNombreRemitente">Nombre del remitente</Label>
              <Input
                id="emailNombreRemitente"
                type="text"
                value={config.emailNombreRemitente}
                onChange={(e) => setConfig({ ...config, emailNombreRemitente: e.target.value })}
                placeholder="QuieroMiSAS"
              />
              <p className="text-sm text-gray-500">
                Nombre que aparecerá en los correos enviados
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Configuración de SMTP</p>
                <p>Las credenciales de SMTP se configuran en las variables de entorno (.env)</p>
              </div>
            </div>

            {/* Sección de prueba de email */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Send className="h-4 w-4" />
                Probar Envío de Email
              </h3>

              {/* Verificar conexión SMTP */}
              <div className="mb-6">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={verifySmtpConnection}
                    variant="outline"
                    disabled={testingConnection}
                  >
                    {testingConnection ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      'Verificar conexión SMTP'
                    )}
                  </Button>
                  {smtpStatus === 'success' && (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      Conexión exitosa
                    </span>
                  )}
                  {smtpStatus === 'error' && (
                    <span className="flex items-center gap-1 text-brand-600 text-sm">
                      <XCircle className="h-4 w-4" />
                      Error de conexión
                    </span>
                  )}
                </div>
              </div>

              {/* Enviar email de prueba */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="testEmail">Email de destino</Label>
                    <Input
                      id="testEmail"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testEmailType">Tipo de template</Label>
                    <select
                      id="testEmailType"
                      value={testEmailType}
                      onChange={(e) => setTestEmailType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-gray-900"
                    >
                      <option value="welcome">Bienvenida (Registro)</option>
                      <option value="nuevoTramite">Nuevo Trámite Iniciado</option>
                      <option value="cambioEstado">Cambio de Estado</option>
                      <option value="accionRequerida">Acción Requerida</option>
                      <option value="tramiteCompletado">Trámite Completado</option>
                      <option value="recordatorioPago">Recordatorio de Pago</option>
                    </select>
                  </div>
                </div>
                <Button
                  onClick={sendTestEmail}
                  className="bg-brand-700 hover:bg-brand-800"
                  disabled={testingEmail || !testEmail}
                >
                  {testingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar email de prueba
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sistema Tab */}
      {activeTab === 'sistema' && (
        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-700" />
              Configuración del Sistema
            </CardTitle>
            <CardDescription>
              Configurá los tiempos y plazos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="diasVencimientoReserva">Días de validez de reserva de denominación</Label>
              <Input
                id="diasVencimientoReserva"
                type="number"
                value={config.diasVencimientoReserva}
                onChange={(e) => setConfig({ ...config, diasVencimientoReserva: parseInt(e.target.value) })}
                min={1}
                max={90}
              />
              <p className="text-sm text-gray-500">
                Días que dura la reserva de una denominación social
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="horasLimiteRespuesta">Horas límite de respuesta</Label>
              <Input
                id="horasLimiteRespuesta"
                type="number"
                value={config.horasLimiteRespuesta}
                onChange={(e) => setConfig({ ...config, horasLimiteRespuesta: parseInt(e.target.value) })}
                min={1}
                max={168}
              />
              <p className="text-sm text-gray-500">
                Tiempo máximo de respuesta a consultas de clientes (en horas)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagos Tab */}
      {activeTab === 'pagos' && (
        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-brand-700" />
              Configuración de Pagos
            </CardTitle>
            <CardDescription>
              Configurá los parámetros de pago y precios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Mercado Pago habilitado</Label>
                <p className="text-sm text-gray-500">
                  Permitir pagos a través de Mercado Pago
                </p>
              </div>
              <Switch
                checked={config.mercadoPagoEnabled}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, mercadoPagoEnabled: checked })
                }
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Precios de Planes</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="precioPlanBasico">Plan Básico</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <Input
                      id="precioPlanBasico"
                      type="number"
                      value={config.precioPlanBasico}
                      onChange={(e) => setConfig({ ...config, precioPlanBasico: parseFloat(e.target.value) })}
                      className="pl-7"
                      min={0}
                      step={1000}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Precio del plan Básico (mostrado en landing page y formulario)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precioPlanEmprendedor">Plan Emprendedor</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <Input
                      id="precioPlanEmprendedor"
                      type="number"
                      value={config.precioPlanEmprendedor}
                      onChange={(e) => setConfig({ ...config, precioPlanEmprendedor: parseFloat(e.target.value) })}
                      className="pl-7"
                      min={0}
                      step={1000}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Precio del plan Emprendedor (mostrado en landing page y formulario)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precioPlanPremium">Plan Premium</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <Input
                      id="precioPlanPremium"
                      type="number"
                      value={config.precioPlanPremium}
                      onChange={(e) => setConfig({ ...config, precioPlanPremium: parseFloat(e.target.value) })}
                      className="pl-7"
                      min={0}
                      step={1000}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Precio del plan Premium (mostrado en landing page y formulario)
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">SMVM y Capital Social</h3>
              <div className="space-y-2">
                <Label htmlFor="smvm">Salario Mínimo, Vital y Móvil (SMVM)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <Input
                    id="smvm"
                    type="number"
                    value={config.smvm}
                    onChange={(e) => setConfig({ ...config, smvm: parseFloat(e.target.value) })}
                    className="pl-7"
                    min={0}
                    step={1000}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Valor actual del SMVM. El capital social mínimo es 2 SMVM = ${(config.smvm * 2).toLocaleString('es-AR')}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Credenciales de Mercado Pago</p>
                <p>Las claves de API se configuran en las variables de entorno (.env)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Tab */}
      {activeTab === 'general' && (
        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-brand-700" />
              Configuración General
            </CardTitle>
            <CardDescription>
              Configuraciones generales de la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Modo mantenimiento</Label>
                <p className="text-sm text-gray-500">
                  Activar modo mantenimiento (solo admins pueden acceder)
                </p>
              </div>
              <Switch
                checked={config.mantenimientoMode}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, mantenimientoMode: checked })
                }
              />
            </div>

            {config.mantenimientoMode && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-900">
                  <p className="font-semibold mb-1">Modo mantenimiento activo</p>
                  <p>Los usuarios no podrán acceder a la plataforma mientras esté activado</p>
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Información del Sistema
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Versión:</span>
                  <span className="font-semibold">1.0.0</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Entorno:</span>
                  <span className="font-semibold">{process.env.NODE_ENV}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Base de datos:</span>
                  <span className="font-semibold">PostgreSQL</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-brand-700 hover:bg-brand-800 rounded-xl shadow-lg shadow-brand-200 px-6 font-semibold"
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
      </div>
    </div>
  )
}
