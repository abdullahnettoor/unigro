import { Surface } from "@/components/ui/Surface";
import { type Tab } from "@/pages/PotDetail";

interface TabNavProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    isMember: boolean;
    isForeman: boolean;
    pendingApprovalsCount: number;
    memberListLength: number;
}

export function TabNav({
    activeTab,
    setActiveTab,
    isMember,
    isForeman,
    pendingApprovalsCount,
    memberListLength
}: TabNavProps) {
    const tabButtonClass = (tab: Tab) =>
        `px-3 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap rounded-full ${activeTab === tab
            ? "bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-sm"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        }`;

    return (
        <div className="sticky top-0 sm:top-4 z-40 -mx-4 sm:mx-0 px-4 sm:px-0 bg-[var(--bg-app)]/60 backdrop-blur-sm py-2">
            <Surface tier={1} className="flex gap-1 overflow-x-auto rounded-full p-1 scrollbar-hide">
                {(isMember || isForeman) && (
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={tabButtonClass("dashboard")}
                    >
                        Overview
                    </button>
                )}

                {isForeman && (
                    <button
                        onClick={() => setActiveTab('organize')}
                        className={tabButtonClass("organize")}
                    >
                        <span className="inline-flex items-center gap-2">
                            <span>Approvals</span>
                            {pendingApprovalsCount > 0 && (
                                <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] px-1 text-[10px] font-semibold">
                                    {pendingApprovalsCount}
                                </span>
                            )}
                        </span>
                    </button>
                )}

                {(isMember || isForeman) && (
                    <button
                        onClick={() => setActiveTab('members')}
                        className={tabButtonClass("members")}
                    >
                        <span className="inline-flex items-center gap-2">
                            <span>Members</span>
                            <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-[var(--surface-deep)]/80 px-1 text-[10px] font-semibold text-[var(--text-muted)]">
                                {memberListLength}
                            </span>
                        </span>
                    </button>
                )}

                    <button
                        onClick={() => setActiveTab('rules')}
                        className={tabButtonClass("rules")}
                    >
                        Rules & Info
                    </button>

                {(isMember || isForeman) && (
                    <>
                        <button
                            onClick={() => setActiveTab('slots')}
                            className={tabButtonClass("slots")}
                        >
                            Slots
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={tabButtonClass("history")}
                        >
                            History
                        </button>
                    </>
                )}
            </Surface>
        </div>
    );
}
