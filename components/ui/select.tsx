import * as React from "react"
import { cn } from "@/lib/utils"
import { controlBase } from "@/components/ui/input"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, invalid, ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, "h-10 px-3 pr-9", className)}
      {...props}
    >
      {children}
    </select>
  ),
)

Select.displayName = "Select"

export { Select }
