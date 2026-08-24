'use client'

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
  disabled,
  maxLength,
  min,
  max,
  pattern,
  autoComplete
}: FormFieldProps) {
  const hasError = validation === 'error' || !!error
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
            hasError && 'border-danger-solid focus:ring-ring focus:border-danger-solid',
            hasSuccess && 'border-success-solid focus:ring-success-solid focus:border-success-solid',
            !hasError && !hasSuccess && 'border-line-strong'
          )}
        />
        {hasError && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-danger pointer-events-none" />
        )}
      </div>

      {error && (
        <p className="text-label text-danger flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {!error && helpText && (
        <p className="text-label text-ink-2 flex items-start gap-1">
          <HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>{helpText}</span>
        </p>
      )}
    </div>
  )
}

