import { Link } from "react-router-dom";
import { cn, formatCurrency } from "@/lib/utils";
import { ArrowIcon } from "@/lib/icons";
import { StatusBadge } from "@/components/common/StatusBadge";

export type PoolItem = {
  _id: string;
  title: string;
  status: string;
  currentRound: number;
  config: {
    totalSeats: number;
    contribution: number;
    currency?: string;
    frequency: string;
    duration: number;
    totalValue: number;
  };
  organizer?: { name: string } | null;
};

const MAX_DOTS = 16;

function getDotIndices(total: number, maxDots = MAX_DOTS) {
  const safeTotal = Math.max(0, total);
  if (safeTotal <= maxDots) {
    return Array.from({ length: safeTotal }, (_, i) => i);
  }
  const step = Math.ceil(safeTotal / maxDots);
  const indices: number[] = [];
  for (let i = 0; i < safeTotal; i += step) {
    indices.push(i);
  }
  if (indices[indices.length - 1] !== safeTotal - 1) {
    indices.push(safeTotal - 1);
  }
  return indices;
}

export function PoolCard({ pool }: { pool: PoolItem }) {
  const poolValue = pool.config.totalValue ?? pool.config.contribution * pool.config.totalSeats;
  const statusTone = {
    ACTIVE: "var(--accent-vivid)",
    DRAFT: "var(--warning)",
    COMPLETED: "var(--success)",
    ARCHIVED: "var(--text-muted)",
  } as const;
  const accent = statusTone[pool.status as keyof typeof statusTone] ?? "var(--accent-vivid)";

  const showRounds = pool.status === "ACTIVE" || pool.status === "COMPLETED";
  const totalDots = showRounds ? pool.config.duration : pool.config.totalSeats;
  const dotIndices = getDotIndices(totalDots);

  return (
    <Link
      to={`/pools/${pool._id}`}
      className={cn(
        "glass-3 group relative flex h-full flex-col gap-4 overflow-hidden rounded-[24px] border border-[var(--border-subtle)] p-4 transition-all",
        "hover:-translate-y-0.5 hover:border-[var(--accent-vivid)]/40 hover:shadow-[0_22px_48px_rgba(0,0,0,0.2)]"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(120px 120px at 92% 0%, color-mix(in oklab, ${accent} 22%, transparent) 0%, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full blur-3xl"
        style={{ background: `color-mix(in oklab, ${accent} 38%, transparent)` }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[var(--text-primary)]">{pool.title}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            by {pool.organizer?.name ?? "Community"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={pool.status} />
          <ArrowIcon size={14} className="text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>

      <div className="relative">
        <p className="font-display text-[var(--type-2xl)] font-bold text-[var(--accent-vivid)]">
          {formatCurrency(pool.config.contribution, pool.config.currency)}
          <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            /{pool.config.frequency}
          </span>
        </p>
      </div>

      {showRounds && (
        <div className="relative">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">
            Round {pool.currentRound} of {pool.config.duration}
          </p>
          <div className="relative">
            <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[var(--surface-2)]/80" />
            <div className="relative flex items-center justify-between gap-0.5 overflow-hidden">
              {dotIndices.map((index, idx) => {
                const nextIndex = dotIndices[idx + 1] ?? totalDots;
                const done = index < pool.currentRound;
                const current = done && nextIndex >= pool.currentRound;
                return (
                  <div key={index} className="flex items-center">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full transition-all",
                        done && !current && "bg-[var(--accent-vivid)]/70",
                        current && "bg-[var(--accent-vivid)] shadow-[0_0_10px_rgba(157,132,255,0.55)]",
                        !done && "bg-[var(--surface-2)]"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {pool.status === "DRAFT" && (
        <div className="relative">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">
            Seats target {pool.config.totalSeats}
          </p>
          <div className="relative">
            <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[var(--surface-2)]/80" />
            <div className="relative flex items-center justify-between gap-0.5 overflow-hidden">
              {dotIndices.map((index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      index === 0 ? "bg-[var(--warning)]/70" : "bg-[var(--surface-2)]"
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto grid grid-cols-2 divide-x divide-[var(--border-subtle)]/60 border-t border-[var(--border-subtle)]/60">
        <div className="flex flex-col gap-0.5 px-3 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Seats</p>
          <p className="text-xs font-bold text-[var(--text-primary)]">{pool.config.totalSeats}</p>
        </div>
        <div className="flex flex-col gap-0.5 px-3 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Pool value</p>
          <p className="text-xs font-bold text-[var(--text-primary)] truncate">
            {formatCurrency(poolValue, pool.config.currency)}
          </p>
        </div>
      </div>
    </Link>
  );
}
