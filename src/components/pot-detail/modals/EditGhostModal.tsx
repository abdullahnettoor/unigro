import React, { useState } from "react";
import { isValidPhoneNumber } from "react-phone-number-input";
import { useMutation } from "convex/react";
import { UserPen, X } from "lucide-react";

import { useFeedback } from "@/components/shared/FeedbackProvider";
import { Input } from "@/components/ui/Input";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import { ModalFooter, ModalHeader, ModalShell, ModalCloseButton } from "@/components/ui/ModalShell";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";



interface EditGhostModalProps {
    ghostUser: {
        _id: Id<"users">;
        name: string;
        phone: string;
    };
    onClose: () => void;
}

export function EditGhostModal({ ghostUser, onClose }: EditGhostModalProps) {
    const editGhost = useMutation(api.users.editGhost);
    const feedback = useFeedback();

    const [name, setName] = useState(ghostUser.name || "");
    const [phone, setPhone] = useState(ghostUser.phone || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        if (!name.trim()) {
            setError("Please enter a name.");
            setIsSubmitting(false);
            return;
        }

        if (!phone || !isValidPhoneNumber(phone)) {
            setError("Please enter a valid phone number with country code.");
            setIsSubmitting(false);
            return;
        }

        try {
            await editGhost({
                userId: ghostUser._id,
                name,
                phone
            });
            feedback.toast.success("Profile updated", "Member details saved successfully.");
            onClose();
        } catch (err: any) {
            console.error(err);
            feedback.toast.error("Failed to update profile", err.message || "An unknown error occurred.");
            setIsSubmitting(false);
        }
    };

    return (
        <ModalShell zIndex={100}>
            <ModalHeader>
                <ModalCloseButton onClick={onClose}>
                    <X size={20} />
                </ModalCloseButton>
                <h3 className="text-2xl font-display font-bold mb-1">Edit unverified member</h3>
                <p className="text-[var(--text-muted)] text-sm leading-snug">
                    Update contact info for users who haven't claimed their account yet.
                </p>
            </ModalHeader>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
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
                    </div>

                    {error && <p className="text-[var(--danger)] text-sm">{error}</p>}

                <ModalFooter>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
                    >
                        {isSubmitting ? "Saving..." : <><UserPen size={18} /> Save changes</>}
                    </button>
                </ModalFooter>
            </form>
        </ModalShell>
    );
}
