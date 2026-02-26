import CurrencyInput from "react-currency-input-field";
// @ts-ignore
import { getEmojiByCurrencyCode } from "country-currency-emoji-flags";
import cc from "currency-codes";
import { Calendar, Info } from "lucide-react";

import { GlassSurface } from "@/components/ui/GlassSurface";
import { getCurrencySymbol } from "@/lib/utils";

interface PotFinancialsStepProps {
    formData: {
        title: string;
        description: string;
        totalValue: number;
        currency: string;
        startDate: string;
    };
    onChange: (data: Partial<PotFinancialsStepProps["formData"]>) => void;
    disabled?: boolean;
}

export function PotFinancialsStep({ formData, onChange, disabled }: PotFinancialsStepProps) {
    const currencies = cc.codes().map((code) => ({
        code,
        label: `${getEmojiByCurrencyCode(code) || ""} ${code}`,
        name: cc.code(code)?.currency || code,
        symbol: getCurrencySymbol(code)
    })).sort((a, b) => {
        // Prioritize specific currencies
        const priority = ["INR", "USD", "EUR", "GBP", "AED", "SAR"];
        const indexA = priority.indexOf(a.code);
        const indexB = priority.indexOf(b.code);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.code.localeCompare(b.code);
    });

    const currentCurrencySymbol = getCurrencySymbol(formData.currency);

    return (
        <section className="space-y-6">
            <GlassSurface tier="glass-2" className="p-5 sm:p-6 space-y-5">
                <div>
                    <h2 className="text-xl font-display font-bold text-[var(--text-primary)] mb-1">Pot Details</h2>
                    <p className="text-sm text-[var(--text-muted)]">Give your pot a name and purpose.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Pot Name <span className="text-[var(--accent-vivid)]">*</span>
                        </label>
                        <input
                            id="title"
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => onChange({ title: e.target.value })}
                            placeholder="e.g. Family Vacation Fund"
                            disabled={disabled}
                            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-deep)]/50 p-3 text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent-vivid)] focus:ring-1 focus:ring-[var(--accent-vivid)] placeholder:text-[var(--text-muted)] disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Description <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                        </label>
                        <textarea
                            id="description"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => onChange({ description: e.target.value })}
                            placeholder="What is this pot for?"
                            className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-deep)]/50 p-3 text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent-vivid)] focus:ring-1 focus:ring-[var(--accent-vivid)] placeholder:text-[var(--text-muted)]"
                        />
                    </div>
                </div>
            </GlassSurface>

            <GlassSurface tier="glass-2" className="p-5 sm:p-6 space-y-5">
                <div>
                    <h2 className="text-xl font-display font-bold text-[var(--text-primary)] mb-1">Financial Goal</h2>
                    <p className="text-sm text-[var(--text-muted)]">Set the target amount and start date.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="totalValue" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Total Pool Value <span className="text-[var(--accent-vivid)]">*</span>
                        </label>
                        <div className="flex rounded-xl bg-[var(--surface-deep)]/50 border border-[var(--border-subtle)] focus-within:border-[var(--accent-vivid)] focus-within:ring-1 focus-within:ring-[var(--accent-vivid)] transition-all overflow-hidden">
                            <div className="relative border-r border-[var(--border-subtle)] bg-[var(--surface-elevated)]/30 min-w-[100px]">
                                <select
                                    id="currency"
                                    value={formData.currency}
                                    onChange={(e) => onChange({ currency: e.target.value })}
                                    disabled={disabled}
                                    className="w-full h-full appearance-none bg-transparent py-3 pl-3 pr-8 text-sm font-semibold text-[var(--text-primary)] outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", inherit' }}
                                >
                                    {currencies.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                                    {/* Chevron down or similar if needed, currently reusing IndianRupee slot but better empty or chevron */}
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                            <div className="relative flex-1">
                                <CurrencyInput
                                    id="totalValue"
                                    name="totalValue"
                                    placeholder="0.00"
                                    defaultValue={formData.totalValue || ""}
                                    value={formData.totalValue || ""}
                                    decimalsLimit={2}
                                    onValueChange={(_value, _name, values) => {
                                        onChange({ totalValue: values?.float || 0 });
                                    }}
                                    disabled={disabled}
                                    className="w-full h-full bg-transparent py-3 px-4 font-mono text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:opacity-50"
                                    decimalSeparator="."
                                    groupSeparator=","
                                    prefix={currentCurrencySymbol}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Start Date <span className="text-[var(--accent-vivid)]">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                                <Calendar size={18} />
                            </div>
                            <input
                                id="startDate"
                                type="date"
                                required
                                value={formData.startDate}
                                onChange={(e) => onChange({ startDate: e.target.value })}
                                disabled={disabled}
                                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-deep)]/50 py-3 pl-10 pr-3 text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent-vivid)] focus:ring-1 focus:ring-[var(--accent-vivid)] disabled:opacity-50"
                            />
                        </div>
                        <p className="mt-2 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                            <Info size={12} />
                            First payment is typically collected on or before this date.
                        </p>
                    </div>
                </div>
            </GlassSurface>
        </section>
    );
}
