import { cn } from "@/lib/utils";

interface PaymentStatusBadgeProps {
  status: "UNPAID" | "PENDING" | "PAID";
  className?: string;
}

const statusStyles: Record<PaymentStatusBadgeProps["status"], string> = {
  UNPAID: "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]",
  PENDING: "border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]",
  PAID: "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]",
};

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
        statusStyles[status],
        className
      )}
    >
      {status}
    </span>
  );
}
