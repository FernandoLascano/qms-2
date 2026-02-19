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
          'text-sm font-semibold',
          hasError && 'text-brand-600',
          hasSuccess && 'text-green-600'
        )}>
          {label}
          {required && <span className="text-brand-600 ml-1">*</span>}
        </Label>
        {hasSuccess && (
          <CheckCircle className="h-4 w-4 text-green-600" />
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
            hasError && 'border-brand-500 focus:ring-brand-500 focus:border-brand-500',
            hasSuccess && 'border-green-500 focus:ring-green-500 focus:border-green-500',
            !hasError && !hasSuccess && 'border-gray-300'
          )}
        />
        {hasError && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-500 pointer-events-none" />
        )}
      </div>

      {error && (
        <p className="text-xs text-brand-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {!error && helpText && (
        <p className="text-xs text-gray-500 flex items-start gap-1">
          <HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>{helpText}</span>
        </p>
      )}
    </div>
  )
}

