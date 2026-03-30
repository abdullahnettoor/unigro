import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-[14px] border border-[var(--border-subtle)]/80 bg-[var(--surface-0)]/70 px-4 py-3 text-sm text-[var(--text-primary)] shadow-[0_8px_20px_rgba(0,0,0,0.08)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-vivid)]/10 focus:border-[var(--accent-vivid)]/30 transition-all disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
