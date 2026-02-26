import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, Save } from "lucide-react";

import { cn } from "@/components/ui/Button";
import { PotFinancialsStep } from "@/pages/create-pot/PotFinancialsStep";
import { PotRulesStep } from "@/pages/create-pot/PotRulesStep";
import { PotSlotsStep } from "@/pages/create-pot/PotSlotsStep";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type Frequency = "monthly" | "weekly" | "biweekly" | "quarterly" | "occasional";
type DrawStrategy = "RANDOM" | "MANUAL";

const STEPS = [
    { id: 1, label: "Financials" },
    { id: 2, label: "Slots & Fees" },
    { id: 3, label: "Rules" },
] as const;

export function CreatePot() {
    const createPot = useMutation(api.pots.create);
    const updatePot = useMutation(api.pots.updatePot);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editPotId = searchParams.get("edit") as Id<"pots"> | null;
    const existingPot = useQuery(api.pots.get, editPotId ? { potId: editPotId } : "skip");

    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        bankDetails: "",
        totalValue: 100000,
        currency: "INR",
        contribution: 10000,
        duration: 10,
        frequency: "monthly" as Frequency,
        commission: 0,
        gracePeriodDays: 5,
        drawStrategy: "RANDOM" as DrawStrategy,
        startDate: new Date().toISOString().split("T")[0],
    });

    useEffect(() => {
        if (!existingPot) return;
        const nextFormData = {
            title: existingPot.title,
            description: existingPot.description || "",
            bankDetails: existingPot.bankDetails || "",
            totalValue: existingPot.config.totalValue,
            currency: existingPot.config.currency || "INR",
            contribution: existingPot.config.contribution,
            duration: existingPot.config.duration,
            frequency: existingPot.config.frequency as Frequency,
            commission: existingPot.config.commission || 0,
            gracePeriodDays: existingPot.config.gracePeriodDays || 0,
            drawStrategy: existingPot.drawStrategy as DrawStrategy,
            startDate: existingPot.startDate
                ? new Date(existingPot.startDate).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
        };
        // Use requestAnimationFrame to avoid update during render
        const frame = window.requestAnimationFrame(() => setFormData(nextFormData));
        return () => window.cancelAnimationFrame(frame);
    }, [existingPot]);

    const isLocked = !!existingPot && (existingPot as any).slots?.some((slot: any) => {
        if (slot.status !== "OPEN" && !slot.isGhost) return true;
        if (slot.isSplit && slot.splitOwners?.some((owner: any) => !owner.isGhost)) return true;
        return false;
    });

    const completionPercent = ((step + 1) / STEPS.length) * 100;

    const validateStep = (stepIndex: number) => {
        if (stepIndex === 0) {
            if (!formData.title.trim() || formData.title.trim().length < 3) return "Pot name must be at least 3 characters.";
            if (!formData.startDate) return "Start date is required.";
            if (formData.totalValue < 1000) return "Total pool value must be at least 1,000.";
        }
        if (stepIndex === 1) {
            if (formData.duration < 2) return "Total slots must be at least 2.";
            if (formData.duration > 50) return "Total slots cannot exceed 50.";
            if (formData.contribution < 1) return "Contribution must be greater than 0.";
            if (formData.commission < 0 || formData.commission > 50) return "Organizer commission must be between 0% and 50%.";
        }
        if (stepIndex === 2) {
            if (formData.gracePeriodDays < 0 || formData.gracePeriodDays > 30) {
                return "Grace period must be between 0 and 30 days.";
            }
        }
        return "";
    };

    const handleNext = () => {
        const message = validateStep(step);
        if (message) {
            setError(message);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        setError("");
        setStep((prev) => Math.min(STEPS.length - 1, prev + 1));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleBack = () => {
        setError("");
        setStep((prev) => Math.max(0, prev - 1));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (step !== STEPS.length - 1) return;

        const message = validateStep(step);
        if (message) {
            setError(message);
            return;
        }

        setIsSubmitting(true);
        setError("");
        try {
            const payload = {
                ...formData,
                totalSlots: formData.duration,
                commission: Number(formData.commission),
                gracePeriodDays: Number(formData.gracePeriodDays),
                startDate: new Date(formData.startDate).getTime(),
                currency: formData.currency,
            };
            let potId = editPotId;
            if (editPotId) {
                await updatePot({ potId: editPotId, ...payload });
            } else {
                potId = await createPot(payload);
            }
            navigate(`/pot/${potId}`, { replace: true });
        } catch (submitError) {
            console.error("Failed to save pot:", submitError);
            setError("Failed to save pot. Please try again.");
            setIsSubmitting(false);
        }
    };

    const updateFormData = (updates: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
        if (error) setError(""); // Clear error on change
    };

    return (
        <div className="min-h-screen bg-[var(--bg-app)] pb-24 relative">
            {/* Header / Progress */}
            <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]/95 px-4 pt-12 pb-4 backdrop-blur-md sm:pt-6">
                <div className="mx-auto max-w-2xl">
                    <div className="mb-4 flex items-center justify-between">
                        <button
                            onClick={() => (step > 0 ? handleBack() : navigate(-1))}
                            className="inline-flex items-center gap-1 rounded-full p-2 -ml-2 text-[var(--text-muted)] hover:bg-[var(--surface-deep)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <ChevronLeft size={20} />
                            <span className="text-sm font-medium">{step === 0 ? "Cancel" : "Back"}</span>
                        </button>
                        <div className="text-lg font-bold text-[var(--text-primary)]">
                            {editPotId ? "Edit Pot" : "Create Pot"}
                        </div>
                        <div className="w-[60px]" /> {/* Spacer for centering */}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium text-[var(--text-muted)]">
                            <span>Step {step + 1} of {STEPS.length}</span>
                            <span>{STEPS[step].label}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-deep)]">
                            <motion.div
                                className="h-full bg-[var(--accent-vivid)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${completionPercent}%` }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-6">
                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-6 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                    <AnimatePresence mode="wait" custom={step}>
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {step === 0 && <PotFinancialsStep formData={formData} onChange={updateFormData} disabled={isLocked} />}
                            {step === 1 && <PotSlotsStep formData={formData} onChange={updateFormData} disabled={isLocked} />}
                            {step === 2 && <PotRulesStep formData={formData} onChange={updateFormData} disabled={isLocked} />}
                        </motion.div>
                    </AnimatePresence>
                </form>
            </main>

            {/* Bottom Action Bar */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 pb-safe-offset-4 shadow-lg sm:pb-4">
                <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
                    <div className="text-xs text-[var(--text-muted)] hidden sm:block">
                        {step === 0 && "Next: Slot Configuration"}
                        {step === 1 && "Next: Rules & Review"}
                        {step === 2 && "Final Step"}
                    </div>

                    <button
                        type="button"
                        onClick={step === STEPS.length - 1 ? () => handleSubmit() : handleNext}
                        disabled={isSubmitting}
                        className={cn(
                            "ml-auto inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-8 text-base font-bold text-[var(--text-on-accent)] shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 sm:w-auto",
                            isSubmitting ? "bg-[var(--text-muted)]" : "bg-[var(--accent-vivid)] shadow-[var(--accent-vivid)]/20"
                        )}
                    >
                        {isSubmitting ? (
                            "Saving..."
                        ) : step === STEPS.length - 1 ? (
                            <>
                                {editPotId ? "Update Pot" : "Create Pot"}
                                <Save size={18} />
                            </>
                        ) : (
                            <>
                                Next Step
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
