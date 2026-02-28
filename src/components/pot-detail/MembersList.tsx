import { useState } from "react";
import { useMutation } from "convex/react";
import { CheckCircle, ChevronDown, ChevronUp, Clock, ShieldAlert, Users, UserPen } from "lucide-react";

import { PaymentModal } from "@/components/pot-detail/PaymentComponents";
import { formatCurrency } from "@/lib/utils";
import { EditGhostModal } from "./modals/EditGhostModal";
import { Surface } from "@/components/ui/Surface";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface MembersListProps {
    members: any[];
    potId: Id<"pots">;
    currentMonth: number;
    isForeman: boolean;
    isActive: boolean;
    currentUserId?: string;
    currency?: string;
}

export function MembersList({ members, potId, currentMonth, isForeman, isActive, currentUserId, currency }: MembersListProps) {
    const recordCashPayment = useMutation(api.transactions.recordCashPayment);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [editingGhost, setEditingGhost] = useState<{ _id: Id<"users">, name: string, phone: string } | null>(null);

    const [paymentModalState, setPaymentModalState] = useState<{
        slotId: Id<"slots">,
        cycle: number,
        amount: number,
        isForemanAction?: boolean,
        userId?: Id<"users">
    } | null>(null);

    const toggleExpand = (userId: string) => {
        setExpandedUser(expandedUser === userId ? null : userId);
    };

    // NEW Handle Mark Paid (Foreman w/ Backdate)
    const handleMarkPaid = (slotId: Id<"slots">, userId: Id<"users">, monthIndex?: number, dueAmount: number = 0) => {
        const targetMonth = monthIndex !== undefined ? monthIndex : currentMonth;
        // Open Modal in Foreman Mode
        setPaymentModalState({
            slotId,
            cycle: targetMonth,
            amount: dueAmount,
            isForemanAction: true,
            userId
        });
    };

    if (members.length === 0) {
        return (
            <div className="text-center py-12 text-[var(--text-muted)]">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p>No active members yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-display font-bold flex items-center gap-2 mb-6">
                <Users className="text-[var(--accent-vivid)]" /> Participants ({members.length})
            </h3>

            <div className="grid grid-cols-1 gap-4">
                {members.map((m) => {
                    const isFullyPaid = m.totalDue === 0;
                    return (
                        <Surface tier={1} rounded="xl" key={m.userId} className="overflow-hidden p-0 border border-[var(--border-subtle)]">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--surface-deep)]/40 transition-colors"
                                onClick={() => toggleExpand(m.userId)}
                            >
                                <div className="flex items-center gap-3">
                                    {m.user.pictureUrl ? (
                                        <img src={m.user.pictureUrl} alt={m.user.name} className="w-10 h-10 rounded-full" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-[var(--surface-deep)] flex items-center justify-center font-bold text-[var(--text-muted)]">
                                            {m.user.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-bold flex items-center gap-2">
                                            {m.user.name}
                                            {m.user.verificationStatus === "UNVERIFIED" && !m.user.clerkId && isForeman && (
                                                <Badge variant="warning" size="sm">Ghost User</Badge>
                                            )}
                                            {m.totalShare < 100 && <Badge variant="default" size="sm">{m.totalShare}% Stake</Badge>}
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)]">
                                            {m.slots.length} Slot{m.slots.length !== 1 ? 's' : ''} • {m.user.phone}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className={`font-bold font-mono ${isFullyPaid ? "text-[var(--accent-vivid)]" : "text-[var(--accent-secondary)]"}`}>
                                            {isFullyPaid ? "PAID" : `Due: ${formatCurrency(m.totalDue, currency)}`}
                                        </div>
                                        {!isFullyPaid && (
                                            <div className="text-[10px] text-[var(--text-muted)]">{m.paidCount}/{m.slots.length} Paid</div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {m.user.verificationStatus === "UNVERIFIED" && !m.user.clerkId && isForeman && (
                                            <Button
                                                variant="ghost"
                                                className="!h-8 !w-8 p-0 hover:bg-[var(--surface-deep)] rounded-full transition-colors"
                                                onClick={(e) => { e.stopPropagation(); setEditingGhost({ _id: m.userId, name: m.user.name, phone: m.user.phone }); }}
                                            >
                                                <UserPen size={16} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" />
                                            </Button>
                                        )}
                                        {expandedUser === m.userId ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedUser === m.userId && (
                                <div className="bg-[var(--surface-deep)]/40 p-4 border-t border-[var(--border-subtle)] space-y-2 relative">
                                    {/* Missed Payments Section */}
                                    {m.missedPayments?.length > 0 && (
                                        <Surface tier={2} className="mb-4 rounded-lg p-3 border border-[var(--danger)]/30">
                                            <div className="text-xs font-bold text-[var(--danger)] mb-2 flex items-center gap-1">
                                                <ShieldAlert size={12} /> Missed Payments
                                            </div>
                                            <div className="space-y-2">
                                                {m.missedPayments.map((missed: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center text-xs bg-[var(--danger)]/5 p-2 rounded-md">
                                                        <span className="text-[var(--text-primary)] font-medium">
                                                            Cycle {missed.monthIndex + 1} • Slot #{missed.slotNumber}
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-bold text-[var(--danger)]">{formatCurrency(missed.amount, currency)}</span>

                                                            {/* User Self-Pay Action */}
                                                            {missed.isMyPayment && missed.status === 'UNPAID' && (
                                                                <Button
                                                                    variant="danger"
                                                                    size="sm"
                                                                    className="!h-7 px-3 text-[10px]"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPaymentModalState({ slotId: missed.slotId, cycle: missed.monthIndex, amount: missed.amount });
                                                                    }}
                                                                >
                                                                    Pay Now
                                                                </Button>
                                                            )}
                                                            {missed.status === 'PENDING' && (
                                                                <Badge variant="warning" size="sm" className="gap-1 flex items-center">
                                                                    <Clock size={10} /> Pending
                                                                </Badge>
                                                            )}

                                                            {/* Foreman Action */}
                                                            {isForeman && isActive && missed.status !== 'PENDING' && (
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="!h-7 px-3 text-[10px] text-[var(--danger)] border-[var(--danger)]/30 hover:bg-[var(--danger)]/10"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleMarkPaid(missed.slotId, m.userId, missed.monthIndex, missed.amount);
                                                                    }}
                                                                >
                                                                    Mark Paid
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </Surface>
                                    )}

                                    {/* Current Slots List */}
                                    {m.slots.map((slot: any) => {
                                        return (
                                            <div key={slot._id} className="flex justify-between items-center text-sm p-2 rounded hover:bg-[var(--surface-deep)]/60">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[var(--text-muted)] font-mono">Slot #{slot.slotNumber}</span>
                                                    {slot.isSplit && <Badge variant="default" size="sm">{slot.share}%</Badge>}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-bold ${slot.isPaid ? 'text-[var(--accent-vivid)]' : 'text-[var(--text-primary)]'}`}>
                                                        {slot.isPaid ? 'PAID' : formatCurrency(slot.due, currency)}
                                                    </span>

                                                    {/* Actions */}
                                                    {!slot.isPaid && isActive && (
                                                        <>
                                                            {/* Self Pay */}
                                                            {m.userId === currentUserId && (
                                                                <Button
                                                                    variant="primary"
                                                                    size="sm"
                                                                    className="!h-7 px-3 text-[10px]"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPaymentModalState({ slotId: slot._id, cycle: currentMonth, amount: slot.due });
                                                                    }}
                                                                >
                                                                    Pay Now
                                                                </Button>
                                                            )}

                                                            {/* Foreman Mark Paid */}
                                                            {isForeman && (
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="!h-7 px-3 text-[10px] text-[var(--accent-vivid)] border-[var(--accent-vivid)]/30 hover:bg-[var(--accent-vivid)]/10"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleMarkPaid(slot._id, m.userId, currentMonth, slot.due);
                                                                    }}
                                                                >
                                                                    Mark Paid
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                    {slot.isPaid && <CheckCircle size={14} className="text-[var(--accent-vivid)]" />}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </Surface>
                    );
                })}
            </div>

            {paymentModalState && (
                <PaymentModal
                    potId={potId}
                    slotId={paymentModalState.slotId}
                    monthIndex={paymentModalState.cycle}
                    amount={paymentModalState.amount}
                    currency={currency}
                    onClose={() => setPaymentModalState(null)}
                    isForeman={paymentModalState.isForemanAction}
                    onForemanRecord={async (date: number) => {
                        if (paymentModalState.userId) {
                            await recordCashPayment({
                                potId,
                                slotId: paymentModalState.slotId,
                                monthIndex: paymentModalState.cycle,
                                userId: paymentModalState.userId,
                                paidAt: date
                            });
                        }
                    }}
                />
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
