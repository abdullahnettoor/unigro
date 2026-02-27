import * as React from "react";

import { Surface } from "@/components/ui/Surface";
import { cn } from "@/lib/utils";

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  tier?: "glass-1" | "glass-2" | "glass-3";
}

const tierMap = {
  "glass-1": 1,
  "glass-2": 2,
  "glass-3": 3,
} as const;

export const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
  ({ tier = "glass-2", className, ...props }, ref) => {
    return (
      <Surface
        ref={ref}
        tier={tierMap[tier]}
        className={cn("rounded-2xl", className)}
        {...props}
      />
    );
  }
);

GlassSurface.displayName = "GlassSurface";
