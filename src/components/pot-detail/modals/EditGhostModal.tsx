import React, { useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { useMutation } from "convex/react";
import { UserPen, X } from "lucide-react";

import { useFeedback } from "@/components/shared/FeedbackProvider";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

import "react-phone-number-input/style.css";

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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center p-3 sm:items-center sm:p-4 z-50">
            <div className="bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[88vh] flex flex-col overflow-hidden relative animate-in fade-in zoom-in duration-200">
                <div className="p-6 pb-4 border-b border-[var(--border-subtle)]/80">
                    <button
                        onClick={onClose}
                        aria-label="Close edit profile"
                        className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                        <X size={20} />
                    </button>
                    <h3 className="text-2xl font-display font-bold mb-1">Edit unverified member</h3>
                    <p className="text-[var(--text-muted)] text-sm leading-snug">
                        Update contact info for users who haven't claimed their account yet.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
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
                    </div>

                    {error && <p className="text-[var(--danger)] text-sm">{error}</p>}

                    <div className="sticky bottom-0 bg-[var(--surface-elevated)] pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? "Saving..." : <><UserPen size={18} /> Save changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
