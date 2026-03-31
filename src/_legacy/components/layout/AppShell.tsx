import * as React from "react";

import { Surface } from "@/components/ui/Surface";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  bottomNav?: React.ReactNode;
  className?: string;
}

export function AppShell({ children, bottomNav, className }: AppShellProps) {
  const [isOnline, setIsOnline] = React.useState<boolean>(() => navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div
      className={cn(
        "min-h-dvh font-body pb-[calc(var(--safe-bottom)+6.5rem)] sm:pb-0",
        className
      )}
    >
      {!isOnline ? (
        <Surface
          tier={2}
          className="safe-top-offset fixed left-1/2 z-50 w-[min(420px,92vw)] -translate-x-1/2 rounded-2xl border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-4 py-2 text-center text-xs font-semibold text-[var(--warning)] shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
          role="status"
          aria-live="polite"
        >
          You are offline. Some actions will sync when you reconnect.
        </Surface>
      ) : null}
      {children}
      {bottomNav}
    </div>
  );
}
