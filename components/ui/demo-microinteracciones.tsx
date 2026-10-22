'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import { FormField } from '@/components/ui/form-field'
import { CopyButton, DatoCopiable, montoParaCopiar } from '@/components/ui/copy-button'
import { EtiquetaCarga } from '@/components/ui/etiqueta-carga'
import { PasswordStrength } from '@/components/ui/password-strength'
import { pesos } from '@/lib/etiquetas'

/** Muestras interactivas para el sistema de diseño (no es pantalla de producto). */
export function DemoMicrointeracciones() {
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [intento, setIntento] = useState(false)
  const [paso, setPaso] = useState(1)
  const [direccion, setDireccion] = useState<'adelante' | 'atras'>('adelante')

  const errorNombre = intento && nombre.trim().length < 2 ? 'Ingresá el nombre completo' : undefined
  const ir = (n: number) => {
    setDireccion(n < paso ? 'atras' : 'adelante')
    setPaso(n)
  }
  const enviar = () => {
    setEnviando(true)
    setTimeout(() => setEnviando(false), 1800)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardBody className="space-y-3 text-body-sm">
          <p className="font-semibold text-ink">Copiar datos bancarios</p>
          <DatoCopiable etiqueta="CBU" valor="0110599520000001234567" mono />
          <DatoCopiable etiqueta="Alias" valor="QMS.CAPITAL.SAS" />
          <div className="flex items-center gap-2">
            <span className="flex-1 text-ink-2">
              Monto: <strong className="text-ink">{pesos(1250000)}</strong>
            </span>
            <CopyButton valor={montoParaCopiar(1250000)} descripcion="Copiar monto" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <p className="text-body-sm font-semibold text-ink">Fortaleza de contraseña</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Probá escribir una contraseña"
            className="h-11 w-full rounded-control border border-line px-3 text-body outline-none focus:border-primary-line focus:ring-2 focus:ring-ring"
          />
          <PasswordStrength valor={password} />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <p className="text-body-sm font-semibold text-ink">Error que no empuja de golpe</p>
          <FormField
            label="Nombre"
            name="demo-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            error={errorNombre}
            helpText="Tal como figura en el DNI"
            required
          />
          <Button variant="outline" onClick={() => setIntento(true)}>
            Validar
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <p className="text-body-sm font-semibold text-ink">Pasos con dirección y botón que no cambia de tamaño</p>
          <div className="overflow-hidden rounded-control border border-line bg-surface-2 p-4">
            <div key={paso} className={direccion === 'atras' ? 'paso-atras' : 'paso-adelante'}>
              <p className="text-label text-ink-3">Paso {paso} de 3</p>
              <p className="text-body font-semibold text-ink">
                {['Datos personales', 'Denominación', 'Capital social'][paso - 1]}
              </p>
            </div>
          </div>
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => ir(paso - 1)} disabled={paso === 1}>
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            {paso < 3 ? (
              <Button onClick={() => ir(paso + 1)}>
                Siguiente <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={enviar} disabled={enviando}>
                <EtiquetaCarga cargando={enviando} textoCargando="Enviando...">
                  Enviar formulario <ChevronRight className="h-4 w-4" />
                </EtiquetaCarga>
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
