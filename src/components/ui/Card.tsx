import * as React from "react";

import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    glass?: boolean
    tier?: "glass-1" | "glass-2" | "glass-3"
    hoverEffect?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, glass = true, tier = "glass-2", hoverEffect = false, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-2xl border border-[var(--border-subtle)] transition-all",
                    glass ? tier : "bg-[var(--surface-elevated)]",
                    hoverEffect ? "hover:border-[var(--accent-vivid)]/50 hover:shadow-lg group" : "",
                    className
                )}
                {...props}
            />
        )
    }
)
Card.displayName = "Card"

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
    )
)
CardHeader.displayName = "CardHeader"

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3 ref={ref} className={cn("font-display font-bold text-xl leading-none tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent-vivid)] transition-colors", className)} {...props} />
    )
)
CardTitle.displayName = "CardTitle"

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
    )
)
CardContent.displayName = "CardContent"

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
    )
)
CardFooter.displayName = "CardFooter"
