import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      toastOptions={{
        className: "glass-3 border border-[var(--border-subtle)] text-[var(--text-primary)]",
        descriptionClassName: "text-[var(--text-muted)]",
      }}
      className="text-[var(--text-primary)]"
      classNames={{
        toast: "glass-3 border border-[var(--border-subtle)]",
        title: "text-[var(--text-primary)]",
        description: "text-[var(--text-muted)]",
        actionButton: "bg-[var(--accent-vivid)] text-[var(--text-on-accent)]",
        cancelButton: "bg-[var(--surface-deep)] text-[var(--text-primary)]",
        success: "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--text-primary)]",
        error: "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--text-primary)]",
        warning: "border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--text-primary)]",
        info: "border-[var(--accent-vivid)]/30 bg-[var(--accent-vivid)]/10 text-[var(--text-primary)]",
        loading: "border-[var(--accent-secondary)]/30 bg-[var(--accent-secondary)]/10 text-[var(--text-primary)]",
      }}
    />
  );
}
