import React, { useState } from "react";
import { isValidPhoneNumber } from "react-phone-number-input";
import { useMutation, useQuery } from "convex/react";
import { Layers, UserPlus, X } from "lucide-react";

import { useFeedback } from "@/components/shared/FeedbackProvider";
import { Input } from "@/components/ui/Input";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import { ModalCloseButton, ModalFooter, ModalHeader, ModalShell } from "@/components/ui/ModalShell";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";



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
        <ModalShell zIndex={100}>
            <ModalHeader>
                <ModalCloseButton onClick={onClose}>
                    <X size={20} />
                </ModalCloseButton>
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
            </ModalHeader>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Slot Number</label>
                        <div className="relative">
                            <Layers className="pointer-events-none absolute left-3 top-3.5 z-10 text-[var(--text-muted)]" size={16} />
                            <Select
                                value={selectedSlotNum === "" ? "" : String(selectedSlotNum)}
                                onValueChange={(value) => setSelectedSlotNum(Number(value))}
                            >
                                <SelectTrigger className="bg-[var(--surface-deep)]/60 pl-10">
                                    <SelectValue placeholder="Select slot" />
                                </SelectTrigger>
                                <SelectContent>
                                    {openSlots.map((s) => (
                                        <SelectItem key={s._id} value={String(s.slotNumber)}>
                                            Slot #{s.slotNumber}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Name</label>
                        <div className="relative">
                            <Input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-[var(--surface-deep)]/60"
                                placeholder="e.g. Sarah Jones"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Phone Number</label>
                        <PhoneInputField
                            value={phone}
                            onChange={setPhone}
                            error={!!error && error.includes("phone")}
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">Required for account syncing. Preferably WhatsApp.</p>
                    </div>

                    {error && <p className="text-[var(--danger)] text-sm">{error}</p>}

                <ModalFooter>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
                    >
                        {isSubmitting ? "Assigning..." : <><UserPlus size={18} /> Assign slot</>}
                    </button>
                </ModalFooter>
            </form>
        </ModalShell>
    );
}
