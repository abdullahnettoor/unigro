import { useState } from "react";
import { useMutation } from "convex/react";
import { AlertTriangle, ArrowRight, CheckCircle2, X } from "lucide-react";

import { useFeedback } from "@/components/shared/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { ModalCloseButton, ModalHeader, ModalShell } from "@/components/ui/ModalShell";
import { Surface } from "@/components/ui/Surface";

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
        <ModalShell zIndex={100} showHandle={false}>
            <ModalHeader className="flex justify-between items-center">
                <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">
                    {isLastRound ? "Complete pot" : "Start next round"}
                </h3>
                <ModalCloseButton onClick={onClose}>
                    <X size={20} />
                </ModalCloseButton>
            </ModalHeader>

            <div className="p-6 space-y-5">
                <p className="text-[var(--text-muted)] text-sm">
                    Winner for cycle {currentMonth} has been selected.
                    {isLastRound
                        ? " This was the final round. Completing this pot will archive it."
                        : " Ready to start collecting for the next cycle?"
                    }
                </p>

                {/* ── Payment Warning ── */}
                {hasPaymentWarning && (
                    <Surface tier={1} className={`rounded-xl p-4 border flex gap-3 transition-colors ${warningAcknowledged
                        ? "bg-[var(--accent-vivid)]/10 border-[var(--accent-vivid)]/30"
                        : "bg-[var(--warning)]/10 border-[var(--warning)]/30"
                        }`}>
                        {warningAcknowledged
                            ? <CheckCircle2 size={16} className="text-[var(--accent-vivid)] shrink-0 mt-0.5" />
                            : <AlertTriangle size={16} className="text-[var(--warning)] shrink-0 mt-0.5" />
                        }
                        <div className="flex-1 min-w-0">
                            {warningAcknowledged ? (
                                <p className="text-sm text-[var(--accent-vivid)] font-medium">Acknowledged — you can proceed.</p>
                            ) : (
                                <>
                                    <p className="text-sm text-[var(--warning)] font-bold mb-1">Payments not complete</p>
                                    <ul className="text-xs text-[var(--text-muted)] space-y-0.5 mb-3">
                                        {unpaidCount > 0 && (
                                            <li>• {unpaidCount} slot{unpaidCount > 1 ? "s" : ""} with no payment submitted</li>
                                        )}
                                        {pendingCount > 0 && (
                                            <li>• {pendingCount} slot{pendingCount > 1 ? "s" : ""} pending approval</li>
                                        )}
                                    </ul>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setWarningAcknowledged(true)}
                                        className="h-auto p-0 text-[var(--warning)] hover:text-[var(--warning)] hover:bg-transparent underline underline-offset-2"
                                    >
                                        Proceed anyway
                                    </Button>
                                </>
                            )}
                        </div>
                    </Surface>
                )}

                {/* ── Next Draw Date (non-last rounds) ── */}
                {!isLastRound && (
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                            Next Draw Date {isOccasional && "(Required)"}
                        </label>
                        <DatePicker
                            value={nextDate}
                            onChange={setNextDate}
                            disabled={false}
                            className="bg-[var(--surface-elevated)]"
                        />
                        {isOccasional && (
                            <p className="text-xs text-[var(--accent-vivid)] mt-1">Set the date for the next occasional draw.</p>
                        )}
                    </div>
                )}

                {/* ── Advance Button ── */}
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleAdvance}
                    disabled={loading || needsAcknowledgement}
                    className="w-full font-bold shadow-lg shadow-[var(--accent-vivid)]/20 py-3.5"
                >
                    {loading ? "Processing..." : (
                        isLastRound
                            ? "Finish pot"
                            : <span className="flex items-center gap-2">{`Begin cycle ${currentMonth + 1}`} <ArrowRight size={18} /></span>
                    )}
                </Button>
                {needsAcknowledgement && (
                    <p className="text-center text-xs text-[var(--text-muted)]">
                        Acknowledge the payment warning above to proceed.
                    </p>
                )}
            </div>
        </ModalShell>
    );
}
