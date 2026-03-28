import * as React from "react";

import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { OfflineUIProvider, useOfflineUI } from "@/components/shared/OfflineUIContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellInner({ children }: AppShellProps) {
  const { isOnline } = useNetworkStatus();
  const offlineUI = useOfflineUI();
  const showBanner = !isOnline && (offlineUI?.blockingFallbacks ?? 0) === 0;

  return (
    <div className="min-h-dvh bg-[var(--bg-app)] text-[var(--text-primary)] font-[family-name:var(--font-body)]">
      {showBanner ? <OfflineBanner /> : null}
      {children}
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <OfflineUIProvider>
      <AppShellInner>{children}</AppShellInner>
    </OfflineUIProvider>
  );
}
