import { useEffect, useState } from "react";

import { OfflineFallback } from "@/components/shared/OfflineFallback";
import { LogoLoader } from "@/components/ui/LogoLoader";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface OfflineStateGateProps {
  ready: boolean;
  offlineTitle?: string;
  offlineMessage?: string;
  minHeightClassName?: string;
  children: React.ReactNode;
}

export function OfflineStateGate({
  ready,
  offlineTitle,
  offlineMessage,
  minHeightClassName = "min-h-[50vh]",
  children,
}: OfflineStateGateProps) {
  const { isOnline } = useNetworkStatus();
  const [showOfflineFallback, setShowOfflineFallback] = useState(false);

  useEffect(() => {
    if (ready || isOnline) {
      setShowOfflineFallback(false);
      return;
    }

    const timer = window.setTimeout(() => setShowOfflineFallback(true), 1200);
    return () => window.clearTimeout(timer);
  }, [isOnline, ready]);

  if (ready) return <>{children}</>;

  if (showOfflineFallback) {
    return <OfflineFallback title={offlineTitle} message={offlineMessage} />;
  }

  return (
    <div className={`grid place-items-center ${minHeightClassName}`}>
      <LogoLoader size="lg" />
    </div>
  );
}
