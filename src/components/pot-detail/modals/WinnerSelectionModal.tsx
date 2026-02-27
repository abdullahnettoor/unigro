import { ModalBody, ModalHeader, ModalShell } from "@/components/ui/ModalShell";

interface WinnerSelectionModalProps {
    activeSlots: any[];
    selectedWinnerSlotNum: number | null;
    setSelectedWinnerSlotNum: (num: number) => void;
    setShowWinnerSelection: (show: boolean) => void;
    handleDraw: () => void;
}

export function WinnerSelectionModal({
    activeSlots,
    selectedWinnerSlotNum,
    setSelectedWinnerSlotNum,
    setShowWinnerSelection,
    handleDraw
}: WinnerSelectionModalProps) {
    return (
        <ModalShell zIndex={100} showHandle={false}>
            <ModalHeader>
                <h3 className="text-xl font-display font-black">Select Winner Manually</h3>
            </ModalHeader>
            <ModalBody className="space-y-6">
                <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
                    {activeSlots.filter(s => !s.drawOrder).map(s => (
                        <button
                            key={s._id}
                            onClick={() => setSelectedWinnerSlotNum(s.slotNumber)}
                            className={`w-full p-4 rounded-xl text-left border-2 transition-all ${selectedWinnerSlotNum === s.slotNumber ? "border-[var(--accent-vivid)] bg-[var(--accent-vivid)]/10" : "border-[var(--border-subtle)] bg-[var(--surface-elevated)]"}`}
                        >
                            <div className="font-bold text-sm">Slot #{s.slotNumber}</div>
                            <div className="text-xs text-[var(--text-muted)]">{s.user?.name || "Shared Slot"}</div>
                        </button>
                    ))}
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowWinnerSelection(false)} className="flex-1 bg-[var(--surface-deep)] py-4 rounded-2xl font-bold text-sm">Cancel</button>
                    <button onClick={handleDraw} disabled={!selectedWinnerSlotNum} className="flex-1 bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold py-4 rounded-2xl text-sm shadow-xl disabled:opacity-50">Confirm Winner</button>
                </div>
            </ModalBody>
        </ModalShell>
    );
}
