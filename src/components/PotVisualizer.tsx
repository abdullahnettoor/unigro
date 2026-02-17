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

export function PotVisualizer({ pot, slots, currentMonthIndex, winnerId }: PotVisualizerProps) {
    const orbitRadius = 140;

    // Generate full list of slots (Real + Virtual)
    const sortedSlots = useMemo(() => {
        const fullSlots = [];
        const slotMap = new Map(slots.map(s => [s.slotNumber, s]));

        for (let i = 1; i <= pot.config.totalSlots; i++) {
            if (slotMap.has(i)) {
                fullSlots.push(slotMap.get(i)!);
            } else {
                // Virtual Slot
                fullSlots.push({
                    _id: `virtual-${i}` as any, // Temporary ID for key
                    slotNumber: i,
                    status: "OPEN",
                    userId: undefined,
                    isGhost: false,
                    user: null,
                    drawOrder: undefined // Added missing property
                });
            }
        }
        return fullSlots;
    }, [slots, pot.config.totalSlots]);

    const filledCount = slots.filter(s => s.status === "FILLED").length;

    return (
        <div className="relative w-[360px] h-[360px] mx-auto flex items-center justify-center">
            {/* Orbit Path */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 360 360">
                <circle cx="180" cy="180" r={orbitRadius} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" />
            </svg>

            {/* The Sun (Pot Center) */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute z-10 w-32 h-32 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--accent-secondary)] shadow-[0_0_50px_rgb(var(--accent-glow)/0.35)] flex flex-col items-center justify-center text-[var(--text-on-accent)] p-4 text-center"
            >
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-80">Cycle {currentMonthIndex}</span>
                <span className="text-2xl font-display font-bold leading-none">₹{pot.config.totalValue.toLocaleString()}</span>
                <span className="text-[9px] mt-1 font-mono opacity-80">{filledCount} / {pot.config.totalSlots} Slots</span>
            </motion.div>

            {/* Planets (Slots) */}
            {sortedSlots.map((slot, index) => {
                const angle = (index / sortedSlots.length) * 2 * Math.PI - (Math.PI / 2); // Start from top
                const x = 180 + orbitRadius * Math.cos(angle);
                const y = 180 + orbitRadius * Math.sin(angle);

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
                        className="absolute top-1/2 left-1/2 w-12 h-12 -ml-6 -mt-6 cursor-pointer group"
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
                                    <div className="w-full h-full flex items-center justify-center bg-[var(--surface-deep)] text-xs font-bold text-[var(--text-muted)]">
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
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-black/80 text-[var(--text-primary)] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            {isOpen ? `Slot #${slot.slotNumber}: OPEN` : `Slot #${slot.slotNumber}: ${slot.user?.name}`}
                            {isWinner && <span className="text-[var(--gold)] block text-[9px] font-bold">WINNER</span>}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
