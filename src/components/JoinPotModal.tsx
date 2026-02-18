import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { X } from "lucide-react";
import { useFeedback } from "./FeedbackProvider";

interface JoinPotModalProps {
    potId: Id<"pots">;
    totalValue: number;
    contribution: number;
    totalSlots: number;
    filledSlots: number;
    onClose: () => void;
    onViewRules: () => void;
}

export function JoinPotModal({ potId, contribution, totalValue, totalSlots, filledSlots, onClose, onViewRules }: JoinPotModalProps) {
    const joinPot = useMutation(api.pots.join);
    const feedback = useFeedback();
    const [selectedSlotCount, setSelectedSlotCount] = useState(1);
    const [agreed, setAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleJoin = async () => {
        setIsSubmitting(true);
        try {
            await joinPot({ potId, slotCount: selectedSlotCount });
            feedback.toast.success("Joined pot", "You're in. Check your dashboard.");
            onClose();
        } catch (error: any) {
            console.error(error);
            const msg = error.message.includes("unverified") ? "Cannot join: organizer is unverified." : "Failed to join pot.";
            feedback.toast.error("Join failed", msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableSlots = totalSlots - filledSlots;
    const totalCommitment = contribution * selectedSlotCount;
    const potentialWin = totalValue * selectedSlotCount;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[88vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-6 pb-4 border-b border-[var(--border-subtle)]/80">
                    <h3 className="text-xl font-bold">Join Pot</h3>
                    <button onClick={onClose} aria-label="Close join pot" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
                </div>

                <div className="overflow-y-auto px-6 py-4 space-y-4">
                    <div className="text-center space-y-3 py-2">
                        <label className="block text-sm text-[var(--text-muted)]">Select Number of Slots</label>

                        <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={() => setSelectedSlotCount(Math.max(1, selectedSlotCount - 1))}
                                aria-label="Decrease slots"
                                className="w-12 h-12 rounded-full bg-[var(--surface-deep)]/60 border border-[var(--border-subtle)] flex items-center justify-center hover:bg-[var(--surface-deep)]/80 text-[var(--text-primary)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={selectedSlotCount <= 1}
                            >
                                <span className="text-2xl mb-1">-</span>
                            </button>

                            <div className="flex flex-col items-center w-16">
                                <span className="text-4xl font-bold text-[var(--text-primary)]">{selectedSlotCount}</span>
                                <span className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider">Slots</span>
                            </div>

                            <button
                                onClick={() => setSelectedSlotCount(Math.min(availableSlots, selectedSlotCount + 1))}
                                aria-label="Increase slots"
                                className="w-12 h-12 rounded-full bg-[var(--surface-deep)]/60 border border-[var(--border-subtle)] flex items-center justify-center hover:bg-[var(--surface-deep)]/80 text-[var(--text-primary)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={selectedSlotCount >= availableSlots}
                            >
                                <span className="text-2xl mb-1">+</span>
                            </button>
                        </div>

                        <div className="text-xs text-[var(--text-muted)] bg-[var(--surface-deep)]/60 inline-block px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                            Available: <span className="text-[var(--text-primary)] font-bold">{availableSlots}</span> / {totalSlots}
                        </div>
                    </div>

                    <div className="bg-[var(--surface-deep)]/60 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--text-muted)]">Per-cycle pay</span>
                            <span className="font-bold text-[var(--text-primary)]">₹{totalCommitment.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--text-muted)]">Total Win Pool</span>
                            <span className="font-bold text-[var(--accent-vivid)]">₹{potentialWin.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <input
                            type="checkbox"
                            id="terms"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="w-5 h-5 rounded border-[var(--border-subtle)] bg-[var(--surface-deep)] text-[var(--accent-vivid)] focus:ring-[var(--accent-vivid)] shrink-0"
                        />
                        <label htmlFor="terms" className="text-sm text-[var(--text-muted)] select-none leading-tight">
                            I agree to the <button onClick={(e) => { e.preventDefault(); onViewRules(); }} className="text-[var(--text-primary)] font-bold underline hover:text-[var(--accent-vivid)] transition-colors">Rules</button> of this Pot.
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-[var(--border-subtle)]/80 bg-[var(--surface-card)] p-4">
                    <button onClick={onClose} className="flex-1 bg-[var(--surface-deep)] py-3 rounded-xl font-bold hover:bg-[var(--surface-deep)] transition-colors text-[var(--text-primary)]">
                        Cancel
                    </button>
                    <button
                        onClick={handleJoin}
                        disabled={isSubmitting || !agreed}
                        className="flex-1 bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSubmitting ? "Joining..." : "Agree & Join"}
                    </button>
                </div>
            </div>
        </div>
    );
}
