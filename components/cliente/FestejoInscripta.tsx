'use client'

import { useEffect } from 'react'

/**
 * Confeti la primera vez que el cliente ve su sociedad inscripta (una vez por
 * trámite y por navegador). La librería se descarga sólo en ese momento.
 */
export function FestejoInscripta({ tramiteId }: { tramiteId: string }) {
  useEffect(() => {
    const clave = `festejo-inscripta-${tramiteId}`
    try {
      if (window.localStorage.getItem(clave)) return
      window.localStorage.setItem(clave, '1')
    } catch {
      return // sin almacenamiento no se puede recordar: mejor no repetirlo en cada visita
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelado = false
    import('canvas-confetti').then(({ default: confetti }) => {
      if (cancelado) return
      const colores = ['#9b1c1f', '#d4a72c', '#1fb86a', '#ffffff']
      const lanzar = (x: number, angulo: number) =>
        confetti({ particleCount: 70, spread: 70, startVelocity: 55, angle: angulo, origin: { x, y: 0.75 }, colors: colores, zIndex: 60 })
      lanzar(0.1, 60)
      lanzar(0.9, 120)
      setTimeout(() => !cancelado && confetti({ particleCount: 90, spread: 100, origin: { y: 0.6 }, colors: colores, zIndex: 60 }), 350)
    })
    return () => {
      cancelado = true
    }
  }, [tramiteId])

  return null
}
