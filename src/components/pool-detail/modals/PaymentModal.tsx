import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import * as Icons from "@/lib/icons";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/Surface";
import { useFeedback } from "@/components/shared/FeedbackProvider";
import { formatCurrency, cn } from "@/lib/utils";
import { api } from "@convex/api";
import { DatePicker } from "@/components/ui/DatePicker";
import type { Id } from "@convex/dataModel";
import type { PoolPaymentDetails } from "../types";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolId: Id<"pools">;
  seatId: Id<"seats">;
  roundIndex: number;
  amount: number;
  currency?: string;
  isOrganizer?: boolean;
  paymentDetails?: PoolPaymentDetails;
  onOrganizerRecord?: (date: number) => Promise<void>;
}

export function PaymentModal({
  open,
  onOpenChange,
  poolId,
  seatId,
  roundIndex,
  amount,
  currency,
  isOrganizer,
  paymentDetails,
  onOrganizerRecord,
}: PaymentModalProps) {
  const generateUploadUrl = useMutation(api.transactions.generateUploadUrl);
  const submitPayment = useMutation(api.transactions.submitPayment);
  const feedback = useFeedback();

  const [paymentType, setPaymentType] = useState<"online" | "cash" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      setFile(selected);
      setError("");

      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    feedback.toast.success(`${label} Copied`);
  };

  const handleOnlineSubmit = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }
    setIsSubmitting(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();
      await submitPayment({ poolId, seatId, roundIndex, storageId, type: "online" });
      onOpenChange(false);
      feedback.toast.success("Payment submitted", "Waiting for organizer approval.");
    } catch (err) {
      setError("Failed to upload proof.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCashSubmit = async () => {
    if (isOrganizer && onOrganizerRecord) {
      setIsSubmitting(true);
      try {
        await onOrganizerRecord(new Date(paymentDate).getTime());
        onOpenChange(false);
        feedback.toast.success("Payment recorded");
      } catch (err) {
        setError("Failed to record payment.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const ok = await feedback.confirm({
      title: "Confirm cash payment?",
      message: "The organizer will need to verify and approve this request.",
      confirmText: "Request Approval",
    });
    if (!ok) return;

    setIsSubmitting(true);
    try {
      await submitPayment({ poolId, seatId, roundIndex, type: "cash", remarks: "Cash payment pending approval" });
      feedback.toast.success("Request submitted", "Waiting for organizer confirmation.");
      onOpenChange(false);
    } catch (err) {
      setError("Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-3 border border-[var(--border-subtle)] rounded-[32px] max-w-[400px] p-0 overflow-hidden outline-none flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-2 shrink-0 pr-12">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Financial</p>
            <DialogTitle className="font-display text-xl font-bold">
              {!paymentType ? "Select Method" : "Make Payment"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6 space-y-6 scrollbar-hide overscroll-contain">
          {/* Summary Card - Persistent context */}
          <Surface tier={2} className="grain p-4 rounded-2xl border border-[var(--border-subtle)]/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--accent-vivid)]/10 text-[var(--accent-vivid)] flex items-center justify-center border border-[var(--accent-vivid)]/20 font-bold text-sm">
                #{roundIndex}
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Round Cycle</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">Payment Due</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-[var(--text-primary)] font-mono">
                {formatCurrency(amount, currency)}
              </p>
            </div>
          </Surface>

          {!paymentType ? (
            <div className="space-y-6 pb-4">
              <div className="space-y-1 text-center px-4">
                <p className="text-sm font-medium text-[var(--text-primary)]">Select payment method</p>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">Choose how you'd like to pay for this round.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentType("online")}
                  className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/40 hover:bg-[var(--accent-vivid)]/10 hover:border-[var(--accent-vivid)]/40 transition-all duration-300"
                >
                  <div className="h-12 w-12 rounded-full bg-[var(--surface-deep)]/60 flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--accent-vivid)] group-hover:bg-[var(--accent-vivid)]/10 transition-colors">
                    <Icons.TransactionIcon size={24} />
                  </div>
                  <span className="text-sm font-bold text-[var(--text-primary)]">Online</span>
                </button>
                <button
                  onClick={() => setPaymentType("cash")}
                  className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/40 hover:bg-[var(--warning)]/10 hover:border-[var(--warning)]/40 transition-all duration-300"
                >
                  <div className="h-12 w-12 rounded-full bg-[var(--surface-deep)]/60 flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--warning)] group-hover:bg-[var(--warning)]/10 transition-colors">
                    <Icons.ContributionIcon size={24} />
                  </div>
                  <span className="text-sm font-bold text-[var(--text-primary)]">Cash</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <button
                onClick={() => { setPaymentType(null); setFile(null); setFilePreview(null); }}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                disabled={isSubmitting}
              >
                <Icons.ArrowIcon size={12} className="rotate-180" /> Change Method
              </button>

              {paymentType === "online" ? (
                <div className="space-y-5">
                  {/* Bank Details section if available */}
                  {paymentDetails && (
                    <div className="space-y-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Payment Target</p>
                      <Surface tier={1} className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-3)]/40 space-y-3">
                        {paymentDetails.upiId && (
                          <div className="flex items-center justify-between group cursor-pointer" onClick={() => copyToClipboard(paymentDetails.upiId!, "UPI ID")}>
                            <div className="flex items-center gap-2.5">
                              <Icons.ZapIcon size={14} className="text-[var(--accent-vivid)]" />
                              <div className="min-w-0">
                                <p className="text-[9px] uppercase font-bold text-[var(--text-muted)] leading-none mb-1">UPI ID</p>
                                <p className="text-xs font-mono font-medium truncate text-[var(--text-primary)]">{paymentDetails.upiId}</p>
                              </div>
                            </div>
                            <Icons.CopyIcon size={12} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                        {paymentDetails.accountNumber && (
                          <div className="flex items-center justify-between group border-t border-[var(--border-subtle)]/30 pt-3 cursor-pointer" onClick={() => copyToClipboard(paymentDetails.accountNumber!, "Account Number")}>
                            <div className="flex items-center gap-2.5">
                              <Icons.BankIcon size={14} className="text-[var(--accent-vivid)]" />
                              <div>
                                <p className="text-[9px] uppercase font-bold text-[var(--text-muted)] leading-none mb-1">{paymentDetails.bankName || "Account"}</p>
                                <p className="text-xs font-mono font-medium text-[var(--text-primary)]">{paymentDetails.accountNumber}</p>
                              </div>
                            </div>
                            <Icons.CopyIcon size={12} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </Surface>
                    </div>
                  )}

                  {/* Upload Zone */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Upload Receipt</p>
                    <div
                      onClick={() => !isSubmitting && fileInputRef.current?.click()}
                      className={cn(
                        "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300 p-8 text-center",
                        file ? "border-[var(--accent-vivid)]/40 bg-[var(--accent-vivid)]/[0.03]" : "border-[var(--border-subtle)] bg-[var(--surface-2)]/40 hover:bg-[var(--surface-3)]/60 cursor-pointer"
                      )}
                    >
                      {filePreview ? (
                        <div className="space-y-3">
                          <img src={filePreview} alt="Preview" className="h-24 w-auto rounded-xl border border-[var(--border-subtle)] mx-auto object-cover" />
                          <p className="text-xs font-mono text-[var(--text-muted)] truncate max-w-[200px] mx-auto">{file?.name}</p>
                        </div>
                      ) : (
                        <>
                          <div className="h-12 w-12 rounded-full bg-[var(--surface-deep)]/60 flex items-center justify-center text-[var(--text-muted)] mb-3">
                            <Icons.UploadImageIcon size={24} />
                          </div>
                          <p className="text-xs font-bold text-[var(--text-primary)]">Select payment proof</p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-1 tracking-tight">Screenshots or PDFs up to 5MB</p>
                        </>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 rounded-full bg-[var(--accent-vivid)] font-bold text-white shadow-lg shadow-[var(--accent-vivid)]/20 disabled:opacity-50"
                    onClick={handleOnlineSubmit}
                    disabled={isSubmitting || !file}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Icons.LoadingIcon className="animate-spin" size={16} /> Submitting...
                      </span>
                    ) : (
                      "Confirm Payment"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {isOrganizer ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-1">Payment Received Date</label>
                        <DatePicker
                          value={paymentDate}
                          onChange={setPaymentDate}
                        />
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] px-1 italic leading-relaxed">
                        Recording as the organizer: This will immediately mark the seat as paid for this round.
                      </p>
                    </div>
                  ) : (
                    <Surface tier={1} className="p-4 rounded-2xl border border-[var(--warning)]/30 bg-[var(--warning)]/10 text-center">
                      <p className="text-sm font-medium text-[var(--text-primary)]">Handed cash to the organizer?</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-2 font-bold uppercase tracking-tighter">Organizer approval required</p>
                    </Surface>
                  )}

                  <Button
                    className={cn(
                      "w-full h-12 rounded-full font-bold text-white shadow-lg disabled:opacity-50",
                      isOrganizer ? "bg-[var(--accent-vivid)] shadow-[var(--accent-vivid)]/20" : "bg-[var(--warning)] shadow-[var(--warning)]/20"
                    )}
                    onClick={handleCashSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Icons.LoadingIcon className="animate-spin" size={16} /> Processing...
                      </span>
                    ) : (
                      isOrganizer ? "Confirm Cash Received" : "Confirm Cash Paid"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)]">
              <Icons.InfoIcon size={14} />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
