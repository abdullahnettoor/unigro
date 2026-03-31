import { WifiOff } from "lucide-react";

import { Surface } from "@/components/ui/Surface";

export function OfflineBanner() {
  return (
    <Surface
      tier={2}
      className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 flex w-[min(460px,calc(100vw-1.5rem))] -translate-x-1/2 items-center gap-3 rounded-2xl border border-[var(--warning)]/25 bg-[var(--warning)]/10 px-4 py-2.5 shadow-[0_14px_32px_rgba(0,0,0,0.18)] lg:bottom-4 lg:left-auto lg:right-4 lg:w-[min(420px,calc(100vw-3rem))] lg:translate-x-0"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--warning)]/15 text-[var(--warning)]">
        <WifiOff size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--warning)]">Offline</p>
        <p className="text-xs font-medium text-[var(--text-primary)]">
          Cached screens stay available. Some live actions will wait for your connection.
        </p>
      </div>
    </Surface>
  );
}
