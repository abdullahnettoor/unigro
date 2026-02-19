import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Calendar, ChevronLeft, Clock, Coins, Landmark, Percent } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

type Frequency = "monthly" | "weekly" | "biweekly" | "quarterly" | "occasional";
type DrawStrategy = "RANDOM" | "MANUAL";

const STEPS = [
    { id: 1, label: "Financials" },
    { id: 2, label: "Slot configuration" },
    { id: 3, label: "Rules and review" },
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
        contribution: 10000,
        duration: 10,
        frequency: "monthly" as Frequency,
        commission: 0,
        gracePeriodDays: 3,
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
        const frame = window.requestAnimationFrame(() => setFormData(nextFormData));
        return () => window.cancelAnimationFrame(frame);
    }, [existingPot]);

    const completionPercent = ((step + 1) / STEPS.length) * 100;

    const derived = useMemo(() => {
        const organizerFee = Math.round((formData.totalValue * formData.commission) / 100);
        const payout = formData.totalValue - organizerFee;
        return {
            organizerFee,
            payout,
            perCycleLabel:
                formData.frequency === "occasional"
                    ? "Per member commitment"
                    : `Per ${formData.frequency} contribution`,
        };
    }, [formData.commission, formData.frequency, formData.totalValue]);

    const setTotalValue = (val: number) => {
        const nextValue = Number.isFinite(val) ? Math.max(1000, val) : 1000;
        setFormData((prev) => ({
            ...prev,
            totalValue: nextValue,
            contribution: Math.max(1, Math.round(nextValue / Math.max(prev.duration, 1))),
        }));
    };

    const setDuration = (val: number) => {
        const nextDuration = Number.isFinite(val) ? Math.min(60, Math.max(2, val)) : 2;
        setFormData((prev) => ({
            ...prev,
            duration: nextDuration,
            contribution: Math.max(1, Math.round(prev.totalValue / nextDuration)),
        }));
    };

    const validateStep = (stepIndex: number) => {
        if (stepIndex === 0) {
            if (!formData.title.trim()) return "Pot name is required.";
            if (!formData.startDate) return "Start date is required.";
            if (formData.totalValue < 1000) return "Total pool value must be at least ₹1,000.";
        }
        if (stepIndex === 1) {
            if (formData.duration < 2) return "Total slots must be at least 2.";
            if (formData.duration > 60) return "Total slots cannot exceed 60.";
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
            };
            let potId = editPotId;
            if (editPotId) {
                await updatePot({ potId: editPotId, ...payload });
            } else {
                potId = await createPot(payload);
            }
            navigate(`/pot/${potId}`);
        } catch (submitError) {
            console.error("Failed to save pot:", submitError);
            setError("Failed to save pot. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:pt-8">
            <button
                onClick={() => (step > 0 ? handleBack() : navigate(-1))}
                className="mb-5 inline-flex items-center gap-1 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
                <ChevronLeft size={18} />
                {step > 0 ? "Back to previous step" : "Back"}
            </button>

            <header className="mb-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display sm:text-4xl">{editPotId ? "Edit Pot" : "Create New Pot"}</h1>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">Set up your pot in three simple steps.</p>
                    </div>
                    <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
                        Step {step + 1} of {STEPS.length}
                    </span>
                </div>

                <div className="glass-2 rounded-2xl p-4">
                    <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-deep)]/70">
                        <div className="h-full rounded-full bg-[var(--accent-vivid)] transition-all duration-300" style={{ width: `${completionPercent}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        {STEPS.map((item, index) => (
                            <div key={item.id} className={`${index <= step ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                                <div className="mb-1 font-semibold">{item.id}. {item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
                <div className="space-y-6">
                    {step === 0 && (
                        <section className="glass-2 rounded-2xl p-5 sm:p-6">
                            <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Step 1: Financials</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm text-[var(--text-muted)]">Pot name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g. Family savings circle"
                                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-deep)]/50 p-3 text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-vivid)]"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm text-[var(--text-muted)]">Description (optional)</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                        rows={4}
                                        placeholder="What is this pot for?"
                                        className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-deep)]/50 p-3 text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-vivid)]"
                                    />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                            <Calendar size={14} /> Start date
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.startDate}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                                            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-deep)]/50 p-3 text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-vivid)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                            <Clock size={14} /> Contribution frequency
                                        </label>
                                        <div className="glass-1 rounded-xl p-2">
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { value: "weekly", label: "Weekly" },
                                                    { value: "biweekly", label: "Bi-weekly" },
                                                    { value: "monthly", label: "Monthly" },
                                                    { value: "quarterly", label: "Quarterly" },
                                                    { value: "occasional", label: "Occasional" },
                                                ].map((freq) => (
                                                    <button
                                                        key={freq.value}
                                                        type="button"
                                                        onClick={() => setFormData((prev) => ({ ...prev, frequency: freq.value as Frequency }))}
                                                        className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                                                            formData.frequency === freq.value
                                                                ? "bg-[var(--accent-vivid)] text-[var(--text-on-accent)]"
                                                                : "bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                                        }`}
                                                    >
                                                        {freq.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                        <Coins size={14} /> Total pool value (INR)
                                    </label>
                                    <input
                                        type="number"
                                        min={1000}
                                        required
                                        value={formData.totalValue}
                                        onChange={(e) => setTotalValue(Number(e.target.value))}
                                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-deep)]/50 p-3 font-mono text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-vivid)]"
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {step === 1 && (
                        <section className="glass-2 rounded-2xl p-5 sm:p-6">
                            <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Step 2: Slot configuration</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm text-[var(--text-muted)]">
                                        {formData.frequency === "occasional" ? "Total slots (participants)" : "Total slots / cycles"}
                                    </label>
                                    <input
                                        type="number"
                                        min={2}
                                        max={60}
                                        required
                                        value={formData.duration}
                                        onChange={(e) => setDuration(Number(e.target.value))}
                                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-deep)]/50 p-3 font-mono text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-vivid)]"
                                    />
                                    <div className="mt-2 text-xs text-[var(--text-muted)]">
                                        This value maps directly to `totalSlots` in your payload.
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                        <Percent size={14} /> Organizer commission (%)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={50}
                                        value={formData.commission}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, commission: Number(e.target.value) }))}
                                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-deep)]/50 p-3 font-mono text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-vivid)]"
                                    />
                                </div>
                                <div className="rounded-xl border border-[var(--accent-vivid)]/25 bg-[var(--accent-vivid)]/8 p-4">
                                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--accent-vivid)]">{derived.perCycleLabel}</div>
                                    <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">₹{formData.contribution.toLocaleString()}</div>
                                </div>
                            </div>
                        </section>
                    )}

                    {step === 2 && (
                        <section className="glass-2 rounded-2xl p-5 sm:p-6">
                            <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Step 3: Rules and final review</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm text-[var(--text-muted)]">Draw strategy</label>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {[
                                            { id: "RANDOM", label: "Random system draw", help: "System picks winner from eligible slots." },
                                            { id: "MANUAL", label: "Manual selection", help: "Organizer chooses winner each cycle." },
                                        ].map((strategy) => (
                                            <button
                                                key={strategy.id}
                                                type="button"
                                                onClick={() => setFormData((prev) => ({ ...prev, drawStrategy: strategy.id as DrawStrategy }))}
                                                className={`rounded-xl border p-4 text-left transition-colors ${formData.drawStrategy === strategy.id
                                                    ? "border-[var(--accent-vivid)] bg-[var(--accent-vivid)]/10"
                                                    : "border-[var(--border-subtle)] bg-[var(--surface-deep)]/40 hover:border-[var(--accent-vivid)]/40"
                                                    }`}
                                            >
                                                <div className="font-semibold text-[var(--text-primary)]">{strategy.label}</div>
                                                <div className="mt-1 text-xs text-[var(--text-muted)]">{strategy.help}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm text-[var(--text-muted)]">Payment grace period (days)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={30}
                                        value={formData.gracePeriodDays}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, gracePeriodDays: Number(e.target.value) }))}
                                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-deep)]/50 p-3 font-mono text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-vivid)]"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                        <Landmark size={14} /> Bank details / UPI (optional)
                                    </label>
                                    <textarea
                                        value={formData.bankDetails}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, bankDetails: e.target.value }))}
                                        rows={3}
                                        placeholder="UPI ID, bank account details, or transfer instructions"
                                        className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-deep)]/50 p-3 text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-vivid)]"
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {error && <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">{error}</div>}
                </div>

                <aside className="mt-6 lg:mt-0">
                    <div className="glass-3 rounded-2xl p-5 lg:sticky lg:top-24">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Pot summary</h3>
                        <div className="space-y-3 text-sm">
                            <SummaryRow label="Pot name" value={formData.title || "Untitled pot"} />
                            <SummaryRow label="Total value" value={`₹${formData.totalValue.toLocaleString()}`} mono />
                            <SummaryRow label="Contribution" value={`₹${formData.contribution.toLocaleString()}`} mono />
                            <SummaryRow label="Frequency" value={capitalize(formData.frequency)} />
                            <SummaryRow label="Total slots" value={`${formData.duration}`} />
                            <SummaryRow label="Organizer fee" value={`₹${derived.organizerFee.toLocaleString()}`} mono />
                            <SummaryRow label="Winner payout" value={`₹${derived.payout.toLocaleString()}`} mono highlight />
                        </div>
                    </div>
                </aside>

                <div className="glass-3 sticky-safe-bottom fixed inset-x-0 bottom-16 z-40 border-t border-[var(--border-subtle)] px-4 py-3 sm:bottom-0 lg:hidden">
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-xs text-[var(--text-muted)]">{step < 2 ? `Step ${step + 1} of 3` : "Final review"}</div>
                            <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                ₹{formData.contribution.toLocaleString()} {formData.frequency === "occasional" ? "total per member" : `per ${formData.frequency}`}
                            </div>
                        </div>
                        {step < 2 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--accent-vivid)] px-5 py-2.5 text-sm font-semibold text-[var(--text-on-accent)] transition-opacity hover:opacity-90"
                            >
                                Next
                                <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--accent-vivid)] px-5 py-2.5 text-sm font-semibold text-[var(--text-on-accent)] transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                {isSubmitting ? "Saving..." : editPotId ? "Update pot" : "Create pot"}
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-6 hidden items-center justify-between lg:flex lg:col-span-2">
                    <button
                        type="button"
                        onClick={step === 0 ? () => navigate(-1) : handleBack}
                        className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-5 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-deep)]/60"
                    >
                        {step === 0 ? "Cancel" : "Back"}
                    </button>
                    {step < 2 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--accent-vivid)] px-6 py-2.5 text-sm font-semibold text-[var(--text-on-accent)] transition-opacity hover:opacity-90"
                        >
                            Continue
                            <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--accent-vivid)] px-6 py-2.5 text-sm font-semibold text-[var(--text-on-accent)] transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                            {isSubmitting ? "Saving..." : editPotId ? "Update pot" : "Create pot"}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

function SummaryRow({
    label,
    value,
    mono,
    highlight,
}: {
    label: string;
    value: string;
    mono?: boolean;
    highlight?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)]/70 pb-2 last:border-none">
            <span className="text-[var(--text-muted)]">{label}</span>
            <span className={`${mono ? "font-mono" : ""} ${highlight ? "font-semibold text-[var(--accent-vivid)]" : "text-[var(--text-primary)]"}`}>
                {value}
            </span>
        </div>
    );
}

function capitalize(value: string) {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
}
