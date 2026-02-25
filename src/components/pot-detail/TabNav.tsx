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
            ? "bg-[var(--accent-vivid)]/15 text-[var(--accent-vivid)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        }`;

    return (
        <div className="sticky top-0 sm:top-4 z-40 -mx-4 sm:mx-0 px-4 sm:px-0 bg-[var(--bg-app)]/50 backdrop-blur-sm py-2">
            <div className="glass-2 flex gap-1 overflow-x-auto rounded-full p-1 scrollbar-hide">
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
                        Organize {pendingApprovalsCount > 0 && <span className="ml-1 bg-[var(--accent-vivid)] text-[var(--text-on-accent)] px-1.5 py-0.5 rounded-full text-[10px]">{pendingApprovalsCount}</span>}
                    </button>
                )}

                {(isMember || isForeman) && (
                    <button
                        onClick={() => setActiveTab('members')}
                        className={tabButtonClass("members")}
                    >
                        Members <span className="ml-1 opacity-50 text-[10px]">{memberListLength}</span>
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
            </div>
        </div>
    );
}
