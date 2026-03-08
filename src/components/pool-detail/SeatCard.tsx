import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/Surface";
import { formatCurrency } from "@/lib/utils";
import { PaymentStatusBadge } from "./PaymentStatusBadge";

interface SeatCardProps {
  seatNumber: number;
  sharePct: number;
  dueAmount: number;
  dueDate: string;
  status: "UNPAID" | "PENDING" | "PAID";
  currency?: string;
  onPay?: () => void;
  wonRound?: number | null;
  wonAmount?: number;
}

export function SeatCard({
  seatNumber,
  sharePct,
  dueAmount,
  dueDate,
  status,
  currency,
  onPay,
  wonRound,
  wonAmount,
}: SeatCardProps) {
  return (
    <Surface tier={2} className="rounded-2xl border border-[var(--border-subtle)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-semibold">
            Seat #{seatNumber}
          </p>
          {sharePct < 100 && (
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">{sharePct}% share</p>
          )}
        </div>
        <PaymentStatusBadge status={status} />
      </div>

      <div className="mt-3">
        <p className="text-lg font-bold font-mono text-[var(--text-primary)]">
          {status === "PAID" ? "Paid" : formatCurrency(dueAmount, currency)}
        </p>
        {status !== "PAID" && (
          <p className="text-xs text-[var(--text-muted)]">Due by {dueDate}</p>
        )}
      </div>

      {status === "UNPAID" && onPay && (
        <Button size="sm" className="mt-4 w-full" onClick={onPay}>
          Pay now
        </Button>
      )}

      {status === "PENDING" && (
        <div className="mt-4 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-3 py-2 text-xs font-semibold text-[var(--warning)]">
          Payment pending approval
        </div>
      )}

      <div className="mt-4 border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-muted)]">
        {wonRound ? (
          <span className="text-[var(--gold)] font-semibold">
            Won round {wonRound}{wonAmount ? ` • ${formatCurrency(wonAmount, currency)}` : ""}
          </span>
        ) : (
          <span>Not yet won</span>
        )}
      </div>
    </Surface>
  );
}
