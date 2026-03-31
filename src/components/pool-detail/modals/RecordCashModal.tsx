import { useState } from "react";
import { useMutation } from "convex/react";
import * as Icons from "@/lib/icons";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/Surface";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFeedback } from "@/components/shared/FeedbackProvider";
import { DatePicker } from "@/components/ui/DatePicker";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { formatCurrency } from "@/lib/utils";

interface RecordCashModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolId: Id<"pools">;
  roundIndex: number;
  contribution: number;
  currency?: string;
  seatOptions: {
    seatId: Id<"seats">;
    seatNumber: number;
    userId?: Id<"users"> | null;
    userName?: string;
    isCoSeat?: boolean;
    coOwners?: {
      userId: Id<"users">;
      userName?: string;
      sharePercentage: number;
    }[];
  }[];
}

export function RecordCashModal({ open, onOpenChange, poolId, roundIndex, contribution, currency, seatOptions }: RecordCashModalProps) {
  const recordCash = useMutation(api.transactions.recordCashPayment);
  const feedback = useFeedback();

  const [selectedSeatId, setSelectedSeatId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSeat = seatOptions.find((seat) => seat.seatId === selectedSeatId);
  const needsPayerChoice = !!selectedSeat?.isCoSeat && !!selectedSeat.coOwners?.length;
  const selectedCoOwner = needsPayerChoice
    ? selectedSeat?.coOwners?.find((owner) => owner.userId === selectedUserId)
    : null;
  const previewAmount = needsPayerChoice
    ? ((contribution * (selectedCoOwner?.sharePercentage || 0)) / 100)
    : contribution;

  const handleSubmit = async () => {
    if (!selectedSeatId) return;
    if (needsPayerChoice && !selectedUserId) return;
    setIsSubmitting(true);
    try {
      await recordCash({
        poolId,
        seatId: selectedSeatId as Id<"seats">,
        roundIndex,
        userId: needsPayerChoice ? (selectedUserId as Id<"users">) : undefined,
        paidAt: new Date(paymentDate).getTime(),
      });
      feedback.toast.success("Cash payment recorded", "Transaction successful.");
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to record cash payment.";
      feedback.toast.error("Process failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-3 border border-[var(--border-subtle)] rounded-[32px] max-w-[400px] p-0 overflow-hidden outline-none flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-2 shrink-0 pr-12">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Organizer Tools</p>
            <DialogTitle className="font-display text-xl font-bold">Record Cash</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6 space-y-6 scrollbar-hide overscroll-contain">
          <Surface tier={2} className="grain p-4 rounded-2xl border border-[var(--border-subtle)]/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--warning)]/10 text-[var(--warning)] flex items-center justify-center border border-[var(--warning)]/20 font-bold text-sm">
                #{roundIndex}
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Active Round</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">Offline Payment</p>
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-[var(--surface-deep)]/60 flex items-center justify-center text-[var(--text-muted)]">
              <Icons.ContributionIcon size={16} />
            </div>
          </Surface>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-3">Select Member Seat</label>
              <Select
                value={selectedSeatId}
                onValueChange={(value) => {
                  setSelectedSeatId(value);
                  setSelectedUserId("");
                }}
              >
                <SelectTrigger className="h-12 rounded-full bg-[var(--surface-2)]/40 border-[var(--border-subtle)] focus:ring-[var(--accent-vivid)] px-5">
                  <SelectValue placeholder="Choose a seat..." />
                </SelectTrigger>
                <SelectContent className="glass-3 rounded-[24px] border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-primary)]">
                  {seatOptions.map((seat) => (
                    <SelectItem key={seat.seatId} value={seat.seatId} className="rounded-xl mx-1 my-0.5 pl-11 pr-4">
                      Seat #{seat.seatNumber}{seat.isCoSeat ? " · Co-seat" : seat.userName ? ` · ${seat.userName}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {needsPayerChoice && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-3">Select Co-seat Member</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="h-12 rounded-full bg-[var(--surface-2)]/40 border-[var(--border-subtle)] focus:ring-[var(--accent-vivid)] px-5">
                    <SelectValue placeholder="Choose a co-seat member..." />
                  </SelectTrigger>
                  <SelectContent className="glass-3 rounded-[24px] border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-primary)]">
                    {selectedSeat?.coOwners?.map((owner) => (
                      <SelectItem key={owner.userId} value={owner.userId} className="rounded-xl mx-1 my-0.5 pl-11 pr-4">
                        {(owner.userName || "Member") + ` · ${owner.sharePercentage}%`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedSeat && (
              <Surface tier={1} className="rounded-2xl border border-[var(--border-subtle)]/40 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Recording for</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                      {needsPayerChoice
                        ? `${selectedCoOwner?.userName || "Select a co-seat member"}`
                        : selectedSeat.userName || `Seat #${selectedSeat.seatNumber}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Amount</p>
                    <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">
                      {formatCurrency(previewAmount, currency)}
                    </p>
                  </div>
                </div>
              </Surface>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-3">Payment Date Received</label>
              <DatePicker
                value={paymentDate}
                onChange={setPaymentDate}
              />
            </div>
          </div>

          <Button
            className="w-full h-12 rounded-full bg-[var(--accent-vivid)] font-bold text-[var(--text-on-accent)] shadow-lg shadow-[var(--accent-vivid)]/20 disabled:opacity-50 disabled:text-[var(--text-on-accent)]/70"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedSeatId || (needsPayerChoice && !selectedUserId)}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Icons.LoadingIcon className="animate-spin" size={16} /> Recording...
              </span>
            ) : (
              "Confirm & Record"
            )}
          </Button>

          <p className="text-[10px] text-[var(--text-muted)] text-center px-4 leading-relaxed font-medium">
            This action will immediately mark the selected contribution as paid for the current round. Use it only after cash is received in hand.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
