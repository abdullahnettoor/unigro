import { Calendar, Clock, Layers, Share2 } from "lucide-react";

import { formatCurrency } from "@/lib/utils";

import type { Doc } from "../../../convex/_generated/dataModel";

interface DesktopSidebarProps {
    pot: Doc<"pots">;
    primaryAction: any;
    winningAmount: number;
    commissionPct: number;
    commissionAmount: number;
    nextDueDate: string;
    nextDrawDate: string;
    handleShare: () => void;
}

export function DesktopSidebar({
    pot,
    primaryAction,
    winningAmount,
    commissionPct,
    commissionAmount,
    nextDueDate,
    nextDrawDate,
    handleShare
}: DesktopSidebarProps) {
    return (
        <aside className="space-y-6 lg:sticky lg:top-8 hidden lg:block">
            {/* Primary Action Card (Desktop) */}
            {primaryAction && (
                <div className="glass-3 border border-[var(--accent-vivid)]/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                        <Layers size={100} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] uppercase font-bold text-[var(--accent-vivid)] tracking-widest mb-2 px-2 py-0.5 bg-[var(--accent-vivid)]/10 rounded-full inline-block">Action Required</p>
                        <h3 className="text-xl font-display font-black text-[var(--text-primary)] mb-2">{primaryAction.label}</h3>
                        <p className="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">{primaryAction.helper}</p>
                        <button
                            onClick={primaryAction.onClick}
                            disabled={primaryAction.disabled}
                            className={`w-full relative z-10 rounded-full px-6 py-4 text-sm font-black transition-all ${primaryAction.tone === "secondary"
                                ? "bg-[var(--accent-secondary)] text-[var(--text-primary)] hover:scale-[1.02] active:scale-[0.98]"
                                : "bg-[var(--accent-vivid)] text-[var(--text-on-accent)] hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_30px_rgba(var(--accent-vivid-rgb),0.3)]"
                                } disabled:opacity-50 disabled:scale-100`}
                        >
                            {primaryAction.label.toUpperCase()}
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Sidebar */}
            <div className="glass-2 rounded-3xl p-6 space-y-6">
                <div className="space-y-4">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">Winning Pot</p>
                        <p className="text-4xl font-display font-black text-[var(--accent-secondary)]">{formatCurrency(winningAmount, pot.config.currency)}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">After {commissionPct.toFixed(2)}% commission ({formatCurrency(commissionAmount, pot.config.currency)})</p>
                    </div>

                    <div className="h-px bg-[var(--border-subtle)] opacity-20" />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">Round Pool</p>
                            <p className="text-lg font-mono font-bold">{formatCurrency(pot.config.totalValue, pot.config.currency)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">EMI</p>
                            <p className="text-lg font-mono font-bold">{formatCurrency(pot.config.contribution, pot.config.currency)}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-[var(--surface-deep)]/60 p-3 rounded-2xl border border-[var(--border-subtle)]/30">
                        <div className="bg-[var(--accent-vivid)]/20 p-2 rounded-xl text-[var(--accent-vivid)]">
                            <Clock size={16} />
                        </div>
                        <div className="flex-1 flex justify-between items-center min-w-0">
                            <p className="text-[9px] uppercase font-bold text-[var(--text-muted)]">Next Payment</p>
                            <p className="text-xs font-bold truncate ml-2">{nextDueDate}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-[var(--surface-deep)]/60 p-3 rounded-2xl border border-[var(--border-subtle)]/30">
                        <div className="bg-[var(--accent-secondary)]/20 p-2 rounded-xl text-[var(--accent-secondary)]">
                            <Calendar size={16} />
                        </div>
                        <div className="flex-1 flex justify-between items-center min-w-0">
                            <p className="text-[9px] uppercase font-bold text-[var(--text-muted)]">Next Draw</p>
                            <p className="text-xs font-bold truncate ml-2">{nextDrawDate}</p>
                        </div>
                    </div>
                </div>

                {/* Share Action */}
                <button
                    onClick={handleShare}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full hover:bg-[var(--surface-deep)] text-xs font-bold transition-colors text-[var(--text-muted)]"
                >
                    <Share2 size={14} /> Share details
                </button>
            </div>
        </aside>
    );
}
