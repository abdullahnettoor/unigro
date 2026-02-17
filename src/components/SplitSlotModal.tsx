import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { X, UserPlus, Layers, PieChart } from "lucide-react";

interface SplitSlotModalProps {
    potId: Id<"pots">;
    openSlots: { slotNumber: number; _id?: string; isReserved?: boolean; remainingPercentage?: number }[];
    onClose: () => void;
}

export function SplitSlotModal({ potId, openSlots, onClose }: SplitSlotModalProps) {
    const assignSplitSlot = useMutation(api.pots.assignSplitSlot);
    const currentUser = useQuery(api.users.current);

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
            onClose();
        } catch (err: any) {
            console.error(err);
            const msg = err.message.includes("Verified") ? "You must be a Verified User to invite members." :
                err.message.includes("remaining") ? err.message : "Failed to assign split slot.";
            alert(msg);
            setIsSubmitting(false); // Only reset if failed
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#232931] border border-white/10 rounded-2xl p-6 w-full max-w-md relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                <h3 className="text-2xl font-display font-bold mb-1 flex items-center gap-2">
                    <PieChart className="text-[#C1FF72]" /> Split Slot
                </h3>
                <div className="mb-6 flex justify-between items-center">
                    <p className="text-gray-400 text-sm">Assign a partial share of a slot.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Slot Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Slot Number</label>
                        <div className="relative">
                            <Layers className="absolute left-3 top-3.5 text-gray-500" size={16} />
                            <select
                                required
                                value={selectedSlotNum}
                                onChange={(e) => setSelectedSlotNum(Number(e.target.value))}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-[#C1FF72] appearance-none"
                            >
                                {openSlots.map(s => (
                                    <option key={s._id} value={s.slotNumber} className="bg-[#232931]">
                                        Slot #{s.slotNumber} {s.isReserved ? "(Partial)" : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Share Percentage */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Share Percentage (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                required
                                min="1"
                                max={maxShare}
                                value={percentage}
                                onChange={(e) => setPercentage(Number(e.target.value))}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#C1FF72]"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Available: {maxShare}% {maxShare < 100 && "(Partially Filled)"}
                        </p>
                    </div>

                    {/* User Details */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#C1FF72]"
                                placeholder="e.g. Sarah Jones"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone</label>
                            <input
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#C1FF72]"
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
                            className="text-xs text-[#C1FF72] hover:underline font-bold w-full text-right"
                        >
                            Assign to Myself
                        </button>
                    )}

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#C1FF72] text-[#1B3022] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
                    >
                        {isSubmitting ? "Assigning..." : <><UserPlus size={18} /> Assign Share</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
