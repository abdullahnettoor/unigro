import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import * as Icons from "@/lib/icons";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Surface } from "@/components/ui/Surface";
import { useFeedback } from "@/components/shared/FeedbackProvider";
import { getCurrencySymbol } from "@/lib/utils";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";

interface RecordPayoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolId: Id<"pools">;
  currentRound: number;
  seatOptions: { seatId: Id<"seats">; seatNumber: number; roundWon?: number; userName?: string }[];
  defaultAmount?: number;
  currency: string;
}

export function RecordPayoutModal({ open, onOpenChange, poolId, currentRound, seatOptions, defaultAmount = 0, currency }: RecordPayoutModalProps) {
  const recordPayout = useMutation(api.transactions.recordPayout);
  const feedback = useFeedback();

  const [selectedRound, setSelectedRound] = useState<string>(String(currentRound));
  const [selectedSeatId, setSelectedSeatId] = useState<string>("");
  const [amount, setAmount] = useState(defaultAmount);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-prefill winner seat when round changes
  useEffect(() => {
    const winner = seatOptions.find(s => s.roundWon === Number(selectedRound));
    if (winner) {
      setSelectedSeatId(winner.seatId);
    }
  }, [selectedRound, seatOptions]);

  const selectedSeat = seatOptions.find(s => s.seatId === selectedSeatId);

  const handleSubmit = async () => {
    if (!selectedSeatId || !selectedSeat) return;
    setIsSubmitting(true);
    try {
      await recordPayout({
        poolId,
        seatId: selectedSeatId as Id<"seats">,
        roundIndex: Number(selectedRound),
        amount,
        notes
      });
      feedback.toast.success("Payout recorded", "The winner pool has been marked as paid.");
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to record payout.";
      feedback.toast.error("Process failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const rounds = Array.from({ length: currentRound }, (_, i) => String(i + 1)).reverse();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-3 border border-[var(--border-subtle)] rounded-[32px] max-w-[400px] p-0 overflow-hidden outline-none flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-2 shrink-0 pr-12">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Payout Record</p>
            <DialogTitle className="font-display text-xl font-bold">Record Payout</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6 space-y-6 scrollbar-hide overscroll-contain">
          <Surface tier={2} className="grain p-4 rounded-2xl border border-[var(--border-subtle)]/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--completed)]/10 text-[var(--completed)] flex items-center justify-center border border-[var(--completed)]/20 shadow-inner">
                <Icons.WinnerIcon size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Round Winner</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">Confirm payout to member</p>
              </div>
            </div>
          </Surface>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-3">Select Round</label>
              <Select value={selectedRound} onValueChange={setSelectedRound}>
                <SelectTrigger className="h-12 rounded-full bg-[var(--surface-2)]/40 border-[var(--border-subtle)] focus:ring-[var(--accent-vivid)] px-5">
                  <SelectValue placeholder="Round" />
                </SelectTrigger>
                <SelectContent className="glass-3 rounded-[24px] border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-primary)]">
                  {rounds.map((r) => (
                    <SelectItem key={r} value={r} className="rounded-xl mx-1 my-0.5 pl-11 pr-4">
                      Round {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-3">Winner Member</label>
              <Select value={selectedSeatId} onValueChange={setSelectedSeatId}>
                <SelectTrigger className="h-12 rounded-full bg-[var(--surface-2)]/40 border-[var(--border-subtle)] focus:ring-[var(--accent-vivid)] px-5">
                  <SelectValue placeholder="Select winner...">
                    {selectedSeat && (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[var(--text-primary)]">#{selectedSeat.seatNumber}</span>
                        <span className="text-[var(--text-muted)] opacity-40 text-[10px]">•</span>
                        <span className="font-bold text-[var(--text-primary)]">{selectedSeat.userName}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="glass-3 rounded-[24px] border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-primary)]">
                  {seatOptions.map((seat) => (
                    <SelectItem key={seat.seatId} value={seat.seatId} className="rounded-xl mx-1 my-0.5 pl-11 pr-4 font-medium">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[var(--text-muted)] font-black text-xs">#{seat.seatNumber}</span>
                        <span className="text-[var(--text-muted)] opacity-30 text-[10px]">•</span>
                        <span className="font-bold text-[var(--text-primary)]">{seat.userName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-3">Payout Amount</label>
              <div className="relative">
                <Input
                  type="number"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="h-12 rounded-full bg-[var(--surface-2)]/40 border-[var(--border-subtle)] focus:ring-[var(--accent-vivid)] px-5 pl-14"
                />
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold text-xs">
                  {getCurrencySymbol(currency, true)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-3">Internal Notes (Optional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Reference number, specific details..."
                className="h-12 rounded-full bg-[var(--surface-2)]/40 border-[var(--border-subtle)] focus:ring-[var(--accent-vivid)] px-5"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedSeatId}
              className="w-full h-12 rounded-full bg-[var(--accent-vivid)] font-bold text-[var(--text-on-accent)] shadow-lg shadow-[var(--accent-vivid)]/20 disabled:text-[var(--text-on-accent)]/70"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Icons.LoadingIcon className="animate-spin" size={16} /> Recording Payout...
                </span>
              ) : (
                "Confirm & Record Payout"
              )}
            </Button>
          </div>

          <p className="text-[10px] text-[var(--text-muted)] text-center px-4 leading-relaxed font-medium">
            This action will mark the winner as paid. Ensure that the actual transfer has been completed before recording.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
