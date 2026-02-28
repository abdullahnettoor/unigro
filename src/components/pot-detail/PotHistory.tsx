// import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { AlertCircle, CheckCircle, Clock, Lock, Trophy, Users, User } from "lucide-react";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

interface PotHistoryProps {
    pot: Doc<"pots">;
    allSlots: (Doc<"slots"> & {
        user?: { name: string } | null;
        splitOwners?: { userId: Id<"users">; sharePercentage: number }[]
    })[];
    transactions: Doc<"transactions">[];
    mySlots: Doc<"slots">[];
    currentUserId?: string;

    isForeman?: boolean; // Deprecated, unused
    onPay: (slotId: Id<"slots">, cycle: number, amount: number) => void;
}

export function PotHistory({ pot, allSlots, transactions, mySlots, currentUserId, onPay }: PotHistoryProps) {
    const currentUserAvatar = allSlots.find(s => s.userId === currentUserId)?.user ? (allSlots.find(s => s.userId === currentUserId)?.user as any).pictureUrl : null;
    const [view, setView] = useState<"all" | "mine">("all");
    const cycles = Array.from({ length: pot.config.duration }, (_, i) => i + 1);

    return (
        <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-xl font-semibold font-display">
                    <Clock className="text-[var(--accent-vivid)]" /> Pot History
                </h3>
                <SegmentedControl
                    value={view}
                    onChange={(val) => setView(val as "all" | "mine")}
                    density="compact"
                    options={[
                        {
                            value: "all",
                            label: <div className="flex items-center justify-center p-0.5"><Users size={18} /></div>
                        },
                        {
                            value: "mine",
                            label: <div className="flex items-center justify-center p-0.5">
                                {currentUserAvatar ? (
                                    <img src={currentUserAvatar} alt="My History" className="w-[18px] h-[18px] rounded-full object-cover" />
                                ) : (
                                    <User size={18} />
                                )}
                            </div>
                        },
                    ]}
                />
            </div>

            {view === "all" ? (
                <Surface tier={1} className="overflow-hidden rounded-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[var(--surface-deep)]/60 text-xs uppercase text-[var(--text-muted)]">
                                <tr>
                                    <th className="p-4 whitespace-nowrap">Cycle</th>
                                    <th className="p-4 whitespace-nowrap">Status</th>
                                    <th className="p-4 whitespace-nowrap">Winner</th>
                                    <th className="p-4 whitespace-nowrap">Collection</th>
                                    <th className="p-4 whitespace-nowrap text-right">Payment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-subtle)]">
                                {cycles.map((cycle) => {
                                    const isCurrent = cycle === pot.currentMonth;
                                    const isFuture = cycle > pot.currentMonth;

                                    // Winner
                                    const winnerSlot = allSlots.find(s => s.drawOrder === cycle);

                                    // Collection Stats
                                    const totalExpected = activeSlotsCount(allSlots);

                                    let paidCount = 0;
                                    allSlots.forEach(slot => {
                                        if (slot.status !== "FILLED" && slot.status !== "RESERVED") return;

                                        if (slot.isSplit && slot.splitOwners) {
                                            slot.splitOwners.forEach(owner => {
                                                const tx = transactions.find(t =>
                                                    t.monthIndex === cycle &&
                                                    t.slotId === slot._id &&
                                                    t.userId === owner.userId &&
                                                    t.status === "PAID"
                                                );
                                                if (tx) {
                                                    paidCount += (owner.sharePercentage / 100);
                                                }
                                            });
                                        } else {
                                            const tx = transactions.find(t =>
                                                t.monthIndex === cycle &&
                                                t.slotId === slot._id &&
                                                t.status === "PAID"
                                            );
                                            if (tx) {
                                                paidCount += 1;
                                            }
                                        }
                                    });

                                    // My Payment
                                    const myPaymentStatuses = getMyPaymentStatus(cycle, mySlots, transactions, currentUserId);

                                    return (
                                        <tr key={cycle} className={`transition-colors hover:bg-[var(--surface-deep)]/60 ${isCurrent ? "bg-[var(--accent-vivid)]/5" : ""}`}>
                                            <td className="p-4 font-mono text-[var(--text-muted)]">
                                                #{cycle}
                                                {isCurrent && <Badge variant="default" className="ml-2 px-1.5 py-0 h-4 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-vivid)] text-white hover:bg-[var(--accent-vivid)]">NOW</Badge>}
                                            </td>
                                            <td className="p-4">
                                                {isFuture ? (
                                                    <span className="text-[var(--text-muted)] flex items-center gap-1"><Lock size={12} /> Locked</span>
                                                ) : isCurrent ? (
                                                    <span className="text-[var(--accent-vivid)] font-bold">In Progress</span>
                                                ) : (
                                                    <span className="text-[var(--text-muted)]">Completed</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {winnerSlot ? (() => {
                                                    const isMeWinner = currentUserId && (winnerSlot.userId === currentUserId || (winnerSlot.isSplit && winnerSlot.splitOwners?.some((o: any) => o.userId === currentUserId)));
                                                    return (
                                                        <div className={`flex items-center gap-2 ${isMeWinner ? "text-[var(--accent-vivid)] bg-[var(--accent-vivid)]/10 px-2 py-1 flex-inline rounded" : "text-[var(--gold)]"}`}>
                                                            <Trophy size={14} />
                                                            <span className="font-bold">#{winnerSlot.slotNumber}</span>
                                                            <span className="text-xs opacity-70">
                                                                {isMeWinner ? "(You)" : `(${winnerSlot.user?.name || "User"})`}
                                                            </span>
                                                        </div>
                                                    );
                                                })() : (
                                                    <span className="text-[var(--text-muted)]">-</span>
                                                )}
                                            </td>

                                            <td className="p-4 font-mono">
                                                {isFuture ? "-" : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-[var(--surface-deep)] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-[var(--accent-vivid)]"
                                                                style={{ width: `${(paidCount / totalExpected) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs">{paidCount % 1 === 0 ? paidCount : paidCount.toFixed(1)}/{totalExpected}</span>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="p-4 text-right">
                                                <SlotPaymentStack
                                                    statuses={myPaymentStatuses}
                                                    cycle={cycle}
                                                    onPay={onPay}
                                                    isFuture={isFuture}
                                                    defaultAmount={pot.config?.contribution || 0}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Surface>
            ) : (
                <Surface tier={1} className="overflow-hidden rounded-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[var(--surface-deep)]/60 text-xs uppercase text-[var(--text-muted)]">
                                <tr>
                                    <th className="p-4 whitespace-nowrap">Cycle</th>
                                    <th className="p-4 whitespace-nowrap">Status</th>
                                    <th className="p-4 whitespace-nowrap text-right">Payment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-subtle)]">
                                {cycles.map((cycle) => {
                                    const isCurrent = cycle === pot.currentMonth;
                                    const isFuture = cycle > pot.currentMonth;
                                    const myPaymentStatuses = getMyPaymentStatusDetailed(cycle, mySlots, transactions, pot.config.contribution, currentUserId);

                                    return (
                                        <tr key={cycle} className={`transition-colors hover:bg-[var(--surface-deep)]/60 ${isCurrent ? "bg-[var(--accent-vivid)]/5" : ""}`}>
                                            <td className="p-4 font-mono text-[var(--text-muted)]">
                                                #{cycle}
                                                {isCurrent && <Badge variant="default" className="ml-2 px-1.5 py-0 h-4 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-vivid)] text-white hover:bg-[var(--accent-vivid)]">NOW</Badge>}
                                            </td>
                                            <td className="p-4">
                                                {isFuture ? (
                                                    <span className="text-[var(--text-muted)] flex items-center gap-1"><Lock size={12} /> Locked</span>
                                                ) : isCurrent ? (
                                                    <span className="text-[var(--accent-vivid)] font-bold">In Progress</span>
                                                ) : (
                                                    <span className="text-[var(--text-muted)]">Completed</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <SlotPaymentStack
                                                    statuses={myPaymentStatuses}
                                                    cycle={cycle}
                                                    onPay={onPay}
                                                    isFuture={isFuture}
                                                    defaultAmount={pot.config?.contribution || 0}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Surface>
            )}
        </section>
    );
}

function activeSlotsCount(slots: Doc<"slots">[]) {
    // Count FILLED or RESERVED slots
    return slots.filter(s => s.status === "FILLED" || s.status === "RESERVED").length;
}

function getMyPaymentStatus(cycle: number, mySlots: Doc<"slots">[], transactions: Doc<"transactions">[], currentUserId?: string) {
    return mySlots.map(slot => {
        let status: "UNPAID" | "PENDING" | "PAID" = "UNPAID";
        let paidAt: number | undefined = undefined;
        let isSplit = slot.isSplit;
        let sharePct = 100;

        if (isSplit && (slot as any).splitOwners && currentUserId) {
            const myShare = (slot as any).splitOwners.find((o: any) => o.userId === currentUserId);
            sharePct = myShare ? myShare.sharePercentage : 0;
        }

        const tx = transactions.find(t => t.slotId === slot._id && t.monthIndex === cycle);

        if (tx) {
            status = tx.status;
            if (tx.status === "PAID") {
                paidAt = tx.paidAt || tx._creationTime;
            }
        }

        return {
            slotId: slot._id,
            slotNumber: slot.slotNumber,
            isSplit,
            sharePct,
            status,
            paidAt
        };
    });
}

function getMyPaymentStatusDetailed(
    cycle: number,
    mySlots: Doc<"slots">[],
    transactions: Doc<"transactions">[],
    contribution: number,
    currentUserId?: string
) {
    return mySlots.map(slot => {
        let status: "UNPAID" | "PENDING" | "PAID" = "UNPAID";
        let paidAt: number | undefined = undefined;
        let sharePct = 100;
        let isSplit = slot.isSplit;

        if (isSplit && (slot as any).splitOwners && currentUserId) {
            const myShare = (slot as any).splitOwners.find((o: any) => o.userId === currentUserId);
            sharePct = myShare ? myShare.sharePercentage : 0;
        }

        const dueAmount = (contribution * sharePct) / 100;

        const tx = transactions.find(t => t.slotId === slot._id && t.monthIndex === cycle);
        if (tx) {
            status = tx.status;
            if (tx.status === "PAID") {
                paidAt = tx.paidAt || tx._creationTime;
            }
        }

        return {
            slotId: slot._id,
            slotNumber: slot.slotNumber,
            isSplit,
            sharePct,
            status,
            dueAmount,
            paidAt
        };
    });
}

function SingleSlotPaymentStatus({ status, cycle, onPay, isFuture, defaultAmount }: { status: any, cycle: number, onPay: Function, isFuture: boolean, defaultAmount: number }) {
    if (isFuture) {
        return <span className="text-[var(--text-muted)]">-</span>;
    }

    const handlePay = () => {
        onPay(status.slotId, cycle, status.dueAmount || defaultAmount);
    };

    return (
        <div className="flex flex-col items-end whitespace-nowrap">
            <div className="flex items-center gap-3">
                {status.dueAmount !== undefined && (
                    <span className="text-xs font-mono text-[var(--text-primary)]">
                        {status.dueAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                )}

                {status.status === "PAID" ? (
                    <span className="text-[var(--accent-vivid)] font-bold flex items-center gap-1"><CheckCircle size={14} /> Paid</span>
                ) : status.status === "PENDING" ? (
                    <span className="text-[var(--warning)] font-bold flex items-center gap-1"><Clock size={14} /> Pending</span>
                ) : (
                    <button
                        onClick={handlePay}
                        className="font-bold text-[var(--danger)] hover:underline flex items-center gap-1"
                    >
                        Pay Now
                    </button>
                )}
            </div>

            <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                <span>Slot #{status.slotNumber}{status.isSplit ? ` (${status.sharePct}%)` : ""}</span>
                <span>•</span>
                {status.status === "PAID" ? (
                    <span>{status.paidAt ? `on ${new Date(status.paidAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : "Paid"}</span>
                ) : status.status === "PENDING" ? (
                    <span className="text-[var(--warning)] flex items-center gap-0.5"><Clock size={10} /> Awaiting Approval</span>
                ) : (
                    <span className="text-[var(--danger)] font-medium flex items-center gap-0.5"><AlertCircle size={10} /> Overdue</span>
                )}
            </div>
        </div>
    );
}

function SlotPaymentStack({ statuses, cycle, onPay, isFuture, defaultAmount }: { statuses: any[], cycle: number, onPay: Function, isFuture: boolean, defaultAmount: number }) {
    if (statuses.length === 0) return <span className="text-[var(--text-muted)]">-</span>;
    if (isFuture) return <span className="text-[var(--text-muted)]">-</span>;

    return (
        <div className="flex flex-col gap-3 items-end">
            {statuses.map(s => (
                <SingleSlotPaymentStatus
                    key={s.slotId}
                    status={s}
                    cycle={cycle}
                    onPay={onPay}
                    isFuture={isFuture}
                    defaultAmount={defaultAmount}
                />
            ))}
        </div>
    );
}
