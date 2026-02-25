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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end justify-center p-3 sm:items-center sm:p-4">
            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6">
                <h3 className="text-xl font-display font-black mb-4">Select Winner Manually</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto mb-6 scrollbar-hide">
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
            </div>
        </div>
    );
}
