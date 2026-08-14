/**
 * @deprecated Usá `@/lib/tramites/estado`.
 *
 * Se mantiene sólo como puente para los componentes que todavía lo importan.
 * Delega en la fuente única para que no vuelvan a divergir los cálculos.
 */

import {
  calcularProgreso as calcularProgresoBase,
  getEstado,
  etapaActual,
  type Audiencia,
} from '@/lib/tramites/estado'

export { calcularProgreso, detalleEtapas, ETAPAS, TOTAL_ETAPAS } from '@/lib/tramites/estado'

const CLASES_TONO: Record<string, string> = {
  neutral: 'bg-surface-3 text-n-700 border-line',
  primary: 'bg-primary-soft text-primary border-primary-line',
  info: 'bg-info-soft text-info border-info-line',
  success: 'bg-success-soft text-success border-success-line',
  warning: 'bg-warning-soft text-warning border-warning-line',
  danger: 'bg-danger-soft text-danger border-danger-line',
}

export const getEstadoColor = (tramite: any, audiencia: Audiencia = 'admin') =>
  CLASES_TONO[getEstado(tramite, audiencia).tone]

export const getEstadoTexto = (tramite: any, audiencia: Audiencia = 'admin') =>
  getEstado(tramite, audiencia).label

export const obtenerEtapaActual = (tramite: any, audiencia: Audiencia = 'admin') =>
  etapaActual(tramite, audiencia)

export default {
  calcularProgreso: calcularProgresoBase,
  getEstadoColor,
  getEstadoTexto,
  obtenerEtapaActual,
}
