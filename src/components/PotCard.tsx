import { Link } from "react-router-dom";
import type { Doc } from "../../convex/_generated/dataModel";

interface PotCardProps {
    pot: Doc<"pots"> & { foreman?: { name: string } | null };
    currentUserId?: string;
}

export function PotCard({ pot, currentUserId }: PotCardProps) {
    const isDraft = pot.status === "DRAFT";
    const isForeman = currentUserId && pot.foremanId === currentUserId;

    return (
        <Link to={`/pot/${pot._id}`} className="block">
            <div className="bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 hover:border-[var(--accent-vivid)]/50 transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col justify-between">

                <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-mono px-2 py-1 rounded-full uppercase tracking-wider ${isDraft ? "bg-[var(--warning)]/10 text-[var(--warning)]" : "bg-[var(--accent-vivid)]/10 text-[var(--accent-vivid)]"
                        }`}>
                        {pot.status}
                    </span>
                    <span className="text-[10px] bg-[var(--surface-deep)]/60 text-[var(--text-muted)] px-2 py-1 rounded-full uppercase tracking-wider">
                        {pot.config.frequency}
                    </span>
                </div>

                <div>
                    <h3 className="text-xl font-bold font-display text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent-vivid)] transition-colors truncate">
                        {pot.title}
                    </h3>
                    <div className="text-[var(--text-muted)] text-xs mb-6 flex items-center gap-1">
                        Organized by <span className="text-[var(--text-muted)] font-medium truncate max-w-[150px]">{isForeman ? "You" : (pot.foreman?.name || "Organizer")}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-[var(--border-subtle)] pt-4">
                    <div>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase mb-1">Pool Value</div>
                        <div className="text-lg font-mono font-bold text-[var(--text-primary)]">₹{pot.config.totalValue.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase mb-1">
                            Per {pot.config.frequency === 'occasional' ? 'Round' : 'Cycle'}
                        </div>
                        <div className="text-lg font-mono font-bold text-[var(--accent-secondary)]">₹{pot.config.contribution.toLocaleString()}</div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
