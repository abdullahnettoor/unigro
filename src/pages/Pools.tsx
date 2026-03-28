import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { ArrowDownAZ, ArrowUpAZ, Plus, RotateCcw, Search } from "lucide-react";

import { api } from "@convex/api";
import {
  DraftIcon,
  LoadingIcon,
} from "@/lib/icons";
import { getProgressScore } from "@/lib/pool";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/common/SectionHeader";
import { PoolCard, type PoolItem } from "@/components/dashboard/PoolCard";
import { OfflineStateGate } from "@/components/shared/OfflineStateGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RoleFilter = "all" | "organizing" | "joined";
type Status = "draft" | "active" | "completed" | "archived";
type SortFilter = "most_recent" | "pool_value" | "progress";
type SortDirection = "desc" | "asc";

const STATUS_CHIPS: Array<{ value: Status; label: string }> = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const DEFAULT_STATUSES = new Set<Status>(["active", "draft", "completed"]);

export function Pools() {
  const pools = useQuery(api.pools.list);
  const currentUser = useQuery(api.users.current);

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [selectedStatuses, setSelectedStatuses] = useState<Set<Status>>(DEFAULT_STATUSES);
  const [sortFilter, setSortFilter] = useState<SortFilter>("most_recent");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);

  const currentUserId = currentUser?._id;

  useEffect(() => {
    const handleScroll = () => {
      const next = window.scrollY > 48;
      setScrolled((prev) => (prev === next ? prev : next));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleStatus = (status: Status) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const resetFilters = () => {
    setRoleFilter("all");
    setSelectedStatuses(new Set(DEFAULT_STATUSES));
    setSortFilter("most_recent");
    setSortDirection("desc");
    setSearch("");
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
      .filter(
        (pool) =>
          selectedStatuses.size === 0 ||
          selectedStatuses.has(pool.status.toLowerCase() as Status)
      )
      .filter((pool) => {
        if (!searchLower) return true;
        return (
          pool.title.toLowerCase().includes(searchLower) ||
          (pool.organizer?.name || "").toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        const base = (() => {
          if (sortFilter === "pool_value") {
            return (b.config?.totalValue || 0) - (a.config?.totalValue || 0);
          }
          if (sortFilter === "progress") {
            return getProgressScore(b) - getProgressScore(a);
          }
          return b._creationTime - a._creationTime;
        })();
        return sortDirection === "desc" ? base : -base;
      });
  }, [currentUserId, pools, roleFilter, search, selectedStatuses, sortDirection, sortFilter]);

  const totalPools = pools?.length ?? 0;
  const filteredOut = pools !== undefined && pools.length > 0 && filteredPools.length === 0;

  return (
    <OfflineStateGate
      ready={pools !== undefined && currentUser !== undefined}
      offlineTitle="Pool collection unavailable offline"
      offlineMessage="This list view needs fresh collection data. Previously opened pool pages can still load from cache."
    >
      <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <div className="sticky top-0 z-40 pb-3 pt-1">
        <div
          className={cn(
            "rounded-[28px] transition-[background-color,border-color,box-shadow,padding] duration-200 ease-out",
            scrolled
              ? "bg-[rgba(var(--bg-app-rgb),0.84)] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl supports-[backdrop-filter]:border supports-[backdrop-filter]:border-[var(--border-subtle)]/40"
              : "bg-transparent px-0 py-0 border border-transparent shadow-none backdrop-blur-0"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)]/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
                  Collection
                </span>
                <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)]/55 px-2.5 py-1 text-[10px] font-semibold text-[var(--text-muted)]">
                  {totalPools} pools
                </span>
              </div>
              <h1
                className={cn(
                  "mt-3 font-display font-bold leading-none text-[var(--text-primary)] transition-all duration-200 ease-out",
                  scrolled ? "text-[1.7rem]" : "text-[2.85rem]"
                )}
              >
                Your pools
              </h1>
              {!scrolled && (
                <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)]">
                  Organize new pools, track joined ones, and filter your collection without
                  losing context.
                </p>
              )}
            </div>

            <Link to="/create" className="shrink-0">
              <span
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition-all duration-200 ease-out",
                  scrolled ? "gap-0 px-3" : "gap-2 px-4"
                )}
              >
                <Plus size={16} className="shrink-0" />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-200 ease-out",
                    scrolled ? "max-w-0 opacity-0" : "max-w-32 opacity-100"
                  )}
                >
                  Create pool
                </span>
              </span>
            </Link>
          </div>

          <div className="mt-4">
            <div className="glass-2 flex items-center rounded-[20px] border border-[var(--border-subtle)]/60 px-3">
              <Search size={16} className="shrink-0 text-[var(--text-muted)]" />
              <Input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search pools or organizers"
                className="border-0 bg-transparent px-3 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        </div>
      </div>

      <section className="mt-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="glass-2 rounded-[24px] border border-[var(--border-subtle)] p-2">
            <div className="flex flex-wrap gap-1.5">
              {([
                { value: "all", label: "All" },
                { value: "joined", label: "Joined" },
                { value: "organizing", label: "Mine" },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRoleFilter(option.value)}
                  className={cn(
                    "btn-chip rounded-full px-3 py-2 text-[11px] font-semibold transition-all",
                    roleFilter === option.value
                      ? "bg-[var(--surface-0)] text-[var(--text-primary)] shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-2 flex w-full items-center gap-2 rounded-[20px] border border-[var(--border-subtle)] p-2 sm:w-auto">
            <Select value={sortFilter} onValueChange={(value) => setSortFilter(value as SortFilter)}>
              <SelectTrigger className="h-9 min-w-0 border-0 bg-transparent px-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] shadow-none focus:ring-0 sm:min-w-[140px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="most_recent">Recent</SelectItem>
                <SelectItem value="pool_value">Pool value</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="btn-chip rounded-full"
              onClick={() => setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))}
              title={sortDirection === "desc" ? "Descending" : "Ascending"}
            >
              {sortDirection === "desc" ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <div className="flex min-w-full gap-2 pb-1">
            {STATUS_CHIPS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleStatus(value)}
                className={cn(
                  "btn-chip shrink-0 rounded-full border px-4 py-2 text-[11px] font-semibold transition-all",
                  selectedStatuses.has(value)
                    ? "border-[var(--accent-vivid)] bg-[var(--accent-vivid)] text-[var(--text-on-accent)]"
                    : "border-[var(--border-subtle)]/50 bg-[var(--surface-2)]/55 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader
          eyebrow="Collection"
          title="Pool collection"
          actions={
            filteredOut ? (
              <Button variant="outline" size="sm" className="btn-chip rounded-full" onClick={resetFilters}>
                <RotateCcw size={14} />
                Reset filters
              </Button>
            ) : null
          }
        />

        <div className="mt-4">
        {pools === undefined ? (
          <div className="flex items-center justify-center py-20 text-[var(--text-muted)]">
            <LoadingIcon size={22} className="animate-spin" />
          </div>
        ) : pools.length === 0 ? (
          <div className="glass-2 rounded-[28px] border border-[var(--border-subtle)] px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-vivid)]/10 text-[var(--accent-vivid)]">
              <DraftIcon size={24} />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">No pools yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--text-muted)]">
              Start with your first pool and bring members into a cleaner, more traceable flow.
            </p>
            <Link to="/create" className="mt-6 inline-flex">
              <Button className="rounded-full">
                <Plus size={16} />
                Create pool
              </Button>
            </Link>
          </div>
        ) : filteredPools.length === 0 ? (
          <div className="glass-2 rounded-[28px] border border-[var(--border-subtle)] px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)]/60 text-[var(--text-muted)]">
              <Search size={22} />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">No matching pools</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--text-muted)]">
              Your current search or filter combination is too narrow. Reset and broaden the view.
            </p>
            <Button variant="outline" className="mt-6 rounded-full" onClick={resetFilters}>
              <RotateCcw size={14} />
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredPools.map((pool) => (
              <PoolCard key={pool._id} pool={pool as PoolItem} />
            ))}
          </div>
        )}
        </div>
      </section>
      </div>
    </OfflineStateGate>
  );
}
