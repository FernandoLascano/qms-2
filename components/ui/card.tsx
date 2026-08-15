import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Card del módulo de gestión.
 *
 * En reposo NO lleva sombra: sólo un borde de 1px. La elevación aparece
 * únicamente cuando la card es clickeable y está en hover (`interactive`).
 * Eso evita el "salto" de la grilla que producía pasar de shadow-sm a
 * shadow-xl.
 *
 * Densidad: `padding="default"` (20px, vista cliente) · `"compact"` (16px,
 * vista admin) · `"none"` (la controla el contenido).
 */

type Padding = 'default' | 'compact' | 'none'

const PADDING: Record<Padding, string> = {
  default: 'p-card-sm sm:p-card',
  compact: 'p-card-sm',
  none: '',
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Aplica hover de elevación. Usar sólo si toda la card es clickeable. */
  interactive?: boolean
  /** Tono de acento del borde para cards que comunican estado. */
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
}

const TONE: Record<string, string> = {
  default: 'border-line bg-surface',
  success: 'border-success-line bg-success-soft',
  warning: 'border-warning-line bg-warning-soft',
  danger: 'border-danger-line bg-danger-soft',
  info: 'border-info-line bg-info-soft',
  primary: 'border-primary-line bg-primary-soft',
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, tone = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // El anillo interior de --shadow-card es lo que le da material:
        // con sólo el borde de 1px la superficie se leía plana.
        "rounded-card border shadow-card",
        TONE[tone],
        interactive &&
          "transition-[box-shadow,border-color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift",
        className,
      )}
      {...props}
    />
  ),
)
Card.displayName = "Card"

/** Cuerpo con padding. Usar dentro de <Card padding="none"> o suelto. */
const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { padding?: Padding }
>(({ className, padding = 'default', ...props }, ref) => (
  <div ref={ref} className={cn(PADDING[padding], className)} {...props} />
))
CardBody.displayName = "CardBody"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { padding?: Padding }
>(({ className, padding = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1", PADDING[padding], className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** @deprecated el tamaño ya no depende de la variante; usá `as` o className */
  variant?: 'default' | 'section'
  as?: 'h2' | 'h3' | 'h4'
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Tag = 'h3', variant, ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn("text-heading text-ink", className)}
      {...props}
    />
  ),
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-body-sm text-ink-2", className)} {...props} />
))
CardDescription.displayName = "CardDescription"

/** Compatibilidad: mismo padding que CardBody pero sin el top (va tras Header). */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { padding?: Padding }
>(({ className, padding = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(PADDING[padding], padding !== 'none' && "pt-0", className)}
    {...props}
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { padding?: Padding }
>(({ className, padding = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-2",
      PADDING[padding],
      padding !== 'none' && "pt-0",
      className,
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}
