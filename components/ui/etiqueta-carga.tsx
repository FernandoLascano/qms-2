import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Contenido de un botón que pasa a «cargando» sin cambiar de tamaño.
 *
 * Idea de interior.dev «loading-button» (MIT): los dos estados ocupan la
 * misma celda y se cruzan con un fundido, así el botón no se achica ni se
 * agranda al apretarlo (antes «Enviar Formulario» → «Enviando...» lo movía).
 */
export function EtiquetaCarga({
  cargando,
  children,
  textoCargando,
}: {
  cargando: boolean
  children: ReactNode
  textoCargando: string
}) {
  return (
    <span className="apilado justify-items-center">
      <span className="inline-flex items-center gap-2" data-activo={!cargando} aria-hidden={cargando}>
        {children}
      </span>
      <span className="inline-flex items-center gap-2" data-activo={cargando} aria-hidden={!cargando}>
        <Loader2 className="h-5 w-5 animate-spin" />
        {textoCargando}
      </span>
    </span>
  )
}
