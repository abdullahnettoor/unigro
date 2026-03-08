import * as React from "react";

import { cn } from "@/lib/utils";

type SurfaceTier = 1 | 2 | 3;
type SurfaceRounded = "lg" | "xl" | "2xl" | "3xl" | "full";

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  tier?: SurfaceTier;
  interactive?: boolean;
  rounded?: SurfaceRounded;
}

const tierClass: Record<SurfaceTier, string> = {
  1: "glass-1",
  2: "glass-2",
  3: "glass-3",
};

const roundedClass: Record<SurfaceRounded, string> = {
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  full: "rounded-full",
};

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ tier = 2, interactive = false, rounded = "2xl", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          tierClass[tier],
          roundedClass[rounded],
          interactive
            ? "transition-all hover:border-[var(--accent-vivid)]/40 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
            : "",
          className
        )}
        {...props}
      />
    );
  }
);

Surface.displayName = "Surface";
