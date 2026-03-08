import { useMemo, useState } from "react";
import * as Icons from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/Surface";
import { getVirtualOpenSeats } from "@/lib/pool";
import { cn } from "@/lib/utils";
import type { PoolDetail, PoolSeat } from "./types";
import type { Id } from "@convex/dataModel";

interface SeatsTabProps {
  pool: PoolDetail;
  seats: PoolSeat[];
  currentUserId?: string;
  isOrganizer: boolean;
  isDraft: boolean;
  isMember: boolean;
  onAddMember: () => void;
  onAssignCoSeat: () => void;
  onDeleteSeat: (seatNumber: number) => void;
  onJoin: () => void;
  onEditGuest: (guestId: Id<"users">, name: string, phone: string) => void;
}

export function SeatsTab({
  pool,
  seats,
  currentUserId,
  isOrganizer,
  isDraft,
  isMember,
  onAddMember,
  onAssignCoSeat,
  onDeleteSeat,
  onJoin,
  onEditGuest,
}: SeatsTabProps) {
  const [view, setView] = useState<"all" | "full" | "co-seat">("all");
  const [expandedSeats, setExpandedSeats] = useState<Set<number>>(new Set());

  const toggleExpand = (seatNumber: number) => {
    setExpandedSeats((prev) => {
      const next = new Set(prev);
      if (next.has(seatNumber)) next.delete(seatNumber);
      else next.add(seatNumber);
      return next;
    });
  };

  const fullSeats = useMemo(() => {
    const virtual = getVirtualOpenSeats(
      { status: pool.status, currentRound: pool.currentRound, config: pool.config, seats },
      seats
    ).map((seat) => ({
      _id: seat._id,
      seatNumber: seat.seatNumber,
      status: "OPEN" as const,
    } as PoolSeat));

    return [...seats, ...virtual].sort((a, b) => a.seatNumber - b.seatNumber);
  }, [pool, seats]);

  const filteredSeats = fullSeats.filter((seat) => {
    if (view === "all") return true;
    if (view === "full") return !seat.isCoSeat;
    if (view === "co-seat") return seat.isCoSeat;
    return true;
  });

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ── 1. Top Controls ── */}
      <div className="space-y-6 px-1">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Allocation</p>
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">Pool Seats</h2>
          </div>

          {/* Custom Segmented Control Style in Header */}
          <div className="flex p-1 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
            {[
              { id: "all", icon: Icons.SeatCountIcon, label: "All" },
              { id: "full", icon: Icons.OrganizerIcon, label: "Full" },
              { id: "co-seat", icon: Icons.LayersIcon, label: "Co-seats" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setView(opt.id as any)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap",
                  view === opt.id
                    ? "bg-[var(--accent-vivid)] text-white shadow-md shadow-[var(--accent-vivid)]/20"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                )}
              >
                <opt.icon size={12} strokeWidth={2.5} />
                <span className="hidden xs:inline">{opt.label}</span>
                <span className="xs:hidden">{opt.id === "co-seat" ? "Co" : opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 1b. Action Grid ── */}
        {isOrganizer && isDraft && (
          <div className="grid grid-cols-2 gap-3 pb-2">
            <Button
              variant="outline"
              onClick={onAddMember}
              className="h-14 rounded-3xl gap-3 text-[var(--accent-vivid)] border-[var(--border-subtle)]/60 bg-[var(--surface-2)]/40 font-bold shadow-sm hover:bg-[var(--surface-2)]/60 transition-all active:scale-95"
            >
              <div className="h-8 w-8 rounded-xl bg-[var(--accent-vivid)]/10 flex items-center justify-center">
                <Icons.InviteIcon size={18} />
              </div>
              <span className="text-sm">Add Member</span>
            </Button>
            <Button
              variant="outline"
              onClick={onAssignCoSeat}
              className="h-14 rounded-3xl gap-3 text-[var(--accent-vivid)] border-[var(--border-subtle)]/60 bg-[var(--surface-2)]/40 font-bold shadow-sm hover:bg-[var(--surface-2)]/60 transition-all active:scale-95"
            >
              <div className="h-8 w-8 rounded-xl bg-[var(--accent-vivid)]/10 flex items-center justify-center">
                <Icons.LayersIcon size={18} />
              </div>
              <span className="text-sm">Add Co-seat</span>
            </Button>
          </div>
        )}
      </div>

      {/* ── 2. Seats Grid ── */}
      {filteredSeats.length === 0 ? (
        <Surface tier={1} className="grain flex flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-[var(--border-subtle)] p-12 text-center bg-[var(--surface-1)]/40">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--text-muted)] opacity-50">
            <Icons.SeatIcon size={28} />
          </div>
          <div>
            <p className="font-bold text-[var(--text-primary)]">No seats found</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Try changing the filter or add new members if you're the organizer.</p>
          </div>
        </Surface>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredSeats.map((seat) => {
            const isOpen = seat.status === "OPEN";
            const isMySlot = currentUserId && (
              seat.userId === currentUserId ||
              (seat.isCoSeat && seat.coOwners?.some(o => o.userId === currentUserId))
            );
            const isExpanded = expandedSeats.has(seat.seatNumber);

            return (
              <Surface
                key={`${seat._id}-${seat.seatNumber}`}
                tier={2}
                className={cn(
                  "grain group relative flex flex-col rounded-[28px] border transition-all duration-300",
                  isOpen
                    ? "border-dashed border-[var(--border-subtle)] bg-[var(--surface-2)]/30"
                    : isMySlot
                      ? "border-[var(--accent-vivid)]/40 bg-gradient-to-br from-[var(--surface-2)] to-[var(--accent-vivid)]/[0.03] shadow-lg shadow-[var(--accent-vivid)]/[0.02]"
                      : "border-[var(--border-subtle)] bg-[var(--surface-2)]"
                )}
              >
                <div className="p-5 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex flex-col items-center justify-center font-display border transition-colors",
                      isOpen
                        ? "bg-[var(--surface-3)] border-dashed border-[var(--border-subtle)] text-[var(--text-muted)]"
                        : "bg-[var(--accent-vivid)]/10 border-[var(--accent-vivid)]/20 text-[var(--accent-vivid)]"
                    )}>
                      <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70 leading-none">Seat</span>
                      <span className="text-lg font-black leading-none">#{seat.seatNumber}</span>
                    </div>

                    <div className="min-w-0">
                      <h3 className={cn(
                        "text-sm font-bold truncate",
                        isOpen ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"
                      )}>
                        {isOpen ? "Awaiting Member" : (
                          seat.user?.name ||
                          seat.coOwners?.map(o => o.userName).join(" • ") ||
                          "Participant"
                        )}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        {isOpen ? (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-vivid)]">Available</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {isMySlot && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[var(--accent-vivid)] text-[9px] font-black uppercase text-white">My Seat</span>
                            )}
                            {seat.isGuest && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[var(--surface-3)] text-[9px] font-bold text-[var(--text-muted)] border border-[var(--border-subtle)]">Guest</span>
                            )}
                            {seat.isCoSeat && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[var(--warning)]/10 text-[9px] font-bold text-[var(--warning)] border border-[var(--warning)]/20">Co-seat</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Expand Button for Co-seats */}
                    {seat.isCoSeat && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleExpand(seat.seatNumber)}
                        className={cn(
                          "h-8 w-8 rounded-xl transition-transform duration-300",
                          isExpanded ? "rotate-180" : ""
                        )}
                      >
                        <Icons.ExpandIcon size={14} className="text-[var(--text-muted)]" />
                      </Button>
                    )}

                    {/* Guest Edit Button */}
                    {isOrganizer && seat.isGuest && seat.user && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onEditGuest(seat.user?._id as Id<"users">, seat.user?.name || "", seat.user?.phone || "")}
                        className="h-8 w-8 rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-vivid)]"
                      >
                        <Icons.EditIcon size={14} />
                      </Button>
                    )}

                    {/* Delete Seat Button */}
                    {isOrganizer && isDraft && !isOpen && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDeleteSeat(seat.seatNumber)}
                        className="h-8 w-8 rounded-xl text-[var(--danger)]/60 hover:text-[var(--danger)] hover:bg-[var(--danger)]/10"
                      >
                        <Icons.DeleteIcon size={14} />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Open Seat Action */}
                {isOpen && !isMember && (
                  <div className="px-5 pb-5 mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full rounded-2xl bg-[var(--accent-vivid)]/5 text-[var(--accent-vivid)] hover:bg-[var(--accent-vivid)]/10 border border-[var(--accent-vivid)]/10 font-bold"
                      onClick={onJoin}
                    >
                      <Icons.JoinIcon size={14} className="mr-2" /> Join this Seat
                    </Button>
                  </div>
                )}

                {/* Expanded Co-owners detail */}
                {isExpanded && seat.coOwners && (
                  <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2 rounded-2xl bg-[var(--surface-3)]/40 p-3 border border-[var(--border-subtle)]/30">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3">Owner Breakdown</p>
                      <div className="space-y-3">
                        {seat.coOwners.map((owner) => (
                          <div key={owner.userId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-[var(--accent-vivid)] text-white flex items-center justify-center text-[10px] font-bold">
                                  {owner.userName?.[0] || "?"}
                                </div>
                                <span className="text-xs font-semibold text-[var(--text-primary)]">
                                  {owner.userName || "Unknown"}
                                  {owner.userId === currentUserId && <span className="ml-1.5 text-[9px] text-[var(--accent-vivid)] font-bold">(You)</span>}
                                </span>
                              </div>
                              {isOrganizer && owner.isGuest && (
                                <button
                                  onClick={() => onEditGuest(owner.userId, owner.userName || "", owner.userPhone || "")}
                                  className="ml-0.5 text-[var(--text-muted)] hover:text-[var(--accent-vivid)] transition-colors p-1"
                                  title="Edit guest info"
                                >
                                  <Icons.EditIcon size={12} />
                                </button>
                              )}
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] bg-[var(--surface-1)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)]/40">
                              {owner.sharePercentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Surface>
            );
          })}
        </div>
      )}
    </section>
  );
}
