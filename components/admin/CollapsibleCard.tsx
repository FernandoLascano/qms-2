'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CollapsibleCardProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

export default function CollapsibleCard({
  title,
  description,
  icon,
  action,
  defaultOpen = false,
  children
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {icon}
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          </div>
          <div className="flex items-center gap-1">
            {action}
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      {isOpen && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  )
}
