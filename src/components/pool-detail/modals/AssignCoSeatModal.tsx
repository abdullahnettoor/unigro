import { useEffect, useState } from "react";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { useMutation } from "convex/react";

import { useFeedback } from "@/components/shared/FeedbackProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription,DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { isContactPickerSupported, selectContact } from "@/lib/contact-picker";
import * as Icons from "@/lib/icons";

import type { PoolSeat } from "../types";

interface AssignCoSeatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolId: Id<"pools">;
  fullSeats: PoolSeat[];
  isVerified: boolean;
}

export function AssignCoSeatModal({ open, onOpenChange, poolId, fullSeats, isVerified }: AssignCoSeatModalProps) {
  const assignCoSeat = useMutation(api.seats.assignCoSeat);
  const feedback = useFeedback();

  const coSeatOptions = fullSeats.filter(s =>
    s.status === "OPEN" ||
    (s.isCoSeat && (s.remainingPercentage ?? 0) > 0)
  );

  const [selectedSeat, setSelectedSeat] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [shareInput, setShareInput] = useState("50");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactPicker = async () => {
    const result = await selectContact();
    if (result) {
      if (result.name) setName(result.name);
      if (result.phone) setPhone(result.phone);
    }
  };


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
  const parsedShare = Number.parseInt(shareInput, 10);

  useEffect(() => {
    if (!open) {
      setShareInput("50");
      return;
    }
    if (!Number.isFinite(parsedShare)) return;
    const clamped = Math.min(Math.max(parsedShare, 1), Math.max(availableShare, 1));
    if (clamped !== parsedShare) setShareInput(String(clamped));
  }, [availableShare, open, parsedShare]);

  const handleSubmit = async () => {
    if (!selectedSeat) {
      feedback.toast.error("Required", "Select a seat.");
      return;
    }
    if (!name.trim()) {
      feedback.toast.error("Invalid input", "Please enter a name.");
      return;
    }
    if (!Number.isFinite(parsedShare) || parsedShare < 1 || parsedShare > availableShare) {
      feedback.toast.error("Invalid share", `Share must be 1–${availableShare}%.`);
      return;
    }
    setIsSubmitting(true);
    try {
      await assignCoSeat({ poolId, seatNumber: parseInt(selectedSeat), name, phone, sharePercentage: parsedShare });
      feedback.toast.success("Co-seat assigned", "Share added successfully.");
      onOpenChange(false);
      setName("");
      setPhone("");
      setShareInput(String(availableShare > 50 ? 50 : availableShare));
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
                  <SelectContent className="glass-3 rounded-[24px] border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-primary)]">
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
                  step={1}
                  inputMode="numeric"
                  value={shareInput}
                  onChange={(e) => setShareInput(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  onBlur={() => {
                    const raw = Number.parseInt(shareInput, 10);
                    if (!Number.isFinite(raw)) {
                      setShareInput("1");
                      return;
                    }
                    const clamped = Math.min(Math.max(raw, 1), Math.max(availableShare, 1));
                    setShareInput(String(clamped));
                  }}
                  className="bg-[var(--surface-0)]/70 h-12 rounded-full border-[var(--border-subtle)]/80 shadow-sm font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  placeholder="%"
                />
              </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Full Name</label>
                  {isContactPickerSupported() && (
                    <button
                      type="button"
                      onClick={handleContactPicker}
                      className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-vivid)] hover:opacity-80 transition-opacity flex items-center gap-1.5 py-0.5"
                    >
                      <Icons.ContactIcon size={12} className="text-[var(--accent-vivid)]" />
                      <span>Select Contact</span>
                    </button>
                  )}
                </div>

                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[var(--surface-0)]/70 h-12 rounded-full border-[var(--border-subtle)]/80 shadow-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
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

        <DialogFooter className="p-7 pt-0 flex flex-col items-stretch gap-3 shrink-0 sm:flex-col sm:space-x-0">
          <div className="flex flex-col gap-3 w-full">
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !isVerified} 
              className="h-12 w-full rounded-full bg-[var(--accent-vivid)] font-bold text-[var(--text-on-accent)] shadow-[0_12px_28px_rgba(var(--accent-glow),0.25)] hover:bg-[var(--accent-vivid)]/90 transition-all disabled:opacity-50 disabled:grayscale-[0.5]"
            >
              {isSubmitting ? <Icons.LoadingIcon className="h-4 w-4 animate-spin mr-2" /> : <Icons.LayersIcon size={16} className="mr-2" />}
              {isVerified ? "Assign share" : "Verification Required"}
            </Button>
            {!isVerified && (
               <p className="text-[10px] text-center text-[var(--accent-vivid)] font-medium px-2 leading-tight">
                 Complete your identity verification in Settings to invite members.
               </p>
            )}
            <Button variant="outline" className="h-12 w-full rounded-full border-[var(--border-subtle)] text-[var(--text-muted)] font-bold hover:bg-[var(--surface-2)]/60 hover:text-[var(--text-primary)] transition-all" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
