// Google Analytics event tracking

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID as string, {
      page_path: url,
    })
  }
}

type GTagEvent = {
  action: string
  category: string
  label?: string
  value?: number
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: GTagEvent) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Eventos personalizados para QuieroMiSAS
export const trackEvent = {
  // Landing Page
  viewPlanes: () => event({
    action: 'view_planes',
    category: 'Landing',
    label: 'Usuario vio sección de planes'
  }),
  
  clickCTA: (ubicacion: string) => event({
    action: 'click_cta',
    category: 'Landing',
    label: ubicacion
  }),
  
  // Registro y Login
  registro: (metodo: 'email' | 'google') => event({
    action: 'registro',
    category: 'Auth',
    label: metodo
  }),
  
  login: (metodo: 'email' | 'google') => event({
    action: 'login',
    category: 'Auth',
    label: metodo
  }),
  
  // Trámites
  iniciarTramite: () => event({
    action: 'iniciar_tramite',
    category: 'Tramites',
    label: 'Usuario inició nuevo trámite'
  }),
  
  completarPaso: (paso: number) => event({
    action: 'completar_paso',
    category: 'Tramites',
    label: `Paso ${paso}`,
    value: paso
  }),
  
  enviarTramite: () => event({
    action: 'enviar_tramite',
    category: 'Tramites',
    label: 'Trámite enviado para revisión'
  }),
  
  // Pagos
  iniciarPago: (monto: number, concepto: string) => event({
    action: 'iniciar_pago',
    category: 'Pagos',
    label: concepto,
    value: monto
  }),
  
  completarPago: (monto: number, concepto: string) => event({
    action: 'completar_pago',
    category: 'Pagos',
    label: concepto,
    value: monto
  }),
  
  // Documentos
  subirDocumento: (tipo: string) => event({
    action: 'subir_documento',
    category: 'Documentos',
    label: tipo
  }),
  
  // Navegación
  verDashboard: () => event({
    action: 'ver_dashboard',
    category: 'Navegacion',
    label: 'Usuario accedió al dashboard'
  }),
  
  // FAQ y Ayuda
  expandirFAQ: (pregunta: string) => event({
    action: 'expandir_faq',
    category: 'Ayuda',
    label: pregunta
  }),
  
  clickContacto: (metodo: 'email' | 'whatsapp') => event({
    action: 'click_contacto',
    category: 'Ayuda',
    label: metodo
  })
}

// Para TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}

