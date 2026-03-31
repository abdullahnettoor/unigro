import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

export const FREE_POOL_LIMIT = 5;
export const PRO_POOL_LIMIT = 25;

export type EntitlementSnapshot = {
  planTier: "free" | "pro";
  maxPools: number;
  adsDisabled: boolean;
  organizedPoolsCount: number;
  canShowAds: boolean;
};

export async function resolveEntitlements(
  ctx: QueryCtx | MutationCtx,
  user: Doc<"users"> | null
): Promise<EntitlementSnapshot> {
  if (!user) {
    return {
      planTier: "free",
      maxPools: FREE_POOL_LIMIT,
      adsDisabled: false,
      organizedPoolsCount: 0,
      canShowAds: false,
    };
  }

  const organizedPoolsCount = (
    await ctx.db
      .query("pools")
      .filter((q) => q.eq(q.field("organizerId"), user._id))
      .collect()
  ).length;

  const planTier = user.planTier ?? "free";
  const maxPools = user.maxPools ?? (planTier === "pro" ? PRO_POOL_LIMIT : FREE_POOL_LIMIT);
  const adsDisabled = user.adsDisabled ?? planTier === "pro";

  return {
    planTier,
    maxPools,
    adsDisabled,
    organizedPoolsCount,
    canShowAds: !adsDisabled && organizedPoolsCount > 0,
  };
}
