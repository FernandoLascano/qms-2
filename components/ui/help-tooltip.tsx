'use client'

import { HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface HelpTooltipProps {
  content: string
  className?: string
}

export function HelpTooltip({ content, className }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center justify-center w-4 h-4 rounded-full",
          "bg-n-200 hover:bg-n-300 text-ink-2",
          "transition-colors cursor-help",
          className
        )}
      >
        <HelpCircle className="h-3 w-3" />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-n-900 text-white text-label rounded-control shadow-xl">
          <p>{content}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-n-900 rotate-45" />
        </div>
      )}
    </div>
  )
}

