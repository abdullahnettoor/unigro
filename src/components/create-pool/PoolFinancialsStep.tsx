import { Input } from "@/components/ui/input";
import { SelectionControl } from "@/components/ui/selection-control";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface PoolFinancialsStepProps {
  formData: {
    title: string;
    terms: string;
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
  onChange: (data: Partial<PoolFinancialsStepProps["formData"]>) => void;
  disabled?: boolean;
}

export function PoolFinancialsStep({ formData, onChange, disabled }: PoolFinancialsStepProps) {
  const { paymentDetails } = formData;

  return (
    <section className="space-y-6">
      <div className="glass-2 rounded-[22px] border border-[var(--border-subtle)] p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-xl font-display font-bold text-[var(--text-primary)] mb-1">Pool details</h2>
          <p className="text-sm text-[var(--text-muted)]">Set a clear name and share expectations for members.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
              Pool name <span className="text-[var(--accent-vivid)]">*</span>
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
            <label htmlFor="terms" className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
              Pool terms <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
            </label>
            <Textarea
              id="terms"
              rows={3}
              value={formData.terms}
              onChange={(e) => onChange({ terms: e.target.value })}
              placeholder="Share expectations, payment timing, or any special rules."
              className="resize-none bg-[var(--surface-deep)]/50"
            />
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              This helps members join with confidence.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-2 rounded-[22px] border border-[var(--border-subtle)] p-5 sm:p-6 space-y-4">
        <button
          type="button"
          onClick={() => onChange({ hasPaymentDetails: !formData.hasPaymentDetails })}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-all",
            formData.hasPaymentDetails
              ? "border-[var(--accent-vivid)] bg-[var(--accent-vivid)]/8"
              : "border-[var(--border-subtle)] bg-[var(--surface-2)]/40"
          )}
        >
          <div className="text-left">
            <p className={cn("text-sm font-semibold", formData.hasPaymentDetails ? "text-[var(--accent-vivid)]" : "text-[var(--text-primary)]")}>
              Add payment details (optional)
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Accurate details let members launch direct UPI payments from the pool.
            </p>
          </div>
          <SelectionControl checked={formData.hasPaymentDetails} variant="checkbox" />
        </button>

        {formData.hasPaymentDetails && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                UPI ID
              </label>
              <Input
                value={paymentDetails.upiId}
                onChange={(e) => onChange({ paymentDetails: { ...paymentDetails, upiId: e.target.value } })}
                placeholder="name@bank"
                className="bg-[var(--surface-deep)]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                Account name
              </label>
              <Input
                value={paymentDetails.accountName}
                onChange={(e) => onChange({ paymentDetails: { ...paymentDetails, accountName: e.target.value } })}
                placeholder="Account holder"
                className="bg-[var(--surface-deep)]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                Bank name
              </label>
              <Input
                value={paymentDetails.bankName}
                onChange={(e) => onChange({ paymentDetails: { ...paymentDetails, bankName: e.target.value } })}
                placeholder="HDFC Bank"
                className="bg-[var(--surface-deep)]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                Account number
              </label>
              <Input
                value={paymentDetails.accountNumber}
                onChange={(e) => onChange({ paymentDetails: { ...paymentDetails, accountNumber: e.target.value } })}
                placeholder="XXXXXXXXXXXX"
                className="bg-[var(--surface-deep)]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                IFSC
              </label>
              <Input
                value={paymentDetails.ifsc}
                onChange={(e) => onChange({ paymentDetails: { ...paymentDetails, ifsc: e.target.value.toUpperCase() } })}
                placeholder="HDFC0001234"
                className="bg-[var(--surface-deep)]/50"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                Payment note (optional)
              </label>
              <Textarea
                rows={2}
                value={paymentDetails.note}
                onChange={(e) => onChange({ paymentDetails: { ...paymentDetails, note: e.target.value } })}
                placeholder="Any payment instructions for members"
                className="resize-none bg-[var(--surface-deep)]/50"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
