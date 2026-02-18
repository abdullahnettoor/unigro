import * as React from "react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility function for class merging
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "accent" | "secondary" | "ghost" | "danger" | "link"
    size?: "sm" | "md" | "lg" | "icon"
    fullWidth?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", fullWidth = false, children, ...props }, ref) => {

        // Base styles
        const baseStyles = "inline-flex items-center justify-center rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-vivid)] disabled:pointer-events-none disabled:opacity-50 active:scale-95"

        // Detailed Variant Styles
        const variants = {
            // Primary: core action
            primary: "bg-[var(--accent-vivid)] text-[var(--text-on-accent)] hover:opacity-90 shadow-md hover:shadow-lg",

            // Accent: secondary premium emphasis
            accent: "bg-[var(--accent-secondary)] text-[var(--text-on-accent)] hover:opacity-90 shadow-md hover:shadow-lg",

            // Secondary: Glass Effect - Used for secondary options
            secondary: "bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-deep)]/80 hover:border-[var(--accent-vivid)]/30 backdrop-blur-md",

            // Ghost: Subtle - Used for tertiary options
            ghost: "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-deep)]/50",

            // Danger: Red
            danger: "bg-[var(--danger)] text-white hover:opacity-90",

            // Link: Like ghost but with action color
            link: "text-[var(--accent-vivid)] hover:underline p-0 h-auto"
        }

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-11 px-6 text-sm", // Min 44px for touch
            lg: "h-14 px-8 text-base",
            icon: "h-11 w-11"
        }

        return (
            <button
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    fullWidth ? "w-full" : "",
                    className
                )}
                {...props}
            >
                {children}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button, cn }
