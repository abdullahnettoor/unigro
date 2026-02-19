import { Link } from "react-router-dom";
import type { Doc } from "../../convex/_generated/dataModel";
import { formatCurrency } from "../lib/utils";

interface PotCardProps {
    pot: Doc<"pots"> & { foreman?: { name: string } | null };
    currentUserId?: string;
}

export function PotCard({ pot, currentUserId }: PotCardProps) {
    const isDraft = pot.status === "DRAFT";
    const isForeman = currentUserId && pot.foremanId === currentUserId;
    const slots = ((pot as unknown as { slots?: Array<{ status: string }> }).slots) || [];
    const filledSlots = slots.filter((slot) => slot.status === "FILLED" || slot.status === "RESERVED").length;
    const totalSlots = Math.max(pot.config.totalSlots, 1);
    const totalCycles = Math.max(pot.config.duration, 1);
    const cycleIndex = Math.min(Math.max(pot.currentMonth || 0, 0), totalCycles);

    const progressCount = isDraft ? filledSlots : cycleIndex;
    const progressTotal = isDraft ? totalSlots : totalCycles;
    const progress = Math.min(100, Math.round((progressCount / progressTotal) * 100));
    const progressLabel = isDraft
        ? "Slot fill progress"
        : (pot.config.frequency === "occasional" ? "Round progress" : "Cycle progress");

    return (
        <Link to={`/pot/${pot._id}`} className="block">
            <div className="glass-2 group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all hover:border-[var(--accent-vivid)]/40 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${isDraft ? "bg-[var(--warning)]/10 text-[var(--warning)]" : "bg-[var(--accent-vivid)]/10 text-[var(--accent-vivid)]"
                        }`}>
                        {pot.status}
                    </span>
                    <span className="rounded-full bg-[var(--surface-deep)]/60 px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                        {pot.config.frequency}
                    </span>
                </div>

                <div className="mb-2 flex items-start gap-3">
                    <div className="glass-1 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base">
                        {pot.status === "ACTIVE" ? "◉" : "◎"}
                    </div>
                    <div className="min-w-0">
                        <h3 className="mb-1 truncate text-lg font-semibold font-display text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-vivid)] sm:text-xl">
                            {pot.title}
                        </h3>
                        <div className="mb-2 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            Organized by{" "}
                            <span className="max-w-[150px] truncate font-medium text-[var(--text-muted)]">
                                {isForeman ? "you" : (pot.foreman?.name || "Organizer")}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span>{progressLabel}</span>
                        <span>{progressCount}/{progressTotal}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-deep)]/70">
                        <div className="h-full rounded-full bg-[var(--accent-vivid)] transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-[var(--border-subtle)] pt-4">
                    <div>
                        <div className="mb-1 text-[10px] uppercase text-[var(--text-muted)]">Pool value</div>
                        <div className="text-lg font-semibold font-mono text-[var(--text-primary)]">
                            {formatCurrency(pot.config.totalValue, pot.config.currency)}
                        </div>
                    </div>
                    <div>
                        <div className="mb-1 text-[10px] uppercase text-[var(--text-muted)]">
                            Per {pot.config.frequency === "occasional" ? "round" : "cycle"}
                        </div>
                        <div className="text-lg font-semibold font-mono text-[var(--accent-secondary)]">
                            {formatCurrency(pot.config.contribution, pot.config.currency)}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
