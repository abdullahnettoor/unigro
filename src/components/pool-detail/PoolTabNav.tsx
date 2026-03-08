import { cn } from "@/lib/utils";
import { Surface } from "@/components/ui/Surface";

export type PoolTab = "overview" | "seats" | "members" | "history" | "rules" | "organizer";

interface PoolTabNavProps {
  activeTab: PoolTab;
  onChange: (tab: PoolTab) => void;
  showOrganizer: boolean;
  showMemberTabs: boolean;
  memberCount: number;
  pendingApprovals: number;
}

export function PoolTabNav({
  activeTab,
  onChange,
  showOrganizer,
  showMemberTabs,
  memberCount,
  pendingApprovals,
}: PoolTabNavProps) {
  const tabButtonClass = (tab: PoolTab) =>
    cn(
      "px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap rounded-full",
      activeTab === tab
        ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
    );

  return (
    <div className="sticky top-[56px] z-40 bg-[var(--bg-app)]/80 backdrop-blur-md py-2 w-full max-w-full overflow-hidden">
      <Surface tier={1} className="flex w-full min-w-0 max-w-full gap-1 overflow-x-auto rounded-full p-1 no-scrollbar">
        {showMemberTabs && (
          <button onClick={() => onChange("overview")} className={cn("shrink-0", tabButtonClass("overview"))}>
            Overview
          </button>
        )}
        <button onClick={() => onChange("rules")} className={cn("shrink-0", tabButtonClass("rules"))}>
          Rules
        </button>
        {showMemberTabs && (
          <>
            <button onClick={() => onChange("seats")} className={cn("shrink-0", tabButtonClass("seats"))}>
              Seats
            </button>
            <button onClick={() => onChange("members")} className={cn("shrink-0", tabButtonClass("members"))}>
              <span className="inline-flex items-center gap-2">
                Members
                <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-[var(--surface-deep)]/70 px-1 text-[10px] font-semibold text-[var(--text-muted)]">
                  {memberCount}
                </span>
              </span>
            </button>
            <button onClick={() => onChange("history")} className={cn("shrink-0", tabButtonClass("history"))}>
              History
            </button>
          </>
        )}
        {showOrganizer && (
          <button onClick={() => onChange("organizer")} className={cn("shrink-0", tabButtonClass("organizer"))}>
            <span className="inline-flex items-center gap-2">
              Organizer
              {pendingApprovals > 0 && (
                <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] px-1 text-[10px] font-semibold">
                  {pendingApprovals}
                </span>
              )}
            </span>
          </button>
        )}
      </Surface>
    </div>
  );
}
