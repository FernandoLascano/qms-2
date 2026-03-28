'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

function turnstileApi() {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; remove: (id: string) => void } }).turnstile
}

/**
 * Turnstile con next/script: en navegación SPA el script puede estar en caché y onLoad no se dispara otra vez;
 * el ref al contenedor a veces es null en el primer effect. Este hook lo unifica.
 */
export function useTurnstileWidget(options: {
  siteKey: string | undefined
  captchaRequired: boolean
  onTokenChange: (token: string | null) => void
}) {
  const { siteKey, captchaRequired } = options
  const onTokenChange = useRef(options.onTokenChange)
  onTokenChange.current = options.onTokenChange

  const [scriptReady, setScriptReady] = useState(false)
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    setContainerEl(node)
  }, [])

  // Si el script ya está (segunda visita / SPA), onLoad de <Script> no corre → detectar turnstile global
  useEffect(() => {
    if (!captchaRequired || !siteKey) return

    if (turnstileApi()?.render) {
      setScriptReady(true)
      return
    }

    const id = window.setInterval(() => {
      if (turnstileApi()?.render) {
        setScriptReady(true)
        window.clearInterval(id)
      }
    }, 50)

    const t = window.setTimeout(() => window.clearInterval(id), 15000)
    return () => {
      window.clearInterval(id)
      window.clearTimeout(t)
    }
  }, [captchaRequired, siteKey])

  const onScriptLoad = useCallback(() => setScriptReady(true), [])

  useLayoutEffect(() => {
    if (!captchaRequired || !siteKey || !scriptReady || !containerEl) return

    const ts = turnstileApi()
    if (!ts?.render) return

    let cancelled = false

    const mountWidget = () => {
      if (cancelled || !containerEl) return
      try {
        if (widgetIdRef.current) {
          ts.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }
        onTokenChange.current(null)
        widgetIdRef.current = ts.render(containerEl, {
          sitekey: siteKey,
          callback: (token: string) => onTokenChange.current(token),
          'expired-callback': () => onTokenChange.current(null),
        })
      } catch {
        // ignore
      }
    }

    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(mountWidget)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      try {
        if (widgetIdRef.current && ts?.remove) {
          ts.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }
      } catch {
        // ignore
      }
    }
  }, [captchaRequired, siteKey, scriptReady, containerEl])

  return {
    setContainerRef,
    onScriptLoad,
    scriptReady,
  }
}
