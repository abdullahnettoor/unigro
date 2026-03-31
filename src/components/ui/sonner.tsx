import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: "rounded-xl border border-white/10 backdrop-blur-xl bg-[var(--surface-elevated)]/90 text-[var(--text-primary)]",
          description: "text-[var(--text-muted)]",
          actionButton: "bg-[var(--accent-vivid)] text-white",
          cancelButton: "bg-[var(--surface-card)] text-[var(--text-muted)]",
        },
      }}
    />
  );
}
