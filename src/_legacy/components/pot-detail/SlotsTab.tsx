import { useState } from "react";
import { ChevronDown, ChevronUp, PieChart, Trash2, User,UserPen, UserPlus, Users } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Surface } from "@/components/ui/Surface";

import type { Doc, Id } from "../../../convex/_generated/dataModel";

import { EditGhostModal } from "./modals/EditGhostModal";

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
    const [view, setView] = useState<"all" | "full" | "split">("all");

    const toggleExpand = (slotNumber: number) => {
        setExpandedSlot(expandedSlot === slotNumber ? null : slotNumber);
    };

    const displayedSlots = allSlots.filter(s => {
        if (view === "all") return true;
        if (view === "full") return !s.isSplit;
        if (view === "split") return s.isSplit;
        return true;
    });

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-xl font-display font-bold">Pot Slots</h3>

                <div className="flex items-center gap-4 ml-auto">
                    <SegmentedControl
                        value={view}
                        onChange={(val) => setView(val as "all" | "full" | "split")}
                        density="compact"
                        options={[
                            {
                                value: "all",
                                label: <div className="flex items-center justify-center p-0.5"><Users size={18} /></div>
                            },
                            {
                                value: "full",
                                label: <div className="flex items-center justify-center p-0.5"><User size={18} /></div>
                            },
                            {
                                value: "split",
                                label: <div className="flex items-center justify-center p-0.5"><PieChart size={18} /></div>
                            },
                        ]}
                    />
                    {isForeman && isDraft && (
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" className="rounded-full font-bold gap-2" onClick={() => setShowAddMember(true)}>
                                <UserPlus size={16} /><span className="hidden md:inline">Add Member</span>
                            </Button>
                            <Button variant="secondary" size="sm" className="rounded-full font-bold gap-2" onClick={() => setShowSplitModal(true)}>
                                <PieChart size={16} /><span className="hidden md:inline">Split Slot</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {displayedSlots.length === 0 ? (
                <Surface tier={1} className="p-8 text-center rounded-2xl border-2 border-dashed border-[var(--border-subtle)]">
                    <Users size={32} className="mx-auto text-[var(--text-muted)] mb-3 opacity-50" />
                    <p className="font-bold text-[var(--text-primary)]">
                        {view === "split" ? "No split slots" : view === "full" ? "No full slots" : "No slots"}
                    </p>
                </Surface>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedSlots.map((slot) => {
                        const isMySlot = slot.userId === currentUserId ||
                            (slot.isSplit && (slot as any).splitOwners?.some((o: any) => o.userId === currentUserId));

                        if (slot.isSplit) {
                            return (
                                <Surface key={slot._id} tier={1} className={`rounded-2xl border-2 transition-all flex flex-col overflow-hidden ${isMySlot ? 'border-[var(--accent-vivid)]/40' : 'border-[var(--border-subtle)]'}`}>
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--surface-dropdown)] transition-colors"
                                        onClick={() => toggleExpand(slot.slotNumber)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-[var(--surface-deep)] flex items-center justify-center font-bold text-sm text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)]">
                                                {slot.slotNumber}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">
                                                    {slot.remainingPercentage === 0 ? "" : "Split: "}
                                                    {(slot as any).splitOwners?.map((o: any) => o.userName).join(' • ') || `Slot #${slot.slotNumber}`}
                                                </p>
                                                <div className="mt-1 flex items-center flex-wrap gap-1.5">
                                                    {slot.remainingPercentage === 0 ? (
                                                        <Badge variant="outline" className="text-[var(--text-muted)]">Split Slot</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-[var(--accent-vivid)]/40 text-[var(--accent-vivid)] bg-[var(--accent-vivid)]/5">{slot.remainingPercentage}% Available</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isForeman && isDraft && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteSlot({ potId: pot._id, slotNumber: slot.slotNumber });
                                                    }}
                                                    className="text-[var(--danger)] hover:bg-[var(--danger)]/10"
                                                    title="Delete entire split slot"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            )}
                                            {expandedSlot === slot.slotNumber ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
                                        </div>
                                    </div>
                                    {expandedSlot === slot.slotNumber && (
                                        <div className="bg-[var(--surface-deep)]/60 border-t border-[var(--border-subtle)] flex flex-col divide-y divide-[var(--border-subtle)]">
                                            {(slot as any).splitOwners?.map((owner: any, idx: number) => (
                                                <div key={idx} className="p-3 pl-16 flex items-center justify-between hover:bg-[var(--surface-input)] transition-colors">
                                                    <div>
                                                        <p className="text-xs font-bold flex items-center gap-2">
                                                            {owner.userName}
                                                            {owner.isGhost && <Badge variant="default" size="sm" className="px-1.5 py-0 h-4 text-[8px] bg-[var(--accent-vivid)]/20 text-[var(--accent-vivid)] hover:bg-[var(--accent-vivid)]/30 rounded-full font-black uppercase">GHOST</Badge>}
                                                        </p>
                                                        <p className="text-[10px] text-[var(--text-muted)] font-mono">{owner.sharePercentage}% Share</p>
                                                    </div>
                                                    {isForeman && isDraft && owner.isGhost && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingGhost({ _id: owner.userId, name: owner.userName, phone: owner.userPhone });
                                                            }}
                                                            className="text-[var(--text-muted)] hover:text-[var(--accent-vivid)]"
                                                            title="Edit unverified user"
                                                        >
                                                            <UserPen size={14} />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Surface>
                            );
                        }

                        return (
                            <Surface key={slot._id} tier={1} className={`rounded-2xl p-4 flex items-center gap-4 border-2 transition-all ${isMySlot ? 'border-[var(--accent-vivid)]/40' : 'border-transparent'}`}>
                                <div className="relative">
                                    <div className="h-10 w-10 rounded-full bg-[var(--surface-deep)] flex items-center justify-center font-bold text-sm border border-dashed border-[var(--border-subtle)] text-[var(--text-muted)]">
                                        {slot.slotNumber}
                                    </div>
                                    {isMySlot && <div className="absolute -top-1 -right-1 h-3 w-3 bg-[var(--accent-vivid)] rounded-full border-2 border-[var(--surface-card)]" />}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col items-start">
                                    <p className="text-sm font-bold truncate block w-full">{slot.user?.name || `Slot #${slot.slotNumber}`}</p>
                                    <div className="mt-1">
                                        {slot.isGhost ? (
                                            <Badge variant="outline" size="sm" className="border-[var(--accent-vivid)]/40 text-[var(--accent-vivid)] bg-[var(--accent-vivid)]/5">Ghost User</Badge>
                                        ) : (
                                            <Badge variant="outline" size="sm" className="text-[var(--text-muted)]">Participant</Badge>
                                        )}
                                    </div>
                                </div>
                                {isForeman && isDraft && (
                                    <div className="flex gap-2">
                                        {slot.isGhost && slot.user && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingGhost({ _id: slot.user!._id, name: slot.user!.name, phone: slot.user!.phone })}
                                                className="text-[var(--text-muted)] hover:text-[var(--accent-vivid)]"
                                                title="Edit unverified user"
                                            >
                                                <UserPen size={16} />
                                            </Button>
                                        )}
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            className="bg-transparent border-transparent hover:border-[var(--danger)]/30 hover:bg-[var(--danger)]/10 text-[var(--danger)]"
                                            onClick={() => deleteSlot({ potId: pot._id, slotNumber: slot.slotNumber })}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                )}
                            </Surface>
                        );
                    })}
                </div>
            )}

            {editingGhost && (
                <EditGhostModal
                    ghostUser={editingGhost}
                    onClose={() => setEditingGhost(null)}
                />
            )}
        </div>
    );
}
