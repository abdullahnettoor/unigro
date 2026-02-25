import { useState } from "react";
import { UserPen, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { EditGhostModal } from "./modals/EditGhostModal";

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
    const [editingGhost, setEditingGhost] = useState<{ _id: Id<"users">, name: string, phone: string } | null>(null);
    const [expandedSlot, setExpandedSlot] = useState<number | null>(null);

    const toggleExpand = (slotNumber: number) => {
        setExpandedSlot(expandedSlot === slotNumber ? null : slotNumber);
    };

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

                    if (slot.isSplit) {
                        return (
                            <div key={slot._id} className={`glass-1 rounded-2xl border-2 transition-all flex flex-col overflow-hidden ${isMySlot ? 'border-[var(--accent-vivid)]/40' : 'border-[var(--border-subtle)]'}`}>
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--surface-deep)]/40 transition-colors"
                                    onClick={() => toggleExpand(slot.slotNumber)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-[var(--surface-deep)] flex items-center justify-center font-bold text-sm text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)]">
                                            {slot.slotNumber}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Slot #{slot.slotNumber}</p>
                                            <p className="text-[10px] text-[var(--accent-vivid)] uppercase tracking-wide font-bold">
                                                Split Slot • {slot.remainingPercentage}% Available
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isForeman && isDraft && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteSlot({ potId: pot._id, slotNumber: slot.slotNumber });
                                                }}
                                                className="p-1.5 text-[var(--warning)] hover:bg-[var(--warning)]/10 rounded-full transition-colors mr-1"
                                                title="Delete entire split slot"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                        {expandedSlot === slot.slotNumber ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
                                    </div>
                                </div>
                                {expandedSlot === slot.slotNumber && (
                                    <div className="bg-[var(--surface-deep)]/60 border-t border-[var(--border-subtle)] flex flex-col divide-y divide-[var(--border-subtle)]">
                                        {(slot as any).splitOwners?.map((owner: any, idx: number) => (
                                            <div key={idx} className="p-3 pl-16 flex items-center justify-between hover:bg-[var(--surface-deep)] transition-colors">
                                                <div>
                                                    <p className="text-xs font-bold flex items-center gap-2">
                                                        {owner.userName}
                                                        {owner.isGhost && <span className="text-[8px] bg-[var(--accent-vivid)]/20 text-[var(--accent-vivid)] px-1.5 rounded-full uppercase">Ghost</span>}
                                                    </p>
                                                    <p className="text-[10px] text-[var(--text-muted)] font-mono">{owner.sharePercentage}% Share</p>
                                                </div>
                                                {isForeman && isDraft && owner.isGhost && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingGhost({ _id: owner.userId, name: owner.userName, phone: owner.userPhone });
                                                        }}
                                                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-vivid)] hover:bg-[var(--accent-vivid)]/10 rounded-full transition-colors"
                                                        title="Edit unverified user"
                                                    >
                                                        <UserPen size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

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
                                    {slot.isGhost ? 'Ghost User' : 'Participant'}
                                </p>
                            </div>
                            {isForeman && isDraft && (
                                <div className="flex gap-2">
                                    {slot.isGhost && slot.user && (
                                        <button
                                            onClick={() => setEditingGhost({ _id: slot.user!._id, name: slot.user!.name, phone: slot.user!.phone })}
                                            className="p-2 text-[var(--text-muted)] hover:text-[var(--accent-vivid)] hover:bg-[var(--accent-vivid)]/10 rounded-full transition-colors"
                                            title="Edit unverified user"
                                        >
                                            <UserPen size={16} />
                                        </button>
                                    )}
                                    <button onClick={() => deleteSlot({ potId: pot._id, slotNumber: slot.slotNumber })} className="p-2 text-[var(--warning)] hover:bg-[var(--warning)]/10 rounded-full transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {editingGhost && (
                <EditGhostModal
                    ghostUser={editingGhost}
                    onClose={() => setEditingGhost(null)}
                />
            )}
        </div>
    );
}
