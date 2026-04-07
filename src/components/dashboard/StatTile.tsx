import type React from "react";

import { cn } from "@/lib/utils";

export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-2 group relative overflow-hidden rounded-[22px] border border-[var(--border-subtle)] p-4 transition-all",
        accent ? "border-[var(--accent-vivid)]/40" : "",
        "hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(0,0,0,0.18)]"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
          {label}
        </p>
        <div
          className={cn(
            "rounded-2xl p-2",
            accent
              ? "bg-[var(--accent-vivid)]/18 text-[var(--accent-vivid)]"
              : "bg-[var(--surface-2)]/70 text-[var(--text-muted)]"
          )}
        >
          <Icon size={16} />
        </div>
      </div>
      <p
        className={cn(
          "mt-4 font-display text-[var(--type-2xl)] font-bold",
          accent ? "text-[var(--accent-vivid)]" : "text-[var(--text-primary)]"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}
