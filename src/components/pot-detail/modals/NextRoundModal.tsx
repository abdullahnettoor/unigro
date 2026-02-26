import { useState } from "react";
import { useMutation } from "convex/react";
import { AlertTriangle, ArrowRight, CheckCircle2, X } from "lucide-react";

import { useFeedback } from "@/components/shared/FeedbackProvider";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface NextRoundModalProps {
    potId: Id<"pots">;
    currentMonth: number;
    totalMonths: number;
    defaultNextDate: string; // YYYY-MM-DD
    isOccasional: boolean;
    /** Slots whose payment for currentMonth is still UNPAID (no transaction row yet) */
    unpaidCount: number;
    /** Slots whose payment for currentMonth is PENDING (submitted, not approved) */
    pendingCount: number;
    onClose: () => void;
}

export function NextRoundModal({
    potId, currentMonth, totalMonths, defaultNextDate,
    isOccasional, unpaidCount, pendingCount, onClose,
}: NextRoundModalProps) {
    const advanceCycle = useMutation(api.pots.advanceCycle);
    const [nextDate, setNextDate] = useState(defaultNextDate);
    const [loading, setLoading] = useState(false);
    const [warningAcknowledged, setWarningAcknowledged] = useState(false);
    const feedback = useFeedback();

    const isLastRound = currentMonth >= totalMonths;
    const hasPaymentWarning = unpaidCount > 0 || pendingCount > 0;
    const needsAcknowledgement = hasPaymentWarning && !warningAcknowledged;

    const handleAdvance = async () => {
        if (!nextDate && !isLastRound) {
            feedback.toast.info("Select a date", "Please choose the next draw date.");
            return;
        }
        setLoading(true);
        try {
            await advanceCycle({
                potId,
                nextDrawDate: new Date(nextDate).getTime(),
            });
            onClose();
        } catch (err: any) {
            feedback.toast.error("Failed to advance", err.message);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">
                        {isLastRound ? "Complete pot" : "Start next round"}
                    </h3>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-5">
                    <p className="text-[var(--text-muted)] text-sm">
                        Winner for cycle {currentMonth} has been selected.
                        {isLastRound
                            ? " This was the final round. Completing this pot will archive it."
                            : " Ready to start collecting for the next cycle?"
                        }
                    </p>

                    {/* ── Payment Warning ── */}
                    {hasPaymentWarning && (
                        <div className={`rounded-xl p-4 border flex gap-3 transition-colors ${warningAcknowledged
                            ? "bg-green-500/10 border-green-500/25"
                            : "bg-amber-500/10 border-amber-500/30"
                            }`}>
                            {warningAcknowledged
                                ? <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
                                : <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                            }
                            <div className="flex-1 min-w-0">
                                {warningAcknowledged ? (
                                    <p className="text-sm text-green-300 font-medium">Acknowledged — you can proceed.</p>
                                ) : (
                                    <>
                                        <p className="text-sm text-amber-300 font-bold mb-1">Payments not complete</p>
                                        <ul className="text-xs text-amber-200/80 space-y-0.5 mb-3">
                                            {unpaidCount > 0 && (
                                                <li>• {unpaidCount} slot{unpaidCount > 1 ? "s" : ""} with no payment submitted</li>
                                            )}
                                            {pendingCount > 0 && (
                                                <li>• {pendingCount} slot{pendingCount > 1 ? "s" : ""} pending approval</li>
                                            )}
                                        </ul>
                                        <button
                                            onClick={() => setWarningAcknowledged(true)}
                                            className="text-xs font-bold text-amber-300 underline underline-offset-2 hover:text-amber-200"
                                        >
                                            Proceed anyway
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Next Draw Date (non-last rounds) ── */}
                    {!isLastRound && (
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                Next Draw Date {isOccasional && "(Required)"}
                            </label>
                            <input
                                type="date"
                                value={nextDate}
                                onChange={(e) => setNextDate(e.target.value)}
                                className="w-full bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-lg p-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-vivid)]"
                            />
                            {isOccasional && (
                                <p className="text-xs text-[var(--accent-vivid)] mt-1">Set the date for the next occasional draw.</p>
                            )}
                        </div>
                    )}

                    {/* ── Advance Button ── */}
                    <button
                        onClick={handleAdvance}
                        disabled={loading || needsAcknowledgement}
                        className="w-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading ? "Processing..." : (
                            isLastRound
                                ? "Finish pot"
                                : <>{`Begin cycle ${currentMonth + 1}`} <ArrowRight size={18} /></>
                        )}
                    </button>
                    {needsAcknowledgement && (
                        <p className="text-center text-xs text-[var(--text-muted)]">
                            Acknowledge the payment warning above to proceed.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
