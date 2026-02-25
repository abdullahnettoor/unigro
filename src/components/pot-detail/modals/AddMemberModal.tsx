import React, { useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { useMutation, useQuery } from "convex/react";
import { Layers,UserPlus, X } from "lucide-react";

import { useFeedback } from "@/components/shared/FeedbackProvider";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

import "react-phone-number-input/style.css";

interface AddMemberModalProps {
    potId: Id<"pots">;
    openSlots: { slotNumber: number; _id?: string }[];
    onClose: () => void;
}

export function AddMemberModal({ potId, openSlots, onClose }: AddMemberModalProps) {
    const assignSlot = useMutation(api.pots.assignSlot);
    const currentUser = useQuery(api.users.current); // Fetch current user
    const feedback = useFeedback();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [selectedSlotNum, setSelectedSlotNum] = useState<number | "">(openSlots[0]?.slotNumber || "");
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

        if (!phone || !isValidPhoneNumber(phone)) {
            setError("Please enter a valid phone number with country code.");
            setIsSubmitting(false);
            return;
        }

        try {
            await assignSlot({
                potId,
                slotNumber: Number(selectedSlotNum),
                name,
                phone
            });
            feedback.toast.success("Member added", "Slot assigned successfully.");
            onClose();
        } catch (err: any) {
            console.error(err);
            const msg = err.message.includes("Verified") ? "You must be verified to invite members." : "Failed to add member.";
            feedback.toast.error("Failed to add member", msg);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center p-3 sm:items-center sm:p-4 z-50">
            <div className="bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[88vh] flex flex-col overflow-hidden relative animate-in fade-in zoom-in duration-200">
                <div className="p-6 pb-4 border-b border-[var(--border-subtle)]/80">
                    <button
                        onClick={onClose}
                        aria-label="Close assign slot"
                        className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                        <X size={20} />
                    </button>
                    <h3 className="text-2xl font-display font-bold mb-1">Assign slot</h3>
                    <div className="flex justify-between items-center">
                        <p className="text-[var(--text-muted)] text-sm">Assign a participant to a specific slot.</p>
                        {currentUser && (
                            <button
                                type="button"
                                onClick={() => {
                                    setName(currentUser.name || "");
                                    setPhone(currentUser.phone || "");
                                }}
                                className="text-xs text-[var(--accent-vivid)] hover:underline font-bold"
                            >
                                Assign to me
                            </button>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
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
                                        Slot #{s.slotNumber}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[var(--surface-deep)]/60 border border-[var(--border-subtle)] rounded-lg p-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-vivid)]"
                                placeholder="e.g. Sarah Jones"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Phone Number</label>
                        <PhoneInput
                            international
                            defaultCountry="IN"
                            value={phone}
                            onChange={(v) => setPhone(v || "")}
                            className="w-full bg-[var(--surface-deep)]/60 border border-[var(--border-subtle)] rounded-lg p-3 text-[var(--text-primary)] font-mono focus-within:border-[var(--accent-vivid)] [&>input]:bg-transparent [&>input]:outline-none"
                            placeholder="+91 1234567890"
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">Required for account syncing. Preferably WhatsApp.</p>
                    </div>

                    {error && <p className="text-[var(--danger)] text-sm">{error}</p>}

                    <div className="sticky bottom-0 bg-[var(--surface-elevated)] pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? "Assigning..." : <><UserPlus size={18} /> Assign slot</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
