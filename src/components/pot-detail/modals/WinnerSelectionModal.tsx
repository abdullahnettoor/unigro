import { Button } from "@/components/ui/Button";
import { ModalBody, ModalHeader, ModalShell } from "@/components/ui/ModalShell";
import { Surface } from "@/components/ui/Surface";

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
                <h3 className="text-xl font-display font-black">Select Winner</h3>
            </ModalHeader>
            <ModalBody className="space-y-6">
                <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide">
                    {activeSlots.filter(s => !s.drawOrder).map(s => {
                        const isSelected = selectedWinnerSlotNum === s.slotNumber;
                        return (
                            <button
                                key={s._id}
                                onClick={() => setSelectedWinnerSlotNum(s.slotNumber)}
                                className="w-full text-left outline-none focus:outline-none"
                            >
                                <Surface
                                    tier={isSelected ? 2 : 1}
                                    className={`w-full p-4 rounded-xl border transition-all ${isSelected ? "border-[var(--accent-vivid)] bg-[var(--accent-vivid)]/5" : "border-[var(--border-subtle)] hover:border-[var(--accent-vivid)]/40"}`}
                                >
                                    <div className="font-bold text-sm">Slot #{s.slotNumber}</div>
                                    <div className="text-xs text-[var(--text-muted)]">{s.user?.name || "Shared Slot"}</div>
                                </Surface>
                            </button>
                        );
                    })}
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        size="lg"
                        className="flex-1"
                        onClick={() => setShowWinnerSelection(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        className="flex-1"
                        onClick={handleDraw}
                        disabled={!selectedWinnerSlotNum}
                    >
                        Confirm
                    </Button>
                </div>
            </ModalBody>
        </ModalShell>
    );
}
