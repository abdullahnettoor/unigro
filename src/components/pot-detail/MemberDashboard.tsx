import { useState } from "react";
import { useMutation } from "convex/react";
import { Clock, Coins, ShieldAlert } from "lucide-react";

import { PaymentModal } from "@/components/pot-detail/PaymentComponents";
import { formatCurrency } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

interface MemberDashboardProps {
    pot: Doc<"pots">;
    mySlots: any[];
    transactions: any[];
    nextDueDate: string;
    currentUserId: string;
}

export function MemberDashboard({ pot, mySlots, transactions, nextDueDate, currentUserId }: MemberDashboardProps) {
    const recordCashPayment = useMutation(api.transactions.recordCashPayment);

    const [paymentModalState, setPaymentModalState] = useState<{ slotId: Id<"slots">, cycle: number, amount: number } | null>(null);

    // Calculate Overdue Payments
    const overduePayments: { slot: any, cycle: number, amount: number }[] = [];
    if (pot.status === "ACTIVE") {
        for (let cycle = 1; cycle < pot.currentMonth; cycle++) {
            mySlots.forEach(slot => {
                const tx = transactions?.find(t => t.slotId === slot._id && t.monthIndex === cycle && (t.userId === currentUserId || !t.userId)); // Match user or legacy

                // Calculate Share Amount
                let sharePct = 100;
                if (slot.isSplit && slot.splitOwners) {
                    const myShare = slot.splitOwners.find((o: any) => o.userId === currentUserId);
                    sharePct = myShare ? myShare.sharePercentage : 0;
                }
                const dueAmount = (pot.config.contribution * sharePct) / 100;

                if ((!tx || tx.status === "UNPAID") && sharePct > 0) {
                    overduePayments.push({
                        slot,
                        cycle,
                        amount: dueAmount
                    });
                }
            });
        }
    }

    return (
        <section className="mb-8 p-6 bg-[var(--surface-elevated)] border border-[var(--accent-vivid)]/20 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Coins size={100} className="text-[var(--accent-vivid)]" />
            </div>

            <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2 z-10 relative">
                <Clock className="text-[var(--accent-vivid)]" /> Your dashboard
            </h3>

            {/* Overdue Payments Alert */}
            {overduePayments.length > 0 && (
                <div className="mb-6 relative z-10  bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl p-4 animate-pulse">
                    <h4 className="text-[var(--danger)] font-bold flex items-center gap-2 mb-3">
                        <ShieldAlert size={20} /> Action Required: Overdue Payments
                    </h4>
                    <div className="space-y-3">
                        {overduePayments.map((item) => (
                            <div key={`${item.slot._id}-${item.cycle}`} className="flex justify-between items-center  bg-[var(--danger)]/5 p-3 rounded-lg border border-[var(--danger)]/10">
                                <div>
                                    <div className="text-sm font-bold text-[var(--text-primary)]">Cycle {item.cycle} • Slot #{item.slot.slotNumber}</div>
                                    <div className="text-xs text-[var(--danger)]">Missed Payment of {formatCurrency(item.amount, pot.config.currency)}</div>
                                </div>
                                <button
                                    onClick={() => setPaymentModalState({ slotId: item.slot._id, cycle: item.cycle, amount: item.amount })}
                                    className="bg-[var(--danger)] hover:bg-[var(--danger)]/90 text-[var(--text-primary)] text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                                >
                                    Pay Now
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {mySlots.map(slot => {
                    const myTx = transactions?.find(t => t.slotId === slot._id && t.monthIndex === pot.currentMonth && (t.userId === currentUserId || !t.userId));
                    let status: "UNPAID" | "PENDING" | "PAID" = "UNPAID";
                    if (myTx) status = myTx.status as "PENDING" | "PAID";

                    const isWinner = slot.drawOrder;
                    const wonAmount = pot.config.totalValue - (pot.config.totalValue * (pot.config.commission || 0) / 100);

                    // Calculate Share
                    let sharePct = 100;
                    if (slot.isSplit && slot.splitOwners) {
                        const myShare = slot.splitOwners.find((o: any) => o.userId === currentUserId);
                        sharePct = myShare ? myShare.sharePercentage : 0;
                    }
                    const dueAmount = (pot.config.contribution * sharePct) / 100;

                    return (
                        <div key={slot._id} className="bg-[var(--surface-deep)]/60 p-4 rounded-xl border border-[var(--border-subtle)]">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">
                                        Slot #{slot.slotNumber}
                                        {sharePct < 100 && <span className="ml-2 text-[var(--accent-vivid)] text-[10px] bg-[var(--accent-vivid)]/10 px-1.5 py-0.5 rounded-full">{sharePct}% Share</span>}
                                    </div>
                                    <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                                        {status === 'PAID' ? 'Paid' : formatCurrency(dueAmount, pot.config.currency)}
                                    </div>
                                    {status !== 'PAID' && <div className="text-xs text-[var(--accent-secondary)]">Due by {nextDueDate}</div>}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${status === 'PAID' ? 'bg-[var(--accent-vivid)]/20 text-[var(--accent-vivid)]' : ' bg-[var(--danger)]/20 text-[var(--danger)]'}`}>
                                    {status}
                                </div>
                            </div>

                            {status === 'UNPAID' && (
                                <button
                                    onClick={() => setPaymentModalState({ slotId: slot._id, cycle: pot.currentMonth, amount: dueAmount })}
                                    className="w-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold py-2 rounded-lg hover:opacity-90 mb-4 text-sm"
                                >
                                    Pay Now
                                </button>
                            )}

                            {status === 'PENDING' && (
                                <div className="text-center text-xs text-[var(--warning)] bg-[var(--warning)]/10 py-2 rounded-lg mb-4">
                                    Payment Pending Approval
                                </div>
                            )}

                            <div className="pt-4 border-t border-[var(--border-subtle)]">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[var(--text-muted)]">Win Status</span>
                                    {isWinner ? (
                                        <span className="text-[var(--gold)] font-bold text-xs flex items-center gap-1">
                                            Won Cycle {isWinner} ({formatCurrency(wonAmount, pot.config.currency)})
                                        </span>
                                    ) : (
                                        <span className="text-[var(--text-muted)] text-xs">Not yet won</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {paymentModalState && (
                <PaymentModal
                    potId={pot._id}
                    slotId={paymentModalState.slotId}
                    monthIndex={paymentModalState.cycle}
                    amount={paymentModalState.amount}
                    currency={pot.config.currency}
                    onClose={() => setPaymentModalState(null)}
                    isForeman={false}
                    onForemanRecord={async (date: number) => {
                        await recordCashPayment({
                            potId: pot._id,
                            slotId: paymentModalState.slotId,
                            monthIndex: paymentModalState.cycle,
                            userId: currentUserId as Id<"users">,
                            paidAt: date
                        });
                    }}
                />
            )}
        </section>
    );
}
