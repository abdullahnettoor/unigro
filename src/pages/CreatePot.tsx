import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Coins, Clock, Calendar, Percent, FileText, Landmark } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

export function CreatePot() {
    const createPot = useMutation(api.pots.create);
    const updatePot = useMutation(api.pots.updatePot);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editPotId = searchParams.get("edit") as Id<"pots">;

    // Fetch pot data if in edit mode
    const existingPot = useQuery(api.pots.get, editPotId ? { potId: editPotId } : "skip");

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        bankDetails: "",
        totalValue: 100000,
        contribution: 10000,
        duration: 10,
        frequency: "monthly" as "monthly" | "weekly" | "biweekly" | "quarterly" | "occasional",
        commission: 0,
        gracePeriodDays: 3,
        drawStrategy: "RANDOM" as "RANDOM" | "MANUAL",
        startDate: new Date().toISOString().split('T')[0],
    });

    // Populate form when editing
    useEffect(() => {
        if (existingPot) {
            setFormData({
                title: existingPot.title,
                description: existingPot.description || "",
                bankDetails: existingPot.bankDetails || "",
                totalValue: existingPot.config.totalValue,
                contribution: existingPot.config.contribution,
                duration: existingPot.config.duration,
                frequency: existingPot.config.frequency as any,
                commission: existingPot.config.commission || 0,
                gracePeriodDays: existingPot.config.gracePeriodDays || 0,
                drawStrategy: existingPot.drawStrategy as any,
                startDate: existingPot.startDate ? new Date(existingPot.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            });
        }
    }, [existingPot]);

    // Auto-calculate contribution based on total / duration
    const handleTotalChange = (val: number) => {
        setFormData(prev => ({
            ...prev,
            totalValue: val,
            contribution: Math.round(val / prev.duration)
        }));
    };

    const handleDurationChange = (val: number) => {
        setFormData(prev => ({
            ...prev,
            duration: val,
            contribution: Math.round(prev.totalValue / val)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let potId;
            if (editPotId) {
                await updatePot({
                    potId: editPotId,
                    ...formData,
                    commission: Number(formData.commission),
                    gracePeriodDays: Number(formData.gracePeriodDays),
                    startDate: new Date(formData.startDate).getTime(),
                });
                potId = editPotId;
            } else {
                potId = await createPot({
                    ...formData,
                    commission: Number(formData.commission), // Ensure number
                    gracePeriodDays: Number(formData.gracePeriodDays),
                    startDate: new Date(formData.startDate).getTime(),
                });
            }
            navigate(`/pot/${potId}`);
        } catch (error) {
            console.error("Failed to save pot:", error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 pb-20">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
            >
                <ChevronLeft size={20} /> Back
            </button>

            <h1 className="text-4xl font-display font-bold mb-2">Create New Pot</h1>
            <p className="text-gray-400 mb-8">Set up the financial rules for your community.</p>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Section 1: Basic Details */}
                <div className="bg-[#232931]/50 border border-white/5 p-6 rounded-2xl space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText className="text-[#C1FF72]" size={20} /> Basic Details
                    </h3>

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

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                            <Calendar size={16} /> Start Date
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#C1FF72] transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Description / Rules (Optional)</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Welcome message, rules about delays, etc."
                            rows={3}
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#C1FF72] transition-colors resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                            <Landmark size={16} /> Bank Details / UPI (Optional)
                        </label>
                        <textarea
                            value={formData.bankDetails}
                            onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
                            placeholder="e.g. UPI: name@okhdfcbank, Account: 1234567890"
                            rows={2}
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#C1FF72] transition-colors resize-none font-mono text-sm"
                        />
                    </div>
                </div>

                {/* Section 2: Financial Config */}
                <div className="bg-[#232931]/50 border border-white/5 p-6 rounded-2xl space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Coins className="text-[#C1FF72]" size={20} /> Financial Configuration
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                <Clock size={16} /> Frequency
                            </label>
                            <select
                                value={formData.frequency}
                                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#C1FF72]"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Bi-Weekly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="occasional">Occasional (On Demand)</option>
                            </select>
                        </div>

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

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                <Calendar size={16} /> {formData.frequency === 'occasional' ? 'Cycles' : 'Duration (Cycles)'}
                            </label>
                            {formData.frequency === 'occasional' ? (
                                <div className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-gray-400 italic">
                                    Determined by number of members (1:1)
                                </div>
                            ) : (
                                <input
                                    type="number"
                                    required
                                    min={2}
                                    max={60}
                                    value={formData.duration}
                                    onChange={(e) => handleDurationChange(Number(e.target.value))}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-[#C1FF72]"
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                <Percent size={16} /> Foreman Commission (%)
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={50}
                                value={formData.commission}
                                onChange={(e) => setFormData({ ...formData, commission: Number(e.target.value) })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-[#C1FF72]"
                            />
                        </div>
                    </div>

                    {/* Calculated Contribution */}
                    <div className="bg-[#C1FF72]/10 border border-[#C1FF72]/20 p-4 rounded-xl flex justify-between items-center">
                        <div>
                            <span className="text-sm text-[#C1FF72] uppercase font-bold text-xs tracking-wider">Per Member Contribution</span>
                            <div className="text-2xl font-mono font-bold text-white">₹{formData.contribution.toLocaleString()}</div>
                        </div>
                        <div className="text-right text-xs text-gray-400">
                            per {formData.frequency}<br />for {formData.frequency === 'occasional' ? 'all members' : `${formData.duration} cycles`}
                        </div>
                    </div>
                </div>

                {/* Section 3: Operational Settings */}
                <div className="bg-[#232931]/50 border border-white/5 p-6 rounded-2xl space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Clock className="text-[#C1FF72]" size={20} /> Operational Settings
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Draw Strategy</label>
                            <select
                                value={formData.drawStrategy}
                                onChange={(e) => setFormData({ ...formData, drawStrategy: e.target.value as any })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#C1FF72]"
                            >
                                <option value="RANDOM">Random (Lucky Draw)</option>
                                <option value="MANUAL">Manual Select (Foreman Decides)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                {formData.drawStrategy === "RANDOM" && "System randomly picks a winner from eligible members."}
                                {formData.drawStrategy === "MANUAL" && "Foreman manually selects the winner (e.g., for bidding or need-based)."}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Payment Grace Period (Days)</label>
                            <input
                                type="number"
                                min={0}
                                max={30}
                                value={formData.gracePeriodDays}
                                onChange={(e) => setFormData({ ...formData, gracePeriodDays: Number(e.target.value) })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-[#C1FF72]"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Days between Payment Due Date and the Draw Date.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#C1FF72] text-[#1B3022] font-bold px-8 py-3 rounded-full hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full md:w-auto justify-center"
                    >
                        {isSubmitting ? "Creating..." : "Create Pot"}
                    </button>
                </div>
            </form>
        </div>
    );
}
