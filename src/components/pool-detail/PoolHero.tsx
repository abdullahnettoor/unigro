import { Surface } from "@/components/ui/Surface";
import { Button } from "@/components/ui/button";
import * as Icons from "@/lib/icons";
import { OrbitVisualizer } from "./visualizers/OrbitVisualizer";
import type { PoolDetail, PoolSeat, PoolTransaction } from "./types";

interface PoolHeroProps {
  pool: PoolDetail;
  seats: PoolSeat[];
  transactions: PoolTransaction[];
  isOrganizer: boolean;
  isDraft: boolean;
  hasOpenSeats: boolean;
  isMember: boolean;
  filledCount: number;
  progressLabel: string;
  progressValue: number;
  progressCount: number;
  progressTotal: number;
  isRestricted?: boolean;
  onSeatClick: (seat: PoolSeat, isOpen: boolean) => void;
  onContact?: () => void;
}

export function PoolHero({
  pool,
  seats,
  transactions,
  isOrganizer,
  hasOpenSeats,
  isMember,
  progressValue,
  progressCount,
  progressTotal,
  isRestricted,
  onSeatClick,
  onContact,
}: PoolHeroProps) {

  if (isRestricted) {
    return (
      <Surface tier={3} className="grain rounded-3xl p-8 relative overflow-hidden flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-vivid)]/[0.04] to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-6 max-w-sm">
          <div className="mx-auto h-16 w-16 rounded-[24px] bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent-vivid)] border border-[var(--border-subtle)]/40 shadow-inner">
            <Icons.LockIcon size={28} strokeWidth={2} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-display font-black text-[var(--text-primary)] leading-tight">{pool.title}</h1>
            <div className="inline-flex items-center rounded-full bg-[var(--accent-vivid)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-vivid)]">
              {pool.status} Pool
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            This pool is currently active. For member privacy, deep details and contributions are restricted to participants.
          </p>
          {onContact && (
            <Button onClick={onContact} className="h-12 px-10 rounded-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold gap-3 shadow-lg shadow-[var(--accent-vivid)]/20 hover:scale-[1.02] active:scale-95 transition-all">
              <Icons.PhoneIcon size={18} />
              Contact Organizer
            </Button>
          )}
        </div>
      </Surface>
    );
  }

  return (
    <Surface tier={3} className="grain rounded-3xl p-4 sm:p-7 relative overflow-hidden min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 w-full">
          <span className="inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)]/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
            {pool.status}
          </span>
          <h1 className="mt-3 text-xl sm:text-2xl font-display font-bold text-[var(--text-primary)] break-words leading-tight min-w-0">
            {pool.title}
          </h1>
        </div>
      </div>

      {(isMember || isOrganizer || (pool.status === "ACTIVE" && hasOpenSeats)) && (
        <div className="mt-6 flex w-full min-w-0 flex-col">
          <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border-subtle)]/35 bg-[var(--surface-1)]/30 p-2 sm:p-3">
            <OrbitVisualizer pool={pool} seats={seats} transactions={transactions} onSeatClick={onSeatClick} />
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-[var(--border-subtle)] pt-5">
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)]/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-vivid)]/[0.03] to-transparent pointer-events-none" />

          <div className="relative z-10 mb-3 flex items-end justify-between gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-xl font-bold font-mono tracking-tight text-[var(--accent-vivid)]">
                {Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(progressCount * (pool.config.contribution || 0))}
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                {pool.status === 'ACTIVE' ? 'collected' : 'committed'}
              </span>
            </div>
            <div className="hidden sm:flex items-baseline gap-1.5 opacity-80">
              <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                of
              </span>
              <span className="text-sm font-semibold font-mono tracking-tight text-[var(--text-primary)]">
                {Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(progressTotal * (pool.config.contribution || 0))}
              </span>
            </div>
          </div>

          <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)] border border-[var(--border-subtle)]/40 z-10">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-[var(--accent-vivid)] to-[var(--accent-secondary)] transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
            />
          </div>

          <div className="mt-3 relative z-10 flex items-center justify-between text-[10px] sm:text-[11px] font-medium text-[var(--text-secondary)] gap-3">
            <span>
              <span className="font-bold text-[var(--accent-vivid)]">{Math.round(progressValue)}%</span> {pool.status === 'ACTIVE' ? 'this round' : 'filled'}
            </span>
            <span className="truncate text-right">
              {Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.max(0, progressTotal - progressCount) * (pool.config.contribution || 0))} remaining
            </span>
          </div>
        </div>
      </div>
    </Surface>
  );
}
