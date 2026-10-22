'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  type?: string
  placeholder?: string
  required?: boolean
  error?: string
  helpText?: string
  validation?: 'success' | 'error' | 'none'
  className?: string
  /** Clases sólo para el campo (p. ej. `font-mono` en un CBU), no para la etiqueta ni la ayuda. */
  inputClassName?: string
  disabled?: boolean
  maxLength?: number
  min?: string | number
  max?: string | number
  pattern?: string
  autoComplete?: string
}

export function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  error,
  helpText,
  validation = 'none',
  className,
  inputClassName,
  disabled,
  maxLength,
  min,
  max,
  pattern,
  autoComplete
}: FormFieldProps) {
  const hasError = validation === 'error' || !!error
  // El último error se sigue mostrando mientras el mensaje se cierra; si no,
  // el texto desaparecería antes que el espacio que ocupa.
  const [ultimoError, setUltimoError] = useState(error)
  if (error && error !== ultimoError) setUltimoError(error)
  const hasSuccess = validation === 'success' && value && !hasError

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={name} className={cn(
          'text-body-sm font-semibold',
          hasError && 'text-danger',
          hasSuccess && 'text-success'
        )}>
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </Label>
        {hasSuccess && (
          <CheckCircle className="h-4 w-4 text-success" />
        )}
      </div>
      
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          min={min}
          max={max}
          pattern={pattern}
          autoComplete={autoComplete}
          className={cn(
            inputClassName,
            hasError && 'border-danger-solid focus:ring-ring focus:border-danger-solid',
            hasSuccess && 'border-success-solid focus:ring-success-solid focus:border-success-solid',
            !hasError && !hasSuccess && 'border-line-strong'
          )}
        />
        {hasError && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-danger pointer-events-none" />
        )}
      </div>

      {/* Error y ayuda comparten lugar: se despliegan y se cruzan con la altura
          justa en vez de empujar el formulario de golpe (idea de interior.dev
          «inline-validation», MIT; ver `.mensaje-campo` en globals.css). */}
      <div className="mensaje-campo -mt-2" data-visible={!!error}>
        <div>
          <p className="pt-2 text-label text-danger flex items-center gap-1" aria-live="polite">
            <AlertCircle className="h-3 w-3" />
            {ultimoError}
          </p>
        </div>
      </div>

      {helpText && (
        <div className="mensaje-campo -mt-2" data-visible={!error}>
          <div>
            <p className="pt-2 text-label text-ink-2 flex items-start gap-1">
              <HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{helpText}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

