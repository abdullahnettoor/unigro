import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Doc } from "../../convex/_generated/dataModel";

interface PotVisualizerProps {
    pot: Doc<"pots">;
    slots: (Doc<"slots"> & { user: Doc<"users"> | null })[];
    currentMonthIndex: number;
    winnerId?: string; // Winner User ID? Or Winner Slot ID?
    // Let's stick to UserID for high-level check, or Slot ID better?
    // The previous code checked winnerId === member.userId.
    // In Slot architecture, we can check winner Slot ID or drawOrder.
    // Actually, `activeMembers` had `drawOrder`. Slots have `drawOrder`.
    // So we can check `slot.drawOrder === currentMonthIndex` inside the loop.
    // But passing `winnerId` (userId) is fine too if we want to highlight user.
}

type VisualizerSlot = (Doc<"slots"> & { user: Doc<"users"> | null }) | {
    _id: string;
    slotNumber: number;
    status: "OPEN";
    userId?: string;
    isGhost: boolean;
    user: null;
    drawOrder?: number;
};

export function PotVisualizer({ pot, slots, currentMonthIndex, winnerId }: PotVisualizerProps) {
    const orbitRadius = 120;

    // Generate full list of slots (Real + Virtual)
    const sortedSlots = useMemo(() => {
        const fullSlots: VisualizerSlot[] = [];
        const slotMap = new Map(slots.map(s => [s.slotNumber, s]));

        for (let i = 1; i <= pot.config.totalSlots; i++) {
            if (slotMap.has(i)) {
                fullSlots.push(slotMap.get(i)!);
            } else {
                // Virtual Slot
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

    const filledCount = slots.filter(s => s.status === "FILLED").length;

    return (
        <div className="relative mx-auto flex h-[300px] w-[300px] items-center justify-center sm:h-[340px] sm:w-[340px]">
            {/* Orbit Path */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-20" viewBox="0 0 300 300">
                <circle cx="150" cy="150" r={orbitRadius} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" />
            </svg>

            {/* The Sun (Pot Center) */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute z-10 flex h-28 w-28 flex-col items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 text-center text-[var(--text-primary)] shadow-lg sm:h-32 sm:w-32"
            >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Cycle {currentMonthIndex}</span>
                <span className="font-display text-xl font-bold leading-none sm:text-2xl">₹{pot.config.totalValue.toLocaleString()}</span>
                <span className="mt-1 font-mono text-[9px] text-[var(--text-muted)]">{filledCount} / {pot.config.totalSlots} slots</span>
            </motion.div>

            {/* Planets (Slots) */}
            {sortedSlots.map((slot, index) => {
                const angle = (index / sortedSlots.length) * 2 * Math.PI - (Math.PI / 2); // Start from top
                const x = 150 + orbitRadius * Math.cos(angle);
                const y = 150 + orbitRadius * Math.sin(angle);

                // Highlight if this slot is the winner of THIS displayed cycle (or passed winnerId match)
                // Note: winnerId prop was userId. slot.userId check is ok.
                const isWinner = (slot.userId && winnerId === slot.userId) || (slot.drawOrder === currentMonthIndex && currentMonthIndex > 0);
                const isOpen = slot.status === "OPEN";

                return (
                    <motion.div
                        key={slot._id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1, x: x - 180, y: y - 180 }}
                        transition={{ duration: 0.5, delay: index * 0.05, type: "spring" }}
                        className="group absolute left-1/2 top-1/2 -ml-5 -mt-5 h-10 w-10 cursor-pointer sm:-ml-6 sm:-mt-6 sm:h-12 sm:w-12"
                    >
                        {/* Planet Body */}
                        {isOpen ? (
                            <div className="w-full h-full rounded-full border border-dashed border-[var(--border-subtle)] bg-[var(--surface-deep)]/60 flex items-center justify-center text-[10px] text-[var(--text-muted)] hover:border-[var(--accent-vivid)] hover:text-[var(--accent-vivid)] transition-colors">
                                {slot.slotNumber}
                            </div>
                        ) : (
                            <div className={`w-full h-full rounded-full border-2 overflow-hidden bg-[var(--surface-elevated)] relative ${isWinner ? "border-[var(--gold)] shadow-[0_0_20px_var(--gold)]" : "border-[var(--border-subtle)] group-hover:border-[var(--accent-vivid)]"
                                } transition-colors`}>
                                {slot.user?.pictureUrl ? (
                                    <img src={slot.user.pictureUrl} alt={slot.user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-[var(--surface-deep)] text-xs font-semibold text-[var(--text-muted)]">
                                        {slot.user?.name?.charAt(0) || slot.slotNumber}
                                    </div>
                                )}

                                {/* Status Indicator Dot */}
                                {isWinner && (
                                    <div className="absolute top-0 right-0 w-3 h-3 bg-[var(--gold)] rounded-full border border-[var(--surface-elevated)]" />
                                )}
                            </div>
                        )}

                        {/* Tooltip on Hover */}
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 rounded bg-black/80 px-2 py-1 text-xs text-[var(--text-primary)] opacity-0 transition-opacity group-hover:opacity-100">
                            {isOpen ? `Slot #${slot.slotNumber}: OPEN` : `Slot #${slot.slotNumber}: ${slot.user?.name}`}
                            {isWinner && <span className="text-[var(--gold)] block text-[9px] font-bold">WINNER</span>}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
