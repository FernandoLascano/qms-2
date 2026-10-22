'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatearMiles } from '@/lib/montos'
import { soloDigitos } from '@/lib/validaciones'
import { cn } from '@/lib/utils'

/**
 * Campo de pesos enteros. Muestra «782.400» mientras se escribe y guarda sólo
 * los dígitos («782400»). Reemplaza al `type="number"`, que dejaba pasar
 * decimales (después mal leídos), cambiaba el valor con la rueda del mouse y no
 * mostraba separadores de miles.
 */
export function CampoMonto({
  id,
  value,
  onChange,
  error,
  placeholder,
  className,
  'aria-label': ariaLabel,
}: {
  id: string
  value: string
  onChange: (digitos: string) => void
  error?: string
  placeholder?: string
  className?: string
  'aria-label'?: string
}) {
  const [ultimoError, setUltimoError] = useState(error)
  if (error && error !== ultimoError) setUltimoError(error)

  return (
    <div className={className}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">$</span>
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={formatearMiles(value)}
          onChange={(e) => onChange(soloDigitos(e.target.value))}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={!!error || undefined}
          className={cn('pl-7 tnum', error && 'border-danger-solid')}
        />
      </div>
      <div className="mensaje-campo" data-visible={!!error}>
        <div>
          <p className="pt-2 text-label text-danger flex items-center gap-1" aria-live="polite">
            <AlertCircle className="h-3 w-3" />
            {ultimoError}
          </p>
        </div>
      </div>
    </div>
  )
}
