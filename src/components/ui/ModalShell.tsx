import * as React from "react";

import { cn } from "@/lib/utils";

type ModalSize = "sm" | "md" | "lg";

type ModalShellProps = {
  children: React.ReactNode;
  size?: ModalSize;
  className?: string;
  overlayClassName?: string;
  showHandle?: boolean;
  zIndex?: number;
};

const sizeClass: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
};

export function ModalShell({
  children,
  size = "md",
  className,
  overlayClassName,
  showHandle = true,
  zIndex = 100,
}: ModalShellProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center p-3 sm:items-center sm:p-4",
        overlayClassName
      )}
      style={{ zIndex }}
    >
      <div
        className={cn(
          "glass-3 border border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl w-full max-h-[88vh] flex flex-col overflow-hidden relative animate-in fade-in zoom-in duration-200 bg-[var(--surface-elevated)]/80 backdrop-blur-md",
          sizeClass[size],
          className
        )}
      >
        {showHandle && (
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-[var(--border-subtle)] sm:hidden" />
        )}
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("p-6 pb-4 border-b border-[var(--border-subtle)]/80", className)}
      {...props}
    />
  );
}

export function ModalBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex-1 overflow-y-auto p-6", className)} {...props} />
  );
}

export function ModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("sticky bottom-0 pt-2 bg-transparent", className)} {...props} />
  );
}

export function ModalCloseButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label="Close"
      className={cn(
        "absolute right-4 top-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]",
        className
      )}
      {...props}
    />
  );
}
