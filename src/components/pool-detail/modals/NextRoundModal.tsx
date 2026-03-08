import { useState } from "react";
import * as Icons from "@/lib/icons";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Surface } from "@/components/ui/Surface";

interface NextRoundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdvance: (nextDrawDate: number) => Promise<void>;
}

export function NextRoundModal({ open, onOpenChange, onAdvance }: NextRoundModalProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdvance = async () => {
    setIsSubmitting(true);
    try {
      await onAdvance(new Date(date).getTime());
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-3 border border-[var(--border-subtle)] rounded-[32px] max-w-[400px] p-0 overflow-hidden outline-none flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-2 shrink-0 pr-12">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Cycle Management</p>
            <DialogTitle className="font-display text-xl font-bold">Advance Round</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6 space-y-6 scrollbar-hide overscroll-contain">
          <Surface tier={2} className="grain p-4 rounded-2xl border border-[var(--border-subtle)]/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--warning)]/10 text-[var(--warning)] flex items-center justify-center border border-[var(--warning)]/20 shadow-inner">
                <Icons.RoundIcon size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Next Step</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">Move to next cycle</p>
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-[var(--surface-deep)]/60 flex items-center justify-center text-[var(--text-muted)]">
              <Icons.ArrowIcon size={14} />
            </div>
          </Surface>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-1">Planned Draw Date</label>
              <DatePicker value={date} onChange={setDate} />
            </div>

            <Button
              onClick={handleAdvance}
              disabled={isSubmitting}
              className="w-full h-12 rounded-full bg-[var(--accent-vivid)] font-bold text-white shadow-lg shadow-[var(--accent-vivid)]/20"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Icons.LoadingIcon className="animate-spin" size={16} /> Advancing...
                </span>
              ) : (
                "Confirm & Advance"
              )}
            </Button>
          </div>

          <p className="text-[10px] text-[var(--text-muted)] text-center px-4 leading-relaxed font-medium">
            This will finalize the current round and set the schedule for the next winner selection.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
