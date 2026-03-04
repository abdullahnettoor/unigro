import React, { useState } from "react";
import { isValidPhoneNumber } from "react-phone-number-input";
import { useMutation, useQuery } from "convex/react";
import { Layers, PieChart, UserPlus, X } from "lucide-react";

import { useFeedback } from "@/components/shared/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ModalCloseButton,ModalFooter, ModalHeader, ModalShell } from "@/components/ui/ModalShell";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";



interface SplitSlotModalProps {
    potId: Id<"pots">;
    openSlots: { slotNumber: number; _id?: string; isReserved?: boolean; remainingPercentage?: number }[];
    onClose: () => void;
}

export function SplitSlotModal({ potId, openSlots, onClose }: SplitSlotModalProps) {
    const assignSplitSlot = useMutation(api.pots.assignSplitSlot);
    const currentUser = useQuery(api.users.current);
    const feedback = useFeedback();

    const initialSlot = openSlots.find(s => s.remainingPercentage !== undefined && s.remainingPercentage < 100) || openSlots[0];
    const initialPercentage = Math.min(50, initialSlot?.remainingPercentage ?? 100);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [percentage, setPercentage] = useState(initialPercentage);
    const [selectedSlotNum, setSelectedSlotNum] = useState<number | "">(initialSlot?.slotNumber || "");

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

        if (percentage > maxShare) {
            setError(`Cannot assign more than ${maxShare}% for this slot.`);
            setIsSubmitting(false);
            return;
        }

        if (!phone || !isValidPhoneNumber(phone)) {
            setError("Please enter a valid phone number with country code.");
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
        <ModalShell zIndex={100}>
            <ModalHeader>
                <ModalCloseButton onClick={onClose}>
                    <X size={20} />
                </ModalCloseButton>

                <h3 className="text-2xl font-display font-bold mb-1 flex items-center gap-2">
                    <PieChart className="text-[var(--accent-vivid)]" /> Split slot
                </h3>
                <div className="flex justify-between items-center">
                    <p className="text-[var(--text-muted)] text-sm">Assign a partial share of a slot.</p>
                </div>
            </ModalHeader>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Slot Selection */}
                <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Slot Number</label>
                    <div className="relative">
                        <Layers className="pointer-events-none absolute left-3 top-3.5 z-10 text-[var(--text-muted)]" size={16} />
                        <Select
                            value={selectedSlotNum === "" ? "" : String(selectedSlotNum)}
                            onValueChange={(value) => setSelectedSlotNum(Number(value))}
                        >
                            <SelectTrigger className="bg-[var(--surface-deep)]/60 !pl-11">
                                <SelectValue placeholder="Select slot" />
                            </SelectTrigger>
                            <SelectContent>
                                {openSlots.map((s) => (
                                    <SelectItem key={s._id} value={String(s.slotNumber)}>
                                        Slot #{s.slotNumber} {s.remainingPercentage !== undefined && s.remainingPercentage < 100 ? "(Partial)" : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Share Percentage */}
                <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Share Percentage (%)</label>
                    <div className="relative">
                        <Input
                            type="number"
                            required
                            min="1"
                            max={maxShare}
                            value={percentage}
                            onChange={(e) => setPercentage(Number(e.target.value))}
                            className={`bg-[var(--surface-deep)]/60 ${percentage > maxShare ? "border-[var(--danger)] focus:border-[var(--danger)]" : "border-[var(--border-subtle)]"}`}
                        />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                        Available: {maxShare}% {maxShare < 100 && "(Partially Filled)"}
                    </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <h4 className="text-sm font-bold">Assignee Details</h4>
                    {currentUser && (
                        <Button
                            variant="link"
                            size="sm"
                            type="button"
                            onClick={() => {
                                setName(currentUser.name || "");
                                setPhone(currentUser.phone || "");
                                setEmail(currentUser.email || "");
                            }}
                            className="text-xs h-auto p-0"
                        >
                            Assign to me
                        </Button>
                    )}
                </div>

                {/* User Details */}
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Name</label>
                        <Input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-[var(--surface-deep)]/60"
                            placeholder="e.g. Sarah Jones"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Phone</label>
                        <PhoneInputField
                            value={phone}
                            onChange={setPhone}
                            error={!!error && error.includes("phone")}
                        />
                    </div>
                </div>

                {error && <p className="text-[var(--danger)] text-sm">{error}</p>}

                <ModalFooter>
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        disabled={isSubmitting}
                        className="gap-2"
                    >
                        {isSubmitting ? "Assigning..." : <><UserPlus size={18} /> Assign share</>}
                    </Button>
                </ModalFooter>
            </form>
        </ModalShell>
    );
}
