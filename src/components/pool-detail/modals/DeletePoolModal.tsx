import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as Icons from "@/lib/icons";

interface DeletePoolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function DeletePoolModal({ open, onOpenChange, onConfirm }: DeletePoolModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-3 border border-[var(--danger)]/30 rounded-[32px] max-w-[400px] p-0 overflow-hidden outline-none">
        <DialogHeader className="p-6 pb-2 pr-12">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--danger)]">Danger Zone</p>
            <DialogTitle className="font-display text-xl font-bold">Delete Pool</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          <div className="p-4 rounded-2xl bg-[var(--danger)]/[0.03] border border-[var(--danger)]/10 flex gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] flex items-center justify-center border border-[var(--danger)]/20 shadow-inner">
              <Icons.DeleteIcon size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">This action is permanent</p>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                All data, history, and active seats associated with this pool will be wiped from our servers. This cannot be undone.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-12 rounded-full font-bold text-[var(--text-muted)] hover:bg-[var(--surface-3)]/40 transition-all"
            >
              Keep pool
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="h-12 rounded-full bg-[var(--danger)]/10 border border-[var(--danger)]/40 font-bold text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white shadow-lg transition-all"
            >
              Delete pool
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
