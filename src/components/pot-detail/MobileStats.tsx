import { Calendar, ChevronDown, Clock, PieChart, Share2 } from "lucide-react";

import { formatCurrency } from "@/lib/utils";

import type { Doc } from "../../../convex/_generated/dataModel";

interface MobileStatsProps {
    showMobileStats: boolean;
    setShowMobileStats: (show: boolean) => void;
    pot: Doc<"pots">;
    winningAmount: number;
    commissionPct: number;
    commissionAmount: number;
    nextDueDate: string;
    nextDrawDate: string;
    handleShare: () => void;
}

export function MobileStats({
    showMobileStats,
    setShowMobileStats,
    pot,
    winningAmount,
    commissionPct,
    commissionAmount,
    nextDueDate,
    nextDrawDate,
    handleShare
}: MobileStatsProps) {
    return (
        <div className="lg:hidden">
            <div className={`glass-3 rounded-3xl overflow-hidden transition-all duration-500 ${showMobileStats ? 'pb-6' : ''}`}>
                <button
                    onClick={() => setShowMobileStats(!showMobileStats)}
                    className="w-full p-4 flex items-center justify-between text-sm font-bold transition-all hover:bg-[var(--surface-elevated)] border-none bg-transparent"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-[var(--accent-secondary)]/20 p-2 rounded-xl text-[var(--accent-secondary)]">
                            <PieChart size={18} />
                        </div>
                        <span>Pot Details & Stats</span>
                    </div>
                    <div className={`transition-transform duration-300 ${showMobileStats ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20} />
                    </div>
                </button>

                {/* Collapsible Content Area */}
                <div className={`grid transition-all duration-500 ease-in-out ${showMobileStats ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                    <div className="overflow-hidden">
                        <div className="px-6 py-2 space-y-6">
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

                            <button
                                onClick={handleShare}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-full hover:bg-[var(--surface-deep)] text-xs font-bold transition-colors text-[var(--text-muted)]"
                            >
                                <Share2 size={14} /> Share details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
