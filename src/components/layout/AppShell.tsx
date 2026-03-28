import * as React from "react";

import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isOnline } = useNetworkStatus();

  return (
    <div className="min-h-dvh bg-[var(--bg-app)] text-[var(--text-primary)] font-[family-name:var(--font-body)]">
      {!isOnline ? <OfflineBanner /> : null}
      {children}
    </div>
  );
}
