import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  density?: "comfortable" | "compact";
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, density = "comfortable", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "glass-1 control-base control-textarea flex w-full text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-vivid)] disabled:cursor-not-allowed disabled:opacity-60",
          density === "compact" ? "control-compact" : "",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
