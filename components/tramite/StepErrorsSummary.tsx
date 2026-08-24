'use client'

import { AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepErrorsSummaryProps {
  errors: string[]
  onClose?: () => void
}

export function StepErrorsSummary({ errors, onClose }: StepErrorsSummaryProps) {
  if (errors.length === 0) return null

  return (
    <div className="bg-primary-soft border-2 border-primary-line rounded-control p-4 mb-4 animate-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-primary mb-2">
            Hay {errors.length} {errors.length === 1 ? 'error' : 'errores'} que corregir:
          </h4>
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-body-sm text-primary flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-primary hover:text-primary transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

