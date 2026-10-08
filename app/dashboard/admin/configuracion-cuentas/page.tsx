'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { PageSkeleton } from '@/components/ui/states'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { cbuValido, soloDigitos, validarCbu } from '@/lib/validaciones'

interface CuentaBancaria {
  id: string
  nombre: string
  banco: string
  cbu: string
  alias?: string
  titular: string
}

type Campo = 'nombre' | 'banco' | 'cbu' | 'titular'

const CUENTA_VACIA = { nombre: '', banco: '', cbu: '', alias: '', titular: '' }

export default function ConfiguracionCuentasPage() {
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [nuevaCuenta, setNuevaCuenta] = useState(CUENTA_VACIA)
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({})
  const [aEliminar, setAEliminar] = useState<CuentaBancaria | null>(null)

  useEffect(() => {
    cargarCuentas()
  }, [])

  const cargarCuentas = async () => {
    try {
      const response = await fetch('/api/admin/cuentas-bancarias')
      if (response.ok) {
        const data = await response.json()
        setCuentas(data.cuentas || [])
      }
    } catch (error) {
      console.error('Error al cargar cuentas:', error)
      toast.error('Error al cargar cuentas bancarias')
    } finally {
      setCargando(false)
    }
  }

  /**
   * Guarda la lista completa. Cada alta y cada baja se guarda en el momento:
   * antes la cuenta agregada quedaba sólo en pantalla hasta apretar «Guardar
   * cambios», y si te ibas sin guardar se perdía sin aviso.
   */
  const guardar = async (lista: CuentaBancaria[]): Promise<boolean> => {
    setGuardando(true)
    try {
      const response = await fetch('/api/admin/cuentas-bancarias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuentas: lista })
      })
      if (response.ok) {
        setCuentas(lista)
        return true
      }
      const data = await response.json().catch(() => ({}))
      toast.error(data.error || 'Error al guardar cuentas bancarias')
      return false
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error('Error al guardar cuentas bancarias')
      return false
    } finally {
      setGuardando(false)
    }
  }

  const validarNueva = () => {
    const e: Partial<Record<Campo, string>> = {}
    if (!nuevaCuenta.nombre.trim()) e.nombre = 'Poné un nombre para reconocer la cuenta'
    if (!nuevaCuenta.banco.trim()) e.banco = 'El banco es obligatorio'
    const errorCbu = validarCbu(nuevaCuenta.cbu)
    if (errorCbu) e.cbu = errorCbu
    if (!nuevaCuenta.titular.trim()) e.titular = 'El titular es obligatorio'
    return e
  }

  const agregarCuenta = async () => {
    const e = validarNueva()
    setErrores(e)
    if (Object.keys(e).length > 0) {
      toast.error('Revisá los datos de la cuenta')
      return
    }

    const cuenta: CuentaBancaria = {
      id: Date.now().toString(),
      nombre: nuevaCuenta.nombre.trim(),
      banco: nuevaCuenta.banco.trim(),
      cbu: soloDigitos(nuevaCuenta.cbu),
      alias: nuevaCuenta.alias.trim() || undefined,
      titular: nuevaCuenta.titular.trim()
    }

    if (await guardar([...cuentas, cuenta])) {
      setNuevaCuenta(CUENTA_VACIA)
      setErrores({})
      toast.success('Cuenta agregada y guardada')
    }
  }

  const confirmarEliminar = async () => {
    if (!aEliminar) return
    if (await guardar(cuentas.filter(c => c.id !== aEliminar.id))) {
      toast.success('Cuenta eliminada')
      setAEliminar(null)
    }
  }

  const cambiar = (campo: keyof typeof CUENTA_VACIA, valor: string) => {
    setNuevaCuenta({ ...nuevaCuenta, [campo]: valor })
    if (errores[campo as Campo]) setErrores({ ...errores, [campo]: undefined })
  }

  // Al salir del campo, el CBU se valida en el momento (22 dígitos + verificadores).
  const validarCbuAlSalir = () => {
    if (!nuevaCuenta.cbu.trim()) return
    setErrores({ ...errores, cbu: validarCbu(nuevaCuenta.cbu) || undefined })
  }

  const cuentasInvalidas = cuentas.filter(c => !cbuValido(c.cbu)).length

  if (cargando) {
    return (
      <div className="space-y-section">
        <PageHeader
          title="Cuentas bancarias"
          description="Cuentas pre-configuradas para transferencias."
          breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Cuentas bancarias' }]}
        />
        <PageSkeleton cards={2} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuentas bancarias"
        description="Cuentas pre-configuradas para transferencias y depósitos de capital."
        breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Cuentas bancarias' }]}
      />

      {/* Agregar una cuenta */}
      <Card>
        <CardHeader>
          <CardTitle>Agregar una cuenta</CardTitle>
          <CardDescription>
            Las cuentas agregadas estarán disponibles en el dropdown al generar links de pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre">Nombre de la cuenta *</Label>
              <Input
                id="nombre"
                value={nuevaCuenta.nombre}
                onChange={(e) => cambiar('nombre', e.target.value)}
                invalid={!!errores.nombre}
                placeholder="Ej: Cuenta Principal, Cuenta Secundaria"
              />
              {errores.nombre && <p className="text-label text-danger mt-1">{errores.nombre}</p>}
            </div>
            <div>
              <Label htmlFor="banco">Banco *</Label>
              <Input
                id="banco"
                value={nuevaCuenta.banco}
                onChange={(e) => cambiar('banco', e.target.value)}
                invalid={!!errores.banco}
                placeholder="Banco Nación, Banco Provincia, etc."
              />
              {errores.banco && <p className="text-label text-danger mt-1">{errores.banco}</p>}
            </div>
            <div>
              <Label htmlFor="cbu">CBU *</Label>
              <Input
                id="cbu"
                value={nuevaCuenta.cbu}
                onChange={(e) => cambiar('cbu', e.target.value)}
                onBlur={validarCbuAlSalir}
                placeholder="22 dígitos"
                inputMode="numeric"
                maxLength={26}
                invalid={!!errores.cbu}
                aria-describedby={errores.cbu ? 'cbu-error' : undefined}
              />
              {errores.cbu && (
                <p id="cbu-error" className="text-label text-danger mt-1">{errores.cbu}</p>
              )}
            </div>
            <div>
              <Label htmlFor="alias">Alias (opcional)</Label>
              <Input
                id="alias"
                value={nuevaCuenta.alias}
                onChange={(e) => cambiar('alias', e.target.value)}
                placeholder="QUIEROMISAS.SAS"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="titular">Titular de la cuenta *</Label>
              <Input
                id="titular"
                value={nuevaCuenta.titular}
                onChange={(e) => cambiar('titular', e.target.value)}
                invalid={!!errores.titular}
                placeholder="QuieroMiSAS S.A.S."
              />
              {errores.titular && <p className="text-label text-danger mt-1">{errores.titular}</p>}
            </div>
            <div className="md:col-span-2">
              <Button
                variant="secondary"
                onClick={agregarCuenta}
                disabled={guardando}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {guardando ? 'Guardando...' : 'Agregar y guardar cuenta'}
              </Button>
              <p className="text-label text-ink-2 mt-2">La cuenta se guarda en el momento.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cuentas */}
      <Card>
        <CardHeader>
          <CardTitle>Cuentas configuradas ({cuentas.length})</CardTitle>
          <CardDescription>
            Estas cuentas estarán disponibles al generar links de pago de honorarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cuentasInvalidas > 0 && (
            <div className="mb-4 flex items-start gap-2 rounded-control border border-warning-line bg-warning-soft p-3 text-body-sm text-warning" role="alert">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
              <p>
                {cuentasInvalidas === 1 ? 'Hay 1 cuenta' : `Hay ${cuentasInvalidas} cuentas`} con un CBU inválido.
                {cuentasInvalidas === 1 ? ' No se ofrece' : ' No se ofrecen'} al generar links de pago hasta que la elimines y la cargues de nuevo con el CBU correcto.
              </p>
            </div>
          )}
          {cuentas.length === 0 ? (
            <p className="text-ink-2 text-center py-8">
              No hay cuentas configuradas. Agrega una cuenta arriba.
            </p>
          ) : (
            <div className="space-y-4">
              {cuentas.map((cuenta) => {
                const cbuInvalido = !cbuValido(cuenta.cbu)
                return (
                <div
                  key={cuenta.id}
                  className={`border rounded-control p-4 transition ${
                    cbuInvalido ? 'border-warning-line bg-warning-soft' : 'border-line bg-surface-2 hover:bg-surface-3'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-body-sm text-ink-2">Nombre</p>
                        <p className="font-semibold text-ink">{cuenta.nombre}</p>
                      </div>
                      <div>
                        <p className="text-body-sm text-ink-2">Banco</p>
                        <p className="font-semibold text-ink">{cuenta.banco}</p>
                      </div>
                      <div>
                        <p className="text-body-sm text-ink-2">CBU</p>
                        <p className="font-mono text-body font-semibold text-ink tnum">{cuenta.cbu}</p>
                        {cbuInvalido && (
                          <div className="mt-1 space-y-1">
                            <Badge tone="warning">
                              <AlertTriangle className="h-3 w-3" aria-hidden /> CBU inválido
                            </Badge>
                            <p className="text-label text-warning">{validarCbu(cuenta.cbu)}</p>
                          </div>
                        )}
                      </div>
                      {cuenta.alias && (
                        <div>
                          <p className="text-body-sm text-ink-2">Alias</p>
                          <p className="font-semibold text-ink">{cuenta.alias}</p>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <p className="text-body-sm text-ink-2">Titular</p>
                        <p className="font-semibold text-ink">{cuenta.titular}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Eliminar ${cuenta.nombre}`}
                      onClick={() => setAEliminar(cuenta)}
                      disabled={guardando}
                      className="text-primary hover:text-primary hover:bg-primary-soft"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!aEliminar}
        onOpenChange={(open) => !open && setAEliminar(null)}
        title="¿Eliminar esta cuenta?"
        description={aEliminar ? `«${aEliminar.nombre}» deja de ofrecerse al generar links de pago. Se guarda en el momento.` : undefined}
        loading={guardando}
        onConfirm={confirmarEliminar}
      />
    </div>
  )
}

