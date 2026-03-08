import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { api } from "@convex/api";
import {
  ActivePoolIcon,
  ContributionIcon,
  DraftIcon,
  LoadingIcon,
  RoundIcon,
  SeatCountIcon,
  TrendIcon,
} from "@/lib/icons";
import { SectionHeader } from "@/components/common/SectionHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import { PoolCard, type PoolItem } from "@/components/dashboard/PoolCard";
import { EmptyPools } from "@/components/dashboard/EmptyPools";
import { DashboardHero } from "@/components/dashboard/DashboardHero";

export function Dashboard() {
  const { user } = useUser();
  const pools = useQuery(api.pools.list);

  const firstName = user?.firstName || user?.fullName?.split(" ")[0] || "there";
  const isLoading = pools === undefined;

  const activePools = pools?.filter((p) => p.status === "ACTIVE") ?? [];
  const draftPools = pools?.filter((p) => p.status === "DRAFT") ?? [];
  const totalRounds = pools?.reduce((sum, p) => sum + (p.currentRound ?? 0), 0) ?? 0;
  const totalSeats = pools?.reduce((sum, p) => sum + (p.config?.totalSeats ?? 0), 0) ?? 0;

  const nextDuePool = activePools[0] ?? pools?.[0];
  const hasPools = Boolean(pools && pools.length > 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardHero
        firstName={firstName}
        poolsCount={pools?.length ?? 0}
        totalSeats={totalSeats}
        nextDueAmount={nextDuePool?.config.contribution}
        nextDueCurrency={nextDuePool?.config.currency}
        nextDueFrequency={nextDuePool?.config.frequency}
        nextDueTitle={nextDuePool?.title}
        hasPools={hasPools}
      />

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Summary statistics">
        <StatTile icon={TrendIcon} label="Joined pools" value={pools?.length ?? 0} hint="All participation" />
        <StatTile icon={ActivePoolIcon} label="Active" value={activePools.length} hint="Running now" accent={activePools.length > 0} />
        <StatTile icon={SeatCountIcon} label="Total seats" value={totalSeats} hint="Across pools" />
        <StatTile icon={RoundIcon} label="Rounds tracked" value={totalRounds} hint="In progress" />
      </section>

      <section className="mt-8" aria-label="My pools">
        <SectionHeader
          eyebrow="Live roster"
          title="Your pools"
          actions={
            <>
              <Link to="/pools" className="text-xs font-semibold text-[var(--accent-vivid)] hover:underline">
                View all
              </Link>
            </>
          }
        />

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-[var(--text-muted)]">
              <LoadingIcon size={22} className="animate-spin" />
            </div>
          ) : pools?.length === 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <PoolCard
                pool={{
                  _id: "preview",
                  title: "Aurora Circle",
                  status: "ACTIVE",
                  currentRound: 2,
                  organizer: { name: "Ayesha" },
                  config: {
                    totalSeats: 12,
                    contribution: 10000,
                    currency: "INR",
                    frequency: "Monthly",
                    duration: 12,
                    totalValue: 120000,
                  },
                } as PoolItem}
              />
              <EmptyPools />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {pools
                ?.slice()
                .sort((a, b) => {
                  const order = { ACTIVE: 0, DRAFT: 1, COMPLETED: 2, ARCHIVED: 3 };
                  return (order[a.status as keyof typeof order] ?? 4) - (order[b.status as keyof typeof order] ?? 4);
                })
                .map((pool) => (
                  <PoolCard key={pool._id} pool={pool as PoolItem} />
                ))}
            </div>
          )}
        </div>
      </section>

      {!isLoading && pools && pools.length > 0 && (
        <section className="mt-8" aria-label="Quick actions">
          <SectionHeader eyebrow="Quick actions" title="Momentum" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: RoundIcon, label: "Rounds", to: "/pools" },
              { icon: ContributionIcon, label: "Payments", to: "/pools" },
            ].map(({ icon: Icon, label, to }) => (
              <Link
                key={label}
                to={to}
                className="glass-2 group flex flex-col items-center gap-2 rounded-[22px] border border-[var(--border-subtle)] p-3 text-center transition-all hover:-translate-y-0.5 hover:border-[var(--accent-vivid)]/40"
              >
                <div className="rounded-2xl bg-[var(--accent-vivid)]/12 p-2.5 text-[var(--accent-vivid)] transition-transform group-hover:scale-105">
                  <Icon size={16} />
                </div>
                <span className="text-[11px] font-semibold text-[var(--text-primary)]">{label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!isLoading && draftPools.length > 0 && (
        <div className="glass-2 mt-6 flex flex-wrap items-center gap-3 rounded-[22px] border border-[var(--warning)]/30 p-4">
          <div className="rounded-2xl bg-[var(--warning)]/15 p-2 text-[var(--warning)]">
            <DraftIcon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {draftPools.length} pool{draftPools.length > 1 ? "s" : ""} waiting to launch
            </p>
            <p className="text-xs text-[var(--text-muted)]">Fill all seats and activate to begin rounds.</p>
          </div>
          <Link to="/pools" className="text-xs font-semibold text-[var(--warning)]">
            Review
          </Link>
        </div>
      )}
    </div>
  );
}
