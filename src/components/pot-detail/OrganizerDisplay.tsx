import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export function OrganizerDisplay({ foremanId, avatarOnly }: { foremanId: Id<"users">, avatarOnly?: boolean }) {
    const foreman = useQuery(api.users.get, { userId: foremanId });

    if (!foreman) return <div className="hidden">...</div>;

    const Avatar = foreman.pictureUrl ? (
        <img src={foreman.pictureUrl} alt={foreman.name} className="w-8 h-8 sm:w-6 sm:h-6 rounded-full border-2 sm:border border-[var(--border-subtle)]" />
    ) : (
        <div className="w-8 h-8 sm:w-6 sm:h-6 rounded-full bg-[var(--surface-deep)] flex items-center justify-center text-[10px] font-bold text-[var(--text-muted)] border-2 sm:border border-[var(--border-subtle)]">
            {foreman.name?.charAt(0)}
        </div>
    );

    if (avatarOnly) {
        return Avatar;
    }

    return (
        <div className="flex items-center gap-2 mt-2">
            {Avatar}
            <span className="text-sm text-[var(--text-muted)]">Organized by <span className="text-[var(--text-primary)] font-bold">{foreman.name}</span></span>
        </div>
    );
}
