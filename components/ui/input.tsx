import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Estilo base de todos los controles de formulario.
 *
 * Dos cosas que los navegadores no resuelven solos y hay que declarar acá:
 *
 *  · `input`, `textarea` y `select` NO heredan la tipografía del documento.
 *    Sin `font-sans` explícito, cada sistema operativo dibuja lo que escribe
 *    el usuario con su fuente por defecto, que no es la del sitio.
 *
 *  · El tamaño era `text-body-sm` (13px) mientras el resto del panel usa
 *    `text-body` (15px): lo que uno escribía quedaba más chico que todo lo que
 *    lo rodea, y ese salto se leía como "otra tipografía" aunque fuera Inter.
 *    Además, por debajo de 16px Safari en iPhone hace zoom al enfocar un
 *    campo; 15px sigue por debajo, pero acorta bastante ese salto.
 */
export const controlBase =
  "w-full rounded-control border border-line-input bg-surface text-ink " +
  "font-sans text-body leading-normal " +
  "placeholder:text-ink-3 placeholder:font-normal " +
  "transition-[border-color,box-shadow] duration-150 " +
  "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/25 " +
  "disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-ink-3 " +
  "aria-[invalid=true]:border-danger-solid aria-[invalid=true]:ring-danger-solid/25"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        "h-10 px-3",
        // Los números en cifras tabulares: así no bailan las columnas al
        // escribir un importe.
        (type === "number" || type === "tel") && "tnum",
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = "Input"

export { Input }
