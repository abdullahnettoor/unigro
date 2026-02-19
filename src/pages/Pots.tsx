import { useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { Link, useLocation } from "react-router-dom";
import { ArrowDownAZ, ArrowUpAZ, Coins, Home, Plus, Search, Settings, WalletCards } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { PotCard } from "../components/PotCard";
import { GlassSurface } from "../components/ui/GlassSurface";
import { UserMenu } from "../components/UserMenu";

type RoleFilter = "all" | "organizing" | "joined";
type StatusFilter = "all" | "draft" | "active" | "completed";
type SortFilter = "most_recent" | "pool_value" | "progress";
type SortDirection = "desc" | "asc";

function PotsSidebar({
    firstName,
    imageUrl,
}: {
    firstName: string;
    imageUrl?: string;
}) {
    const location = useLocation();
    const isActive = (path: string) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));
    const navItemClass = (active: boolean) =>
        `flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${active
            ? "bg-[var(--accent-vivid)]/12 font-semibold text-[var(--accent-vivid)]"
            : "text-[var(--text-muted)] hover:bg-[var(--surface-card)]/60"
        }`;

    return (
        <aside className="hidden md:block">
            <GlassSurface tier="glass-2" className="sticky top-3 flex h-[calc(100vh-1.5rem)] flex-col p-3 lg:p-4">
                <Link to="/" className="mb-4 flex items-center gap-2 rounded-xl px-2 py-1.5">
                    <div className="grid h-6 w-6 place-items-center rounded-md bg-[var(--accent-vivid)] text-[var(--text-on-accent)] text-xs font-bold">
                        G
                    </div>
                    <span className="text-base font-display font-bold text-[var(--text-primary)]">GrowPot</span>
                </Link>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Workspace</p>
                <div className="space-y-2">
                    <Link to="/" className={navItemClass(isActive("/"))}>
                        <Home size={16} />
                        Dashboard
                    </Link>
                    <Link to="/pots" className={navItemClass(isActive("/pots"))}>
                        <WalletCards size={16} />
                        Pots
                    </Link>
                    <div className={navItemClass(false)}>
                        <Coins size={16} />
                        Rewards
                    </div>
                    <div className={navItemClass(false)}>
                        <Settings size={16} />
                        Settings
                    </div>
                </div>

                <div className="mt-auto border-t border-[var(--border-subtle)]/70 pt-3">
                    <UserMenu
                        placement="top-center"
                        menuClassName="w-full"
                        trigger={
                            <div className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left">
                                <div className="h-9 w-9 overflow-hidden rounded-full border border-[var(--border-subtle)]">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="grid h-full w-full place-items-center bg-[var(--surface-deep)] text-xs font-semibold text-[var(--text-muted)]">
                                            {firstName.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 text-left">
                                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{firstName}</p>
                                    <p className="text-xs text-[var(--text-muted)]">Profile menu</p>
                                </div>
                            </div>
                        }
                    />
                </div>
            </GlassSurface>
        </aside>
    );
}

function getProgressScore(pot: {
    status: string;
    currentMonth: number;
    config: { duration: number; totalSlots: number };
    slots?: Array<{ status: string }>;
}) {
    if (pot.status === "DRAFT") {
        const slots = pot.slots || [];
        const filled = slots.filter((slot) => slot.status === "FILLED" || slot.status === "RESERVED").length;
        return filled / Math.max(pot.config.totalSlots, 1);
    }
    return Math.min(Math.max(pot.currentMonth, 0), pot.config.duration) / Math.max(pot.config.duration, 1);
}

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
            className={`rounded-md border px-2 py-1 text-[10px] font-medium leading-none transition-colors sm:text-[11px] ${active
                ? "border-[var(--accent-vivid)]/45 bg-[var(--accent-vivid)]/12 text-[var(--accent-vivid)]"
                : "border-[var(--border-subtle)] bg-[var(--surface-card)]/45 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
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
            <PotsSidebar firstName={firstName} imageUrl={clerkUser?.imageUrl} />

            <div className="md:py-4">
                <header className="mb-5 sm:mb-6">
                    <div className="mb-3">
                        <h1 className="text-2xl font-display font-bold tracking-tight sm:text-3xl">Pots</h1>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">View and filter the pots you organize or joined.</p>
                    </div>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="glass-1 flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2">
                            <Search size={16} className="text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search by pot or organizer"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                            />
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

                <section className="mb-5">
                    <div className="glass-1 rounded-2xl p-2.5 sm:p-3">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-0.5">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] sm:text-[11px]">Role</span>
                                <div className="inline-flex items-center gap-1.5">
                                    <FilterPill label="All" active={roleFilter === "all"} onClick={() => setRoleFilter("all")} />
                                    <FilterPill label="Organizing" active={roleFilter === "organizing"} onClick={() => setRoleFilter("organizing")} />
                                    <FilterPill label="Joined" active={roleFilter === "joined"} onClick={() => setRoleFilter("joined")} />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-0.5">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] sm:text-[11px]">Status</span>
                                <div className="inline-flex items-center gap-1.5">
                                    <FilterPill label="All" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
                                    <FilterPill label="Draft" active={statusFilter === "draft"} onClick={() => setStatusFilter("draft")} />
                                    <FilterPill label="Active" active={statusFilter === "active"} onClick={() => setStatusFilter("active")} />
                                    <FilterPill label="Completed" active={statusFilter === "completed"} onClick={() => setStatusFilter("completed")} />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <label htmlFor="pots-sort" className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                                    Sort by
                                </label>
                                <select
                                    id="pots-sort"
                                    value={sortFilter}
                                    onChange={(e) => setSortFilter(e.target.value as SortFilter)}
                                    className="min-h-8 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2 text-[11px] text-[var(--text-primary)] outline-none"
                                >
                                    <option value="most_recent">Most recent</option>
                                    <option value="pool_value">Pool value</option>
                                    <option value="progress">Progress</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))}
                                    className="inline-flex min-h-8 items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2 text-[11px] font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent-vivid)]/35 hover:text-[var(--accent-vivid)]"
                                    aria-label={sortDirection === "desc" ? "Sort descending" : "Sort ascending"}
                                    title={sortDirection === "desc" ? "Descending" : "Ascending"}
                                >
                                    {sortDirection === "desc" ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />}
                                    {sortDirection === "desc" ? "Desc" : "Asc"}
                                </button>
                                <span className="text-[11px] text-[var(--text-muted)]">Discover coming soon</span>
                            </div>
                        </div>
                    </div>
                </section>

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
