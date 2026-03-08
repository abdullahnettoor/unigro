import { useState } from "react";
import * as Icons from "@/lib/icons";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Surface } from "@/components/ui/Surface";

interface WinnerSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eligibleSeats: number[];
  onStartAnimation: () => void;
  onSetManualWinner: (seatNumber: number) => Promise<void>;
}

export function WinnerSelectionModal({ open, onOpenChange, eligibleSeats, onStartAnimation, onSetManualWinner }: WinnerSelectionModalProps) {
  const [selectedSeat, setSelectedSeat] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleManualSet = async () => {
    if (!selectedSeat) return;
    setIsSubmitting(true);
    try {
      await onSetManualWinner(Number(selectedSeat));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-3 border border-[var(--border-subtle)] rounded-[32px] max-w-[400px] p-0 overflow-hidden outline-none flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Lottery Draw</p>
            <DialogTitle className="font-display text-xl font-bold">Pick a Winner</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 scrollbar-hide">
          <Surface tier={2} className="grain p-4 rounded-2xl border border-[var(--border-subtle)]/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--accent-vivid)]/10 text-[var(--accent-vivid)] flex items-center justify-center border border-[var(--accent-vivid)]/20 shadow-inner">
                <Icons.DrawIcon size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Eligible Pools</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">{eligibleSeats.length} Seats Ready</p>
              </div>
            </div>
          </Surface>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-3">Choose Manual Winner</label>
              <Select value={selectedSeat} onValueChange={setSelectedSeat}>
                <SelectTrigger className="h-12 rounded-full bg-[var(--surface-2)]/40 border-[var(--border-subtle)] focus:ring-[var(--accent-vivid)] px-5">
                  <SelectValue placeholder="Select a seat number..." />
                </SelectTrigger>
                <SelectContent className="glass-3 rounded-[24px] border-[var(--border-subtle)]">
                  {eligibleSeats.map((seat) => (
                    <SelectItem key={seat} value={String(seat)} className="rounded-xl mx-1 my-0.5 pl-11 pr-4">
                      Seat #{seat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={onStartAnimation}
                disabled={isSubmitting}
                className="h-12 rounded-full font-bold text-[var(--text-muted)] hover:bg-[var(--surface-3)]/40 hover:text-[var(--text-primary)] transition-all"
              >
                Random draw
              </Button>
              <Button
                onClick={handleManualSet}
                disabled={isSubmitting || !selectedSeat}
                className="h-12 rounded-full bg-[var(--accent-vivid)] font-bold text-white shadow-lg shadow-[var(--accent-vivid)]/20"
              >
                {isSubmitting ? <Icons.LoadingIcon className="animate-spin" size={16} /> : "Set Winner"}
              </Button>
            </div>
          </div>

          <p className="text-[10px] text-[var(--text-muted)] text-center px-4 leading-relaxed font-medium">
            Random draw uses a fair algorithmic selection. Manual selection allows for specific overrides if needed.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
