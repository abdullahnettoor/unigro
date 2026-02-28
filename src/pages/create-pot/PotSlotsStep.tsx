import { useState } from "react";
import { Percent, Users } from "lucide-react";

import { Surface } from "@/components/ui/Surface";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils";

type Frequency = "monthly" | "weekly" | "biweekly" | "quarterly" | "occasional";

interface PotSlotsStepProps {
    formData: {
        frequency: Frequency;
        duration: number; // totalSlots
        commission: number;
        contribution: number;
        totalValue: number;
        currency: string;
    };
    onChange: (data: Partial<PotSlotsStepProps["formData"]>) => void;
    disabled?: boolean;
}

export function PotSlotsStep({ formData, onChange, disabled }: PotSlotsStepProps) {
    const [commissionType, setCommissionType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");

    // Local state for fixed amount input to allow typing
    // We convert to percentage on change
    const [fixedCommission, setFixedCommission] = useState(() => {
        return Math.round((formData.totalValue * formData.commission) / 100);
    });

    const frequencies: { value: Frequency; label: string }[] = [
        { value: "weekly", label: "Weekly" },
        { value: "biweekly", label: "Bi-weekly" },
        { value: "monthly", label: "Monthly" },
        { value: "quarterly", label: "Quarterly" },
        { value: "occasional", label: "Occasional" },
    ];

    const setDuration = (val: number) => {
        const nextDuration = Number.isFinite(val) ? Math.min(60, Math.max(2, val)) : 2;
        const nextContribution = Math.max(1, Math.round(formData.totalValue / nextDuration));
        onChange({
            duration: nextDuration,
            contribution: nextContribution,
        });
    };

    const handleCommissionChange = (val: number, type: "PERCENTAGE" | "FIXED") => {
        if (type === "PERCENTAGE") {
            const nextCommission = Math.min(50, Math.max(0, val));
            onChange({ commission: nextCommission });
            // Update fixed amount counterpart
            setFixedCommission(Math.round((formData.totalValue * nextCommission) / 100));
        } else {
            const nextFixed = Math.max(0, val);
            setFixedCommission(nextFixed);
            // Convert to percentage for parent state
            // prevent division by zero
            const percentage = formData.totalValue > 0 ? (nextFixed / formData.totalValue) * 100 : 0;
            onChange({ commission: percentage });
        }
    };

    const organizerFee = Math.round((formData.totalValue * formData.commission) / 100);
    const payout = formData.totalValue - organizerFee;

    const currencySymbol = getCurrencySymbol(formData.currency, true);

    return (
        <section className="space-y-6">
            <Surface tier={2} className="p-5 sm:p-6 space-y-5">
                <div>
                    <h2 className="text-xl font-display font-bold text-[var(--text-primary)] mb-1">Schedule & Slots</h2>
                    <p className="text-sm text-[var(--text-muted)]">Configure how often members contribute.</p>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                            Contribution Frequency
                        </label>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {frequencies.map((freq) => (
                                <Button
                                    key={freq.value}
                                    type="button"
                                    onClick={() => onChange({ frequency: freq.value })}
                                    disabled={disabled}
                                    variant={formData.frequency === freq.value ? "primary" : "secondary"}
                                    className="w-full"
                                >
                                    {freq.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <div className="flex items-center justify-between mb-2 h-8">
                                <label className="block text-sm font-medium text-[var(--text-primary)]">
                                    Total Slots (Participants)
                                </label>
                            </div>
                            <div className="relative">
                                <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--text-muted)]">
                                    <Users size={18} />
                                </div>
                                <Input
                                    type="number"
                                    min={2}
                                    max={50}
                                    value={formData.duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    disabled={disabled}
                                    className="bg-[var(--surface-deep)]/50 !pl-10 pr-3 font-mono"
                                />
                            </div>
                            <p className="mt-2 text-xs text-[var(--text-muted)]">
                                {formData.frequency === "occasional" ? "Duration depends on slots" : `Duration: ${formData.duration} ${formData.frequency.replace("ly", "s")}`}
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2 h-8">
                                <label className="block text-sm font-medium text-[var(--text-primary)]">
                                    Organizer Commission
                                </label>
                                <div className="flex rounded-lg bg-[var(--surface-elevated)] p-0.5 border border-[var(--border-subtle)]">
                                    <button
                                        type="button"
                                        onClick={() => setCommissionType("PERCENTAGE")}
                                        className={`btn-chip px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all ${commissionType === "PERCENTAGE"
                                            ? "bg-[var(--accent-vivid)] text-[var(--text-on-accent)] shadow-sm"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                            }`}
                                    >
                                        %
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCommissionType("FIXED")}
                                        disabled={disabled}
                                        className={`btn-chip px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all ${commissionType === "FIXED"
                                            ? "bg-[var(--accent-vivid)] text-[var(--text-on-accent)] shadow-sm"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        {currencySymbol}
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 flex w-5 items-center justify-center text-[var(--text-muted)]">
                                    {commissionType === "PERCENTAGE" ? <Percent size={16} /> : <span className="text-sm font-bold">{currencySymbol}</span>}
                                </div>
                                <Input
                                    type="number"
                                    min={0}
                                    {...(commissionType === "PERCENTAGE" ? { max: 50, step: 0.1 } : { max: formData.totalValue })}
                                    value={commissionType === "PERCENTAGE" ? Number(formData.commission.toFixed(2)) : fixedCommission}
                                    onChange={(e) => handleCommissionChange(Number(e.target.value), commissionType)}
                                    disabled={disabled}
                                    className="bg-[var(--surface-deep)]/50 !pl-10 pr-3 font-mono"
                                />
                            </div>
                            <p className="mt-2 text-xs text-[var(--text-muted)]">
                                {commissionType === "PERCENTAGE"
                                    ? `≈ ${formatCurrency(organizerFee, formData.currency)} from total pool`
                                    : `${formData.commission.toFixed(2)}% of total pool`
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </Surface>

            <Surface tier={1} className="p-5 overflow-hidden relative">
                <div className="grid gap-4 sm:grid-cols-3 text-center sm:text-left">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Contribution</div>
                        <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">{formatCurrency(formData.contribution, formData.currency)}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">per member / cycle</div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Organizer Fee</div>
                        <div className="text-xl font-bold font-mono text-[var(--text-primary)]">{formatCurrency(organizerFee, formData.currency)}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">total for the pot</div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-vivid)] mb-1">Winner Payout</div>
                        <div className="text-2xl font-bold font-mono text-[var(--accent-vivid)]">{formatCurrency(payout, formData.currency)}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">take home amount</div>
                    </div>
                </div>
            </Surface>
        </section>
    );
}
