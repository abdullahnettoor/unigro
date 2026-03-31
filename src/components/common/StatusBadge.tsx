import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  ACTIVE: { label: "Active", className: "bg-[var(--success)]/12 text-[var(--success)]" },
  DRAFT: { label: "Draft", className: "bg-[var(--text-muted)]/10 text-[var(--text-muted)]" },
  COMPLETED: { label: "Completed", className: "bg-[var(--accent-vivid)]/12 text-[var(--accent-vivid)]" },
  ARCHIVED: { label: "Archived", className: "bg-[var(--border-subtle)] text-[var(--text-muted)]" },
  PENDING: { label: "Pending", className: "bg-[var(--warning)]/12 text-[var(--warning)]" },
  PAID: { label: "Paid", className: "bg-[var(--success)]/12 text-[var(--success)]" },
  UNPAID: { label: "Unpaid", className: "bg-[var(--danger)]/12 text-[var(--danger)]" },
} as const;

function fallbackLabel(status: string) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function StatusBadge({ status }: { status: string }) {
  const key = status?.toUpperCase() as keyof typeof STATUS_STYLES;
  const config = STATUS_STYLES[key];
  const label = config?.label ?? fallbackLabel(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        config?.className ?? "bg-[var(--border-subtle)] text-[var(--text-muted)]"
      )}
    >
      {label}
    </span>
  );
}

export type StatusBadgeKey = keyof typeof STATUS_STYLES;
