 
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-vivid)] disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        primary: "bg-[var(--accent-vivid)] text-[var(--text-on-accent)] hover:opacity-90 shadow-md hover:shadow-lg",
        accent: "bg-[var(--accent-secondary)] text-[var(--text-on-accent)] hover:opacity-90 shadow-md hover:shadow-lg",
        secondary: "glass-1 text-[var(--text-primary)] hover:border-[var(--accent-vivid)]/30",
        ghost: "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-deep)]/50",
        danger: "bg-[var(--danger)] text-white hover:opacity-90",
        link: "text-[var(--accent-vivid)] hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-10 px-4 text-xs",
        md: "h-11 px-6 text-sm",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11",
        pill: "h-10 px-4 text-xs",
      },
      density: {
        comfortable: "",
        compact: "btn-chip",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      density: "comfortable",
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, density, fullWidth, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, density, fullWidth }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
