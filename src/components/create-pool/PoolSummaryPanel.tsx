import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

export function PoolSummaryPanel({
  formData,
  organizerFee,
  payout,
  isLocked,
}: {
  formData: {
    title: string;
    terms: string;
    totalValue: number;
    currency: string;
    contribution: number;
    duration: number;
    frequency: string;
    commission: number;
    startDate: string;
    drawStrategy: string;
    hasPaymentDetails: boolean;
    paymentDetails: {
      upiId: string;
      accountName: string;
      bankName: string;
      accountNumber: string;
      ifsc: string;
      note: string;
    };
  };
  organizerFee: number;
  payout: number;
  isLocked: boolean;
}) {
  const formattedStartDate = formData.startDate
    ? format(new Date(formData.startDate), "PPP")
    : "Not set";

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-28">
        <div className="glass-2 rounded-[22px] border border-[var(--border-subtle)] p-5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Summary</p>
            <h3 className="text-lg font-display font-semibold text-[var(--text-primary)]">
              {formData.title.trim() || "Untitled pool"}
            </h3>
            {formData.terms && (
              <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
                {formData.terms}
              </p>
            )}
            {isLocked && (
              <p className="mt-2 text-xs text-[var(--warning)]">Some fields are locked once seats are filled.</p>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Total pool</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {formatCurrency(formData.totalValue, formData.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Per round</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {formatCurrency(formData.contribution, formData.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Seats</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {formData.duration}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Frequency</span>
              <span className="font-semibold text-[var(--text-primary)] capitalize">
                {formData.frequency}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Organizer fee</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {formData.commission.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Fee value</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {formatCurrency(organizerFee, formData.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Winner payout</span>
              <span className="font-semibold text-[var(--accent-vivid)]">
                {formatCurrency(payout, formData.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Start date</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {formattedStartDate}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Draw</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {formData.drawStrategy === "RANDOM" ? "System draw" : "Manual pick"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Payment details</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {formData.hasPaymentDetails ? "Added" : "Not added"}
              </span>
            </div>
            {formData.hasPaymentDetails && formData.paymentDetails.upiId && (
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">UPI</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {formData.paymentDetails.upiId}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
