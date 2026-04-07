import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as Icons from "@/lib/icons";

interface ArchivePoolModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => Promise<void>;
}

export function ArchivePoolModal({ open, onOpenChange, onConfirm }: ArchivePoolModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass-3 border border-[var(--warning)]/30 rounded-[32px] max-w-[400px] p-0 overflow-hidden outline-none">
                <DialogHeader className="p-6 pb-2 pr-12">
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--warning)]">Status Update</p>
                        <DialogTitle className="font-display text-xl font-bold">Archive Pool</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="px-6 pb-6 space-y-6">
                    <div className="p-4 rounded-2xl bg-[var(--warning)]/[0.03] border border-[var(--warning)]/10 flex gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-[var(--warning)]/10 text-[var(--warning)] flex items-center justify-center border border-[var(--warning)]/20 shadow-inner">
                            <Icons.HistoryIcon size={20} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">Move to archive?</p>
                            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                Archiving will remove this pool from your active list and disable management actions. History remains preserved and you can unarchive at any time.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="h-12 rounded-full font-bold text-[var(--text-muted)] hover:bg-[var(--surface-3)]/40 transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onConfirm}
                            className="h-12 rounded-full bg-[var(--warning)]/10 border border-[var(--warning)]/40 font-bold text-[var(--warning)] hover:bg-[var(--warning)] hover:text-white shadow-lg transition-all"
                        >
                            Archive Now
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
