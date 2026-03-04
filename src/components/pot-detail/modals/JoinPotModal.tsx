import { useState } from "react";
import { isValidPhoneNumber } from "react-phone-number-input";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, User, X } from "lucide-react";

import { useFeedback } from "@/components/shared/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { Input } from "@/components/ui/Input";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import { ModalBody, ModalCloseButton, ModalFooter, ModalHeader, ModalShell } from "@/components/ui/ModalShell";
import { formatCurrency } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface JoinPotModalProps {
    potId: Id<"pots">;
    totalValue: number;
    contribution: number;
    totalSlots: number;
    filledSlots: number;
    onClose: () => void;
    onViewRules: () => void;
    currency?: string;
}

export function JoinPotModal({ potId, contribution, totalValue, totalSlots, filledSlots, onClose, onViewRules, currency }: JoinPotModalProps) {
    const currentUser = useQuery(api.users.current);
    const joinPot = useMutation(api.pots.join);
    const joinAsGhost = useMutation(api.pots.joinAsGhost);
    const feedback = useFeedback();

    const [selectedSlotCount, setSelectedSlotCount] = useState(1);
    const [agreed, setAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Guest Inputs
    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [authError, setAuthError] = useState<string | null>(null);

    const handleJoin = async () => {
        setIsSubmitting(true);
        setAuthError(null);

        try {
            if (currentUser) {
                await joinPot({ potId, slotCount: selectedSlotCount });
                feedback.toast.success("Joined pot", "You're in. Check your dashboard.");
                onClose();
            } else {
                // Ghost Join
                if (!guestName.trim()) {
                    feedback.toast.error("Missing Info", "Please provide your name.");
                    setIsSubmitting(false);
                    return;
                }

                if (!guestPhone || !isValidPhoneNumber(guestPhone)) {
                    feedback.toast.error("Invalid Phone", "Please enter a valid phone number with country code.");
                    setIsSubmitting(false);
                    return;
                }

                const result = await joinAsGhost({
                    potId,
                    name: guestName,
                    phone: guestPhone,
                    slotCount: selectedSlotCount
                });

                // Persist the membership in this browser session
                const existingGuests = JSON.parse(localStorage.getItem("unigro_ghost_memberships") || "[]");
                if (!existingGuests.includes(result.userId)) {
                    existingGuests.push(result.userId);
                    localStorage.setItem("unigro_ghost_memberships", JSON.stringify(existingGuests));
                }

                feedback.toast.success("Joined as Guest!", "Your slots are reserved. Sign up to secure your account.");
                onClose();
            }
        } catch (error: unknown) {
            console.error(error);
            const message = error instanceof Error ? error.message : "";

            if (message.includes("ALREADY_REGISTERED")) {
                setAuthError("This phone number is already registered. Please sign in to join.");
            } else {
                const msg = message.includes("unverified") ? "Cannot join: organizer is unverified." : "Failed to join pot.";
                feedback.toast.error("Join failed", msg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableSlots = totalSlots - filledSlots;
    const totalCommitment = contribution * selectedSlotCount;
    const potentialWin = totalValue * selectedSlotCount;

    return (
        <ModalShell zIndex={100}>
            <ModalHeader className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Join Pot</h3>
                <ModalCloseButton onClick={onClose}>
                    <X size={20} />
                </ModalCloseButton>
            </ModalHeader>

            <ModalBody className="px-6 py-4 space-y-6">
                {/* Guest Form if unauthenticated */}
                {!currentUser && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="bg-[var(--accent-vivid)]/5 border border-[var(--accent-vivid)]/20 p-4 rounded-xl">
                            <p className="text-xs font-bold text-[var(--accent-vivid)] uppercase tracking-wider mb-2">Guest Participant</p>
                            <p className="text-sm text-[var(--text-muted)]">Don't have an account? Join as a guest now and secure your slots later.</p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                                    <Input
                                        type="text"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="bg-[var(--surface-deep)]/60 pl-11 pr-4"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5 ml-1">Mobile Number</label>
                                <PhoneInputField
                                    value={guestPhone}
                                    onChange={setGuestPhone}
                                    error={!!authError}
                                />
                            </div>

                            {authError && (
                                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3 text-red-500">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <p className="text-xs font-medium">{authError}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="text-center space-y-3 pt-2">
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">Select Number of Slots</label>

                    <div className="flex items-center justify-center gap-6">
                        <Button
                            variant="secondary"
                            onClick={() => setSelectedSlotCount(Math.max(1, selectedSlotCount - 1))}
                            aria-label="Decrease slots"
                            className="w-12 h-12 rounded-full p-0 flex items-center justify-center text-[var(--text-primary)] border-[var(--border-subtle)] bg-[var(--surface-deep)]/60 hover:bg-[var(--surface-deep)]/80"
                            disabled={selectedSlotCount <= 1}
                        >
                            <span className="text-2xl font-light mb-1">-</span>
                        </Button>

                        <div className="flex flex-col items-center w-16">
                            <span className="text-4xl font-display font-black text-[var(--text-primary)]">{selectedSlotCount}</span>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase font-extrabold tracking-widest">Slots</span>
                        </div>

                        <Button
                            variant="secondary"
                            onClick={() => setSelectedSlotCount(Math.min(availableSlots, selectedSlotCount + 1))}
                            aria-label="Increase slots"
                            className="w-12 h-12 rounded-full p-0 flex items-center justify-center text-[var(--text-primary)] border-[var(--border-subtle)] bg-[var(--surface-deep)]/60 hover:bg-[var(--surface-deep)]/80"
                            disabled={selectedSlotCount >= availableSlots}
                        >
                            <span className="text-2xl font-light mb-1">+</span>
                        </Button>
                    </div>

                    <div className="text-[10px] text-[var(--text-muted)] bg-[var(--surface-deep)]/60 inline-block px-3 py-1 rounded-full border border-[var(--border-subtle)] uppercase font-bold tracking-wider">
                        Available: <span className="text-[var(--text-primary)] font-black">{availableSlots}</span> / {totalSlots}
                    </div>
                </div>

                <Surface tier={1} className="p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Per-cycle pay</span>
                        <span className="text-lg font-mono font-bold text-[var(--text-primary)]">{formatCurrency(totalCommitment, currency)}</span>
                    </div>
                    <div className="h-px bg-[var(--border-subtle)]/20" />
                    <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Win Pool</span>
                        <span className="text-lg font-mono font-bold text-[var(--accent-secondary)]">{formatCurrency(potentialWin, currency)}</span>
                    </div>
                </Surface>

                <div className="flex items-center gap-3 pt-2">
                    <input
                        type="checkbox"
                        id="terms"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="h-5 w-5 rounded-lg border-[var(--border-subtle)] bg-[var(--surface-deep)] text-[var(--accent-vivid)] focus:ring-[var(--accent-vivid)] shrink-0 transition-all cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-xs text-[var(--text-muted)] select-none leading-relaxed cursor-pointer font-medium">
                        I agree to the <button onClick={(e) => { e.preventDefault(); onViewRules(); }} className="text-[var(--accent-vivid)] font-bold underline decoration-[var(--accent-vivid)]/30 underline-offset-4 hover:decoration-[var(--accent-vivid)] transition-all">Rules & Regulations</button> of this pot.
                    </label>
                </div>
            </ModalBody>

            <ModalFooter className="grid grid-cols-2 gap-3 border-t border-[var(--border-subtle)]/80 p-6 pt-4">
                <Button variant="secondary" onClick={onClose} size="lg" className="font-bold">
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleJoin}
                    disabled={isSubmitting || !agreed}
                    className="font-bold shadow-lg shadow-[var(--accent-vivid)]/20"
                >
                    {isSubmitting ? "Processing..." : (currentUser ? "Agree & Join" : "Join as Guest")}
                </Button>
            </ModalFooter>
        </ModalShell>
    );
}
