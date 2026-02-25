import { useState } from "react";
import { useMutation } from "convex/react";
import { CheckCircle, ChevronDown, ChevronUp, Clock, ShieldAlert, Users, UserPen } from "lucide-react";

import { PaymentModal } from "@/components/pot-detail/PaymentComponents";
import { formatCurrency } from "@/lib/utils";
import { EditGhostModal } from "./modals/EditGhostModal";

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
                        <div key={m.userId} className="bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--surface-deep)]/60 transition-colors"
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
                                            {m.totalShare < 100 && <span className="text-[10px] bg-[var(--surface-deep)]/80 px-1.5 rounded-full text-[var(--text-muted)]">{m.totalShare}% Stake</span>}
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)]">
                                            {m.slots.length} Slot{m.slots.length !== 1 ? 's' : ''} • {m.user.phone}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        {m.user.verificationStatus === "UNVERIFIED" && !m.user.clerkId && isForeman && (
                                            <div className="text-[10px] text-[var(--accent-vivid)] font-bold mb-1 flex items-center justify-end gap-1">
                                                Ghost User
                                            </div>
                                        )}
                                        <div className={`font-bold font-mono ${isFullyPaid ? "text-[var(--accent-vivid)]" : "text-[var(--accent-secondary)]"}`}>
                                            {isFullyPaid ? "PAID" : `Due: ${formatCurrency(m.totalDue, currency)}`}
                                        </div>
                                        {!isFullyPaid && (
                                            <div className="text-[10px] text-[var(--text-muted)]">{m.paidCount}/{m.slots.length} Paid</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        {expandedUser === m.userId ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedUser === m.userId && (
                                <div className="bg-[var(--surface-deep)]/60 p-4 border-t border-[var(--border-subtle)] space-y-2 relative">
                                    {m.user.verificationStatus === "UNVERIFIED" && !m.user.clerkId && isForeman && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingGhost({ _id: m.userId, name: m.user.name, phone: m.user.phone }); }}
                                            className="absolute top-4 right-4 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-[10px] px-2 py-1 rounded hover:bg-[var(--surface-card)] transition-colors flex items-center gap-1 shadow-sm"
                                        >
                                            <UserPen size={12} /> Edit Details
                                        </button>
                                    )}
                                    {/* Missed Payments Section */}
                                    {m.missedPayments?.length > 0 && (
                                        <div className="mb-4  bg-[var(--danger)]/10 rounded-lg p-3 border border-[var(--danger)]/20">
                                            <div className="text-xs font-bold text-[var(--danger)] mb-2 flex items-center gap-1">
                                                <ShieldAlert size={12} /> Missed Payments
                                            </div>
                                            <div className="space-y-2">
                                                {m.missedPayments.map((missed: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center text-xs">
                                                        <span className="text-[var(--text-muted)]">
                                                            Cycle {missed.monthIndex + 1} • Slot #{missed.slotNumber}
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-bold text-[var(--danger)]">{formatCurrency(missed.amount, currency)}</span>

                                                            {/* User Self-Pay Action */}
                                                            {missed.isMyPayment && missed.status === 'UNPAID' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPaymentModalState({ slotId: missed.slotId, cycle: missed.monthIndex, amount: missed.amount });
                                                                    }}
                                                                    className="bg-[var(--danger)] text-[var(--text-on-accent)] text-[10px] font-bold px-3 py-1 rounded hover:bg-[var(--danger)]/90 shadow-sm"
                                                                >
                                                                    Pay Now
                                                                </button>
                                                            )}
                                                            {missed.status === 'PENDING' && (
                                                                <span className="text-[var(--warning)] text-[10px] bg-[var(--warning)]/10 px-2 py-0.5 rounded flex items-center gap-1">
                                                                    <Clock size={10} /> Pending
                                                                </span>
                                                            )}

                                                            {/* Foreman Action */}
                                                            {isForeman && isActive && missed.status !== 'PENDING' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleMarkPaid(missed.slotId, m.userId, missed.monthIndex, missed.amount);
                                                                    }}
                                                                    className="bg-[var(--surface-elevated)] border border-[var(--danger)]/30 text-[var(--danger)] text-[10px] px-2 py-0.5 rounded hover:bg-[var(--danger)]/20"
                                                                >
                                                                    Mark Paid
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Current Slots List */}
                                    {m.slots.map((slot: any) => {
                                        return (
                                            <div key={slot._id} className="flex justify-between items-center text-sm p-2 rounded hover:bg-[var(--surface-deep)]/60">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[var(--text-muted)] font-mono">Slot #{slot.slotNumber}</span>
                                                    {slot.isSplit && <span className="text-[10px] bg-[var(--surface-deep)]/80 px-1.5 rounded text-[var(--text-muted)]">{slot.share}%</span>}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-bold ${slot.isPaid ? 'text-[var(--accent-vivid)]' : 'text-[var(--text-muted)]'}`}>
                                                        {slot.isPaid ? 'PAID' : formatCurrency(slot.due, currency)}
                                                    </span>

                                                    {/* Actions */}
                                                    {!slot.isPaid && isActive && (
                                                        <>
                                                            {/* Self Pay */}
                                                            {m.userId === currentUserId && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPaymentModalState({ slotId: slot._id, cycle: currentMonth, amount: slot.due });
                                                                    }}
                                                                    className="bg-[var(--accent-vivid)] text-[var(--text-on-accent)] text-[10px] font-bold px-3 py-1 rounded hover:opacity-90 shadow-sm"
                                                                >
                                                                    Pay Now
                                                                </button>
                                                            )}

                                                            {/* Foreman Mark Paid */}
                                                            {isForeman && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleMarkPaid(slot._id, m.userId, currentMonth, slot.due);
                                                                    }}
                                                                    className="bg-[var(--surface-elevated)] border border-[var(--accent-vivid)]/30 text-[var(--accent-vivid)] text-[10px] font-bold px-2 py-1 rounded hover:bg-[var(--accent-vivid)]/10"
                                                                >
                                                                    Mark Paid
                                                                </button>
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
                        </div>
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
