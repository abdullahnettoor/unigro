import { useEffect, useRef, useState } from "react";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { useMutation } from "convex/react";

import { useFeedback } from "@/components/shared/FeedbackProvider";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SelectionControl } from "@/components/ui/selection-control";
import { Surface } from "@/components/ui/Surface";
import * as Icons from "@/lib/icons";
import { compressImage,formatBytes } from "@/lib/image-compression";
import {
  buildGenericUpiLink,
  buildIosUpiOptions,
  createUpiPayload,
  detectUpiPlatform,
  launchUpiLink,
} from "@/lib/upi";
import { cn,formatCurrency } from "@/lib/utils";

import type { PoolPaymentDetails, PoolTransaction } from "../types";

const PENDING_UPI_RETURN_KEY = "unigro_pending_upi_return";

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
  poolTitle?: string;
  existingTransaction?: PoolTransaction | null;
  onOrganizerRecord?: (date: number) => Promise<void>;
}

type PaymentType = "upi" | "online" | "cash" | null;
type UpiStage = "idle" | "launched";

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
  poolTitle,
  existingTransaction,
  onOrganizerRecord,
}: PaymentModalProps) {
  const generateUploadUrl = useMutation(api.transactions.generateUploadUrl);
  const submitPayment = useMutation(api.transactions.submitPayment);
  const feedback = useFeedback();
  const platform = detectUpiPlatform();
  const hasUpi = !!paymentDetails?.upiId && !isOrganizer;
  const upiPayload = paymentDetails
    ? createUpiPayload({
        paymentDetails,
        amount,
        poolTitle: poolTitle || "UniGro pool",
        roundIndex,
        currency: currency || "INR",
      })
    : null;
  const iosUpiOptions = upiPayload ? buildIosUpiOptions(upiPayload) : [];

  const [paymentType, setPaymentType] = useState<PaymentType>(hasUpi ? "upi" : null);
  const [upiStage, setUpiStage] = useState<UpiStage>(existingTransaction?.type === "upi" ? "launched" : "idle");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const persistPendingReturn = () => {
    sessionStorage.setItem(
      PENDING_UPI_RETURN_KEY,
      JSON.stringify({ poolId, seatId, roundIndex, at: Date.now() })
    );
  };

  const clearPendingReturn = () => {
    const raw = sessionStorage.getItem(PENDING_UPI_RETURN_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { poolId: string; seatId: string; roundIndex: number };
      if (parsed.poolId === poolId && parsed.seatId === seatId && parsed.roundIndex === roundIndex) {
        sessionStorage.removeItem(PENDING_UPI_RETURN_KEY);
      }
    } catch {
      sessionStorage.removeItem(PENDING_UPI_RETURN_KEY);
    }
  };

  useEffect(() => {
    if (!open) return;
    setError("");
    setFile(null);
    setFilePreview(null);
    setCashConfirmed(false);
    if (existingTransaction?.type === "upi") {
      setPaymentType("upi");
      setUpiStage("launched");
      return;
    }
    if (existingTransaction?.type === "cash") {
      setPaymentType("cash");
      setUpiStage("idle");
      return;
    }
    if (hasUpi) {
      setPaymentType("upi");
      setUpiStage("idle");
      return;
    }
    if (existingTransaction?.type === "online") {
      setPaymentType("online");
      setUpiStage("idle");
      return;
    }
    setPaymentType(null);
    setUpiStage("idle");
  }, [open, existingTransaction, hasUpi]);

  useEffect(() => {
    if (!open) return;
    const handleReturn = () => {
      if (document.visibilityState === "hidden") return;
      const raw = sessionStorage.getItem(PENDING_UPI_RETURN_KEY);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as { poolId: string; seatId: string; roundIndex: number };
        if (parsed.poolId === poolId && parsed.seatId === seatId && parsed.roundIndex === roundIndex) {
          setPaymentType("upi");
          setUpiStage("launched");
          feedback.toast.info("Back in UniGro", "Upload your screenshot so the organizer can verify the payment.");
        }
      } catch {
        sessionStorage.removeItem(PENDING_UPI_RETURN_KEY);
      }
    };

    window.addEventListener("focus", handleReturn);
    document.addEventListener("visibilitychange", handleReturn);
    return () => {
      window.removeEventListener("focus", handleReturn);
      document.removeEventListener("visibilitychange", handleReturn);
    };
  }, [open, poolId, seatId, roundIndex, feedback]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setIsCompressing(true);
    setError("");

    try {
      const originalSize = selected.size;
      // Target 100-200kb with 0.5 quality and 1000px max dimension
      const compressed = await compressImage(selected, { 
        quality: 0.5,
        maxWidth: 1000,
        maxHeight: 1000 
      });
      const compressedSize = compressed.size;

      console.log(`[Compression] ${selected.name}: ${formatBytes(originalSize)} -> ${formatBytes(compressedSize)} (${Math.round((1 - compressedSize / originalSize) * 100)}% reduction)`);

      setFile(compressed);

      if (compressed.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(compressed);
      } else {
        setFilePreview(null);
      }
    } catch (err) {
      console.error("Compression failed:", err);
      // Fallback to original if compression fails
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(selected);
    } finally {
      setIsCompressing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    feedback.toast.success(`${label} copied`);
  };

  const uploadProofAndSubmit = async (type: "online" | "upi") => {
    if (!file) {
      setError("Please select a screenshot or receipt first.");
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
      await submitPayment({
        poolId,
        seatId,
        roundIndex,
        storageId,
        type,
        remarks:
          type === "upi"
            ? "UPI payment submitted for organizer approval"
            : "Online payment submitted for organizer approval",
      });
      clearPendingReturn();
      onOpenChange(false);
      feedback.toast.success("Payment submitted", "Waiting for organizer approval.");
    } catch {
      setError("Failed to upload proof.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLaunchUpi = async (deepLink: string, paymentApp?: string) => {
    if (!upiPayload) {
      setError("UPI details are unavailable for this pool.");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitPayment({
        poolId,
        seatId,
        roundIndex,
        type: "upi",
        remarks: "UPI payment launched. Waiting for organizer approval.",
        paymentApp,
        initiatedAt: Date.now(),
        upiDeepLinkUsed: deepLink,
      });
      persistPendingReturn();
      setUpiStage("launched");
      feedback.toast.success("UPI app opening", "Return here after payment and upload your screenshot.");
      launchUpiLink(deepLink);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start the UPI flow.";
      setError(message);
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
      } catch {
        setError("Failed to record payment.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPayment({ poolId, seatId, roundIndex, type: "cash", remarks: "Cash payment pending approval" });
      clearPendingReturn();
      feedback.toast.success("Request submitted", "Waiting for organizer confirmation.");
      onOpenChange(false);
    } catch {
      setError("Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetToMethodChoice = () => {
    setPaymentType(hasUpi ? "upi" : null);
    setUpiStage("idle");
    setFile(null);
    setFilePreview(null);
    setCashConfirmed(false);
    setError("");
  };

  const title =
    !paymentType ? "Select Method" : paymentType === "upi" ? "Pay with UPI" : paymentType === "online" ? "Upload Proof" : "Cash Payment";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-3 border border-[var(--border-subtle)] rounded-[32px] max-w-[420px] p-0 overflow-hidden outline-none flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-2 shrink-0 pr-12">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Financial</p>
            <DialogTitle className="font-display text-xl font-bold">{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6 space-y-6 scrollbar-hide overscroll-contain">
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
              <p className="text-lg font-black text-[var(--text-primary)] font-mono">{formatCurrency(amount, currency)}</p>
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
                onClick={resetToMethodChoice}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                disabled={isSubmitting}
              >
                <Icons.ArrowIcon size={12} className="rotate-180" /> Change Method
              </button>

              {paymentType === "upi" ? (
                <div className="space-y-5">
                  {upiPayload && (
                    <Surface tier={1} className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-3)]/40 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase font-bold text-[var(--text-muted)] leading-none mb-1">UPI ID</p>
                          <p className="text-xs font-mono font-medium truncate text-[var(--text-primary)]">{upiPayload.payeeVpa}</p>
                        </div>
                        <Button type="button" size="sm" variant="ghost" className="h-8 rounded-full px-3" onClick={() => copyToClipboard(upiPayload.payeeVpa, "UPI ID")}>
                          <Icons.CopyIcon size={14} />
                        </Button>
                      </div>
                      <div className="grid gap-2 text-xs text-[var(--text-muted)] sm:grid-cols-2">
                        <p><span className="font-semibold text-[var(--text-primary)]">Payee:</span> {upiPayload.payeeName}</p>
                        <p><span className="font-semibold text-[var(--text-primary)]">Amount:</span> {formatCurrency(amount, currency)}</p>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        Launch your UPI app, complete the payment, then return here and upload a screenshot for organizer approval.
                      </p>
                    </Surface>
                  )}

                  {upiStage === "idle" ? (
                    <>
                      {platform === "ios" ? (
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Choose UPI app</p>
                          <div className="grid grid-cols-2 gap-3">
                            {iosUpiOptions.map((option) => (
                              <Button
                                key={option.id}
                                type="button"
                                variant="secondary"
                                className="h-12 rounded-2xl font-bold"
                                disabled={isSubmitting}
                                onClick={() => void handleLaunchUpi(option.deepLink, option.id)}
                              >
                                {option.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Button
                          className="w-full h-12 rounded-full bg-[var(--accent-vivid)] font-bold text-[var(--text-on-accent)] shadow-lg shadow-[var(--accent-vivid)]/20"
                          onClick={() => upiPayload && void handleLaunchUpi(buildGenericUpiLink(upiPayload), "generic")}
                          disabled={isSubmitting || !upiPayload}
                        >
                          {platform === "android" ? "Open UPI App" : "Try UPI Link"}
                        </Button>
                      )}

                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setPaymentType("cash")}
                          className="rounded-2xl border border-[var(--warning)]/25 bg-[var(--warning)]/8 px-4 py-4 text-left transition-colors hover:bg-[var(--warning)]/12"
                        >
                          <p className="text-sm font-semibold text-[var(--text-primary)]">Paid in cash</p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">Send a cash approval request instead.</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentType("online")}
                          className="rounded-2xl border border-[var(--border-subtle)]/60 bg-[var(--surface-2)]/35 px-4 py-4 text-left transition-colors hover:bg-[var(--surface-2)]/55"
                        >
                          <p className="text-sm font-semibold text-[var(--text-primary)]">Upload proof manually</p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">Use this if you already paid outside the UPI launch.</p>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <Surface tier={2} className="rounded-2xl border border-[var(--accent-vivid)]/25 bg-[var(--accent-vivid)]/10 p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-vivid)]/15 text-[var(--accent-vivid)]">
                            <Icons.InfoIcon size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">Payment done in your UPI app?</p>
                            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                              Upload the screenshot now so the organizer can verify this round payment quickly.
                            </p>
                          </div>
                        </div>
                      </Surface>

                      <Surface tier={1} className="p-4 rounded-2xl border border-[var(--accent-vivid)]/25 bg-[var(--accent-vivid)]/8">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Waiting for your proof</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">
                          Your payment request is now pending. Upload a screenshot to help the organizer verify it faster.
                        </p>
                      </Surface>

                      <div className="space-y-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Upload screenshot</p>
                        <div
                          onClick={() => !isSubmitting && !isCompressing && fileInputRef.current?.click()}
                          className={cn(
                            "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300 p-8 text-center",
                            file ? "border-[var(--accent-vivid)]/40 bg-[var(--accent-vivid)]/[0.03]" : "border-[var(--border-subtle)] bg-[var(--surface-2)]/40 hover:bg-[var(--surface-3)]/60 cursor-pointer"
                          )}
                        >
                          {isCompressing ? (
                            <div className="flex flex-col items-center gap-3">
                                <Icons.LoadingIcon className="h-6 w-6 animate-spin text-[var(--accent-vivid)]" />
                                <span className="text-[10px] font-bold text-[var(--accent-vivid)] uppercase tracking-widest">Optimizing...</span>
                            </div>
                          ) : filePreview ? (
                            <div className="space-y-3">
                              <img src={filePreview} alt="Preview" className="h-24 w-auto rounded-xl border border-[var(--border-subtle)] mx-auto object-cover" />
                              <p className="text-xs font-mono text-[var(--text-muted)] truncate max-w-[200px] mx-auto">{file?.name}</p>
                            </div>
                          ) : (
                            <>
                              <div className="h-12 w-12 rounded-full bg-[var(--surface-deep)]/60 flex items-center justify-center text-[var(--text-muted)] mb-3">
                                <Icons.UploadImageIcon size={24} />
                              </div>
                              <p className="text-xs font-bold text-[var(--text-primary)]">Select payment screenshot</p>
                              <p className="text-[10px] text-[var(--text-muted)] mt-1 tracking-tight">JPEG or PNG up to 5MB</p>
                            </>
                          )}
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isCompressing} />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-11 rounded-2xl font-bold"
                          onClick={() => upiPayload && void handleLaunchUpi(platform === "ios" ? iosUpiOptions[0]?.deepLink || buildGenericUpiLink(upiPayload) : buildGenericUpiLink(upiPayload), platform === "ios" ? iosUpiOptions[0]?.id : "generic")}
                          disabled={isSubmitting || !upiPayload}
                        >
                          Reopen UPI app
                        </Button>
                        <Button
                          type="button"
                          className="h-11 rounded-2xl bg-[var(--accent-vivid)] font-bold text-[var(--text-on-accent)]"
                          onClick={() => void uploadProofAndSubmit("upi")}
                          disabled={isSubmitting || !file}
                        >
                          {isSubmitting ? "Submitting..." : "Submit UPI Proof"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : paymentType === "online" ? (
                <div className="space-y-5">
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

                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Upload Receipt</p>
                    <div
                      onClick={() => !isSubmitting && !isCompressing && fileInputRef.current?.click()}
                      className={cn(
                        "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300 p-8 text-center",
                        file ? "border-[var(--accent-vivid)]/40 bg-[var(--accent-vivid)]/[0.03]" : "border-[var(--border-subtle)] bg-[var(--surface-2)]/40 hover:bg-[var(--surface-3)]/60 cursor-pointer"
                      )}
                    >
                      {isCompressing ? (
                        <div className="flex flex-col items-center gap-3">
                            <Icons.LoadingIcon className="h-6 w-6 animate-spin text-[var(--accent-vivid)]" />
                            <span className="text-[10px] font-bold text-[var(--accent-vivid)] uppercase tracking-widest">Optimizing...</span>
                        </div>
                      ) : filePreview ? (
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
                          <p className="text-[10px] text-[var(--text-muted)] mt-1 tracking-tight">JPEG or PNG up to 5MB</p>
                        </>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isCompressing} />
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 rounded-full bg-[var(--accent-vivid)] font-bold text-[var(--text-on-accent)] shadow-lg shadow-[var(--accent-vivid)]/20 disabled:opacity-50"
                    onClick={() => void uploadProofAndSubmit("online")}
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
                        <DatePicker value={paymentDate} onChange={setPaymentDate} />
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
                      "w-full h-12 rounded-full font-bold text-[var(--text-on-accent)] shadow-lg disabled:opacity-100",
                      isOrganizer ? "bg-[var(--accent-vivid)] shadow-[var(--accent-vivid)]/20" : "bg-[var(--warning)] shadow-[var(--warning)]/20"
                    )}
                    onClick={() => void handleCashSubmit()}
                    disabled={isSubmitting || (!isOrganizer && !cashConfirmed)}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Icons.LoadingIcon className="animate-spin" size={16} /> Processing...
                      </span>
                    ) : (
                      isOrganizer ? "Confirm Cash Received" : "Confirm Cash Paid"
                    )}
                  </Button>

                  {!isOrganizer && (
                    <button
                      type="button"
                      onClick={() => setCashConfirmed((prev) => !prev)}
                      className="w-full rounded-2xl border border-[var(--border-subtle)]/60 bg-[var(--surface-2)]/35 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-2)]/55"
                    >
                      <span className="flex items-start gap-3">
                        <SelectionControl checked={cashConfirmed} variant="checkbox" size="sm" className="mt-0.5" />
                        <span>
                          <span className="block text-sm font-semibold text-[var(--text-primary)]">I confirm I handed cash to the organizer</span>
                          <span className="mt-1 block text-xs text-[var(--text-muted)]">This will send an approval request to the organizer.</span>
                        </span>
                      </span>
                    </button>
                  )}
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
