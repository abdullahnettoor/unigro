import { PotVisualizer } from "@/components/pot-detail/PotVisualizer";
import { OrganizerDisplay } from "@/components/pot-detail/OrganizerDisplay";
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
    displayProgress
}: PotHeroProps) {
    return (
        <div className="glass-3 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 z-20 hidden sm:block">
                <OrganizerDisplay foremanId={pot.foremanId} />
            </div>
            <div className="mb-2 text-center sm:text-left">
                <span className="text-[10px] font-bold text-[var(--accent-vivid)] uppercase tracking-widest bg-[var(--accent-vivid)]/10 px-2 py-0.5 rounded-full mb-2 inline-block">
                    GrowPot {pot.status}
                </span>
                <h1 className="text-3xl sm:text-4xl font-display font-black text-[var(--text-primary)]">{pot.title}</h1>
            </div>

            {(isMember || isForeman || (isActive && hasOpenSlots)) && (
                <div className="mt-4">
                    <PotVisualizer pot={pot} slots={allSlots} currentMonthIndex={pot.currentMonth} transactions={transactions} />
                </div>
            )}

            {/* Quick Progress Bar for small screens/non-members */}
            <div className="mt-8 border-t border-[var(--border-subtle)] pt-6">
                <div className="flex justify-between items-end mb-2">
                    <div className="text-xs uppercase tracking-wide text-[var(--text-muted)] font-bold">
                        {isActive ? "Collection status" : "Filling status"}
                    </div>
                    <div className="text-xs font-mono text-[var(--text-primary)] font-bold">
                        {isActive ? `${progressInfo?.count ?? 0} / ${progressInfo?.total ?? 0} paid` : `${filledCount} / ${pot.config.totalSlots} joined`}
                    </div>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-deep)] border border-[var(--border-subtle)]/30">
                    <div
                        className="h-full bg-gradient-to-r from-[var(--accent-vivid)] to-[var(--accent-secondary)] transition-all duration-500 shadow-[0_0_10px_var(--accent-vivid)]"
                        style={{ width: `${Math.min(100, displayProgress)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
