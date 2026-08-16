'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Devuelve una ref y las clases para que un contenedor anime sus hijos cuando
 * entra en pantalla.
 *
 *   const { ref, clase } = useAlAparecer()
 *   <div ref={ref} className={`grid gap-6 ${clase}`}>…</div>
 *
 * La animación la hace CSS (ver `.al-aparecer` en globals.css). Acá sólo se
 * agrega una clase, una sola vez: a diferencia de escribir la opacidad en el
 * estilo del elemento, una clase es idempotente y un re-render de React no la
 * puede volver atrás.
 */
export function useAlAparecer<T extends HTMLElement = HTMLDivElement>(margen = '-80px') {
  const ref = useRef<T>(null)
  const [aLaVista, setALaVista] = useState(false)

  useEffect(() => {
    const nodo = ref.current
    if (!nodo || aLaVista) return

    // Sin IntersectionObserver (o si ya está en pantalla al cargar) se muestra
    // directamente: nunca se puede quedar contenido invisible.
    if (typeof IntersectionObserver === 'undefined') {
      setALaVista(true)
      return
    }

    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return
        setALaVista(true)
        obs.disconnect()
      },
      { rootMargin: margen },
    )
    obs.observe(nodo)
    return () => obs.disconnect()
  }, [margen, aLaVista])

  return { ref, clase: aLaVista ? 'al-aparecer a-la-vista' : 'al-aparecer' }
}
