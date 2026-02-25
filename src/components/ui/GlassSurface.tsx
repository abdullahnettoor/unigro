import * as React from "react";
import { cn } from "@/components/ui/Button";

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
    tier?: "glass-1" | "glass-2" | "glass-3";
}

export const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
    ({ tier = "glass-2", className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("rounded-2xl border border-[var(--border-subtle)]", tier, className)}
                {...props}
            />
        );
    }
);

GlassSurface.displayName = "GlassSurface";
