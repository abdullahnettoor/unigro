import { Trash2 } from "lucide-react";

import type { Doc, Id } from "../../../convex/_generated/dataModel";

interface SlotsTabProps {
    pot: Doc<"pots">;
    allSlots: any[];
    currentUserId: string | undefined;
    isForeman: boolean;
    isDraft: boolean;
    setShowAddMember: (show: boolean) => void;
    setShowSplitModal: (show: boolean) => void;
    deleteSlot: (args: { potId: Id<"pots">, slotNumber: number }) => void;
}

export function SlotsTab({
    pot,
    allSlots,
    currentUserId,
    isForeman,
    isDraft,
    setShowAddMember,
    setShowSplitModal,
    deleteSlot
}: SlotsTabProps) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-display font-bold">Pot Slots</h3>
                {isForeman && isDraft && (
                    <div className="flex gap-2">
                        <button onClick={() => setShowAddMember(true)} className="px-4 py-2 bg-[var(--surface-deep)] text-xs font-bold rounded-full hover:bg-[var(--surface-card)] transition-colors">+ Add Member</button>
                        <button onClick={() => setShowSplitModal(true)} className="px-4 py-2 bg-[var(--surface-deep)] text-xs font-bold rounded-full hover:bg-[var(--surface-card)] transition-colors">Split Slot</button>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allSlots.map((slot) => {
                    const isMySlot = slot.userId === currentUserId ||
                        (slot.isSplit && (slot as any).splitOwners?.some((o: any) => o.userId === currentUserId));
                    return (
                        <div key={slot._id} className={`glass-1 rounded-2xl p-4 flex items-center gap-4 border-2 transition-all ${isMySlot ? 'border-[var(--accent-vivid)]/40' : 'border-transparent'}`}>
                            <div className="relative">
                                <div className="h-10 w-10 rounded-full bg-[var(--surface-deep)] flex items-center justify-center font-bold text-sm">
                                    {slot.user?.name?.charAt(0) || slot.slotNumber}
                                </div>
                                {isMySlot && <div className="absolute -top-1 -right-1 h-3 w-3 bg-[var(--accent-vivid)] rounded-full border-2 border-[var(--surface-card)]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{slot.user?.name || `Slot #${slot.slotNumber}`}</p>
                                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">
                                    {slot.isGhost ? 'Ghost User' : slot.isSplit ? 'Split Slot' : 'Participant'}
                                </p>
                            </div>
                            {isForeman && isDraft && (
                                <button onClick={() => deleteSlot({ potId: pot._id, slotNumber: slot.slotNumber })} className="p-2 text-[var(--warning)] hover:bg-[var(--warning)]/10 rounded-full">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
