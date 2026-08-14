'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { PageSkeleton } from '@/components/ui/states'
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
  XCircle,
  Forward
, X } from 'lucide-react'
import { toast } from 'sonner'

interface ConfigData {
  // Notificaciones
  notificacionesAutomaticas: boolean
  diasAlertaDenominacion: number
  diasAlertaEstancamiento: number

  // Email
  emailRemitente: string
  emailNombreRemitente: string
  emailForwardingEnabled: boolean
  emailForwardingAddress: string

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
  descuentoTransferencia: number
  smvm: number

  // Comisiones (esquema de distribución)
  comisionMwPct: number
  comisionOperadorPct: number
  comisionFondoFernandoPct: number
  comisionFondoJustinianoPct: number
  comisionOriginacionPct: number

  // Domicilio en sede
  domicilioSedeDirecciones: string[]
  domicilioSedePrecioAnual: number
  domicilioSedeDiasAlerta: number

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
    emailForwardingEnabled: true,
    emailForwardingAddress: '',
    diasVencimientoReserva: 30,
    horasLimiteRespuesta: 48,
    mercadoPagoEnabled: true,
    precioBaseSAS: 50000,
    precioPlanBasico: 285000,
    precioPlanEmprendedor: 320000,
    precioPlanPremium: 390000,
    descuentoTransferencia: 3,
    smvm: 317800,
    comisionMwPct: 30,
    comisionOperadorPct: 50,
    comisionFondoFernandoPct: 12,
    comisionFondoJustinianoPct: 8,
    comisionOriginacionPct: 30,
    domicilioSedeDirecciones: [],
    domicilioSedePrecioAnual: 0,
    domicilioSedeDiasAlerta: 30,
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
      <div className="space-y-section">
        <PageHeader
          title="Configuración del sistema"
          description="Precios, comisiones y parámetros generales."
          breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Configuración' }]}
        />
        <PageSkeleton cards={2} />
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
        <h1 className="text-display text-ink">
          Configuración del Sistema
        </h1>
        <p className="mt-1 text-body text-ink-2">
          Administrá las configuraciones globales de la plataforma
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-surface rounded-card shadow-raise border border-line p-2">
        <nav className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-control transition-all whitespace-nowrap font-medium ${
                activeTab === tab.id
                  ? 'bg-primary text-on-primary shadow-raise'
                  : 'text-ink-2 hover:text-ink hover:bg-surface-3'
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
        <Card className="shadow-raise rounded-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
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
                <p className="text-body-sm text-ink-2">
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
              <p className="text-body-sm text-ink-2">
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
              <p className="text-body-sm text-ink-2">
                Días sin actividad antes de marcar un trámite como estancado
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <Card className="shadow-raise rounded-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
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
              <p className="text-body-sm text-ink-2">
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
              <p className="text-body-sm text-ink-2">
                Nombre que aparecerá en los correos enviados
              </p>
            </div>

            <div className="rounded-control border border-line bg-surface-2/80 p-4 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <h3 className="text-body-sm font-semibold text-ink flex items-center gap-2">
                    <Forward className="h-4 w-4 text-primary shrink-0" />
                    Reenvío de correos entrantes (SES)
                  </h3>
                  <p className="text-body-sm text-ink-2">
                    Si está activo, los mensajes que llegan a las direcciones configuradas en AWS (p. ej. contacto@) pueden reenviarse a una copia
                    para revisión. Desactivalo para no reenviar automáticamente.
                  </p>
                </div>
                <Switch
                  checked={config.emailForwardingEnabled}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, emailForwardingEnabled: checked })
                  }
                  className="shrink-0"
                />
              </div>
              {config.emailForwardingEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="emailForwardingAddress">Email de reenvío</Label>
                  <Input
                    id="emailForwardingAddress"
                    type="email"
                    value={config.emailForwardingAddress}
                    onChange={(e) =>
                      setConfig({ ...config, emailForwardingAddress: e.target.value })
                    }
                    placeholder="tu@empresa.com"
                  />
                  <p className="text-body-sm text-ink-2">
                    Usado por el webhook de inbound cuando el reenvío está habilitado.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-info-soft border border-info-line rounded-control p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
              <div className="text-body-sm text-info">
                <p className="font-semibold mb-1">Configuración de SMTP</p>
                <p>Las credenciales de SMTP se configuran en las variables de entorno (.env)</p>
              </div>
            </div>

            {/* Sección de prueba de email */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-body-sm font-semibold text-ink mb-4 flex items-center gap-2">
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
                    <span className="flex items-center gap-1 text-success text-body-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      Conexión exitosa
                    </span>
                  )}
                  {smtpStatus === 'error' && (
                    <span className="flex items-center gap-1 text-primary text-body-sm">
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
                      className="w-full px-3 py-2 border border-line-strong rounded-control focus:outline-none focus:ring-2 focus:ring-ring bg-surface text-ink"
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
                  className="bg-primary hover:bg-primary-hover"
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
        <Card className="shadow-raise rounded-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
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
              <p className="text-body-sm text-ink-2">
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
              <p className="text-body-sm text-ink-2">
                Tiempo máximo de respuesta a consultas de clientes (en horas)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagos Tab */}
      {activeTab === 'pagos' && (
        <Card className="shadow-raise rounded-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
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
                <p className="text-body-sm text-ink-2">
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
              <h3 className="text-body-sm font-semibold text-ink mb-4">Precios de Planes</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="precioPlanBasico">Plan Básico</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-ink-2">$</span>
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
                  <p className="text-body-sm text-ink-2">
                    Precio del plan Básico (mostrado en landing page y formulario)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precioPlanEmprendedor">Plan Emprendedor</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-ink-2">$</span>
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
                  <p className="text-body-sm text-ink-2">
                    Precio del plan Emprendedor (mostrado en landing page y formulario)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precioPlanPremium">Plan Premium</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-ink-2">$</span>
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
                  <p className="text-body-sm text-ink-2">
                    Precio del plan Premium (mostrado en landing page y formulario)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descuentoTransferencia">Descuento por transferencia</Label>
                  <div className="relative">
                    <Input
                      id="descuentoTransferencia"
                      type="number"
                      value={config.descuentoTransferencia}
                      onChange={(e) => setConfig({ ...config, descuentoTransferencia: parseFloat(e.target.value) })}
                      className="pr-8"
                      min={0}
                      max={100}
                      step={0.5}
                    />
                    <span className="absolute right-3 top-3 text-ink-2">%</span>
                  </div>
                  <p className="text-body-sm text-ink-2">
                    Porcentaje de descuento aplicado sobre el precio del plan cuando el cliente paga por transferencia
                    (usado al generar el link de pago de honorarios)
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-body-sm font-semibold text-ink mb-4">SMVM y Capital Social</h3>
              <div className="space-y-2">
                <Label htmlFor="smvm">Salario Mínimo, Vital y Móvil (SMVM)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-ink-2">$</span>
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
                <p className="text-body-sm text-ink-2">
                  Valor actual del SMVM. El capital social mínimo es 2 SMVM = ${(config.smvm * 2).toLocaleString('es-AR')}
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-body-sm font-semibold text-ink mb-1">Comisiones (esquema de distribución)</h3>
              <p className="text-body-sm text-ink-2 mb-4">
                Porcentajes usados por el módulo <strong>Liquidación de Comisiones</strong>. Los cuatro del esquema base
                deben sumar 100%.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {([
                  ['comisionMwPct', 'MW'],
                  ['comisionOperadorPct', 'Operador (Fernando)'],
                  ['comisionFondoFernandoPct', 'Fondo Fernando'],
                  ['comisionFondoJustinianoPct', 'Fondo Justiniano'],
                  ['comisionOriginacionPct', 'Comisión originación'],
                ] as const).map(([key, label]) => (
                  <div className="space-y-2" key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <div className="relative">
                      <Input
                        id={key}
                        type="number"
                        value={config[key]}
                        onChange={(e) => setConfig({ ...config, [key]: parseFloat(e.target.value) })}
                        className="pr-8"
                        min={0}
                        max={100}
                        step={0.5}
                      />
                      <span className="absolute right-3 top-3 text-ink-2">%</span>
                    </div>
                  </div>
                ))}
              </div>
              {(() => {
                const suma = config.comisionMwPct + config.comisionOperadorPct + config.comisionFondoFernandoPct + config.comisionFondoJustinianoPct
                const ok = Math.abs(suma - 100) < 0.001
                return (
                  <p className={`text-body-sm mt-3 ${ok ? 'text-success' : 'text-danger'}`}>
                    Suma del esquema base (MW + Operador + Fondos): {suma}% {ok ? '' : '— debe ser 100%'}
                  </p>
                )
              })()}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-body-sm font-semibold text-ink mb-1">Domicilio en Sede</h3>
              <p className="text-body-sm text-ink-2 mb-4">
                Servicio de domicilio legal en la oficina. Usado por el módulo <strong>Domicilios en Sede</strong>.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Direcciones de la sede</Label>
                  <p className="text-body-sm text-ink-2">Al activar el servicio elegís cuál de estas se usa como domicilio legal del trámite.</p>
                  <div className="space-y-2">
                    {config.domicilioSedeDirecciones.map((dir, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={dir}
                          onChange={(e) => {
                            const nuevas = [...config.domicilioSedeDirecciones]
                            nuevas[idx] = e.target.value
                            setConfig({ ...config, domicilioSedeDirecciones: nuevas })
                          }}
                          placeholder="Ej: Ituzaingó 87, 5to Piso"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Quitar esta dirección"
                          className="text-ink-2 hover:text-danger shrink-0"
                          onClick={() => setConfig({ ...config, domicilioSedeDirecciones: config.domicilioSedeDirecciones.filter((_, i) => i !== idx) })}
                        >
                          <X className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfig({ ...config, domicilioSedeDirecciones: [...config.domicilioSedeDirecciones, ''] })}
                    >
                      + Agregar dirección
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="domicilioSedePrecioAnual">Precio anual</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-ink-2">$</span>
                      <Input
                        id="domicilioSedePrecioAnual"
                        type="number"
                        value={config.domicilioSedePrecioAnual}
                        onChange={(e) => setConfig({ ...config, domicilioSedePrecioAnual: parseFloat(e.target.value) })}
                        className="pl-7"
                        min={0}
                        step={1000}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domicilioSedeDiasAlerta">Alerta de vencimiento (días antes)</Label>
                    <Input
                      id="domicilioSedeDiasAlerta"
                      type="number"
                      value={config.domicilioSedeDiasAlerta}
                      onChange={(e) => setConfig({ ...config, domicilioSedeDiasAlerta: parseInt(e.target.value) })}
                      min={0}
                      step={1}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-info-soft border border-info-line rounded-control p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
              <div className="text-body-sm text-info">
                <p className="font-semibold mb-1">Credenciales de Mercado Pago</p>
                <p>Las claves de API se configuran en las variables de entorno (.env)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Tab */}
      {activeTab === 'general' && (
        <Card className="shadow-raise rounded-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Configuración General
            </CardTitle>
            <CardDescription>
              Configuraciones generales de la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-body">Modo mantenimiento</Label>
                <p className="text-body-sm text-ink-2">
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
              <div className="bg-warning-soft border border-warning-line rounded-control p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-body-sm text-warning">
                  <p className="font-semibold mb-1">Modo mantenimiento activo</p>
                  <p>Los usuarios no podrán acceder a la plataforma mientras esté activado</p>
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="text-body-sm font-semibold text-ink mb-3 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Información del Sistema
              </h3>
              <div className="space-y-2 text-body-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-ink-2">Versión:</span>
                  <span className="font-semibold">1.0.0</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-ink-2">Entorno:</span>
                  <span className="font-semibold">{process.env.NODE_ENV}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-ink-2">Base de datos:</span>
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
          className="bg-primary hover:bg-primary-hover rounded-control shadow-raise px-6 font-semibold"
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
