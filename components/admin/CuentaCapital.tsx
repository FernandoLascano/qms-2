'use client'

import { useState, useEffect } from 'react'
import CollapsibleCard from '@/components/admin/CollapsibleCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Banknote, Send, History, Clock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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

interface EnvioRecord {
  fecha: Date
  banco: string
  cbu: string
}

export default function CuentaCapital({ tramiteId, capitalSocial, cuentaInicial }: CuentaCapitalProps) {
  const router = useRouter()
  const montoSugerido = Math.round((capitalSocial || 0) * 0.25)

  const [banco, setBanco] = useState(cuentaInicial?.banco || '')
  const [cbu, setCbu] = useState(cuentaInicial?.cbu || '')
  const [alias, setAlias] = useState(cuentaInicial?.alias || '')
  const [titular, setTitular] = useState(cuentaInicial?.titular || '')
  const [montoEsperado, setMontoEsperado] = useState(
    cuentaInicial?.montoEsperado ? String(cuentaInicial.montoEsperado) : String(montoSugerido || '')
  )
  const [guardando, setGuardando] = useState(false)
  const [historialEnvios, setHistorialEnvios] = useState<EnvioRecord[]>([])

  // Cargar historial de notificaciones relacionadas
  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const response = await fetch(`/api/admin/tramites/${tramiteId}/notificaciones-capital`)
        if (response.ok) {
          const data = await response.json()
          setHistorialEnvios(data.map((n: any) => ({
            fecha: new Date(n.createdAt),
            banco: n.metadata?.banco || 'No especificado',
            cbu: n.metadata?.cbu || 'No especificado'
          })))
        }
      } catch (error) {
        console.error('Error al cargar historial:', error)
      }
    }
    fetchHistorial()
  }, [tramiteId])

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
        // Actualizar historial localmente
        setHistorialEnvios([{
          fecha: new Date(),
          banco,
          cbu
        }, ...historialEnvios])
        router.refresh()
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
    <div className="rounded-lg h-full">
      <CollapsibleCard
        title="Depósito de Capital (Cuenta Bancaria)"
        description="Informa al cliente dónde debe depositar el 25% del capital social."
        icon={<Banknote className="h-5 w-5 text-blue-700" />}
      >
        <div className="space-y-6">
        <div className="bg-blue-50 border-2 border-blue-100 rounded-lg p-4">
          <p className="text-blue-900 font-bold flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Monto Sugerido (25%): ${montoSugerido.toLocaleString('es-AR')}
          </p>
          <p className="text-xs text-blue-700 mt-1 italic">
            Capital social total: ${capitalSocial.toLocaleString('es-AR')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="banco">Banco *</Label>
            <Input
              id="banco"
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              placeholder="Banco Nación, Banco Provincia, etc."
              disabled={guardando}
              className="border-gray-200 focus:border-blue-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="titular">Titular de la Cuenta *</Label>
            <Input
              id="titular"
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
              placeholder="QuieroMiSAS S.A.S."
              disabled={guardando}
              className="border-gray-200 focus:border-blue-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cbu">CBU *</Label>
            <Input
              id="cbu"
              value={cbu}
              onChange={(e) => setCbu(e.target.value)}
              placeholder="22 dígitos"
              disabled={guardando}
              maxLength={22}
              className="border-gray-200 focus:border-blue-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alias">Alias (opcional)</Label>
            <Input
              id="alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="QUIEROMISAS.CAPITAL"
              disabled={guardando}
              className="border-gray-200 focus:border-blue-300"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="montoEsperado">Monto exacto a depositar (ARS) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">$</span>
              <Input
                id="montoEsperado"
                type="number"
                value={montoEsperado}
                onChange={(e) => setMontoEsperado(e.target.value)}
                disabled={guardando}
                className="pl-7 border-gray-200 focus:border-blue-300"
              />
            </div>
            <p className="text-[11px] text-gray-500 italic">
              Este es el monto que se le informará al cliente en su panel.
            </p>
          </div>
        </div>

        <Button
          onClick={handleGuardar}
          disabled={guardando}
          className="w-full bg-blue-600 hover:bg-blue-700 font-bold h-12 shadow-md transition-all active:scale-95"
        >
          <Send className="h-4 w-4 mr-2" />
          {guardando ? 'Enviando...' : 'Enviar Instrucciones al Cliente'}
        </Button>

        {/* Historial de Envío */}
        {historialEnvios.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4 text-gray-500" />
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Historial de Envío</h4>
            </div>
            <div className="space-y-3">
              {historialEnvios.map((envio, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{envio.banco}</p>
                      <p className="text-[10px] text-gray-500 font-mono">CBU: {envio.cbu}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="flex items-center gap-1 text-gray-600 font-medium text-xs">
                      <Clock className="h-3 w-3" />
                      {format(envio.fecha, "d/M/yy HH:mm", { locale: es })}
                    </div>
                    <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 font-bold">
                      ENVIADO
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </CollapsibleCard>
    </div>
  )
}


