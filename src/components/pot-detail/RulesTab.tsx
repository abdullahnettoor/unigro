import { Calendar, Coins, Info, Layers } from "lucide-react";
import { OrganizerDisplay } from "@/components/pot-detail/OrganizerDisplay";
import { Surface } from "@/components/ui/Surface";
import { formatCurrency } from "@/lib/utils";

import type { Doc } from "../../../convex/_generated/dataModel";

interface RulesTabProps {
    pot: Doc<"pots">;
    gracePeriod: number;
}

export function RulesTab({ pot, gracePeriod }: RulesTabProps) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <Surface tier={1} className="rounded-2xl p-6">
                <div className="mb-6 -mt-2">
                    <OrganizerDisplay foremanId={pot.foremanId} />
                </div>
                <h3 className="text-lg font-display font-bold flex items-center gap-2 mb-4">
                    <Info className="text-[var(--accent-vivid)]" size={18} /> Description
                </h3>
                <p className="text-[var(--text-muted)] text-sm whitespace-pre-wrap leading-relaxed">
                    {pot.description || "No specific description provided by the organizer."}
                </p>
            </Surface>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Surface tier={1} className="p-5 rounded-2xl space-y-4">
                    <h4 className="font-bold text-[var(--text-primary)] text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Layers size={14} className="text-[var(--accent-vivid)]" /> Configuration
                    </h4>
                    <div className="space-y-2 text-sm font-medium">
                        <Surface tier={2} className="flex justify-between items-center p-2.5 rounded-lg border-none shadow-none">
                            <span className="text-[var(--text-muted)]">Target Slots</span>
                            <span className="font-bold text-[var(--text-primary)]">{pot.config.totalSlots}</span>
                        </Surface>
                        <Surface tier={2} className="flex justify-between items-center p-2.5 rounded-lg border-none shadow-none">
                            <span className="text-[var(--text-muted)]">EMI</span>
                            <span className="font-bold text-[var(--accent-vivid)]">{formatCurrency(pot.config.contribution, pot.config.currency)}</span>
                        </Surface>
                        <Surface tier={2} className="flex justify-between items-center p-2.5 rounded-lg border-none shadow-none">
                            <span className="text-[var(--text-muted)]">Frequency</span>
                            <span className="capitalize">{pot.config.frequency}</span>
                        </Surface>
                        <Surface tier={2} className="flex justify-between items-center p-2.5 rounded-lg border-none shadow-none">
                            <span className="text-[var(--text-muted)]">Duration</span>
                            <span>{pot.config.duration} Rounds</span>
                        </Surface>
                        <Surface tier={2} className="flex justify-between items-center p-2.5 rounded-lg border-none shadow-none">
                            <span className="text-[var(--text-muted)]">Commission</span>
                            <span>{pot.config.commission}%</span>
                        </Surface>
                    </div>
                </Surface>

                <Surface tier={1} className="p-5 rounded-2xl space-y-4">
                    <h4 className="font-bold text-[var(--text-primary)] text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Calendar size={14} className="text-[var(--accent-secondary)]" /> Timeline
                    </h4>
                    <div className="space-y-2 text-sm font-medium">
                        <Surface tier={2} className="flex justify-between items-center p-2.5 rounded-lg border-none shadow-none">
                            <span className="text-[var(--text-muted)]">Start Date</span>
                            <span>{pot.startDate ? new Date(pot.startDate).toLocaleDateString() : 'N/A'}</span>
                        </Surface>
                        <Surface tier={2} className="flex justify-between items-center p-2.5 rounded-lg border-none shadow-none">
                            <span className="text-[var(--text-muted)]">Grace Period</span>
                            <span>{gracePeriod} Days</span>
                        </Surface>
                    </div>
                </Surface>
            </div>

            {pot.bankDetails && (
                <Surface tier={1} className="p-6 rounded-2xl space-y-4">
                    <h4 className="font-bold text-[var(--text-primary)] text-sm uppercase tracking-wider flex items-center gap-2">
                        <Coins size={14} className="text-[var(--accent-vivid)]" /> Payment Details
                    </h4>
                    <Surface tier={2} className="p-4 rounded-xl font-mono text-sm whitespace-pre-wrap border-none shadow-none">
                        {pot.bankDetails}
                    </Surface>
                </Surface>
            )}
        </div>
    );
}
