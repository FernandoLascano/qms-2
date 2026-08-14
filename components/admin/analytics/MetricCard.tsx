'use client'

import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
  color?: 'red' | 'green' | 'blue' | 'yellow' | 'purple'
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  subtitle,
  color = 'red' 
}: MetricCardProps) {
  const colorClasses = {
    red: 'bg-primary-soft text-primary',
    green: 'bg-success-soft text-success',
    blue: 'bg-info-soft text-info',
    yellow: 'bg-warning-soft text-warning',
    purple: 'bg-info-soft text-info'
  }

  return (
    <div className="bg-surface rounded-control shadow-raise p-6 hover:shadow-raise transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-body-sm font-medium text-ink-2 mb-1">{title}</p>
          <h3 className="text-display font-semibold text-ink mb-2">{value}</h3>
          
          {subtitle && (
            <p className="text-body-sm text-ink-2">{subtitle}</p>
          )}
          
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-body-sm font-semibold ${
                trend.isPositive ? 'text-success' : 'text-primary'
              }`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-label text-ink-2">vs mes anterior</span>
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-control ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

