import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
};

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type FeedbackContextValue = {
  toast: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
  };
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return ctx;
}

function Toasts({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed inset-x-3 bottom-24 z-[60] space-y-2 sm:inset-x-auto sm:right-4 sm:bottom-6 sm:max-w-sm">
      {items.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md ${
            t.variant === "success"
              ? "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]"
              : t.variant === "error"
                ? "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]"
                : "border-[var(--border-subtle)] bg-[var(--surface-elevated)]/95 text-[var(--text-primary)]"
          }`}
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{t.title}</div>
              {t.message && <div className="mt-1 text-xs text-[var(--text-primary)]/80">{t.message}</div>}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="Dismiss"
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({
  open,
  options,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  options: ConfirmOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open || !options) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-3 sm:items-center sm:p-4">
      <div className="w-full rounded-t-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 sm:max-w-md sm:rounded-2xl">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{options.title}</h3>
        {options.message && <p className="mt-2 text-sm text-[var(--text-muted)]">{options.message}</p>}
        <div className="mt-6 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl bg-[var(--surface-deep)] py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-deep)]"
          >
            {options.cancelText || "Cancel"}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${
              options.danger
                ? "bg-[var(--danger)] text-[var(--text-on-accent)] hover:bg-[var(--danger)]/90"
                : "bg-[var(--accent-vivid)] text-[var(--text-on-accent)] hover:opacity-90"
            }`}
          >
            {options.confirmText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const confirmResolver = useRef<(value: boolean) => void>();

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((variant: ToastVariant, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, title, message, variant }]);
    setTimeout(() => dismissToast(id), 3500);
  }, [dismissToast]);

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmOptions(options);
    setConfirmOpen(true);
    return new Promise<boolean>((resolve) => {
      confirmResolver.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setConfirmOpen(false);
    confirmOptions && setConfirmOptions(null);
    confirmResolver.current?.(true);
  };

  const handleCancel = () => {
    setConfirmOpen(false);
    confirmOptions && setConfirmOptions(null);
    confirmResolver.current?.(false);
  };

  const value = useMemo<FeedbackContextValue>(
    () => ({
      toast: {
        success: (title, message) => pushToast("success", title, message),
        error: (title, message) => pushToast("error", title, message),
        info: (title, message) => pushToast("info", title, message),
      },
      confirm,
    }),
    [confirm, pushToast]
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Toasts items={toasts} onDismiss={dismissToast} />
      <ConfirmDialog open={confirmOpen} options={confirmOptions} onConfirm={handleConfirm} onCancel={handleCancel} />
    </FeedbackContext.Provider>
  );
}

export { useFeedback };
