import { useMemo } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { useQuery } from "convex/react";

import { useFeedback } from "@/components/shared/FeedbackProvider";
import { OfflineStateGate } from "@/components/shared/OfflineStateGate";
import { SuccessShell } from "@/components/shared/SuccessShell";
import { formatCurrency } from "@/lib/utils";

type CreateSuccessState = {
  poolId: Id<"pools">;
  title: string;
  totalSeats: number;
  contribution: number;
  currency?: string;
  frequency: string;
  startDate: number;
  status?: string;
};

function formatFrequencyLabel(frequency?: string) {
  if (!frequency) return "Custom";
  return frequency.charAt(0).toUpperCase() + frequency.slice(1);
}

export function CreateSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const feedback = useFeedback();

  const state = location.state as CreateSuccessState | null;
  const poolId = (searchParams.get("poolId") as Id<"pools"> | null) ?? state?.poolId ?? null;
  const pool = useQuery(api.pools.get, poolId ? { poolId } : "skip");

  const effectivePool = pool ?? state;
  const totalSeats = pool?.config.totalSeats ?? state?.totalSeats ?? 0;
  const contribution = pool?.config.contribution ?? state?.contribution ?? 0;
  const currency = pool?.config.currency ?? state?.currency;
  const frequency = pool?.config.frequency ?? state?.frequency;
  const status = pool?.status ?? state?.status ?? "DRAFT";
  const shareUrl = poolId ? `${window.location.origin}/pools/${poolId}` : window.location.href;

  const startDateLabel = useMemo(() => {
    const rawDate = pool?.startDate ?? state?.startDate;
    if (!rawDate) return "Start date pending";
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(rawDate));
  }, [pool?.startDate, state?.startDate]);

  const handleShare = async () => {
    const title = effectivePool?.title || "UniGro Pool";
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        // fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(shareUrl);
    feedback.toast.success("Invite copied", "Share the pool link with your members.");
  };

  return (
    <OfflineStateGate
      ready={!!effectivePool}
      offlineTitle="Success view unavailable offline"
      offlineMessage="Open this page once while connected so the new pool summary can be restored from cache later."
      minHeightClassName="min-h-[70vh]"
    >
      {effectivePool ? (
        <SuccessShell
          eyebrow="Pool created"
          title="Your pool is ready to launch"
          description="Saved successfully. Open it now or share the invite to start filling seats."
          compact
          summary={
            <div className="grid gap-3">
              <div className="rounded-[24px] border border-[var(--border-subtle)]/60 bg-[var(--surface-2)]/45 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Pool</p>
                <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{effectivePool.title}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {totalSeats} seats • {formatCurrency(contribution, currency)} / {formatFrequencyLabel(frequency)}
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Starts {startDateLabel} • {status.toLowerCase()}
                </p>
              </div>
            </div>
          }
          primaryAction={{
            label: "Open pool",
            onClick: () => navigate(`/pools/${poolId}`),
          }}
          secondaryAction={{
            label: "Share invite",
            onClick: handleShare,
          }}
          tertiaryAction={{
            label: "Back to pools",
            onClick: () => navigate("/pools"),
          }}
          sponsorPlacement="success-create"
          sponsorTitle="Sponsored launch tools"
          sponsorBody="A larger sponsor area can live in the lower half of this success view while your confirmation stays compact above."
        />
      ) : (
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            We couldn’t restore the new pool summary. Go back to your collection and reopen the pool from there.
          </p>
          <Link to="/pools" className="mt-4 inline-flex text-sm font-semibold text-[var(--accent-vivid)] hover:underline">
            Back to pools
          </Link>
        </div>
      )}
    </OfflineStateGate>
  );
}
