import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import * as Icons from "@/lib/icons";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import { useFeedback } from "@/components/shared/FeedbackProvider";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import type { PoolSeat } from "../types";

interface AssignCoSeatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolId: Id<"pools">;
  fullSeats: PoolSeat[];
}

export function AssignCoSeatModal({ open, onOpenChange, poolId, fullSeats }: AssignCoSeatModalProps) {
  const assignCoSeat = useMutation(api.seats.assignCoSeat);
  const feedback = useFeedback();

  const coSeatOptions = fullSeats.filter(s =>
    s.status === "OPEN" ||
    (s.isCoSeat && (s.remainingPercentage ?? 0) > 0)
  );

  const [selectedSeat, setSelectedSeat] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [share, setShare] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-select first available co-seat or open seat
  useEffect(() => {
    if (open && coSeatOptions.length > 0 && !selectedSeat) {
      // Prefer partial seats
      const partial = coSeatOptions.find(o => o.isCoSeat);
      setSelectedSeat(partial ? partial.seatNumber.toString() : coSeatOptions[0].seatNumber.toString());
    }
  }, [open, coSeatOptions, selectedSeat]);

  const currentSeat = coSeatOptions.find(o => o.seatNumber.toString() === selectedSeat);
  const availableShare = currentSeat?.isCoSeat ? (currentSeat.remainingPercentage ?? 0) : 100;

  const handleSubmit = async () => {
    if (!selectedSeat) {
      feedback.toast.error("Required", "Select a seat.");
      return;
    }
    if (!name.trim()) {
      feedback.toast.error("Invalid input", "Please enter a name.");
      return;
    }
    if (share < 1 || share > availableShare) {
      feedback.toast.error("Invalid share", `Share must be 1–${availableShare}%.`);
      return;
    }
    setIsSubmitting(true);
    try {
      await assignCoSeat({ poolId, seatNumber: parseInt(selectedSeat), name, phone, sharePercentage: share });
      feedback.toast.success("Co-seat assigned", "Share added successfully.");
      onOpenChange(false);
      setName("");
      setPhone("");
      setShare(availableShare > 50 ? 50 : availableShare);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to assign co-seat.";
      feedback.toast.error("Failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-3 border border-[var(--border-subtle)] max-w-sm rounded-[32px] p-0 focus:outline-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-7 pb-2 shrink-0 pr-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Allocation Split</p>
          <DialogTitle className="font-display text-xl font-bold text-[var(--text-primary)] leading-tight">Assign co-seat owner</DialogTitle>
          <DialogDescription className="text-sm text-[var(--text-muted)] leading-relaxed">
            Split any available seat with multiple people.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 px-7 pb-7 space-y-5 scrollbar-hide overscroll-contain">
          <div className="mt-4 space-y-5">
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] ml-1">Seat</label>
                <Select value={selectedSeat} onValueChange={setSelectedSeat}>
                  <SelectTrigger className="bg-[var(--surface-0)]/70 h-12 rounded-full border-[var(--border-subtle)]/80 shadow-sm">
                    <SelectValue placeholder="Seat" />
                  </SelectTrigger>
                  <SelectContent className="glass-3 rounded-[24px] border-[var(--border-subtle)]">
                    {coSeatOptions.map((seat) => (
                      <SelectItem key={seat.seatNumber} value={seat.seatNumber.toString()} className="rounded-xl">
                        #{seat.seatNumber} {seat.isCoSeat ? `(${seat.remainingPercentage}% left)` : "(Open)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] ml-1">Share %</label>
                <Input
                  type="number"
                  min={1}
                  max={availableShare}
                  value={share}
                  onChange={(e) => setShare(Number(e.target.value))}
                  className="bg-[var(--surface-0)]/70 h-12 rounded-full border-[var(--border-subtle)]/80 shadow-sm font-mono"
                  placeholder="%"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] ml-1">Full Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[var(--surface-0)]/70 h-12 rounded-full border-[var(--border-subtle)]/80 shadow-sm"
                placeholder="e.g. Rahul Verma"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] ml-1">Phone Number</label>
              <PhoneInputField
                value={phone}
                onChange={setPhone}
                className="bg-[var(--surface-0)]/70 h-12 rounded-full border-[var(--border-subtle)]/80 shadow-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-7 pt-0 flex flex-col items-stretch gap-3 shrink-0 sm:space-x-0">
          <Button onClick={handleSubmit} disabled={isSubmitting} className="h-12 w-full rounded-full bg-[var(--accent-vivid)] font-bold text-white shadow-[0_12px_28px_rgba(var(--accent-glow),0.25)] hover:bg-[var(--accent-vivid)]/90 transition-all">
            {isSubmitting ? <Icons.LoadingIcon className="h-4 w-4 animate-spin mr-2" /> : <Icons.LayersIcon size={16} className="mr-2" />}
            Assign share
          </Button>
          <Button variant="outline" className="h-12 w-full rounded-full border-[var(--border-subtle)] text-[var(--text-muted)] font-bold hover:bg-[var(--surface-2)]/60 hover:text-[var(--text-primary)] transition-all" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
