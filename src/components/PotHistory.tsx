import type { Doc, Id } from "../../convex/_generated/dataModel";
import { CheckCircle, Clock, AlertCircle, Lock, Trophy } from "lucide-react";

interface PotHistoryProps {
    pot: Doc<"pots">;
    allSlots: (Doc<"slots"> & {
        user?: { name: string } | null;
        splitOwners?: { userId: Id<"users">; sharePercentage: number }[]
    })[];
    transactions: Doc<"transactions">[];
    mySlots: Doc<"slots">[];

    isForeman?: boolean; // Deprecated, unused
    onPay: (slotId: Id<"slots">, cycle: number, amount: number) => void;
}

export function PotHistory({ pot, allSlots, transactions, mySlots, onPay }: PotHistoryProps) {
    const cycles = Array.from({ length: pot.config.duration }, (_, i) => i + 1);

    return (
        <section className="mt-12">
            <h3 className="text-xl font-display font-bold flex items-center gap-2 mb-6">
                <Clock className="text-[#C1FF72]" /> Pot History
            </h3>

            <div className="bg-[#232931]/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-gray-400 font-mono text-xs uppercase">
                            <tr>
                                <th className="p-4 whitespace-nowrap">Cycle</th>
                                <th className="p-4 whitespace-nowrap">Status</th>
                                <th className="p-4 whitespace-nowrap">Winner</th>
                                <th className="p-4 whitespace-nowrap">Collection</th>
                                <th className="p-4 whitespace-nowrap text-right">My Payment</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
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
                                const myPaymentStatus = getMyPaymentStatus(cycle, mySlots, transactions);

                                return (
                                    <tr key={cycle} className={`hover:bg-white/5 transition-colors ${isCurrent ? "bg-[#C1FF72]/5" : ""}`}>
                                        <td className="p-4 font-mono text-gray-400">
                                            #{cycle}
                                            {isCurrent && <span className="ml-2 text-[10px] bg-[#C1FF72] text-[#1B3022] px-1.5 py-0.5 rounded font-bold">NOW</span>}
                                        </td>
                                        <td className="p-4">
                                            {isFuture ? (
                                                <span className="text-gray-600 flex items-center gap-1"><Lock size={12} /> Locked</span>
                                            ) : isCurrent ? (
                                                <span className="text-[#C1FF72] font-bold">In Progress</span>
                                            ) : (
                                                <span className="text-gray-400">Completed</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {winnerSlot ? (
                                                <div className="flex items-center gap-2 text-[#FFD700]">
                                                    <Trophy size={14} />
                                                    <span className="font-bold">Slot #{winnerSlot.slotNumber}</span>
                                                    <span className="text-xs opacity-70">({winnerSlot.user?.name || "User"})</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-600">-</span>
                                            )}
                                        </td>

                                        <td className="p-4 font-mono">
                                            {isFuture ? "-" : (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#C1FF72]"
                                                            style={{ width: `${(paidCount / totalExpected) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs">{paidCount % 1 === 0 ? paidCount : paidCount.toFixed(1)}/{totalExpected}</span>
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-4 text-right">
                                            {mySlots.length === 0 ? (
                                                <span className="text-gray-600">-</span>
                                            ) : isFuture ? (
                                                <span className="text-gray-600">-</span>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    {myPaymentStatus.allPaid ? (
                                                        <div className="text-right">
                                                            <span className="text-[#C1FF72] flex items-center gap-1 justify-end"><CheckCircle size={14} /> Paid</span>
                                                            {myPaymentStatus.paidAt && <span className="text-[10px] text-gray-500 block">on {new Date(myPaymentStatus.paidAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                                                        </div>
                                                    ) : myPaymentStatus.pending ? (
                                                        <span className="text-yellow-400 flex items-center gap-1 justify-end"><Clock size={14} /> Pending</span>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-red-400 flex items-center gap-1 justify-end"><AlertCircle size={14} /> Overdue</span>
                                                            {myPaymentStatus.actionableSlot && (
                                                                <button
                                                                    onClick={() => onPay(myPaymentStatus.actionableSlot!._id, cycle, pot.config?.contribution || 0)} // Assuming full contribution for simplicity, or we need to calculate share
                                                                    className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded"
                                                                >
                                                                    Pay
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

function activeSlotsCount(slots: Doc<"slots">[]) {
    // Count FILLED or RESERVED slots
    return slots.filter(s => s.status === "FILLED" || s.status === "RESERVED").length;
}

function getMyPaymentStatus(cycle: number, mySlots: Doc<"slots">[], transactions: Doc<"transactions">[]) {
    if (mySlots.length === 0) return { allPaid: true, pending: false }; // Non-members

    let allPaid = true;
    let pending = false;
    let paidAt: number | undefined = undefined;
    let actionableSlot: Doc<"slots"> | undefined = undefined;

    // Check transaction for EACH of my slots for this cycle
    for (const slot of mySlots) {
        // Need to filter transactions by userId if split, but typically mySlots filters ownership.
        // Let's assume loose check for now or strict if userId available.
        const tx = transactions.find(t => t.slotId === slot._id && t.monthIndex === cycle);

        if (!tx || tx.status === "UNPAID") {
            allPaid = false;
            actionableSlot = slot; // Return the first unpaid slot to allow action
        } else if (tx.status === "PENDING") {
            allPaid = false;
            pending = true;
        } else if (tx.status === "PAID") {
            // If multiple slots, show latest date? or first?
            paidAt = tx.paidAt || tx._creationTime;
        }
    }

    return { allPaid, pending, paidAt, actionableSlot };
}
