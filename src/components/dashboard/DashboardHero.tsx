import { TrendIcon } from "@/lib/icons";
import { formatCurrency } from "@/lib/utils";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardHero({
  firstName,
  poolsCount,
  totalSeats,
  nextDueAmount,
  nextDueCurrency,
  nextDueFrequency,
  nextDueTitle,
  hasPools,
}: {
  firstName: string;
  poolsCount: number;
  totalSeats: number;
  nextDueAmount?: number;
  nextDueCurrency?: string;
  nextDueFrequency?: string;
  nextDueTitle?: string;
  hasPools: boolean;
}) {
  const greeting = getGreeting();

  return (
    <section className="glass-3 relative overflow-hidden rounded-[26px] border border-[var(--border-subtle)] p-5">
      <div className="pointer-events-none absolute inset-0 bg-[var(--bg-glass-gradient)] opacity-70" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[var(--accent-vivid)]/20 blur-3xl" />
      <div className="relative grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">{greeting}</p>
          <h1 className="mt-3 font-display text-[var(--type-3xl)] font-bold text-[var(--text-primary)]">
            {firstName}, your dues are in focus.
          </h1>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            {hasPools
              ? `You’re active in ${poolsCount} pool${poolsCount === 1 ? "" : "s"} · ${totalSeats} seats total.`
              : "Join a pool to see upcoming dues and cycle progress."}
          </p>
        </div>
        <div className="glass-2 relative rounded-[22px] border border-[var(--border-subtle)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">Upcoming dues</p>
          <p className="mt-3 font-display text-[var(--type-2xl)] font-bold text-[var(--text-primary)]">
            {hasPools && nextDueAmount !== undefined
              ? formatCurrency(nextDueAmount, nextDueCurrency)
              : "—"}
            {hasPools && nextDueFrequency && (
              <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                /{nextDueFrequency}
              </span>
            )}
          </p>
          <div className="mt-4 rounded-2xl bg-[var(--surface-2)]/70 p-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)]">Next due in</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
              {hasPools ? nextDueTitle ?? "Your next pool" : "Join a pool to view"}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <TrendIcon size={14} className="text-[var(--accent-vivid)]" />
            Track your contributions across active pools.
          </div>
        </div>
      </div>
    </section>
  );
}
