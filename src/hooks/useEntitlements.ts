import { useEffect, useState } from "react";
import { api } from "@convex/api";
import { useQuery } from "convex/react";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { ENTITLEMENTS_CACHE_KEY, type EntitlementSnapshot,FREE_ENTITLEMENTS } from "@/lib/entitlements";

export function useEntitlements() {
  const queryValue = useQuery(api.users.getEntitlements) as EntitlementSnapshot | undefined;
  const { isOnline } = useNetworkStatus();
  const [cached, setCached] = useState<EntitlementSnapshot>(() => {
    if (typeof window === "undefined") return FREE_ENTITLEMENTS;
    try {
      const raw = window.localStorage.getItem(ENTITLEMENTS_CACHE_KEY);
      return raw ? { ...FREE_ENTITLEMENTS, ...(JSON.parse(raw) as Partial<EntitlementSnapshot>) } : FREE_ENTITLEMENTS;
    } catch {
      return FREE_ENTITLEMENTS;
    }
  });

  useEffect(() => {
    if (!queryValue) return;
    setCached(queryValue);
    window.localStorage.setItem(ENTITLEMENTS_CACHE_KEY, JSON.stringify(queryValue));
  }, [queryValue]);

  return {
    entitlements: queryValue ?? cached,
    isLoading: queryValue === undefined && isOnline,
    isFromCache: queryValue === undefined && !isOnline,
  };
}
