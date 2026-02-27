import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      richColors
      toastOptions={{
        className: "glass-3 border border-[var(--border-subtle)] text-[var(--text-primary)]",
        descriptionClassName: "text-[var(--text-muted)]",
        classNames: {
          actionButton: "bg-[var(--accent-vivid)] text-[var(--text-on-accent)]",
          cancelButton: "bg-[var(--surface-deep)] text-[var(--text-primary)]",
        },
      }}
    />
  );
}
