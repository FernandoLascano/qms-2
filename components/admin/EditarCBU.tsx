'use client'

import { useState } from 'react'
import CollapsibleCard from '@/components/admin/CollapsibleCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const INFORMAR_LUEGO = 'INFORMAR_LUEGO'

interface EditarCBUProps {
  tramiteId: string
  cbuPrincipal?: string | null
  cbuSecundario?: string | null
}

export default function EditarCBU({ tramiteId, cbuPrincipal, cbuSecundario }: EditarCBUProps) {
  const router = useRouter()

  // "INFORMAR_LUEGO" no es un CBU real: se muestra como vacío para poder cargarlo.
  const norm = (v?: string | null) => (v && v !== INFORMAR_LUEGO ? v : '')

  const [principal, setPrincipal] = useState(norm(cbuPrincipal))
  const [secundario, setSecundario] = useState(norm(cbuSecundario))
  const [guardando, setGuardando] = useState(false)

  const pendiente =
    cbuPrincipal === INFORMAR_LUEGO ||
    cbuSecundario === INFORMAR_LUEGO ||
    (!cbuPrincipal && !cbuSecundario)

  const soloDigitos = (v: string) => v.replace(/[.\-\s]/g, '')
  const cbuDudoso = (v: string) => v.trim() !== '' && !/^\d{22}$/.test(soloDigitos(v))

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      const res = await fetch(`/api/admin/tramites/${tramiteId}/editar-formulario`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // El endpoint mergea datosUsuario: solo se pisan estos dos campos.
          datosUsuario: {
            cbuPrincipal: principal.trim(),
            cbuSecundario: secundario.trim(),
          },
        }),
      })

      if (res.ok) {
        toast.success('CBU actualizado correctamente')
        router.refresh()
      } else {
        const e = await res.json().catch(() => ({}))
        toast.error(e.error || 'Error al guardar el CBU')
      }
    } catch {
      toast.error('Error al guardar el CBU')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <CollapsibleCard
      title="CBU Informados"
      description="Datos bancarios del cliente — editable (para cargarlos cuando el cliente los comparte)"
      icon={<Building2 className="h-5 w-5 text-ink-2" />}
    >
      {pendiente && (
        <div className="bg-warning-soft border border-warning-line rounded-control p-3 mb-4 text-body-sm text-warning">
          El cliente todavía no informó el CBU (eligió informarlo más adelante). Cuando te lo comparta, cargalo acá y guardá.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cbuPrincipal">CBU Principal</Label>
          <Input
            id="cbuPrincipal"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="22 dígitos"
            className="mt-1"
          />
          <p className="text-label text-ink-2 mt-1">Administrador Titular</p>
          {cbuDudoso(principal) && (
            <p className="text-label text-warning mt-1">Un CBU tiene 22 dígitos — podés guardar igual.</p>
          )}
        </div>
        <div>
          <Label htmlFor="cbuSecundario">CBU Secundario</Label>
          <Input
            id="cbuSecundario"
            value={secundario}
            onChange={(e) => setSecundario(e.target.value)}
            placeholder="22 dígitos"
            className="mt-1"
          />
          <p className="text-label text-ink-2 mt-1">Administrador Suplente</p>
          {cbuDudoso(secundario) && (
            <p className="text-label text-warning mt-1">Un CBU tiene 22 dígitos — podés guardar igual.</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleGuardar} disabled={guardando} className="bg-primary hover:bg-primary-hover">
          <Save className="h-4 w-4 mr-2" />
          {guardando ? 'Guardando…' : 'Guardar CBU'}
        </Button>
      </div>
    </CollapsibleCard>
  )
}
