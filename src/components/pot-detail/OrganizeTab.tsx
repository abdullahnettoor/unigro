import { Clock,ShieldCheck } from "lucide-react";

import { formatCurrency } from "@/lib/utils";

import type { Doc } from "../../../convex/_generated/dataModel";

interface OrganizeTabProps {
    pot: Doc<"pots">;
    isDraft: boolean;
    isActive: boolean;
    currentWinnerSlot: any;
    isDrawing: boolean;
    transactions: any[];
    allSlots: any[];
    commissionPct: number;
    handleActivate: () => void;
    handleDraw: () => void;
    setShowWinnerSelection: (show: boolean) => void;
    setGlobalPaymentState: (state: any) => void;
}

export function OrganizeTab({
    pot,
    isDraft,
    isActive,
    currentWinnerSlot,
    isDrawing,
    transactions,
    allSlots,
    commissionPct,
    handleActivate,
    handleDraw,
    setShowWinnerSelection,
    setGlobalPaymentState
}: OrganizeTabProps) {
    const pendingTransactions = transactions?.filter(t => t.status === "PENDING") || [];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Quick Management Card */}
            <section className="glass-3 rounded-3xl p-6 border border-[var(--accent-vivid)]/20 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                    <ShieldCheck size={100} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-xl font-display font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <ShieldCheck className="text-[var(--accent-vivid)]" size={24} /> Organizer Controls
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="glass-1 p-4 rounded-2xl">
                            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">Pot Status</p>
                            <p className="text-lg font-black text-[var(--accent-vivid)] uppercase">{pot.status}</p>
                        </div>
                        <div className="glass-1 p-4 rounded-2xl">
                            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">Round Pool</p>
                            <p className="text-lg font-black">{formatCurrency(pot.config.totalValue, pot.config.currency)}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {isDraft && (
                            <button
                                onClick={handleActivate}
                                className="w-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] py-4 rounded-2xl font-black shadow-[0_10px_30px_rgba(var(--accent-vivid-rgb),0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                ACTIVATE POT
                            </button>
                        )}

                        {isActive && !currentWinnerSlot && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowWinnerSelection(true)}
                                    className="flex-1 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] py-3 rounded-2xl text-xs font-bold hover:bg-[var(--surface-deep)] transition-colors"
                                >
                                    Manual Winner
                                </button>
                                <button
                                    onClick={handleDraw}
                                    disabled={isDrawing}
                                    className="flex-1 bg-[var(--accent-secondary)] text-[var(--text-primary)] py-3 rounded-2xl text-xs font-black shadow-[0_10px_30px_rgba(var(--accent-secondary-rgb),0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    RUN DRAW
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Pending Approvals Section */}
            <section className="glass-2 rounded-3xl p-6">
                <h3 className="text-lg font-display font-bold flex items-center gap-2 mb-6 text-[var(--warning)]">
                    <Clock size={20} /> Pending Approvals
                </h3>
                {pendingTransactions.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-muted)] glass-1 rounded-2xl border border-dashed border-[var(--border-subtle)]">
                        No pending approvals for now.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendingTransactions.map(tx => {
                            const slot = allSlots.find(s => s._id === tx.slotId);
                            return (
                                <div key={tx._id} className="glass-1 p-4 rounded-xl flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-[var(--surface-deep)] rounded-full flex items-center justify-center font-bold">
                                            {slot?.slotNumber || tx.monthIndex}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Round {tx.monthIndex} Payment</p>
                                            <p className="text-xs text-[var(--text-muted)]">{tx.user?.name || 'Member'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {tx.proofUrl && <a href={tx.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent-vivid)] hover:underline mr-2">View Proof</a>}
                                        <button
                                            onClick={() => setGlobalPaymentState({ slotId: tx.slotId, cycle: tx.monthIndex, amount: pot.config.contribution, isForemanAction: true, userId: tx.userId })}
                                            className="bg-[var(--accent-vivid)] text-[var(--text-on-accent)] text-xs font-bold px-4 py-2 rounded-full hover:opacity-90"
                                        >
                                            Review
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Round Details / Rules Summary */}
            <div className="glass-1 rounded-3xl p-6">
                <h4 className="text-xs uppercase font-black tracking-widest text-[var(--text-muted)] mb-4">Pot Configuration</h4>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <dt className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Target Slots</dt>
                        <dd className="font-bold">{pot.config.totalSlots}</dd>
                    </div>
                    <div>
                        <dt className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Duration</dt>
                        <dd className="font-bold">{pot.config.duration} Months</dd>
                    </div>
                    <div>
                        <dt className="text-[10px] uppercase font-bold text-[var(--text-muted)]">EMI</dt>
                        <dd className="font-bold">{formatCurrency(pot.config.contribution, pot.config.currency)}</dd>
                    </div>
                    <div>
                        <dt className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Commission</dt>
                        <dd className="font-bold">{commissionPct.toFixed(2)}%</dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}
