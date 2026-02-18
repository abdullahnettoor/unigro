import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { X, UserPlus, Layers, PieChart } from "lucide-react";
import { useFeedback } from "./FeedbackProvider";

interface SplitSlotModalProps {
    potId: Id<"pots">;
    openSlots: { slotNumber: number; _id?: string; isReserved?: boolean; remainingPercentage?: number }[];
    onClose: () => void;
}

export function SplitSlotModal({ potId, openSlots, onClose }: SplitSlotModalProps) {
    const assignSplitSlot = useMutation(api.pots.assignSplitSlot);
    const currentUser = useQuery(api.users.current);
    const feedback = useFeedback();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [percentage, setPercentage] = useState(50);
    const [selectedSlotNum, setSelectedSlotNum] = useState<number | "">(openSlots[0]?.slotNumber || "");

    // Derived state
    const selectedSlot = openSlots.find(s => s.slotNumber === selectedSlotNum);
    const maxShare = selectedSlot?.remainingPercentage ?? 100;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        if (!selectedSlotNum) {
            setError("Please select a slot.");
            setIsSubmitting(false);
            return;
        }

        try {
            await assignSplitSlot({
                potId,
                slotNumber: Number(selectedSlotNum),
                name,
                phone,
                email: email || undefined,
                sharePercentage: Number(percentage)
            });
            feedback.toast.success("Split assigned", "Member share added.");
            onClose();
        } catch (err: any) {
            console.error(err);
            const msg = err.message.includes("Verified") ? "You must be verified to invite members." :
                err.message.includes("remaining") ? err.message : "Failed to assign split slot.";
            feedback.toast.error("Failed to assign split slot", msg);
            setIsSubmitting(false); // Only reset if failed
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center p-3 sm:items-center sm:p-4 z-50">
            <div className="bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[88vh] flex flex-col overflow-hidden relative animate-in fade-in zoom-in duration-200">
                <div className="p-6 pb-4 border-b border-[var(--border-subtle)]/80">
                    <button
                        onClick={onClose}
                        aria-label="Close split slot"
                        className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                        <X size={20} />
                    </button>

                    <h3 className="text-2xl font-display font-bold mb-1 flex items-center gap-2">
                        <PieChart className="text-[var(--accent-vivid)]" /> Split slot
                    </h3>
                    <div className="flex justify-between items-center">
                        <p className="text-[var(--text-muted)] text-sm">Assign a partial share of a slot.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Slot Selection */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Slot Number</label>
                        <div className="relative">
                            <Layers className="absolute left-3 top-3.5 text-[var(--text-muted)]" size={16} />
                            <select
                                required
                                value={selectedSlotNum}
                                onChange={(e) => setSelectedSlotNum(Number(e.target.value))}
                                className="w-full bg-[var(--surface-deep)]/60 border border-[var(--border-subtle)] rounded-lg p-3 pl-10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-vivid)] appearance-none"
                            >
                                {openSlots.map(s => (
                                    <option key={s._id} value={s.slotNumber} className="bg-[var(--surface-elevated)]">
                                        Slot #{s.slotNumber} {s.isReserved ? "(Partial)" : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Share Percentage */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Share Percentage (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                required
                                min="1"
                                max={maxShare}
                                value={percentage}
                                onChange={(e) => setPercentage(Number(e.target.value))}
                                className="w-full bg-[var(--surface-deep)]/60 border border-[var(--border-subtle)] rounded-lg p-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-vivid)]"
                            />
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            Available: {maxShare}% {maxShare < 100 && "(Partially Filled)"}
                        </p>
                    </div>

                    {/* User Details */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[var(--surface-deep)]/60 border border-[var(--border-subtle)] rounded-lg p-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-vivid)]"
                                placeholder="e.g. Sarah Jones"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Phone</label>
                            <input
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-[var(--surface-deep)]/60 border border-[var(--border-subtle)] rounded-lg p-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-vivid)]"
                                placeholder="+1234567890"
                            />
                        </div>
                    </div>

                    {currentUser && (
                        <button
                            type="button"
                            onClick={() => {
                                setName(currentUser.name || "");
                                setPhone(currentUser.phone || "");
                                setEmail(currentUser.email || "");
                            }}
                            className="text-xs text-[var(--accent-vivid)] hover:underline font-bold w-full text-right"
                        >
                            Assign to Myself
                        </button>
                    )}

                    {error && <p className="text-[var(--danger)] text-sm">{error}</p>}

                    <div className="sticky bottom-0 bg-[var(--surface-elevated)] pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? "Assigning..." : <><UserPlus size={18} /> Assign share</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
