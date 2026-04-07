import { Surface } from "@/components/ui/Surface";
import { cn } from "@/lib/utils";

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
      "px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap rounded-full shrink-0 max-w-full",
      activeTab === tab
        ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
    );

  return (
    <div className="sticky top-[56px] -mt-px z-40 w-full min-w-0 max-w-full overflow-hidden pb-2 bg-[rgba(var(--bg-app-rgb),0.86)] supports-[backdrop-filter]:backdrop-blur-md">
      <Surface
        tier={1}
        className="flex w-full min-w-0 max-w-full gap-1 overflow-x-auto rounded-full p-1 no-scrollbar snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [overscroll-behavior-x:contain] [-webkit-overflow-scrolling:touch]"
      >
        {showMemberTabs && (
          <button onClick={() => onChange("overview")} className={cn("snap-start", tabButtonClass("overview"))}>
            Overview
          </button>
        )}
        <button onClick={() => onChange("rules")} className={cn("snap-start", tabButtonClass("rules"))}>
          Rules
        </button>
        {showMemberTabs && (
          <>
            <button onClick={() => onChange("seats")} className={cn("snap-start", tabButtonClass("seats"))}>
              Seats
            </button>
            <button onClick={() => onChange("members")} className={cn("snap-start", tabButtonClass("members"))}>
              <span className="inline-flex items-center gap-2">
                Members
                <span className="grid h-5 min-w-[20px] max-w-[44px] place-items-center truncate rounded-full bg-[var(--surface-deep)]/70 px-1 text-[10px] font-semibold text-[var(--text-muted)]">
                  {memberCount}
                </span>
              </span>
            </button>
            <button onClick={() => onChange("history")} className={cn("snap-start", tabButtonClass("history"))}>
              History
            </button>
          </>
        )}
        {showOrganizer && (
          <button onClick={() => onChange("organizer")} className={cn("snap-start", tabButtonClass("organizer"))}>
            <span className="inline-flex items-center gap-2">
              <span className="sm:hidden">Org</span>
              <span className="hidden sm:inline">Organizer</span>
              {pendingApprovals > 0 && (
                <span className="grid h-5 min-w-[20px] max-w-[44px] place-items-center truncate rounded-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] px-1 text-[10px] font-semibold">
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
