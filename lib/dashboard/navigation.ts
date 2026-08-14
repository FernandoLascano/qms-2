import {
  BarChart3,
  BookOpen,
  Building,
  Building2,
  Calendar,
  Clock,
  Coins,
  CreditCard,
  FileText,
  Handshake,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  Settings,
  Upload,
  UserSearch,
  Users,
  Bell,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Navegación del dashboard, definida por datos.
 *
 * Antes esto era un array plano de 21 ítems cortado con `slice(0, 13)` y
 * `slice(13)` — con 14 ítems de admin, "Configuración del sistema" terminaba
 * bajo el encabezado "Mi cuenta". Y el resaltado del ítem activo era una
 * cadena de 14 condiciones `||` escritas a mano, así que toda sección nueva
 * nacía sin resaltado.
 *
 * Ahora cada ítem declara cómo se activa y a qué grupo pertenece.
 */

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  /** Sólo se activa con la ruta exacta (para índices como /dashboard). */
  exact?: boolean
  /** Clave de contador dinámico (emails sin leer, notificaciones). */
  badge?: 'emails' | 'notificaciones'
  /** Descripción usada como subtítulo de la página. */
  description?: string
}

export interface NavGroup {
  /** Sin título = grupo suelto arriba de todo. */
  title?: string
  items: NavItem[]
}

/* ───────────────────────────── Cliente ───────────────────────────── */

export const NAV_CLIENTE: NavGroup[] = [
  {
    items: [
      {
        name: 'Inicio',
        href: '/dashboard',
        icon: Home,
        exact: true,
        description: 'Tus trámites y lo que necesita tu atención',
      },
      {
        name: 'Mis trámites',
        href: '/dashboard/tramites',
        icon: FileText,
        description: 'Seguimiento de tus constituciones',
      },
    ],
  },
  {
    title: 'Mi sociedad',
    items: [
      {
        name: 'Legajo',
        href: '/dashboard/mi-sociedad',
        icon: Building2,
        description: 'Datos y documentos de tu sociedad',
      },
      {
        name: 'Libros digitales',
        href: '/dashboard/libros-digitales',
        icon: BookOpen,
        description: 'Cómo llevar los libros de tu sociedad',
      },
      {
        name: 'Documentos',
        href: '/dashboard/documentos',
        icon: Upload,
        description: 'Subí y consultá tus documentos',
      },
    ],
  },
  {
    title: 'Más',
    items: [
      {
        name: 'Servicios',
        href: '/dashboard/servicios',
        icon: Handshake,
        description: 'Otros servicios para tu empresa',
      },
      {
        name: 'Notificaciones',
        href: '/dashboard/notificaciones',
        icon: Bell,
        badge: 'notificaciones',
        description: 'Todo lo que te avisamos',
      },
      {
        name: 'Configuración',
        href: '/dashboard/configuracion',
        icon: Settings,
        description: 'Tus datos de acceso y contacto',
      },
    ],
  },
]

/* ────────────────────────────── Admin ────────────────────────────── */

export const NAV_ADMIN: NavGroup[] = [
  {
    title: 'Trabajo',
    items: [
      {
        name: 'Hoy',
        href: '/dashboard/admin',
        icon: Home,
        exact: true,
        description: 'Lo que hay que resolver hoy',
      },
      {
        name: 'Trámites',
        href: '/dashboard/admin/tramites',
        icon: FileText,
        description: 'Gestión de todos los trámites',
      },
      {
        name: 'Leads',
        href: '/dashboard/admin/leads',
        icon: UserSearch,
        description: 'Formularios empezados sin terminar',
      },
    ],
  },
  {
    title: 'Clientes',
    items: [
      {
        name: 'Sociedades',
        href: '/dashboard/admin/sociedades',
        icon: Building2,
        description: 'Sociedades inscriptas',
      },
      {
        name: 'Usuarios',
        href: '/dashboard/admin/usuarios',
        icon: Users,
        description: 'Cuentas de la plataforma',
      },
      {
        name: 'Partners',
        href: '/dashboard/admin/partners',
        icon: Handshake,
        description: 'Referidos y condiciones económicas',
      },
      {
        name: 'Comisiones',
        href: '/dashboard/admin/comisiones',
        icon: Coins,
        description: 'Liquidación de comisiones',
      },
    ],
  },
  {
    title: 'Comunicación',
    items: [
      {
        name: 'Email',
        href: '/dashboard/admin/emails',
        icon: Mail,
        badge: 'emails',
        description: 'Bandeja de correo',
      },
      {
        name: 'Consultas del chat',
        href: '/dashboard/admin/consultas-chat',
        icon: MessageCircle,
        description: 'Preguntas del asistente y análisis',
      },
      {
        name: 'Calendario',
        href: '/dashboard/admin/calendario',
        icon: Calendar,
        description: 'Eventos y vencimientos',
      },
    ],
  },
  {
    title: 'Contenido',
    items: [
      {
        name: 'Blog',
        href: '/dashboard/admin/blog',
        icon: BookOpen,
        description: 'Artículos del sitio',
      },
    ],
  },
  {
    title: 'Sistema',
    items: [
      {
        name: 'Analytics',
        href: '/dashboard/admin/analytics',
        icon: BarChart3,
        description: 'Métricas del negocio y del sitio',
      },
      {
        name: 'Tiempos',
        href: '/dashboard/admin/tracking-tiempo',
        icon: Clock,
        description: 'Cuánto tarda cada etapa',
      },
      {
        name: 'Jurisdicciones',
        href: '/dashboard/admin/jurisdicciones',
        icon: MapPin,
        description: 'Gastos y parámetros por jurisdicción',
      },
      {
        name: 'Domicilios en sede',
        href: '/dashboard/admin/domicilios',
        icon: Building,
        description: 'Servicio de domicilio legal',
      },
      {
        name: 'Cuentas bancarias',
        href: '/dashboard/admin/configuracion-cuentas',
        icon: CreditCard,
        description: 'Cuentas para depósitos y pagos',
      },
      {
        name: 'Configuración',
        href: '/dashboard/admin/configuracion',
        icon: Settings,
        description: 'Parámetros del sistema',
      },
    ],
  },
]

/* ───────────────────────────── Utilidades ───────────────────────── */

/** ¿Este ítem corresponde a la ruta actual? */
export function esActivo(item: NavItem, pathname: string | null): boolean {
  if (!pathname) return false
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export function navPara(esAdmin: boolean): NavGroup[] {
  return esAdmin ? NAV_ADMIN : NAV_CLIENTE
}

/** Todos los ítems en una lista plana. */
export function todosLosItems(): NavItem[] {
  return [...NAV_ADMIN, ...NAV_CLIENTE].flatMap((g) => g.items)
}

/**
 * Ítem que corresponde a la ruta actual, tomando siempre la coincidencia más
 * específica. Se usa para el título de la pestaña y las migas de pan.
 */
export function itemPorRuta(pathname: string | null): NavItem | undefined {
  if (!pathname) return undefined
  const candidatos = todosLosItems().filter((i) => esActivo(i, pathname))
  return candidatos.sort((a, b) => b.href.length - a.href.length)[0]
}
