import * as React from "react"
import { cn } from "@/lib/utils"

export const controlBase =
  "w-full rounded-control border border-line-input bg-surface text-ink text-body-sm " +
  "placeholder:text-ink-3 " +
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
      className={cn(controlBase, "h-10 px-3", className)}
      {...props}
    />
  ),
)
Input.displayName = "Input"

export { Input }
