export type EntitlementSnapshot = {
  planTier: "free" | "pro";
  maxPools: number;
  adsDisabled: boolean;
  organizedPoolsCount: number;
  canShowAds: boolean;
};

export const FREE_ENTITLEMENTS: EntitlementSnapshot = {
  planTier: "free",
  maxPools: 5,
  adsDisabled: false,
  organizedPoolsCount: 0,
  canShowAds: false,
};

export const ENTITLEMENTS_CACHE_KEY = "unigro_entitlements_cache";
