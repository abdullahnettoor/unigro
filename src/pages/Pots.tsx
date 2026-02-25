import { useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { ArrowDownAZ, ArrowUpAZ, Filter, Plus, Search, X } from "lucide-react";
import { cn } from "../components/ui/Button";
import { api } from "../../convex/_generated/api";
import { AnimatePresence, motion } from "framer-motion";
import { PotCard } from "../components/PotCard";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { DashboardSidebar } from "./Dashboard";
import { getProgressScore } from "../lib/pot";

type RoleFilter = "all" | "organizing" | "joined";
type StatusFilter = "all" | "draft" | "active" | "completed";
type SortFilter = "most_recent" | "pool_value" | "progress";
type SortDirection = "desc" | "asc";



function FilterPill({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ease-in-out",
                active
                    ? "border-[var(--accent-vivid)] bg-[var(--accent-vivid)] text-[var(--text-on-accent)] shadow-sm shadow-[var(--accent-vivid)]/20"
                    : "border-[var(--border-subtle)] bg-[var(--surface-deep)]/30 text-[var(--text-primary)] hover:border-[var(--accent-vivid)]/50 hover:bg-[var(--surface-elevated)]"
            )}
        >
            {label}
        </button>
    );
}

export function Pots() {
    const pots = useQuery(api.pots.list);
    const currentUser = useQuery(api.users.current);
    const { user: clerkUser } = useUser();

    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [sortFilter, setSortFilter] = useState<SortFilter>("most_recent");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [search, setSearch] = useState("");
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    const activeFilterCount = statusFilter !== "all" ? 1 : 0;

    const firstName = clerkUser?.firstName || clerkUser?.fullName?.split(" ")[0] || "there";

    const currentUserId = currentUser?._id;

    const filteredPots = useMemo(() => {
        if (!pots) return [];

        const searchLower = search.trim().toLowerCase();

        const roleFiltered = pots.filter((pot) => {
            if (!currentUserId) return true;
            if (roleFilter === "organizing") return pot.foremanId === currentUserId;
            if (roleFilter === "joined") return pot.foremanId !== currentUserId;
            return true;
        });

        const statusFiltered = roleFiltered.filter((pot) => {
            if (statusFilter === "all") return true;
            return pot.status.toLowerCase() === statusFilter;
        });

        const searched = statusFiltered.filter((pot) => {
            if (!searchLower) return true;
            const title = pot.title.toLowerCase();
            const organizerName = (pot.foreman?.name || "").toLowerCase();
            return title.includes(searchLower) || organizerName.includes(searchLower);
        });

        return [...searched].sort((a, b) => {
            const base = (() => {
                if (sortFilter === "pool_value") return b.config.totalValue - a.config.totalValue;
                if (sortFilter === "progress") return getProgressScore(b) - getProgressScore(a);
                return b._creationTime - a._creationTime;
            })();
            return sortDirection === "desc" ? base : -base;
        });
    }, [currentUserId, pots, roleFilter, search, sortDirection, sortFilter, statusFilter]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-5 md:py-3 lg:gap-6">
            <DashboardSidebar firstName={firstName} imageUrl={clerkUser?.imageUrl} />

            <div className="md:py-4">
                <header className="mb-5 sm:mb-6">
                    <div className="mb-3">
                        <h1 className="text-2xl font-display font-bold tracking-tight sm:text-3xl">Pots</h1>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">View and filter the pots you organize or joined.</p>
                    </div>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="flex w-full items-center gap-2 lg:w-auto lg:flex-1">
                            <div className="glass-1 flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-[var(--accent-vivid)]/20">
                                <Search size={16} className="text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Search pots..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                                />
                            </div>
                            <button
                                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                                className={cn(
                                    "glass-1 relative grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border transition-colors hover:bg-[var(--surface-elevated)]",
                                    isFiltersOpen || activeFilterCount > 0
                                        ? "border-[var(--accent-vivid)] text-[var(--accent-vivid)]"
                                        : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                                )}
                                aria-label="Toggle filters"
                            >
                                {isFiltersOpen ? <X size={20} /> : <Filter size={20} />}
                                {activeFilterCount > 0 && !isFiltersOpen && (
                                    <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[var(--accent-vivid)] text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--bg-app)]">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>
                        <Link
                            to="/create"
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[var(--accent-vivid)] px-4 py-2 text-sm font-semibold text-[var(--text-on-accent)] transition-opacity hover:opacity-90"
                        >
                            <Plus size={16} />
                            Create pot
                        </Link>
                    </div>
                </header>

                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold font-display">
                            Your pots
                        </h2>
                        <span className="rounded-full bg-[var(--surface-deep)]/80 px-2 py-0.5 text-sm text-[var(--text-muted)]">
                            {filteredPots.length}
                        </span>
                    </div>
                    <SegmentedControl
                        value={roleFilter}
                        onChange={(val) => setRoleFilter(val as RoleFilter)}
                        className="p-0.5"
                        buttonClassName="min-h-7 px-3 text-[11px]"
                        options={[
                            { value: "all", label: "All" },
                            { value: "joined", label: "Participating" },
                            { value: "organizing", label: "Organizing" },
                        ]}
                    />
                </div>

                <AnimatePresence>
                    {isFiltersOpen && (
                        <motion.section
                            initial={{ height: 0, opacity: 0, scale: 0.98 }}
                            animate={{ height: "auto", opacity: 1, scale: 1 }}
                            exit={{ height: 0, opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="mb-5 overflow-hidden"
                        >
                            <div className="glass-1 rounded-2xl p-3 sm:p-4">
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                                        <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar sm:pb-0">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] opacity-80 min-w-[3rem]">Status</span>
                                            <div className="flex items-center gap-2">
                                                <FilterPill label="All" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
                                                <FilterPill label="Draft" active={statusFilter === "draft"} onClick={() => setStatusFilter("draft")} />
                                                <FilterPill label="Active" active={statusFilter === "active"} onClick={() => setStatusFilter("active")} />
                                                <FilterPill label="Completed" active={statusFilter === "completed"} onClick={() => setStatusFilter("completed")} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-1 flex flex-wrap items-center gap-3 border-t border-[var(--border-subtle)]/50 pt-3">
                                        <label htmlFor="pots-sort" className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] opacity-80 min-w-[3rem]">
                                            Sort
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <select
                                                id="pots-sort"
                                                value={sortFilter}
                                                onChange={(e) => setSortFilter(e.target.value as SortFilter)}
                                                className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-vivid)] focus:ring-1 focus:ring-[var(--accent-vivid)] sm:text-sm"
                                            >
                                                <option value="most_recent">Most recent</option>
                                                <option value="pool_value">Pool value</option>
                                                <option value="progress">Progress</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))}
                                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent-vivid)]/50 hover:bg-[var(--surface-card)] sm:text-sm"
                                                aria-label={sortDirection === "desc" ? "Sort descending" : "Sort ascending"}
                                                title={sortDirection === "desc" ? "Descending" : "Ascending"}
                                            >
                                                {sortDirection === "desc" ? <ArrowDownAZ size={15} /> : <ArrowUpAZ size={15} />}
                                                {sortDirection === "desc" ? "Desc" : "Asc"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

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
            </div>
        </div>
    );
}
