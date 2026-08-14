import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Botón único del módulo de gestión.
 *
 * Sobre `danger`: la marca ES roja, así que un botón rojo relleno no se
 * distingue del primario. Por eso `danger` es un botón de contorno con texto
 * rojo, pensado para listas y menús. El relleno fuerte (`danger-solid`) se usa
 * sólo dentro del diálogo de confirmación, donde ya no compite con nada.
 */

type Variant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'danger-solid'
  | 'link'
  /** @deprecated alias de `primary` */
  | 'default'
  /** @deprecated alias de `secondary` */
  | 'outline'
  /** @deprecated alias de `danger` */
  | 'destructive'

type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size | 'default'
  /** Muestra un spinner y bloquea el botón sin cambiar su texto. */
  loading?: boolean
  /** Renderiza sobre el hijo (p. ej. un <Link>) en vez de un <button>. */
  asChild?: boolean
}

const ALIAS: Record<string, Exclude<Variant, 'default' | 'outline' | 'destructive'>> = {
  default: 'primary',
  outline: 'secondary',
  destructive: 'danger',
}

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control " +
  "font-medium transition-[background-color,border-color,color,box-shadow] duration-150 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
  "active:translate-y-px " +
  "disabled:pointer-events-none disabled:opacity-50 disabled:active:translate-y-0"

const variants: Record<string, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active",
  secondary:
    "border border-line-strong bg-surface text-ink hover:bg-surface-3 hover:border-line-strong",
  ghost:
    "text-ink-2 hover:bg-surface-3 hover:text-ink",
  danger:
    "border border-danger-line bg-surface text-danger hover:bg-danger-soft",
  'danger-solid':
    "bg-danger-solid text-on-primary hover:bg-danger",
  link:
    "text-primary underline-offset-4 hover:underline px-0 h-auto",
}

const sizes: Record<string, string> = {
  sm: "h-8 px-3 text-body-sm",
  md: "h-10 px-4 text-body-sm",
  lg: "h-12 px-6 text-body",
  icon: "h-10 w-10 shrink-0",
  'icon-sm': "h-8 w-8 shrink-0",
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const v = ALIAS[variant] ?? variant
    const s = size === 'default' ? 'md' : size
    const Comp = asChild ? Slot : 'button'

    // Con asChild el hijo maneja su propio contenido: no inyectamos el spinner.
    if (asChild) {
      return (
        <Comp
          className={cn(base, variants[v], sizes[s], className)}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      )
    }

    return (
      <button
        className={cn(base, variants[v], sizes[s], className)}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />}
        {children}
      </button>
    )
  },
)

Button.displayName = "Button"

export { Button }
