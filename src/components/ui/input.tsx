import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-full border border-[var(--border-subtle)]/80 bg-[var(--surface-0)]/70 px-4 py-2 text-sm text-[var(--text-primary)] shadow-[0_8px_20px_rgba(0,0,0,0.08)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-vivid)]/10 focus:border-[var(--accent-vivid)]/30 transition-all disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
