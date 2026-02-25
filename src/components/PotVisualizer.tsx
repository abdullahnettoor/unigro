import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Doc } from "../../convex/_generated/dataModel";
import { Clock } from "lucide-react";

interface PotVisualizerProps {
    pot: Doc<"pots">;
    slots: (Doc<"slots"> & { user: Doc<"users"> | null })[];
    currentMonthIndex: number;
    winnerId?: string;
    transactions?: any[]; // Using any[] to bypass strict Doc typing for enriched fields
}

type VisualizerSlot = (Doc<"slots"> & { user: Doc<"users"> | null; splitOwners?: any[] }) | {
    _id: string;
    slotNumber: number;
    status: "OPEN";
    userId?: string;
    isGhost: boolean;
    user: null;
    drawOrder?: number;
    isSplit?: boolean;
    splitOwners?: any[];
};

export function PotVisualizer({ pot, slots, currentMonthIndex, winnerId, transactions }: PotVisualizerProps) {
    const orbitRadius = 135; // Increased slightly for more air

    // Generate full list of slots (Real + Virtual)
    const sortedSlots = useMemo(() => {
        const fullSlots: VisualizerSlot[] = [];
        const slotMap = new Map(slots.map(s => [s.slotNumber, s]));

        for (let i = 1; i <= pot.config.totalSlots; i++) {
            if (slotMap.has(i)) {
                fullSlots.push(slotMap.get(i)!);
            } else {
                fullSlots.push({
                    _id: `virtual-${i}`,
                    slotNumber: i,
                    status: "OPEN",
                    userId: undefined,
                    isGhost: false,
                    user: null,
                    drawOrder: undefined,
                });
            }
        }
        return fullSlots;
    }, [slots, pot.config.totalSlots]);

    // Calculate collection progress for the current cycle
    const collectionProgress = useMemo(() => {
        if (!transactions) return 0;
        const currentCycleTxs = transactions.filter(t => t.monthIndex === currentMonthIndex && t.status === "PAID");
        const totalExpected = pot.config.contribution * pot.config.totalSlots;
        if (totalExpected === 0) return 0;

        let collected = 0;
        currentCycleTxs.forEach(tx => {
            const slot = slots.find(s => s._id === tx.slotId);
            if (!slot) return;

            if (slot.isSplit && (slot as any).splitOwners) {
                const owner = (slot as any).splitOwners.find((o: any) => o.userId === tx.userId);
                if (owner) {
                    collected += (pot.config.contribution * owner.sharePercentage) / 100;
                } else if (!tx.userId) {
                    // Fallback for legacy split payments without userId tracked
                    collected += pot.config.contribution;
                }
            } else {
                collected += pot.config.contribution;
            }
        });

        return Math.min(100, (collected / totalExpected) * 100);
    }, [transactions, currentMonthIndex, pot.config.contribution, pot.config.totalSlots, slots]);

    const paidCount = transactions?.filter(t => t.monthIndex === currentMonthIndex && t.status === "PAID").length || 0;

    return (
        <div className="relative mx-auto flex h-[350px] w-full max-w-[400px] items-center justify-center overflow-visible">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent-vivid)_0%,transparent_70%)] opacity-[0.05] rounded-full blur-3xl pointer-events-none" />

            {/* Orbit Path with dash patterns */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-10" viewBox="0 0 400 400">
                <circle cx="200" cy="200" r={orbitRadius} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8,8" />
                <circle cx="200" cy="200" r={orbitRadius + 20} fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            </svg>

            {/* The Sun (Pot Center) */}
            <div className="relative z-10 flex items-center justify-center">
                {/* Collection Progress Ring */}
                <svg className="absolute h-40 w-40 -rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="var(--border-subtle)"
                        strokeWidth="1.5"
                        fill="none"
                        className="opacity-20"
                    />
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="var(--accent-vivid)"
                        strokeWidth="2.5"
                        strokeDasharray="283"
                        initial={{ strokeDashoffset: 283 }}
                        animate={{ strokeDashoffset: 283 - (283 * collectionProgress) / 100 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        fill="none"
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_8px_var(--accent-vivid)]"
                    />
                </svg>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex h-32 w-32 flex-col items-center justify-center rounded-full border border-[var(--accent-vivid)]/20 bg-[var(--surface-elevated)] p-4 text-center ring-4 ring-[var(--surface-card)]/50 shadow-2xl backdrop-blur-md"
                >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1 mb-1">
                        <Clock size={10} className="text-[var(--accent-vivid)]" /> Cycle {currentMonthIndex}
                    </div>
                    <div className="font-display text-2xl font-black text-[var(--text-primary)] leading-none mb-1">
                        {Math.round(collectionProgress)}%
                    </div>
                    <div className="text-[9px] font-mono text-[var(--text-muted)] bg-[var(--surface-deep)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)]">
                        {paidCount}/{sortedSlots.length} Payments
                    </div>
                </motion.div>
            </div>

            {/* Planets (Slots) */}
            {sortedSlots.map((slot, index) => {
                const angle = (index / sortedSlots.length) * 2 * Math.PI - (Math.PI / 2);
                const x = 200 + orbitRadius * Math.cos(angle);
                const y = 200 + orbitRadius * Math.sin(angle);

                const isWinner = (slot.userId && winnerId === slot.userId) || (slot.drawOrder === currentMonthIndex && currentMonthIndex > 0);
                const isOpen = slot.status === "OPEN";
                const isPaid = transactions?.some(t => t.slotId === slot._id && t.monthIndex === currentMonthIndex && t.status === "PAID");
                const isPending = transactions?.some(t => t.slotId === slot._id && t.monthIndex === currentMonthIndex && t.status === "PENDING");

                return (
                    <motion.div
                        key={slot._id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1, x: x - 200, y: y - 200 }}
                        transition={{ duration: 0.6, delay: index * 0.04, type: "spring", damping: 15 }}
                        className="group absolute left-1/2 top-1/2 -ml-6 -mt-6 h-12 w-12 cursor-pointer transition-transform hover:z-20"
                    >
                        <div className="relative h-full w-full">
                            {/* Inner highlight for paid state */}
                            <AnimatePresence>
                                {isPaid && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1.25 }}
                                        className="absolute -inset-1 rounded-full border-2 border-[var(--accent-vivid)]/40 animate-pulse pointer-events-none"
                                    />
                                )}
                            </AnimatePresence>

                            {/* Slot Circle */}
                            {isOpen ? (
                                <div className="flex h-full w-full items-center justify-center rounded-full border border-dashed border-[var(--border-subtle)] bg-[var(--surface-deep)]/40 text-[10px] text-[var(--text-muted)] transition-all hover:border-[var(--accent-vivid)] hover:bg-[var(--accent-vivid)]/5">
                                    {slot.slotNumber}
                                </div>
                            ) : (
                                <div className={`h-full w-full rounded-full border-2 bg-[var(--surface-card)] transition-all ${isWinner ? "border-[var(--gold)] shadow-[0_0_15px_var(--gold)]" :
                                    isPaid ? "border-[var(--accent-vivid)] shadow-sm" :
                                        isPending ? "border-[var(--warning)]" :
                                            "border-[var(--border-subtle)]"
                                    } overflow-hidden group-hover:scale-110 relative flex flex-wrap`}>
                                    {slot.isSplit && slot.splitOwners && slot.splitOwners.length > 0 ? (
                                        <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-[1px]">
                                            {slot.splitOwners.slice(0, 4).map((owner: any, idx) => (
                                                <div key={owner.userId || idx} className="h-full w-full overflow-hidden bg-[var(--surface-deep)]">
                                                    {owner.userPictureUrl ? (
                                                        <img src={owner.userPictureUrl} alt={owner.userName} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-[6px] font-bold text-[var(--text-muted)]">
                                                            {owner.userName?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {/* Fill empty spots in grid if less than 4 owners */}
                                            {slot.splitOwners.length < 4 && Array.from({ length: 4 - slot.splitOwners.length }).map((_, i) => (
                                                <div key={`empty-${i}`} className="h-full w-full bg-[var(--surface-deep)]/20" />
                                            ))}
                                        </div>
                                    ) : slot.user?.pictureUrl ? (
                                        <img src={slot.user.pictureUrl} alt={slot.user.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[var(--text-muted)] bg-[var(--surface-deep)]">
                                            {slot.user?.name?.charAt(0) || slot.slotNumber}
                                        </div>
                                    )}

                                    {/* Winner Pulse */}
                                    {isWinner && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-full h-full bg-[var(--gold)]/20 animate-pulse" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Split Indicator */}
                            {(slot as any).isSplit && (
                                <div className="absolute -top-1 -right-1 z-10 rounded-full bg-[var(--accent-vivid)] p-0.5 shadow-sm border border-white/20">
                                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                </div>
                            )}
                        </div>

                        {/* Tooltip */}
                        <div className="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 scale-90 rounded-lg bg-[var(--surface-elevated)] p-2 text-xs shadow-xl ring-1 ring-[var(--border-subtle)] opacity-0 transition-all group-hover:opacity-100 group-hover:scale-100 min-w-[120px] backdrop-blur-md">
                            <div className="font-bold text-[var(--text-primary)]">
                                {isOpen ? `Slot #${slot.slotNumber}: Available` : `Slot #${slot.slotNumber}: ${slot.user?.name}`}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${isPaid ? 'bg-[var(--accent-vivid)]' : isPending ? 'bg-[var(--warning)]' : 'bg-gray-500'}`} />
                                <span className="text-[var(--text-muted)] text-[10px]">
                                    {isWinner ? "CYCLE WINNER" : isPaid ? "Paid" : isPending ? "Pending Approval" : "Payment Due"}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
