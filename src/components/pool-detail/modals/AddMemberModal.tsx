import { useState } from "react";
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

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolId: Id<"pools">;
  fullSeats: PoolSeat[];
  isVerified: boolean;
}

export function AddMemberModal({ open, onOpenChange, poolId, fullSeats, isVerified }: AddMemberModalProps) {
  const assignSeat = useMutation(api.seats.assignSeat);
  const feedback = useFeedback();

  const availableSeats = fullSeats.filter(s => s.status === "OPEN");

  const [selectedSeat, setSelectedSeat] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-select first available
  useState(() => {
    if (availableSeats.length > 0) setSelectedSeat(availableSeats[0].seatNumber.toString());
  });

  const handleSubmit = async () => {
    if (!selectedSeat) {
      feedback.toast.error("Required", "Select a seat.");
      return;
    }
    if (!name.trim()) {
      feedback.toast.error("Invalid input", "Please enter a name.");
      return;
    }
    setIsSubmitting(true);
    try {
      await assignSeat({
        poolId,
        seatNumber: parseInt(selectedSeat),
        name,
        phone
      });
      feedback.toast.success("Member added", "Seat assigned successfully.");
      onOpenChange(false);
      setName("");
      setPhone("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to assign seat.";
      feedback.toast.error("Failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-3 border border-[var(--border-subtle)] max-w-sm rounded-[32px] p-0 overflow-hidden focus:outline-none shadow-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="p-7 pb-2 shrink-0 text-center sm:text-left pr-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Member Entry</p>
          <DialogTitle className="font-display text-xl font-bold text-[var(--text-primary)]">Add new member</DialogTitle>
          <DialogDescription className="text-sm text-[var(--text-muted)] leading-relaxed">
            Assign an open seat to a new pool member.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 px-7 pb-7 space-y-5 scrollbar-hide overscroll-contain">
          <div className="mt-4 space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] ml-1">Seat Number</label>
              <Select value={selectedSeat} onValueChange={setSelectedSeat}>
                <SelectTrigger className="bg-[var(--surface-0)]/70 h-12 rounded-full border-[var(--border-subtle)]/80 shadow-sm">
                  <SelectValue placeholder="Select an open seat" />
                </SelectTrigger>
                <SelectContent className="glass-3 rounded-[24px] border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-primary)]">
                  {availableSeats.map((seat) => (
                    <SelectItem key={seat.seatNumber} value={seat.seatNumber.toString()} className="rounded-xl">
                      Seat #{seat.seatNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] ml-1">Full Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[var(--surface-0)]/70 h-12 rounded-full border-[var(--border-subtle)]/80 shadow-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                placeholder="e.g. Arjun Kumar"
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
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !isVerified} 
            className="h-12 w-full rounded-full bg-[var(--accent-vivid)] font-bold text-[var(--text-on-accent)] shadow-[0_12px_28px_rgba(var(--accent-glow),0.25)] hover:bg-[var(--accent-vivid)]/90 transition-all disabled:opacity-50 disabled:grayscale-[0.5]"
          >
            {isSubmitting ? <Icons.LoadingIcon className="h-4 w-4 animate-spin mr-2" /> : <Icons.InviteIcon size={16} className="mr-2" />}
            {isVerified ? "Assign seat" : "Account Verification Required"}
          </Button>
          {!isVerified && (
             <p className="text-[10px] text-center text-[var(--accent-vivid)] font-medium px-2">
               Complete your identity verification in Settings to invite members.
             </p>
          )}
          <Button variant="outline" className="h-12 w-full rounded-full border-[var(--border-subtle)] text-[var(--text-muted)] font-bold hover:bg-[var(--surface-2)]/60 hover:text-[var(--text-primary)] transition-all" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
