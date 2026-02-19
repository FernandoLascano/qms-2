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
    red: 'bg-brand-50 text-brand-700',
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    purple: 'bg-purple-50 text-purple-700'
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
          
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm font-semibold ${
                trend.isPositive ? 'text-green-600' : 'text-brand-600'
              }`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">vs mes anterior</span>
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

