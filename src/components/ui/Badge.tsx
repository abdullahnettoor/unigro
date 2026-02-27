import * as React from "react";

import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "brand" | "success" | "warning" | "danger" | "outline"
    size?: "sm" | "md"
}

export function Badge({ className, variant = "default", size = "sm", ...props }: BadgeProps) {
    const baseStyles = "inline-flex items-center rounded-full font-semibold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-vivid)] focus:ring-offset-2"

    const variants = {
        default: "bg-[var(--surface-deep)]/80 text-[var(--text-muted)] border border-transparent",
        brand: "bg-[var(--accent-vivid)]/15 text-[var(--accent-vivid)] border border-[var(--accent-vivid)]/20",
        success: "bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/20",
        warning: "bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/20",
        danger: "bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/20",
        outline: "text-[var(--text-primary)] border border-[var(--border-subtle)]"
    }

    const sizes = {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-3 py-1 text-xs"
    }

    return (
        <div className={cn(baseStyles, variants[variant], sizes[size], className)} {...props} />
    )
}
