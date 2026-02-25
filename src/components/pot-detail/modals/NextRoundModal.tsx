import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { X, ArrowRight } from "lucide-react";
import { useFeedback } from "@/components/shared/FeedbackProvider";

interface NextRoundModalProps {
    potId: Id<"pots">;
    currentMonth: number;
    totalMonths: number;
    defaultNextDate: string; // YYYY-MM-DD
    isOccasional: boolean;
    onClose: () => void;
}

export function NextRoundModal({ potId, currentMonth, totalMonths, defaultNextDate, isOccasional, onClose }: NextRoundModalProps) {
    const advanceCycle = useMutation(api.pots.advanceCycle);
    const [nextDate, setNextDate] = useState(defaultNextDate);
    const [loading, setLoading] = useState(false);
    const feedback = useFeedback();

    const isLastRound = currentMonth >= totalMonths;

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
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-display font-bold text-[var(--text-primary)] flex items-center gap-2">
                        {isLastRound ? "Complete pot" : "Start next round"}
                    </h3>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
                </div>

                <div className="space-y-6">
                    <p className="text-[var(--text-muted)] text-sm">
                        Winner for cycle {currentMonth} has been selected.
                        {isLastRound
                            ? " This was the final round. Completing this pot will archive it."
                            : " Ready to start collecting for the next cycle?"
                        }
                    </p>

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
                            {isOccasional && <p className="text-xs text-[var(--accent-vivid)] mt-1">Set the date for the next occasional draw.</p>}
                        </div>
                    )}

                    <button
                        onClick={handleAdvance}
                        disabled={loading}
                        className="w-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold py-3 rounded-xl hover:opacity-90 flex justify-center items-center gap-2"
                    >
                        {loading ? "Processing..." : (
                            isLastRound ? "Finish pot" : <>Begin cycle {currentMonth + 1} <ArrowRight size={18} /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
