import { Calendar, Coins, Info, Layers } from "lucide-react";
import { OrganizerDisplay } from "@/components/pot-detail/OrganizerDisplay";

import type { Doc } from "../../../convex/_generated/dataModel";

interface RulesTabProps {
    pot: Doc<"pots">;
    gracePeriod: number;
}

export function RulesTab({ pot, gracePeriod }: RulesTabProps) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="glass-1 rounded-2xl p-6">
                <div className="mb-6 -mt-2">
                    <OrganizerDisplay foremanId={pot.foremanId} />
                </div>
                <h3 className="text-lg font-display font-bold flex items-center gap-2 mb-4">
                    <Info className="text-[var(--accent-vivid)]" size={18} /> Description
                </h3>
                <p className="text-[var(--text-muted)] text-sm whitespace-pre-wrap leading-relaxed">
                    {pot.description || "No specific description provided by the organizer."}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-1 p-5 rounded-2xl space-y-4">
                    <h4 className="font-bold text-[var(--text-primary)] text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2"><Layers size={14} className="text-[var(--accent-vivid)]" /> Configuration</h4>
                    <div className="space-y-2 text-sm font-medium">
                        <div className="flex justify-between items-center bg-[var(--surface-deep)]/40 p-2.5 rounded-lg border border-[var(--border-subtle)]/20">
                            <span className="text-[var(--text-muted)]">Frequency</span>
                            <span className="capitalize">{pot.config.frequency}</span>
                        </div>
                        <div className="flex justify-between items-center bg-[var(--surface-deep)]/40 p-2.5 rounded-lg border border-[var(--border-subtle)]/20">
                            <span className="text-[var(--text-muted)]">Duration</span>
                            <span>{pot.config.duration} Rounds</span>
                        </div>
                        <div className="flex justify-between items-center bg-[var(--surface-deep)]/40 p-2.5 rounded-lg border border-[var(--border-subtle)]/20">
                            <span className="text-[var(--text-muted)]">Commission</span>
                            <span>{pot.config.commission}%</span>
                        </div>
                    </div>
                </div>

                <div className="glass-1 p-5 rounded-2xl space-y-4">
                    <h4 className="font-bold text-[var(--text-primary)] text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2"><Calendar size={14} className="text-[var(--accent-secondary)]" /> Timeline</h4>
                    <div className="space-y-2 text-sm font-medium">
                        <div className="flex justify-between items-center bg-[var(--surface-deep)]/40 p-2.5 rounded-lg border border-[var(--border-subtle)]/20">
                            <span className="text-[var(--text-muted)]">Grace Period</span>
                            <span>{gracePeriod} Days</span>
                        </div>
                        <div className="flex justify-between items-center bg-[var(--surface-deep)]/40 p-2.5 rounded-lg border border-[var(--border-subtle)]/20">
                            <span className="text-[var(--text-muted)]">Start Date</span>
                            <span>{pot.startDate ? new Date(pot.startDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {pot.bankDetails && (
                <div className="glass-1 p-6 rounded-2xl space-y-4">
                    <h4 className="font-bold text-[var(--text-primary)] text-sm uppercase tracking-wider flex items-center gap-2"><Coins size={14} className="text-[var(--accent-vivid)]" /> Payment Details</h4>
                    <div className="p-4 bg-[var(--surface-deep)]/60 rounded-xl font-mono text-sm whitespace-pre-wrap border border-[var(--border-subtle)]/30">
                        {pot.bankDetails}
                    </div>
                </div>
            )}
        </div>
    );
}
