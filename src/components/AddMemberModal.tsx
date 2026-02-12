import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { X, UserPlus, Phone, Layers } from "lucide-react";

interface AddMemberModalProps {
    potId: Id<"pots">;
    openSlots: { slotNumber: number; _id?: string }[];
    onClose: () => void;
}

export function AddMemberModal({ potId, openSlots, onClose }: AddMemberModalProps) {
    const assignSlot = useMutation(api.pots.assignSlot);
    const currentUser = useQuery(api.users.current); // Fetch current user

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

        try {
            await assignSlot({
                potId,
                slotNumber: Number(selectedSlotNum),
                name,
                phone
            });
            onClose();
        } catch (err: any) {
            console.error(err);
            setError("Failed to add member. Please try again.");
            setIsSubmitting(false);
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

                <h3 className="text-2xl font-display font-bold mb-1">Assign Slot</h3>
                <div className="mb-6 flex justify-between items-center">
                    <p className="text-gray-400 text-sm">Assign a participant to a specific slot.</p>
                    {currentUser && (
                        <button
                            type="button"
                            onClick={() => {
                                setName(currentUser.name || "");
                                setPhone(currentUser.phone || "");
                            }}
                            className="text-xs text-[#C1FF72] hover:underline font-bold"
                        >
                            Assign to Me
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                                        Slot #{s.slotNumber}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#C1FF72]"
                                placeholder="e.g. Sarah Jones"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3.5 text-gray-500" size={16} />
                            <input
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 pl-10 text-white font-mono focus:outline-none focus:border-[#C1FF72]"
                                placeholder="+1234567890"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Required for account syncing.</p>
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#C1FF72] text-[#1B3022] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
                    >
                        {isSubmitting ? "Assigning..." : <><UserPlus size={18} /> Assign Slot</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
