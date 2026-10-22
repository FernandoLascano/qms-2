'use client'

import { useEffect, useRef } from 'react'

/** Registra la vista una sola vez por carga (conteo real por visita). */
export function RegistrarVista({ postId }: { postId: string }) {
  const vistaRegistrada = useRef(false)
  useEffect(() => {
    if (vistaRegistrada.current) return
    vistaRegistrada.current = true
    fetch(`/api/blog/${postId}/vista`, { method: 'POST', keepalive: true }).catch(() => {})
  }, [postId])
  return null
}
