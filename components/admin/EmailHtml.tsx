'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Muestra el HTML de un email recibido, aislado del panel.
 *
 * Antes se inyectaba con `dangerouslySetInnerHTML` directo en la página, y el
 * CSS del remitente se aplicaba a TODO el panel: un email de Rebill traía siete
 * bloques <style> con selectores globales —`a { color: #2580ff }`, `img { … }`,
 * `body { … }`— y dejaba todos los enlaces del menú azules y el logo agrandado.
 * Ninguna clase del contenedor puede evitarlo: un <style> inyectado en el
 * documento vale para el documento entero.
 *
 * El iframe también tapa un agujero de seguridad. El HTML de un correo entrante
 * es contenido de un tercero, y aunque el navegador no ejecuta <script> puestos
 * por innerHTML, sí dispara los `onerror`/`onload` de una <img>. Acá no corre
 * nada: `sandbox` sin `allow-scripts` desactiva todo el JavaScript de adentro.
 *
 * Se permite `allow-same-origin` sólo para poder medir el alto del contenido y
 * ajustar el marco. Es seguro justamente porque no hay `allow-scripts`: sin
 * JavaScript adentro, no hay nada que pueda aprovechar ese permiso.
 */
/**
 * Los enlaces se abren en una pestaña nueva: dentro del marco no se puede
 * navegar. `noopener` corta el acceso de la página abierta a este marco.
 */
function conEnlacesAfuera(html: string): string {
  if (typeof DOMParser === 'undefined') return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('base').forEach((b) => b.remove())
  doc.querySelectorAll('a[href], area[href]').forEach((a) => {
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener noreferrer')
  })
  const base = doc.createElement('base')
  base.setAttribute('target', '_blank')
  doc.head.prepend(base)
  return '<!doctype html>' + doc.documentElement.outerHTML
}

export function EmailHtml({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [alto, setAlto] = useState(320)
  const contenido = useMemo(() => conEnlacesAfuera(html), [html])

  useEffect(() => {
    const marco = ref.current
    if (!marco) return

    const medir = () => {
      try {
        const doc = marco.contentDocument
        if (!doc?.body) return
        // +16 por el margen que casi todos los emails traen en el body.
        const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight) + 16
        if (h > 0) setAlto(Math.min(h, 4000))
      } catch {
        // Si el navegador bloquea el acceso, queda el alto por defecto con
        // scroll interno: se ve peor, pero se ve.
      }
    }

    marco.addEventListener('load', medir)
    // Las imágenes cambian el alto cuando terminan de cargar.
    const t = setTimeout(medir, 400)
    const t2 = setTimeout(medir, 1500)
    return () => {
      marco.removeEventListener('load', medir)
      clearTimeout(t)
      clearTimeout(t2)
    }
  }, [contenido])

  return (
    <iframe
      ref={ref}
      srcDoc={contenido}
      // allow-popups: que los enlaces abran pestaña nueva; escape-sandbox: que
      // esa pestaña funcione como una normal y no herede las restricciones.
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      title="Contenido del email"
      className="w-full rounded-control border border-line bg-white"
      style={{ height: alto }}
    />
  )
}
