import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export function OrganizerDisplay({ foremanId }: { foremanId: Id<"users"> }) {
    const foreman = useQuery(api.users.get, { userId: foremanId });

    if (!foreman) return <div className="text-xs text-[var(--text-muted)] animate-pulse">Loading organizer...</div>;

    return (
        <div className="flex items-center gap-2 mt-2">
            {foreman.pictureUrl ? (
                <img src={foreman.pictureUrl} alt={foreman.name} className="w-6 h-6 rounded-full border border-[var(--border-subtle)]" />
            ) : (
                <div className="w-6 h-6 rounded-full bg-[var(--surface-deep)] flex items-center justify-center text-[10px] font-bold text-[var(--text-muted)]">
                    {foreman.name?.charAt(0)}
                </div>
            )}
            <span className="text-sm text-[var(--text-muted)]">Organized by <span className="text-[var(--text-primary)] font-bold">{foreman.name}</span></span>
        </div>
    );
}
