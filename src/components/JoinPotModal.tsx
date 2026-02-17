import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { X } from "lucide-react";

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
    const [selectedSlotCount, setSelectedSlotCount] = useState(1);
    const [agreed, setAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleJoin = async () => {
        setIsSubmitting(true);
        try {
            await joinPot({ potId, slotCount: selectedSlotCount });
            onClose();
        } catch (error: any) {
            console.error(error);
            const msg = error.message.includes("unverified") ? "Cannot join: Pot Foreman is unverified." : "Failed to join pot.";
            alert(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableSlots = totalSlots - filledSlots;
    const totalCommitment = contribution * selectedSlotCount;
    const potentialWin = totalValue * selectedSlotCount;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
            <div className="bg-[#1a1f26] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Join Pot</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                <div className="mb-6 space-y-4">
                    <div className="text-center space-y-3 py-2">
                        <label className="block text-sm text-gray-400">Select Number of Slots</label>

                        <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={() => setSelectedSlotCount(Math.max(1, selectedSlotCount - 1))}
                                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={selectedSlotCount <= 1}
                            >
                                <span className="text-2xl mb-1">-</span>
                            </button>

                            <div className="flex flex-col items-center w-16">
                                <span className="text-4xl font-bold text-white">{selectedSlotCount}</span>
                                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Slots</span>
                            </div>

                            <button
                                onClick={() => setSelectedSlotCount(Math.min(availableSlots, selectedSlotCount + 1))}
                                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={selectedSlotCount >= availableSlots}
                            >
                                <span className="text-2xl mb-1">+</span>
                            </button>
                        </div>

                        <div className="text-xs text-gray-500 bg-white/5 inline-block px-3 py-1 rounded-full border border-white/5">
                            Available: <span className="text-white font-bold">{availableSlots}</span> / {totalSlots}
                        </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Monthly Pay</span>
                            <span className="font-bold text-white">₹{totalCommitment.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Total Win Pool</span>
                            <span className="font-bold text-[#C1FF72]">₹{potentialWin.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <input
                            type="checkbox"
                            id="terms"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-[#C1FF72] focus:ring-[#C1FF72] shrink-0"
                        />
                        <label htmlFor="terms" className="text-sm text-gray-400 select-none leading-tight">
                            I agree to the <button onClick={(e) => { e.preventDefault(); onViewRules(); }} className="text-white font-bold underline hover:text-[#C1FF72] transition-colors">Rules</button> of this Pot.
                        </label>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 bg-gray-800 py-3 rounded-xl font-bold hover:bg-gray-700 transition-colors text-white">
                        Cancel
                    </button>
                    <button
                        onClick={handleJoin}
                        disabled={isSubmitting || !agreed}
                        className="flex-1 bg-[#C1FF72] text-[#1B3022] font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSubmitting ? "Joining..." : "Agree & Join"}
                    </button>
                </div>
            </div>
        </div>
    );
}
