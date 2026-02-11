import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Doc } from "../../convex/_generated/dataModel";

interface PotVisualizerProps {
    pot: Doc<"pots">;
    members: (Doc<"members"> & { user: Doc<"users"> | null })[];
    currentMonthIndex: number;
    winnerId?: string;
}

export function PotVisualizer({ pot, members, currentMonthIndex, winnerId }: PotVisualizerProps) {
    const orbitRadius = 140; // Reduced radius for tighter fit

    // Sort members for consistent positioning
    const sortedMembers = useMemo(() => {
        return [...members].sort((a, b) => (a._creationTime - b._creationTime));
    }, [members]);

    return (
        <div className="relative w-[340px] h-[340px] mx-auto flex items-center justify-center">
            {/* Orbit Path - Subtle Dashed Line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 340 340">
                <circle cx="170" cy="170" r={orbitRadius} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" />
            </svg>

            {/* The Sun (Pot Center) */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute z-10 w-32 h-32 rounded-full bg-gradient-to-br from-[#FFD700] to-[#E07A5F] shadow-[0_0_50px_rgba(224,122,95,0.4)] flex flex-col items-center justify-center text-[#1B3022] p-4 text-center"
            >
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-80">Month {currentMonthIndex + 1}</span>
                <span className="text-2xl font-display font-bold leading-none">₹{pot.config.totalValue.toLocaleString()}</span>
                <span className="text-[9px] mt-1 font-mono opacity-80">{members.length} Planets</span>
            </motion.div>

            {/* Planets (Members) */}
            {sortedMembers.map((member, index) => {
                const angle = (index / sortedMembers.length) * 2 * Math.PI - (Math.PI / 2); // Start from top
                const x = 170 + orbitRadius * Math.cos(angle);
                const y = 170 + orbitRadius * Math.sin(angle);

                const isWinner = winnerId === member.userId;

                return (
                    <motion.div
                        key={member._id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1, x: x - 170, y: y - 170 }} // Framer centers on parent, so we offset
                        transition={{ duration: 0.5, delay: index * 0.1, type: "spring" }}
                        className="absolute top-1/2 left-1/2 w-12 h-12 -ml-6 -mt-6 cursor-pointer group"
                    >
                        {/* Planet Body */}
                        <div className={`w-full h-full rounded-full border-2 overflow-hidden bg-[#232931] relative ${isWinner ? "border-[#FFD700] shadow-[0_0_20px_#FFD700]" : "border-white/20 group-hover:border-[#C1FF72]"
                            } transition-colors`}>
                            {member.user?.pictureUrl ? (
                                <img src={member.user.pictureUrl} alt={member.user.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-700 text-xs font-bold text-gray-400">
                                    {member.user?.name?.charAt(0) || "?"}
                                </div>
                            )}

                            {/* Status Indicator Dot */}
                            {isWinner && (
                                <div className="absolute top-0 right-0 w-3 h-3 bg-[#FFD700] rounded-full border border-[#232931]" />
                            )}
                        </div>

                        {/* Tooltip on Hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            {member.user?.name}
                            {isWinner && <span className="text-[#FFD700] block text-[9px] font-bold">WINNER</span>}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
