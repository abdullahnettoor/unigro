import { addDays, format, parseISO } from "date-fns";

import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/DatePicker";
import { cn } from "@/lib/utils";
import { DrawIcon, OrganizerIcon } from "@/lib/icons";

type DrawStrategy = "RANDOM" | "MANUAL";

interface PoolRulesStepProps {
  formData: {
    drawStrategy: DrawStrategy;
    gracePeriodDays: number;
    startDate: string;
  };
  onChange: (data: Partial<PoolRulesStepProps["formData"]>) => void;
  disableGracePeriod?: boolean;
  disableStartDate?: boolean;
}

export function PoolRulesStep({
  formData,
  onChange,
  disableGracePeriod = false,
  disableStartDate = false,
}: PoolRulesStepProps) {
  return (
    <section className="space-y-6">
      <div className="glass-2 rounded-[22px] border border-[var(--border-subtle)] p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-xl font-display font-bold text-[var(--text-primary)] mb-1">Strategy & dates</h2>
          <p className="text-sm text-[var(--text-muted)]">Set draw rules and payment timing.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
              Draw strategy
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  id: "RANDOM",
                  label: "System draw",
                  icon: DrawIcon,
                  desc: "Fair luck-based selection by the system.",
                },
                {
                  id: "MANUAL",
                  label: "Manual pick",
                  icon: OrganizerIcon,
                  desc: "Organizer selects the winner each round.",
                },
              ].map((strategy) => (
                <button
                  key={strategy.id}
                  type="button"
                  onClick={() => onChange({ drawStrategy: strategy.id as DrawStrategy })}
                  className={cn(
                    "relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all",
                    formData.drawStrategy === strategy.id
                      ? "border-[var(--accent-vivid)] bg-[var(--accent-vivid)]/10"
                      : "border-[var(--border-subtle)] bg-[var(--surface-2)]/40 hover:border-[var(--accent-vivid)]/40"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                Start date <span className="text-[var(--accent-vivid)]">*</span>
              </label>
              <DatePicker
                value={formData.startDate}
                onChange={(value) => onChange({ startDate: value })}
                disabled={disableStartDate}
              />
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                First contribution is typically collected on or before this date.
              </p>
            </div>

            <div>
              <label htmlFor="gracePeriod" className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                Payment grace period (days)
              </label>
              <Input
                id="gracePeriod"
                type="number"
                min={0}
                max={30}
                value={formData.gracePeriodDays}
                onChange={(e) => onChange({ gracePeriodDays: Number(e.target.value) })}
                disabled={disableGracePeriod}
                className="bg-[var(--surface-deep)]/50 font-mono"
              />
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Grace period starts from the selected start date.
              </p>
              {formData.startDate && !Number.isNaN(formData.gracePeriodDays) && (
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Estimated draw date: {format(addDays(parseISO(formData.startDate), formData.gracePeriodDays || 0), "PPP")}
                </p>
              )}
              {disableGracePeriod && (
                <p className="mt-2 text-xs text-[var(--warning)]">Grace period is locked once seats are filled.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
