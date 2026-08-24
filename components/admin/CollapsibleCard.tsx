'use client'

import { CollapsibleSection } from '@/components/ui/collapsible-section'

/**
 * @deprecated Usá `@/components/ui/collapsible-section`.
 *
 * Se mantiene como puente para los 12 componentes del admin que lo importan.
 * La implementación vieja tenía la cabecera en un <div onClick>: no se podía
 * abrir con teclado, no anunciaba aria-expanded y el botón de acción del
 * encabezado disparaba también el plegado. Ahora delega en el componente
 * accesible del sistema, así que todos esos usos quedan arreglados de una.
 */

interface CollapsibleCardProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

export default function CollapsibleCard(props: CollapsibleCardProps) {
  return <CollapsibleSection {...props} padding="default" />
}
