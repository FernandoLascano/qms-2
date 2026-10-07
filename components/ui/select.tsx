import * as React from "react"
import { cn } from "@/lib/utils"
import { controlBase } from "@/components/ui/input"

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  invalid?: boolean
  /**
   * `md` (por defecto) para formularios: 15px como el resto de los campos.
   * `sm` para controles dentro de tablas y listas densas, donde el texto de
   * alrededor va a 13px y uno de 15px se ve más grande que la fila.
   */
  size?: "md" | "sm"
}

/**
 * Select nativo con la flecha propia (`.select-flecha` en globals.css): la del
 * sistema queda pegada al borde y cambia de un navegador a otro.
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, invalid, size = "md", ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      data-size={size}
      className={cn(
        controlBase,
        "select-flecha appearance-none",
        size === "sm" ? "h-8 pl-2.5 pr-8 text-body-sm" : "h-10 pl-3 pr-10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
)

Select.displayName = "Select"

export { Select }
