import * as React from "react"
import { cn } from "@/lib/utils"
import { controlBase } from "@/components/ui/input"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, "min-h-20 px-3 py-2 leading-relaxed", className)}
      {...props}
    />
  ),
)
Textarea.displayName = "Textarea"

export { Textarea }
