import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/Surface";
import * as Icons from "@/lib/icons";
import { cn,formatCurrency } from "@/lib/utils";

import type { PoolDetail } from "./types";

interface RulesTabProps {
  pool: PoolDetail;
  nextDrawDate: string;
  isMember?: boolean;
  onJoin?: () => void;
}

export function RulesTab({ pool, nextDrawDate, isMember, onJoin }: RulesTabProps) {
  return (
    <section className="space-y-8">
      {/* ── 1. Organizer Profile ── */}
      <div className="space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)] px-1">Trust & Transparency</p>
        <Surface tier={3} className="grain rounded-[28px] border border-[var(--border-subtle)] p-6 bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="relative shrink-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-display text-xl font-bold shadow-xl shadow-[var(--accent-vivid)]/20 border-2 border-white/10 relative">
                  <span className="relative z-10">{pool.organizer?.name?.[0] || "O"}</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent rounded-[22px]" />
                </div>
                {pool.organizer?.verificationStatus === "VERIFIED" && (
                  <div className="absolute -right-1 -bottom-1 z-20 rounded-full bg-[var(--success)] p-1 text-[var(--text-on-accent)] ring-2 ring-[var(--surface-3)] shadow-md">
                    <Icons.CheckIcon size={10} strokeWidth={4} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-[var(--text-primary)] leading-tight truncate">
                  {pool.organizer?.name}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-vivid)]">Verified Organizer</p>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <span className="font-mono bg-[var(--surface-3)]/60 px-2 py-0.5 rounded-full border border-[var(--border-subtle)]/30">
                    {pool.organizer?.phone || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {pool.organizer?.phone && (
              <Button asChild size="icon" variant="outline" className="rounded-2xl h-11 w-11 shrink-0 bg-white/5 border-[var(--border-subtle)]/40 text-[var(--accent-vivid)] hover:bg-[var(--accent-vivid)] hover:text-[var(--text-on-accent)] transition-all duration-300 group">
                <a href={`tel:${pool.organizer.phone}`} title="Call Organizer">
                  <Icons.PhoneIcon size={18} className="group-hover:scale-110 transition-transform" />
                </a>
              </Button>
            )}
          </div>
        </Surface>
      </div>

      {/* ── 1. Pool Rules ── */}
      <div className="space-y-4">
        <header className="px-1 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Rules & Terms</p>
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">Pool Guidelines</h2>
          </div>

          {onJoin && (
            <Button
              onClick={onJoin}
              className="rounded-full bg-[var(--accent-vivid)] hover:bg-[var(--accent-vivid)]/90 text-[var(--text-on-accent)] font-bold px-6 h-11 gap-2 shadow-xl shadow-[var(--accent-vivid)]/25 transition-all active:scale-95"
            >
              <Icons.ZapIcon size={18} fill="currentColor" />
              <span>Join Pool</span>
            </Button>
          )}
        </header>

        <Surface tier={2} className="grain rounded-[28px] border border-[var(--border-subtle)] p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="shrink-0 rounded-2xl bg-[var(--accent-vivid)]/10 p-2.5 text-[var(--accent-vivid)]">
              <Icons.InfoIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1.5">Organizer Terms</h3>
              <p className="text-sm leading-relaxed text-[var(--text-muted)] whitespace-pre-wrap">
                {pool.terms || "No specific terms provided by the organizer. Standard fair-play rules apply to all contributions and draws."}
              </p>
            </div>
          </div>
        </Surface>
      </div>

      {/* ── 2. Configuration Grid ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Surface tier={1} className="rounded-[28px] border border-[var(--border-subtle)]/60 p-5 bg-[var(--surface-1)]/40">
          <div className="flex items-center gap-2 mb-4">
            <Icons.LayersIcon size={14} className="text-[var(--text-muted)]" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Core Config</h3>
          </div>
          <div className="space-y-3.5">
            {[
              { label: "Total Seats", value: pool.config.totalSeats, icon: Icons.SeatCountIcon },
              { label: "Contribution", value: formatCurrency(pool.config.contribution, pool.config.currency), icon: Icons.ContributionIcon, highlight: true },
              { label: "Frequency", value: pool.config.frequency, icon: Icons.RoundIcon, capitalize: true },
              { label: "Duration", value: `${pool.config.duration} Rounds`, icon: Icons.HistoryIcon },
              { label: "Commission", value: `${pool.config.commission ?? 0}%`, icon: Icons.CommissionIcon },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between border-b border-[var(--border-subtle)]/30 pb-2.5 last:border-0 last:pb-0">
                <div className="flex items-center gap-2.5 text-[var(--text-muted)]">
                  <item.icon size={14} strokeWidth={1.5} />
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
                <span className={cn(
                  "text-xs font-bold",
                  item.highlight ? "text-[var(--accent-vivid)]" : "text-[var(--text-primary)]",
                  item.capitalize && "capitalize"
                )}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface tier={1} className="rounded-[28px] border border-[var(--border-subtle)]/60 p-5 bg-[var(--surface-1)]/40">
          <div className="flex items-center gap-2 mb-4">
            <Icons.ClockIcon size={14} className="text-[var(--text-muted)]" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Timeline</h3>
          </div>
          <div className="space-y-3.5">
            {[
              { label: "Start Date", value: pool.startDate ? new Date(pool.startDate).toLocaleDateString() : "N/A", icon: Icons.StartDateIcon },
              { label: "Grace Period", value: `${pool.config.gracePeriodDays ?? 0} Days`, icon: Icons.ZapIcon },
              { label: "Next Draw", value: nextDrawDate, icon: Icons.DrawIcon },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between border-b border-[var(--border-subtle)]/30 pb-2.5 last:border-0 last:pb-0">
                <div className="flex items-center gap-2.5 text-[var(--text-muted)]">
                  <item.icon size={14} strokeWidth={1.5} />
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)]">{item.value}</span>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      {/* ── 3. Payment Details ── */}
      {pool.paymentDetails && isMember && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)] px-1">Money & Bank</p>
          <Surface tier={2} className="rounded-[28px] border border-[var(--border-subtle)] p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-xl bg-[var(--success)]/12 p-2 text-[var(--success)]">
                <Icons.BankIcon size={18} />
              </div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Disbursement Details</h4>
            </div>

            <div className="grid grid-cols-1 gap-y-4 gap-x-8 sm:grid-cols-2">
              {[
                { label: "UPI ID", value: pool.paymentDetails.upiId },
                { label: "Account Name", value: pool.paymentDetails.accountName },
                { label: "Bank Name", value: pool.paymentDetails.bankName },
                { label: "Account Number", value: pool.paymentDetails.accountNumber },
                { label: "IFSC Code", value: pool.paymentDetails.ifsc },
              ].map((field) => field.value ? (
                <div key={field.label} className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">{field.label}</span>
                  <span className="text-sm font-mono font-bold text-[var(--text-primary)] break-all">{field.value}</span>
                </div>
              ) : null)}
            </div>

            {pool.paymentDetails.note && (
              <div className="mt-6 rounded-2xl bg-[var(--surface-2)]/50 p-3.5 border border-[var(--border-subtle)]/20">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1">Note from Organizer</p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed italic">{pool.paymentDetails.note}</p>
              </div>
            )}
          </Surface>
        </div>
      )}

    </section>
  );
}
