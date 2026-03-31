import { BadgeCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PoolOrganizer } from "./types";

interface OrganizerBadgeProps {
  organizer?: PoolOrganizer | null;
  avatarOnly?: boolean;
  className?: string;
}

export function OrganizerBadge({ organizer, avatarOnly = false, className }: OrganizerBadgeProps) {
  if (!organizer) return null;
  const initials = organizer.name?.[0] || "O";
  const isVerified = organizer.verificationStatus === "VERIFIED";

  if (avatarOnly) {
    return (
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border-subtle)]",
          className
        )}
      >
        {organizer?.name ? (
          <span className="text-sm font-semibold">{initials}</span>
        ) : (
          <BadgeCheck size={16} />
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
        <span className="text-sm font-semibold">{initials}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{organizer.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span className="break-all">{organizer.phone}</span>
          {isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success)]/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--success)]">
              <BadgeCheck size={12} /> Verified
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
