import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-vivid)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent-vivid)] text-[var(--text-on-accent)] shadow-[0_12px_28px_rgba(0,0,0,0.18)] hover:opacity-90",
        destructive:
          "bg-[var(--danger)] text-[var(--text-on-accent)] shadow-[0_12px_28px_rgba(0,0,0,0.18)] hover:opacity-90",
        outline:
          "border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent-vivid)]/40",
        secondary:
          "glass-2 text-[var(--text-primary)] border border-[var(--border-subtle)]/80 hover:border-[var(--accent-vivid)]/40",
        ghost: "text-[var(--text-primary)] hover:bg-[var(--surface-2)]/60",
        link: "text-[var(--accent-vivid)] underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-8 px-3 text-xs",
        sm: "h-9 px-4 text-sm",
        default: "h-10 px-5",
        lg: "h-12 px-8 text-sm",
        icon: "h-10 w-10 rounded-full",
        "icon-sm": "h-8 w-8 rounded-full",
        compact: "h-9 px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
