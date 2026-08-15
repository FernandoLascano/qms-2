'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { PageSkeleton } from '@/components/ui/states'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import Link from 'next/link'

interface CuentaBancaria {
  id: string
  nombre: string
  banco: string
  cbu: string
  alias?: string
  titular: string
}

export default function ConfiguracionCuentasPage() {
  const router = useRouter()
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [nuevaCuenta, setNuevaCuenta] = useState({
    nombre: '',
    banco: '',
    cbu: '',
    alias: '',
    titular: ''
  })

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

  const agregarCuenta = () => {
    if (!nuevaCuenta.nombre || !nuevaCuenta.banco || !nuevaCuenta.cbu || !nuevaCuenta.titular) {
      toast.error('Completa todos los campos obligatorios')
      return
    }

    const cuenta: CuentaBancaria = {
      id: Date.now().toString(),
      nombre: nuevaCuenta.nombre,
      banco: nuevaCuenta.banco,
      cbu: nuevaCuenta.cbu,
      alias: nuevaCuenta.alias || undefined,
      titular: nuevaCuenta.titular
    }

    setCuentas([...cuentas, cuenta])
    setNuevaCuenta({ nombre: '', banco: '', cbu: '', alias: '', titular: '' })
    toast.success('Cuenta agregada (guarda para confirmar)')
  }

  const eliminarCuenta = (id: string) => {
    setCuentas(cuentas.filter(c => c.id !== id))
    toast.success('Cuenta eliminada (guarda para confirmar)')
  }

  const guardarCuentas = async () => {
    setGuardando(true)
    try {
      const response = await fetch('/api/admin/cuentas-bancarias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuentas })
      })

      if (response.ok) {
        toast.success('Cuentas bancarias guardadas correctamente')
        router.refresh()
      } else {
        toast.error('Error al guardar cuentas bancarias')
      }
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error('Error al guardar cuentas bancarias')
    } finally {
      setGuardando(false)
    }
  }

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
                onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, nombre: e.target.value })}
                placeholder="Ej: Cuenta Principal, Cuenta Secundaria"
              />
            </div>
            <div>
              <Label htmlFor="banco">Banco *</Label>
              <Input
                id="banco"
                value={nuevaCuenta.banco}
                onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, banco: e.target.value })}
                placeholder="Banco Nación, Banco Provincia, etc."
              />
            </div>
            <div>
              <Label htmlFor="cbu">CBU *</Label>
              <Input
                id="cbu"
                value={nuevaCuenta.cbu}
                onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, cbu: e.target.value })}
                placeholder="0000000000000000000000"
                maxLength={22}
              />
            </div>
            <div>
              <Label htmlFor="alias">Alias (opcional)</Label>
              <Input
                id="alias"
                value={nuevaCuenta.alias}
                onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, alias: e.target.value })}
                placeholder="QUIEROMISAS.SAS"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="titular">Titular de la cuenta *</Label>
              <Input
                id="titular"
                value={nuevaCuenta.titular}
                onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, titular: e.target.value })}
                placeholder="QuieroMiSAS S.A.S."
              />
            </div>
            <div className="md:col-span-2">
              <Button
              variant="secondary"
              onClick={agregarCuenta} className="gap-2">
                <Plus className="h-4 w-4" />
                Agregar cuenta
              </Button>
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
          {cuentas.length === 0 ? (
            <p className="text-ink-2 text-center py-8">
              No hay cuentas configuradas. Agrega una cuenta arriba.
            </p>
          ) : (
            <div className="space-y-4">
              {cuentas.map((cuenta) => (
                <div
                  key={cuenta.id}
                  className="border border-line rounded-control p-4 bg-surface-2 hover:bg-surface-3 transition"
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
                      onClick={() => eliminarCuenta(cuenta.id)}
                      className="text-primary hover:text-primary hover:bg-primary-soft"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {cuentas.length > 0 && (
            <div className="mt-6 pt-4 border-t border-line">
              <Button
                onClick={guardarCuentas}
                disabled={guardando}
                className="gap-2 bg-primary hover:bg-primary"
              >
                <Save className="h-4 w-4" />
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

