import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface OfflineUIContextValue {
  blockingFallbacks: number;
  registerBlockingFallback: () => void;
  unregisterBlockingFallback: () => void;
}

const OfflineUIContext = createContext<OfflineUIContextValue | null>(null);

export function OfflineUIProvider({ children }: { children: ReactNode }) {
  const [blockingFallbacks, setBlockingFallbacks] = useState(0);

  const value = useMemo<OfflineUIContextValue>(
    () => ({
      blockingFallbacks,
      registerBlockingFallback: () => setBlockingFallbacks((count) => count + 1),
      unregisterBlockingFallback: () => setBlockingFallbacks((count) => Math.max(0, count - 1)),
    }),
    [blockingFallbacks]
  );

  return <OfflineUIContext.Provider value={value}>{children}</OfflineUIContext.Provider>;
}

export function useOfflineUI() {
  return useContext(OfflineUIContext);
}
