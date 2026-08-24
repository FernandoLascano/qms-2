'use client'

import * as React from "react"
import { AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/**
 * Envoltorio único de campo de formulario: label + control + ayuda + error.
 *
 * Reemplaza los ~30 formularios que armaban esto a mano con paddings, radios y
 * colores de anillo distintos. El error se asocia al control por
 * aria-describedby, así lo anuncia el lector de pantalla.
 *
 *   <Field label="CUIT" htmlFor="cuit" required error={errores.cuit}>
 *     <Input id="cuit" invalid={!!errores.cuit} … />
 *   </Field>
 */

interface FieldProps {
  label?: string
  htmlFor?: string
  required?: boolean
  hint?: string
  error?: string
  className?: string
  children: React.ReactNode
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined
  const hintId = htmlFor ? `${htmlFor}-hint` : undefined
  const describedBy = [error ? errorId : null, !error && hint ? hintId : null]
    .filter(Boolean)
    .join(' ')

  const control =
    describedBy.length > 0
      ? React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(
                child as React.ReactElement<{ 'aria-describedby'?: string }>,
                { 'aria-describedby': describedBy },
              )
            : child,
        )
      : children

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label htmlFor={htmlFor} className="block">
          {label}
          {required && (
            <span className="text-danger ml-0.5" aria-hidden>
              *
            </span>
          )}
        </Label>
      )}

      {control}

      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-label text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="text-label text-ink-2">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
