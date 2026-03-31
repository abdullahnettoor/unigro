import type React from "react";

export function SectionHeader({
  eyebrow,
  title,
  actions,
}: {
  eyebrow: string;
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-[var(--type-2xl)] font-bold text-[var(--text-primary)]">
          {title}
        </h2>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
