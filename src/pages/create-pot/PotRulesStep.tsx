import { Landmark, Shuffle, UserCheck } from "lucide-react";

import { GlassSurface } from "@/components/ui/GlassSurface";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

type DrawStrategy = "RANDOM" | "MANUAL";

interface PotRulesStepProps {
    formData: {
        drawStrategy: DrawStrategy;
        gracePeriodDays: number;
        bankDetails: string;
    };
    onChange: (data: Partial<PotRulesStepProps["formData"]>) => void;
    disabled?: boolean;
}

export function PotRulesStep({ formData, onChange, disabled }: PotRulesStepProps) {
    return (
        <section className="space-y-6">
            <GlassSurface tier="glass-2" className="p-5 sm:p-6 space-y-5">
                <div>
                    <h2 className="text-xl font-display font-bold text-[var(--text-primary)] mb-1">Pot Rules</h2>
                    <p className="text-sm text-[var(--text-muted)]">Define how winners are picked and payments are handled.</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                            Draw Strategy
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {[
                                {
                                    id: "RANDOM",
                                    label: "System Draw",
                                    icon: Shuffle,
                                    desc: "Fair luck-based selection by the system.",
                                },
                                {
                                    id: "MANUAL",
                                    label: "Manual Pick",
                                    icon: UserCheck,
                                    desc: "Organizer selects the winner each cycle.",
                                },
                            ].map((strategy) => (
                                <button
                                    key={strategy.id}
                                    type="button"
                                    onClick={() => onChange({ drawStrategy: strategy.id as DrawStrategy })}
                                    disabled={disabled}
                                    className={cn(
                                        "relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all",
                                        formData.drawStrategy === strategy.id
                                            ? "border-[var(--accent-vivid)] bg-[var(--accent-vivid)]/10"
                                            : "border-[var(--border-subtle)] bg-[var(--surface-elevated)]/50 hover:border-[var(--accent-vivid)]/40 hover:bg-[var(--surface-elevated)]",
                                        disabled && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                                        <strategy.icon size={18} className={formData.drawStrategy === strategy.id ? "text-[var(--accent-vivid)]" : "text-[var(--text-muted)]"} />
                                        {strategy.label}
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)]">{strategy.desc}</p>

                                    {formData.drawStrategy === strategy.id && (
                                        <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-[var(--accent-vivid)] shadow-[0_0_8px_var(--accent-vivid)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="gracePeriod" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Payment Grace Period (Days)
                        </label>
                        <Input
                            id="gracePeriod"
                            type="number"
                            min={0}
                            max={30}
                            value={formData.gracePeriodDays}
                            onChange={(e) => onChange({ gracePeriodDays: Number(e.target.value) })}
                            disabled={disabled}
                            className="bg-[var(--surface-deep)]/50 font-mono"
                        />
                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                            Number of days members have to pay after the due date before late fees apply (if any).
                        </p>
                    </div>

                    <div>
                        <label htmlFor="bankDetails" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Bank / UPI Details <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute left-3 top-3 z-10 text-[var(--text-muted)]">
                                <Landmark size={18} />
                            </div>
                            <Textarea
                                id="bankDetails"
                                rows={3}
                                value={formData.bankDetails}
                                onChange={(e) => onChange({ bankDetails: e.target.value })}
                                placeholder="Enter UPI ID or Bank Account details for members to pay to."
                                className="resize-none bg-[var(--surface-deep)]/50 pl-10 pr-3"
                            />
                        </div>
                    </div>
                </div>
            </GlassSurface>
        </section>
    );
}
