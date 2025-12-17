'use client'

import { useState } from 'react'
import CollapsibleCard from '@/components/admin/CollapsibleCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Banknote } from 'lucide-react'
import { toast } from 'sonner'

interface CuentaCapitalProps {
  tramiteId: string
  capitalSocial: number
  cuentaInicial?: {
    banco: string
    cbu: string
    alias: string | null
    titular: string
    montoEsperado: number
  } | null
}

export default function CuentaCapital({ tramiteId, capitalSocial, cuentaInicial }: CuentaCapitalProps) {
  const montoSugerido = Math.round((capitalSocial || 0) * 0.25)

  const [banco, setBanco] = useState(cuentaInicial?.banco || '')
  const [cbu, setCbu] = useState(cuentaInicial?.cbu || '')
  const [alias, setAlias] = useState(cuentaInicial?.alias || '')
  const [titular, setTitular] = useState(cuentaInicial?.titular || '')
  const [montoEsperado, setMontoEsperado] = useState(
    cuentaInicial?.montoEsperado ? String(cuentaInicial.montoEsperado) : String(montoSugerido || '')
  )
  const [guardando, setGuardando] = useState(false)

  const handleGuardar = async () => {
    if (!banco || !cbu || !titular || !montoEsperado) {
      toast.error('Completa todos los campos obligatorios')
      return
    }

    if (cbu.length !== 22) {
      toast.error('El CBU debe tener 22 dígitos')
      return
    }

    setGuardando(true)

    try {
      const response = await fetch(`/api/admin/tramites/${tramiteId}/cuenta-capital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          banco,
          cbu,
          alias,
          titular,
          montoEsperado: parseFloat(montoEsperado)
        })
      })

      if (response.ok) {
        toast.success('Datos bancarios guardados y cliente notificado')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al guardar datos bancarios')
      }
    } catch (error) {
      toast.error('Error al guardar datos bancarios')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="border-blue-200 bg-blue-50 rounded-lg">
      <CollapsibleCard
        title="Depósito de Capital (Cuenta Bancaria)"
        description="Informa al cliente dónde debe depositar el 25% del capital social."
        icon={<Banknote className="h-5 w-5 text-blue-700" />}
      >
        <div className="space-y-4">
        <div className="bg-white border border-blue-100 rounded-lg p-3 text-xs text-gray-700">
          <p>
            Capital social informado: <strong>${capitalSocial.toLocaleString('es-AR')}</strong>
          </p>
          <p>
            Depósito mínimo (25% sugerido):{' '}
            <strong>${montoSugerido.toLocaleString('es-AR')}</strong>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="banco">Banco *</Label>
            <Input
              id="banco"
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              placeholder="Banco Nación, Banco Provincia, etc."
              disabled={guardando}
            />
          </div>

          <div>
            <Label htmlFor="titular">Titular de la Cuenta *</Label>
            <Input
              id="titular"
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
              placeholder="QuieroMiSAS S.A.S."
              disabled={guardando}
            />
          </div>

          <div>
            <Label htmlFor="cbu">CBU *</Label>
            <Input
              id="cbu"
              value={cbu}
              onChange={(e) => setCbu(e.target.value)}
              placeholder="0000000000000000000000"
              disabled={guardando}
              maxLength={22}
            />
          </div>

          <div>
            <Label htmlFor="alias">Alias (opcional)</Label>
            <Input
              id="alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="QUIEROMISAS.CAPITAL"
              disabled={guardando}
            />
          </div>

          <div>
            <Label htmlFor="montoEsperado">Monto a Depositar (ARS) *</Label>
            <Input
              id="montoEsperado"
              type="number"
              value={montoEsperado}
              onChange={(e) => setMontoEsperado(e.target.value)}
              disabled={guardando}
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Sugerido: 25% del capital. Podés ajustarlo si el organismo exige otro monto.
            </p>
          </div>
        </div>

        <Button
          onClick={handleGuardar}
          disabled={guardando}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {guardando ? 'Guardando...' : 'Guardar y Notificar al Cliente'}
        </Button>
        </div>
      </CollapsibleCard>
    </div>
  )
}


