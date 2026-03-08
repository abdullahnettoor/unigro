import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { ArrowDownAZ, ArrowUpAZ, Plus, Search } from "lucide-react";

import { api } from "@convex/api";
import { LoadingIcon, DraftIcon } from "@/lib/icons";
import { PoolCard, type PoolItem } from "@/components/dashboard/PoolCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

const DEFAULT_STATUSES = new Set<Status>(["active"]);

const getProgressScore = (pool: any) => {
    if (pool.status === 'DRAFT') return 0;
    if (pool.status === 'COMPLETED') return 100;
    const currentRound = pool.currentRound || 0;
    const duration = pool.config?.duration || 1;
    return (currentRound / duration) * 100;
};

export function Pools() {
    const pools = useQuery(api.pools.list);
    const currentUser = useQuery(api.users.current);

    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
    const [selectedStatuses, setSelectedStatuses] = useState<Set<Status>>(DEFAULT_STATUSES);
    const [sortFilter, setSortFilter] = useState<SortFilter>("most_recent");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [search, setSearch] = useState("");

    const currentUserId = currentUser?._id;

    const toggleStatus = (s: Status) => {
        setSelectedStatuses((prev) => {
            const next = new Set(prev);
            if (next.has(s)) {
                next.delete(s);
            } else {
                next.add(s);
            }
            return next;
        });
    };

    const filteredPools = useMemo(() => {
        if (!pools) return [];
        const searchLower = search.trim().toLowerCase();

        return [...pools]
            .filter((pool) => {
                if (!currentUserId) return true;
                if (roleFilter === "organizing") return pool.organizerId === currentUserId;
                if (roleFilter === "joined") return pool.organizerId !== currentUserId;
                return true;
            })
            .filter((pool) => selectedStatuses.size === 0 || selectedStatuses.has(pool.status.toLowerCase() as Status))
            .filter((pool) => {
                if (!searchLower) return true;
                return (
                    pool.title.toLowerCase().includes(searchLower) ||
                    (pool.organizer?.name || "").toLowerCase().includes(searchLower)
                );
            })
            .sort((a, b) => {
                const base = (() => {
                    if (sortFilter === "pool_value") return (b.config?.totalValue || 0) - (a.config?.totalValue || 0);
                    if (sortFilter === "progress") return getProgressScore(b) - getProgressScore(a);
                    return b._creationTime - a._creationTime;
                })();
                return sortDirection === "desc" ? base : -base;
            });
    }, [currentUserId, pools, roleFilter, search, sortDirection, sortFilter, selectedStatuses]);

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 pb-32">
            {/* Minimal Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-[var(--text-primary)] flex items-center gap-3">
                        Your pools
                        {pools && (
                            <span className="rounded-full bg-[var(--surface-2)] border border-[var(--border-subtle)]/50 px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)] tracking-wider">
                                {pools.length}
                            </span>
                        )}
                    </h1>
                </div>
                <Link
                    to="/create"
                    className="inline-flex h-9 items-center justify-center rounded-full bg-[var(--surface-deep)] border border-[var(--accent-vivid)]/30 px-4 text-xs font-semibold text-[var(--accent-vivid)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--accent-vivid)] gap-1.5"
                >
                    <Plus size={14} strokeWidth={2.5} />
                    Create pool
                </Link>
            </div>

            {/* Unified Toolbar */}
            <div className="mb-6 flex flex-col gap-3">
                {/* Search, Sort, & Role Filter */}
                <div className="glass-2 flex flex-col sm:flex-row items-stretch sm:items-center rounded-[20px] p-1.5 border border-[var(--border-subtle)]/60">
                    <div className="relative flex-1 flex items-center min-w-0">
                        <Search size={15} className="absolute left-3 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search pools..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent border-none py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-0"
                        />
                    </div>

                    {/* Divider on desktop */}
                    <div className="hidden sm:block w-px h-6 bg-[var(--border-subtle)] mx-2" />

                    {/* Secondary Row on mobile */}
                    <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-2 border-t border-[var(--border-subtle)]/50 sm:border-t-0 pt-1.5 sm:pt-0 pb-0.5 sm:pb-0 px-0.5 sm:px-0">
                        {/* Role Filter */}
                        <div className="flex bg-[var(--surface-0)]/50 p-0.5 sm:p-1 rounded-[14px] sm:rounded-2xl shrink-0">
                            {[
                                { value: "all", label: "All" },
                                { value: "joined", label: "Joined" },
                                { value: "organizing", label: "Mine" },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setRoleFilter(opt.value as RoleFilter)}
                                    className={cn(
                                        "px-2 sm:px-4 py-1 sm:py-1.5 rounded-[10px] sm:rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest sm:tracking-wider transition-all",
                                        roleFilter === opt.value
                                            ? "bg-[var(--surface-2)] text-[var(--text-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Divider between role and sort on mobile inside flex*/}
                        <div className="w-px h-4 sm:h-5 bg-[var(--border-subtle)]/60 mx-0.5 sm:mx-1 shrink-0" />

                        {/* Sorting integrated into toolbar */}
                        <div className="flex items-center shrink min-w-0">
                            <Select value={sortFilter} onValueChange={(val) => setSortFilter(val as SortFilter)}>
                                <SelectTrigger className="h-[26px] sm:h-[28px] w-auto max-w-[85px] sm:max-w-[120px] border-none bg-transparent px-1 sm:px-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] shadow-none focus:ring-0 truncate [&>svg]:hidden sm:[&>svg]:block">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="most_recent">Recent</SelectItem>
                                    <SelectItem value="pool_value">Pool value</SelectItem>
                                    <SelectItem value="progress">Progress</SelectItem>
                                </SelectContent>
                            </Select>
                            <button
                                type="button"
                                onClick={() => setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))}
                                className="flex aspect-square h-[24px] sm:h-[26px] items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-0)]/50 hover:text-[var(--text-primary)] transition-colors shrink-0"
                                title={sortDirection === "desc" ? "Descending" : "Ascending"}
                            >
                                {sortDirection === "desc" ? <ArrowDownAZ size={13} /> : <ArrowUpAZ size={13} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 px-1">
                    {STATUS_CHIPS.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => toggleStatus(value)}
                            className={cn(
                                "btn-chip flex h-[28px] items-center shrink-0 rounded-full border px-4 text-[11px] font-semibold leading-none transition-all duration-150",
                                selectedStatuses.has(value)
                                    ? "border-[var(--accent-vivid)] bg-[var(--accent-vivid)] text-[var(--text-on-accent)] shadow-sm"
                                    : "border-[var(--border-subtle)]/40 bg-[var(--surface-2)]/50 text-[var(--text-muted)] hover:border-[var(--border-subtle)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid List */}
            <section className="mt-6">
                {pools === undefined ? (
                    <div className="flex justify-center items-center py-20 text-[var(--text-muted)]">
                        <LoadingIcon size={22} className="animate-spin" />
                    </div>
                ) : pools.length === 0 ? (
                    <div className="glass-2 flex flex-col items-center justify-center rounded-[24px] border border-[var(--border-subtle)]/50 px-6 py-12 text-center">
                        <div className="mb-4 rounded-full bg-[var(--accent-vivid)]/10 p-3 text-[var(--accent-vivid)]">
                            <DraftIcon size={24} />
                        </div>
                        <h3 className="text-base font-bold text-[var(--text-primary)]">No pools yet</h3>
                        <p className="mt-1 text-sm text-[var(--text-muted)] max-w-sm">
                            You haven't joined or created any pools. Get started by organizing your first pool!
                        </p>
                        <Link
                            to="/create"
                            className="mt-6 inline-flex h-9 items-center justify-center rounded-full bg-[var(--accent-vivid)] px-5 text-sm font-semibold text-[var(--text-on-accent)] shadow-sm transition-all hover:opacity-90 leading-none gap-1.5"
                        >
                            <Plus size={16} />
                            Create pool
                        </Link>
                    </div>
                ) : filteredPools.length === 0 ? (
                    <div className="glass-2 flex flex-col items-center justify-center rounded-[24px] border border-[var(--border-subtle)]/50 py-12 px-6 text-center">
                        <Search size={24} className="text-[var(--text-muted)] opacity-50 mb-3" />
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">No matches found</h3>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                            Adjust filters or search term to see more results.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredPools.map((pool) => (
                            <PoolCard key={pool._id} pool={pool as unknown as PoolItem} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
