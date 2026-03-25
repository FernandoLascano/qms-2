import { endOfMonth, format, startOfMonth, startOfYear } from 'date-fns'

export type Ga4Periodo = 'dia' | 'semana' | 'mes' | 'año'

/**
 * Rangos compatibles con GA4 Data API (today, 7daysAgo, o YYYY-MM-DD).
 */
export function ga4DateRange(periodo: string): { startDate: string; endDate: string } {
  const today = new Date()
  switch (periodo) {
    case 'dia':
      return { startDate: 'today', endDate: 'today' }
    case 'semana':
      return { startDate: '7daysAgo', endDate: 'today' }
    case 'mes':
      return {
        startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
      }
    case 'año':
      return {
        startDate: format(startOfYear(today), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      }
    default:
      return { startDate: '7daysAgo', endDate: 'today' }
  }
}
