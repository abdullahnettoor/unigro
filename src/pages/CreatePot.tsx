import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Coins, Clock } from "lucide-react";

export function CreatePot() {
    const createPot = useMutation(api.pots.create);
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        totalValue: 100000,
        contribution: 10000,
        duration: 10,
        frequency: "monthly"
    });

    // Auto-calculate contribution based on total / duration
    const handleTotalChange = (val: number) => {
        setFormData(prev => ({
            ...prev,
            totalValue: val,
            contribution: val / prev.duration
        }));
    };

    const handleDurationChange = (val: number) => {
        setFormData(prev => ({
            ...prev,
            duration: val,
            contribution: prev.totalValue / val
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const potId = await createPot(formData);
            navigate(`/pot/${potId}`);
        } catch (error) {
            console.error("Failed to create pot:", error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
            >
                <ChevronLeft size={20} /> Back
            </button>

            <h1 className="text-4xl font-display font-bold mb-2">Create New Pot</h1>
            <p className="text-gray-400 mb-8">Set up the financial rules for your community.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-[#232931]/50 border border-white/5 p-6 rounded-2xl space-y-6">

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Pot Name</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Office Colleagues 2024"
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#C1FF72] transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Total Value */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                <Coins size={16} /> Total Pool Value (₹)
                            </label>
                            <input
                                type="number"
                                required
                                min={1000}
                                value={formData.totalValue}
                                onChange={(e) => handleTotalChange(Number(e.target.value))}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-[#C1FF72]"
                            />
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                <Clock size={16} /> Duration (Months)
                            </label>
                            <input
                                type="number"
                                required
                                min={2}
                                max={60}
                                value={formData.duration}
                                onChange={(e) => handleDurationChange(Number(e.target.value))}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-[#C1FF72]"
                            />
                        </div>
                    </div>

                    {/* Calculated Contribution */}
                    <div className="bg-[#C1FF72]/10 border border-[#C1FF72]/20 p-4 rounded-xl flex justify-between items-center">
                        <div>
                            <span className="text-sm text-[#C1FF72]">Monthly Contribution</span>
                            <div className="text-2xl font-mono font-bold text-white">₹{formData.contribution.toLocaleString()}</div>
                        </div>
                        <div className="text-right text-xs text-gray-400">
                            per member<br />for {formData.duration} months
                        </div>
                    </div>

                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#C1FF72] text-[#1B3022] font-bold px-8 py-3 rounded-full hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? "Creating..." : "Create & Add Members"}
                    </button>
                </div>
            </form>
        </div>
    );
}
