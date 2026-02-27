import { OrganizerDisplay } from "@/components/pot-detail/OrganizerDisplay";
import { PotVisualizer } from "@/components/pot-detail/PotVisualizer";
import { Surface } from "@/components/ui/Surface";

import type { Doc } from "../../../convex/_generated/dataModel";

interface PotHeroProps {
    pot: Doc<"pots">;
    allSlots: any[];
    transactions: any[];
    isActive: boolean;
    hasOpenSlots: boolean;
    isMember: boolean;
    isForeman: boolean;
    progressInfo: { count: number; total: number } | null;
    filledCount: number;
    displayProgress: number;
    onOrganizerClick: () => void;
    onSlotClick?: (slotId: string, slotNumber: number, isOpen: boolean, isSplit: boolean) => void;
}

export function PotHero({
    pot,
    allSlots,
    transactions,
    isActive,
    hasOpenSlots,
    isMember,
    isForeman,
    progressInfo,
    filledCount,
    displayProgress,
    onOrganizerClick,
    onSlotClick
}: PotHeroProps) {
    return (
        <Surface tier={3} className="grain rounded-3xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 z-20 hidden lg:block cursor-pointer hover:scale-105 transition-transform" onClick={onOrganizerClick}>
                <OrganizerDisplay foremanId={pot.foremanId} avatarOnly={true} />
            </div>

            {/* Desktop Title & Status */}
            <div className="hidden lg:block mb-6 text-left">
                <span className="text-[10px] font-bold text-[var(--accent-vivid)] uppercase tracking-widest bg-[var(--accent-vivid)]/10 px-2 py-0.5 rounded-full mb-2 inline-block">
                    {pot.status}
                </span>
                <h1 className="text-4xl font-display font-black text-[var(--text-primary)] truncate">{pot.title}</h1>
            </div>

            {/* Mobile/Tablet Status Badge */}
            <div className="lg:hidden flex justify-center mb-4 relative z-10 animate-in fade-in duration-300">
                <span className="text-[10px] sm:text-xs font-bold text-[var(--accent-vivid)] uppercase tracking-widest bg-[var(--accent-vivid)]/10 px-3 py-1 rounded-full border border-[var(--accent-vivid)]/20 shadow-sm backdrop-blur-md">
                    {pot.status}
                </span>
            </div>

            {(isMember || isForeman || (isActive && hasOpenSlots)) && (
                <div className="mt-4">
                    <PotVisualizer pot={pot} slots={allSlots} currentMonthIndex={pot.currentMonth} transactions={transactions} onSlotClick={onSlotClick} />
                </div>
            )}

            {/* Progress Bars */}
            <div className="mt-8 border-t border-[var(--border-subtle)] pt-6 space-y-6">
                {/* Collection/Filling Status */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-xs uppercase tracking-wide text-[var(--text-muted)] font-bold">
                            {isActive ? "Cycle collection status" : "Filling status"}
                        </div>
                        <div className="text-xs font-mono text-[var(--text-primary)] font-bold">
                            {isActive ? `${progressInfo?.count ?? 0} / ${progressInfo?.total ?? 0} paid` : `${filledCount} / ${pot.config.totalSlots} joined`}
                        </div>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-deep)] border border-[var(--border-subtle)]/30">
                        <div
                            className="h-full bg-gradient-to-r from-[var(--accent-vivid)] to-[var(--accent-secondary)] transition-all duration-500 shadow-[0_0_6px_rgba(0,0,0,0.2)]"
                            style={{ width: `${Math.min(100, displayProgress)}%` }}
                        />
                    </div>
                </div>

                {/* Overall Pot Cycle Progress (Only for Active Pots) */}
                {isActive && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-500">
                        <div className="flex justify-between items-end mb-2">
                            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)] font-bold">
                                Overall Cycle Progress
                            </div>
                            <div className="text-xs font-mono text-[var(--text-primary)] font-bold">
                                {pot.currentMonth} / {pot.config.duration} rounds
                            </div>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-deep)] border border-[var(--border-subtle)]/30">
                            <div
                                className="h-full bg-gradient-to-r from-[var(--gold)] to-[var(--accent-vivid)] transition-all duration-700 shadow-[0_0_6px_rgba(0,0,0,0.2)]"
                                style={{ width: `${(pot.currentMonth / pot.config.duration) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </Surface>
    );
}
