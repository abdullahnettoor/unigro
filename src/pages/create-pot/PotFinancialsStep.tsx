import CurrencyInput from "react-currency-input-field";
// @ts-ignore
import { getEmojiByCurrencyCode } from "country-currency-emoji-flags";
import cc from "currency-codes";
import { Info } from "lucide-react";

import { DatePicker } from "@/components/ui/DatePicker";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Input } from "@/components/ui/Input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
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
                        <Input
                            id="title"
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => onChange({ title: e.target.value })}
                            placeholder="e.g. Family Vacation Fund"
                            disabled={disabled}
                            className="bg-[var(--surface-deep)]/50"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Description <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                        </label>
                        <Textarea
                            id="description"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => onChange({ description: e.target.value })}
                            placeholder="What is this pot for?"
                            className="resize-none bg-[var(--surface-deep)]/50"
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
                                <Select
                                    value={formData.currency}
                                    onValueChange={(value) => onChange({ currency: value })}
                                    disabled={disabled}
                                >
                                    <SelectTrigger
                                        className="h-full rounded-none border-0 !bg-transparent !shadow-none !ring-0 px-3 text-sm font-semibold"
                                        style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", inherit' }}
                                    >
                                        <SelectValue placeholder="Currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currencies.map((c) => (
                                            <SelectItem key={c.code} value={c.code}>
                                                {c.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                        <DatePicker
                            value={formData.startDate}
                            onChange={(value) => onChange({ startDate: value })}
                            disabled={disabled}
                        />
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
