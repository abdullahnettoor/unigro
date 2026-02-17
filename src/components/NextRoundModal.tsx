import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { X, ArrowRight } from "lucide-react";

interface NextRoundModalProps {
    potId: Id<"pots">;
    currentMonth: number;
    totalMonths: number;
    defaultNextDate: string; // YYYY-MM-DD
    isOccasional: boolean;
    onClose: () => void;
}

export function NextRoundModal({ potId, currentMonth, totalMonths, defaultNextDate, isOccasional, onClose }: NextRoundModalProps) {
    const advanceCycle = useMutation(api.pots.advanceCycle);
    const [nextDate, setNextDate] = useState(defaultNextDate);
    const [loading, setLoading] = useState(false);

    const isLastRound = currentMonth >= totalMonths;

    const handleAdvance = async () => {
        if (!nextDate && !isLastRound) return alert("Please select a date for the next draw.");

        setLoading(true);
        try {
            await advanceCycle({
                potId,
                nextDrawDate: new Date(nextDate).getTime(),
            });
            onClose();
        } catch (err: any) {
            alert("Failed to advance: " + err.message);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
            <div className="bg-[#1a1f26] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                        {isLastRound ? "Complete Pot" : "Start Next Round"}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                <div className="space-y-6">
                    <p className="text-gray-400 text-sm">
                        Winner for Cycle {currentMonth} has been selected.
                        {isLastRound
                            ? " This was the final round. Completing this pot will archive it."
                            : " Ready to start collecting for the next cycle?"
                        }
                    </p>

                    {!isLastRound && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                Next Draw Date {isOccasional && "(Required)"}
                            </label>
                            <input
                                type="date"
                                value={nextDate}
                                onChange={(e) => setNextDate(e.target.value)}
                                className="w-full bg-[#232931] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#C1FF72]"
                            />
                            {isOccasional && <p className="text-xs text-[#C1FF72] mt-1">Set the date for the next occasional draw.</p>}
                        </div>
                    )}

                    <button
                        onClick={handleAdvance}
                        disabled={loading}
                        className="w-full bg-[#C1FF72] text-[#1B3022] font-bold py-3 rounded-xl hover:opacity-90 flex justify-center items-center gap-2"
                    >
                        {loading ? "Processing..." : (
                            isLastRound ? "Finish Pot" : <>Begin Cycle {currentMonth + 1} <ArrowRight size={18} /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
