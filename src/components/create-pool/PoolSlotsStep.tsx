import { useMemo, useState } from "react";
import { Percent } from "lucide-react";
import CurrencyInput from "react-currency-input-field";
// @ts-ignore
import { getEmojiByCurrencyCode } from "country-currency-emoji-flags";
import cc from "currency-codes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectionControl } from "@/components/ui/selection-control";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils";
import { SeatCountIcon } from "@/lib/icons";

type Frequency = "monthly" | "weekly" | "biweekly" | "quarterly" | "occasional";

interface PoolSlotsStepProps {
  formData: {
    frequency: Frequency;
    duration: number;
    commission: number;
    contribution: number;
    totalValue: number;
    currency: string;
    organizerFirst: boolean;
  };
  onChange: (data: Partial<PoolSlotsStepProps["formData"]>) => void;
  disabled?: boolean;
  showOrganizerFirst?: boolean;
}

export function PoolSlotsStep({ formData, onChange, disabled, showOrganizerFirst = true }: PoolSlotsStepProps) {
  const [commissionType, setCommissionType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
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

  const currencies = cc
    .codes()
    .map((code) => ({
      code,
      label: `${getEmojiByCurrencyCode(code) || ""} ${code}`,
      name: cc.code(code)?.currency || code,
      symbol: getCurrencySymbol(code),
    }))
    .sort((a, b) => {
      const priority = ["INR", "USD", "EUR", "GBP", "AED", "SAR"];
      const indexA = priority.indexOf(a.code);
      const indexB = priority.indexOf(b.code);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.code.localeCompare(b.code);
    });

  const setDuration = (val: number) => {
    const nextDuration = Number.isFinite(val) ? Math.min(60, Math.max(2, val)) : 2;
    onChange({ duration: nextDuration });
  };

  const handleCommissionChange = (val: number, type: "PERCENTAGE" | "FIXED") => {
    if (type === "PERCENTAGE") {
      const nextCommission = Math.min(50, Math.max(0, val));
      onChange({ commission: nextCommission });
      setFixedCommission(Math.round((formData.totalValue * nextCommission) / 100));
    } else {
      const nextFixed = Math.max(0, val);
      setFixedCommission(nextFixed);
      const percentage = formData.totalValue > 0 ? (nextFixed / formData.totalValue) * 100 : 0;
      onChange({ commission: percentage });
    }
  };

  const organizerFee = Math.round((formData.totalValue * formData.commission) / 100);
  const payout = useMemo(() => formData.totalValue - organizerFee, [formData.totalValue, organizerFee]);
  const currencySymbol = getCurrencySymbol(formData.currency, true);

  return (
    <section className="space-y-6">
      <div className="glass-2 rounded-[22px] border border-[var(--border-subtle)] p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-xl font-display font-bold text-[var(--text-primary)] mb-1">Seats & fees</h2>
          <p className="text-sm text-[var(--text-muted)]">Define the money flow and member count.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="totalValue" className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
              Total pool value <span className="text-[var(--accent-vivid)]">*</span>
            </label>
            <div className="flex rounded-xl bg-[var(--surface-deep)]/50 border border-[var(--border-subtle)] focus-within:border-[var(--accent-vivid)] focus-within:ring-1 focus-within:ring-[var(--accent-vivid)] transition-all overflow-hidden">
              <div className="relative border-r border-[var(--border-subtle)] bg-[var(--surface-2)]/60 min-w-[110px]">
                <Select
                  value={formData.currency}
                  onValueChange={(value) => onChange({ currency: value })}
                  disabled={disabled}
                >
                  <SelectTrigger
                    className="h-full rounded-none !border-transparent !bg-transparent !shadow-none !ring-0 px-3 text-sm font-semibold"
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
                  prefix={currencySymbol}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
              Contribution frequency
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {frequencies.map((freq) => (
                <Button
                  key={freq.value}
                  type="button"
                  onClick={() => onChange({ frequency: freq.value })}
                  disabled={disabled}
                  variant={formData.frequency === freq.value ? "default" : "secondary"}
                  size="sm"
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
                <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Total seats (participants)
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--text-muted)]">
                  <SeatCountIcon size={18} />
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
                {formData.frequency === "occasional"
                  ? "Duration depends on seats"
                  : `Duration: ${formData.duration} ${formData.frequency.replace("ly", "s")}`}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 h-8">
                <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Organizer commission
                </label>
                <div className="flex rounded-lg bg-[var(--surface-2)]/60 p-0.5 border border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setCommissionType("PERCENTAGE")}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all ${
                      commissionType === "PERCENTAGE"
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
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all ${
                      commissionType === "FIXED"
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
                  : `${formData.commission.toFixed(2)}% of total pool`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-1 rounded-[22px] border border-[var(--border-subtle)] p-5 overflow-hidden">
        <div className="grid gap-4 sm:grid-cols-3 text-center sm:text-left">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Contribution</div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
              {formatCurrency(formData.contribution, formData.currency)}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">per member / round</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Organizer fee</div>
            <div className="text-xl font-bold font-mono text-[var(--text-primary)]">
              {formatCurrency(organizerFee, formData.currency)}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">total for the pool</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-vivid)] mb-1">Winner payout</div>
            <div className="text-2xl font-bold font-mono text-[var(--accent-vivid)]">
              {formatCurrency(payout, formData.currency)}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">take home amount</div>
          </div>
        </div>
      </div>

      {showOrganizerFirst && (
        <button
          type="button"
          onClick={() => onChange({ organizerFirst: !formData.organizerFirst })}
          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-all ${
            formData.organizerFirst
              ? "border-[var(--accent-vivid)] bg-[var(--accent-vivid)]/8"
              : "border-[var(--border-subtle)] bg-[var(--surface-2)]/40"
          }`}
        >
          <div className="text-left">
            <p className={`text-sm font-semibold ${formData.organizerFirst ? "text-[var(--accent-vivid)]" : "text-[var(--text-primary)]"}`}>
              Reserve seat 1 for me
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              You automatically take the first seat as organizer.
            </p>
          </div>
          <SelectionControl checked={formData.organizerFirst} variant="checkbox" />
        </button>
      )}
    </section>
  );
}
