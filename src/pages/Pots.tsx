import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { ArrowDownAZ, ArrowUpAZ, Plus, Search } from "lucide-react";

import { PotCard } from "@/components/shared/PotCard";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";
import { getProgressScore } from "@/lib/pot";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { PageShell } from "@/components/layout/PageShell";

import { api } from "../../convex/_generated/api";

type RoleFilter = "all" | "organizing" | "joined";
type Status = "draft" | "active" | "completed" | "archived";
type SortFilter = "most_recent" | "pool_value" | "progress";
type SortDirection = "desc" | "asc";

const STATUS_CHIPS: { value: Status; label: string }[] = [
    { value: "draft", label: "Draft" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "archived", label: "Archived" },
];

const DEFAULT_STATUSES = new Set<Status>();

export function Pots() {
    const pots = useQuery(api.pots.list);
    const currentUser = useQuery(api.users.current);
    const { user: clerkUser } = useUser();

    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
    // Multi-select status: default = all except archived
    const [selectedStatuses, setSelectedStatuses] = useState<Set<Status>>(DEFAULT_STATUSES);
    const [sortFilter, setSortFilter] = useState<SortFilter>("most_recent");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [search, setSearch] = useState("");

    const firstName = clerkUser?.firstName || clerkUser?.fullName?.split(" ")[0] || "there";
    const currentUserId = currentUser?._id;

    const toggleStatus = (s: Status) => {
        setSelectedStatuses(prev => {
            const next = new Set(prev);
            if (next.has(s)) {
                next.delete(s);
            } else {
                next.add(s);
            }
            return next;
        });
    };

    const filteredPots = useMemo(() => {
        if (!pots) return [];
        const searchLower = search.trim().toLowerCase();

        return [...pots]
            .filter(pot => {
                if (!currentUserId) return true;
                if (roleFilter === "organizing") return pot.foremanId === currentUserId;
                if (roleFilter === "joined") return pot.foremanId !== currentUserId;
                return true;
            })
            .filter(pot => selectedStatuses.size === 0 || selectedStatuses.has(pot.status.toLowerCase() as Status))
            .filter(pot => {
                if (!searchLower) return true;
                return pot.title.toLowerCase().includes(searchLower) ||
                    (pot.foreman?.name || "").toLowerCase().includes(searchLower);
            })
            .sort((a, b) => {
                const base = (() => {
                    if (sortFilter === "pool_value") return b.config.totalValue - a.config.totalValue;
                    if (sortFilter === "progress") return getProgressScore(b) - getProgressScore(a);
                    return b._creationTime - a._creationTime;
                })();
                return sortDirection === "desc" ? base : -base;
            });
    }, [currentUserId, pots, roleFilter, search, sortDirection, sortFilter, selectedStatuses]);

    return (
        <PageShell
            maxWidth="xl"
            sidebar={<AppSidebar firstName={firstName} imageUrl={clerkUser?.imageUrl} showAdmin={firstName === "Admin"} />}
            title="Pots"
            subtitle="View and filter the pots you organize or joined."
            headerClassName="relative"
            actionsClassName="absolute right-0 top-0"
            titleClassName="pr-16"
            subtitleClassName="pr-16"
            actions={
                <Link
                    to="/create"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] shadow-[0_8px_20px_rgba(43,110,87,0.20)] transition-opacity hover:opacity-90 sm:w-auto sm:gap-2 sm:px-5"
                    aria-label="Create pot"
                >
                    <Plus size={16} />
                    <span className="hidden sm:inline text-sm font-semibold">Create pot</span>
                </Link>
            }
        >
            {/* ── Search ── */}
            <div className="mb-4">
                <div className="relative min-w-0 flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <Input
                        type="text"
                        placeholder="Search pots..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* ── Title + Quick Filter ── */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold font-display">Your pots</h2>
                    <span className="rounded-full bg-[var(--surface-deep)]/80 px-2 py-0.5 text-sm text-[var(--text-muted)]">
                        {filteredPots.length}
                    </span>
                </div>
                <div className="ml-auto">
                    <SegmentedControl
                        value={roleFilter}
                        onChange={(val) => setRoleFilter(val as RoleFilter)}
                        density="compact"
                        options={[
                            { value: "all", label: "All" },
                            { value: "joined", label: "Joined" },
                            { value: "organizing", label: "Mine" },
                        ]}
                    />
                </div>
            </div>

            {/* ── Status filter chips + sticky sort ── */}
            <div className="mb-4 flex items-center h-[30px]">
                {/* Scrollable Chips */}
                <div className="flex flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {STATUS_CHIPS.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => toggleStatus(value)}
                            className={cn(
                                "btn-chip flex h-[26px] items-center shrink-0 rounded-full border px-3 text-[11px] font-semibold leading-none transition-all duration-150",
                                selectedStatuses.has(value)
                                    ? "border-[var(--accent-vivid)] bg-[var(--accent-vivid)] text-[var(--text-on-accent)] shadow-sm"
                                    : "border-[var(--border-subtle)] bg-[var(--surface-deep)]/30 text-[var(--text-muted)] hover:border-[var(--accent-vivid)]/40 hover:text-[var(--text-primary)]"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Sticky Sort — right-aligned */}
                <div className="flex items-center gap-1 shrink-0 bg-[var(--bg-app)] pl-2 h-full ml-1">
                    <div className="h-3 w-px bg-[var(--border-subtle)] mr-1" />
                    <Select value={sortFilter} onValueChange={(val) => setSortFilter(val as SortFilter)}>
                        <SelectTrigger density="compact" className="h-[26px] rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2 text-[11px] leading-none">
                            <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="most_recent">Recent</SelectItem>
                            <SelectItem value="pool_value">Pool</SelectItem>
                            <SelectItem value="progress">Progress</SelectItem>
                        </SelectContent>
                    </Select>
                    <button
                        type="button"
                        onClick={() => setSortDirection(prev => prev === "desc" ? "asc" : "desc")}
                        className="btn-chip flex aspect-square h-[26px] items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:border-[var(--accent-vivid)]/50 transition-colors"
                        title={sortDirection === "desc" ? "Descending" : "Ascending"}
                    >
                        {sortDirection === "desc" ? <ArrowDownAZ size={13} /> : <ArrowUpAZ size={13} />}
                    </button>
                </div>
            </div>

            {/* ── Pot grid ── */}
            <section>
                {!pots ? (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="glass-2 h-48 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : pots.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)]/30 py-14 text-center text-[var(--text-muted)]">
                        You do not have any pots yet.
                    </div>
                ) : filteredPots.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)]/30 py-14 text-center text-[var(--text-muted)]">
                        No pots match the selected filters.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        {filteredPots.map((pot) => (
                            <PotCard key={pot._id} pot={pot} currentUserId={currentUserId} />
                        ))}
                    </div>
                )}
            </section>
        </PageShell>
    );
}
