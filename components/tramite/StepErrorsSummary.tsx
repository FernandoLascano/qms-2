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
    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4 animate-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-red-900 mb-2">
            Hay {errors.length} {errors.length === 1 ? 'error' : 'errores'} que corregir:
          </h4>
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-800 flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-red-600 hover:text-red-800 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

