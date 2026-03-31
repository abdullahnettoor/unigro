import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  density?: "comfortable" | "compact";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, density = "comfortable", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "glass-1 control-base flex w-full text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-vivid)] disabled:cursor-not-allowed disabled:opacity-60",
          density === "compact" ? "control-compact" : "",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
