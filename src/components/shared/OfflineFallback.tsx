import { RefreshCw, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/Surface";

interface OfflineFallbackProps {
  title?: string;
  message?: string;
}

export function OfflineFallback({
  title = "This screen needs internet",
  message = "The app shell is available offline, but this page has not been cached yet or needs fresh data before it can open.",
}: OfflineFallbackProps) {
  return (
    <div className="flex min-h-[52vh] items-center justify-center px-4 py-10">
      <Surface tier={3} className="w-full max-w-md rounded-[32px] border border-[var(--border-subtle)] p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--warning)]/12 text-[var(--warning)]">
          <WifiOff size={24} />
        </div>
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.34em] text-[var(--warning)]">Offline access</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{message}</p>
        <div className="mt-6 flex justify-center">
          <Button className="h-10 rounded-full px-5" onClick={() => window.location.reload()}>
            <RefreshCw size={14} />
            Retry
          </Button>
        </div>
      </Surface>
    </div>
  );
}
