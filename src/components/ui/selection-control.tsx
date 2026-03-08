import * as React from "react";

import { CheckIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface SelectionControlProps extends React.HTMLAttributes<HTMLSpanElement> {
  checked?: boolean;
  variant?: "checkbox" | "radio";
  size?: "sm" | "md";
}

const sizeClasses = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
};

export function SelectionControl({
  checked = false,
  variant = "checkbox",
  size = "sm",
  className,
  ...props
}: SelectionControlProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center aspect-square border-2 transition-colors",
        sizeClasses[size],
        variant === "radio" ? "rounded-full" : "rounded-[6px]",
        checked
          ? "border-[var(--accent-vivid)] bg-[var(--accent-vivid)]/15"
          : "border-[var(--border-subtle)] bg-[var(--surface-2)]/40",
        className
      )}
      {...props}
    >
      {checked &&
        (variant === "checkbox" ? (
          <CheckIcon size={12} strokeWidth={2.6} className="text-[var(--accent-vivid)]" />
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-vivid)]" />
        ))}
    </span>
  );
}
